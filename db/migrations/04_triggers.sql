-- FILE: db/migrations/04_triggers.sql
-- PURPOSE: Creates essential triggers for the application
-- NOTE: All triggers are explicitly created in the 'travel_planner' schema

PROMPT 'Creating triggers in travel_planner schema...';

-- ============================================================================
-- AUDIT TABLE: Required for audit trigger
-- PURPOSE: Logs significant changes to bookings for audit trail
-- ============================================================================
CREATE TABLE travel_planner.Audit_Log (
    logId NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tableName VARCHAR2(50) NOT NULL,
    recordId VARCHAR2(36) NOT NULL,
    action VARCHAR2(20) NOT NULL,  -- INSERT, UPDATE, DELETE
    oldValue VARCHAR2(4000),
    newValue VARCHAR2(4000),
    changedBy VARCHAR2(100),
    changedAt TIMESTAMP DEFAULT SYSTIMESTAMP
);

PROMPT 'Audit_Log table created.';


-- ============================================================================
-- TRIGGER 1: TRG_BOOKING_AUDIT
-- PURPOSE: Logs all changes to the Booking table for audit trail
-- FIRES: After INSERT, UPDATE, DELETE on Booking
-- WHY: Demonstrates audit logging - a common real-world requirement
-- ============================================================================
CREATE OR REPLACE TRIGGER travel_planner.TRG_BOOKING_AUDIT
AFTER INSERT OR UPDATE OR DELETE ON travel_planner.Booking
FOR EACH ROW
DECLARE
    v_action VARCHAR2(20);
    v_old_value VARCHAR2(4000);
    v_new_value VARCHAR2(4000);
BEGIN
    IF INSERTING THEN
        v_action := 'INSERT';
        v_old_value := NULL;
        v_new_value := 'BookingId: ' || :NEW.bookingId ||
                       ', CustomerId: ' || :NEW.customerId ||
                       ', Status: ' || :NEW.status;

        INSERT INTO travel_planner.Audit_Log (tableName, recordId, action, oldValue, newValue, changedBy)
        VALUES ('BOOKING', :NEW.bookingId, v_action, v_old_value, v_new_value, USER);

    ELSIF UPDATING THEN
        v_action := 'UPDATE';
        v_old_value := 'Status: ' || :OLD.status;
        v_new_value := 'Status: ' || :NEW.status;

        INSERT INTO travel_planner.Audit_Log (tableName, recordId, action, oldValue, newValue, changedBy)
        VALUES ('BOOKING', :NEW.bookingId, v_action, v_old_value, v_new_value, USER);

    ELSIF DELETING THEN
        v_action := 'DELETE';
        v_old_value := 'BookingId: ' || :OLD.bookingId ||
                       ', CustomerId: ' || :OLD.customerId ||
                       ', Status: ' || :OLD.status;
        v_new_value := NULL;

        INSERT INTO travel_planner.Audit_Log (tableName, recordId, action, oldValue, newValue, changedBy)
        VALUES ('BOOKING', :OLD.bookingId, v_action, v_old_value, v_new_value, USER);
    END IF;

END TRG_BOOKING_AUDIT;
/

PROMPT 'Trigger TRG_BOOKING_AUDIT created.';


-- ============================================================================
-- TRIGGER 2: TRG_AUTO_CONFIRM_ON_PAYMENT
-- PURPOSE: Automatically confirms a booking when payment is completed
-- FIRES: After UPDATE on Payment (when status changes to 'completed')
-- WHY: Demonstrates automatic business logic - when payment completes,
--      the booking should be confirmed without manual intervention
-- ============================================================================
CREATE OR REPLACE TRIGGER travel_planner.TRG_AUTO_CONFIRM_ON_PAYMENT
AFTER UPDATE OF status ON travel_planner.Payment
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
BEGIN
    -- Automatically confirm the booking when payment is completed
    UPDATE travel_planner.Booking
    SET status = 'confirmed'
    WHERE bookingId = :NEW.bookingId
    AND status = 'pending';

END TRG_AUTO_CONFIRM_ON_PAYMENT;
/

PROMPT 'Trigger TRG_AUTO_CONFIRM_ON_PAYMENT created.';


-- ============================================================================
-- TRIGGER 3: TRG_PREVENT_DOUBLE_BOOKING
-- PURPOSE: Prevents booking hotel rooms when not enough are available
-- FIRES: Before INSERT on Booking_Hotel
-- WHY: Demonstrates business rule validation - prevents overbooking
-- ============================================================================
CREATE OR REPLACE TRIGGER travel_planner.TRG_PREVENT_DOUBLE_BOOKING
FOR INSERT ON travel_planner.Booking_Hotel
COMPOUND TRIGGER

    -- Store rows inserted in the current statement to avoid ORA-04091
    TYPE t_booking_room IS RECORD (
        hotelId      travel_planner.Hotel.hotelId%TYPE,
        checkIn      DATE,
        checkOut     DATE,
        roomsBooked  NUMBER
    );
    TYPE t_booking_room_list IS TABLE OF t_booking_room INDEX BY PLS_INTEGER;
    g_new_rows t_booking_room_list;

    -- Helper to sum rooms from this statement for the same hotel and overlap
    FUNCTION get_new_rooms(
        p_hotel_id IN travel_planner.Hotel.hotelId%TYPE,
        p_check_in IN DATE,
        p_check_out IN DATE
    ) RETURN NUMBER IS
        v_total NUMBER := 0;
    BEGIN
        IF g_new_rows.COUNT > 0 THEN
            FOR i IN g_new_rows.FIRST .. g_new_rows.LAST LOOP
                IF g_new_rows.EXISTS(i) THEN
                    IF g_new_rows(i).hotelId = p_hotel_id AND (
                        (p_check_in >= g_new_rows(i).checkIn AND p_check_in < g_new_rows(i).checkOut)
                        OR (p_check_out > g_new_rows(i).checkIn AND p_check_out <= g_new_rows(i).checkOut)
                        OR (p_check_in <= g_new_rows(i).checkIn AND p_check_out >= g_new_rows(i).checkOut)
                    ) THEN
                        v_total := v_total + g_new_rows(i).roomsBooked;
                    END IF;
                END IF;
            END LOOP;
        END IF;
        RETURN v_total;
    END get_new_rooms;

    BEFORE EACH ROW IS
    BEGIN
        g_new_rows(g_new_rows.COUNT + 1) := t_booking_room(
            :NEW.hotelId,
            :NEW.checkIn,
            :NEW.checkOut,
            :NEW.roomsBooked
        );
    END BEFORE EACH ROW;

    AFTER STATEMENT IS
        v_total_rooms   NUMBER;
        v_booked_rooms  NUMBER;
        v_hotel_name    VARCHAR2(200);
        v_new_rooms     NUMBER;
        v_existing_rooms NUMBER;
        v_available     NUMBER;
    BEGIN
        IF g_new_rows.COUNT > 0 THEN
            FOR i IN g_new_rows.FIRST .. g_new_rows.LAST LOOP
                IF g_new_rows.EXISTS(i) THEN
                    -- Get hotel info
                    SELECT hotelName, availableRooms INTO v_hotel_name, v_total_rooms
                    FROM travel_planner.Hotel
                    WHERE hotelId = g_new_rows(i).hotelId;

                    -- Count all rooms booked for overlapping dates (includes new rows)
                    SELECT NVL(SUM(bh.roomsBooked), 0) INTO v_booked_rooms
                    FROM travel_planner.Booking_Hotel bh
                    JOIN travel_planner.Booking b ON bh.bookingId = b.bookingId
                    WHERE bh.hotelId = g_new_rows(i).hotelId
                    AND b.status IN ('pending', 'confirmed')
                    AND (
                        (g_new_rows(i).checkIn >= bh.checkIn AND g_new_rows(i).checkIn < bh.checkOut)
                        OR (g_new_rows(i).checkOut > bh.checkIn AND g_new_rows(i).checkOut <= bh.checkOut)
                        OR (g_new_rows(i).checkIn <= bh.checkIn AND g_new_rows(i).checkOut >= bh.checkOut)
                    );

                    -- Rooms being inserted in this statement for the same window
                    v_new_rooms := get_new_rooms(
                        g_new_rows(i).hotelId,
                        g_new_rows(i).checkIn,
                        g_new_rows(i).checkOut
                    );

                    -- Rooms that were already booked before this statement
                    v_existing_rooms := v_booked_rooms - v_new_rooms;
                    v_available := v_total_rooms - v_existing_rooms;

                    IF v_booked_rooms > v_total_rooms THEN
                        RAISE_APPLICATION_ERROR(
                            -20030,
                            'Not enough rooms at ' || v_hotel_name ||
                            ' for dates ' || TO_CHAR(g_new_rows(i).checkIn, 'YYYY-MM-DD') ||
                            ' to ' || TO_CHAR(g_new_rows(i).checkOut, 'YYYY-MM-DD') ||
                            '. Available: ' || v_available ||
                            ', Requested: ' || v_new_rooms
                        );
                    END IF;
                END IF;
            END LOOP;
        END IF;
    END AFTER STATEMENT;

END TRG_PREVENT_DOUBLE_BOOKING;
/

PROMPT 'Trigger TRG_PREVENT_DOUBLE_BOOKING created.';


-- ============================================================================
-- TRIGGER 4: TRG_CUSTOMER_EMAIL_LOWERCASE
-- PURPOSE: Ensures customer email is always stored in lowercase
-- FIRES: Before INSERT or UPDATE on Customer
-- WHY: Demonstrates data normalization - ensures consistent email format
-- ============================================================================
CREATE OR REPLACE TRIGGER travel_planner.TRG_CUSTOMER_EMAIL_LOWERCASE
BEFORE INSERT OR UPDATE OF email ON travel_planner.Customer
FOR EACH ROW
BEGIN
    -- Convert email to lowercase for consistency
    :NEW.email := LOWER(:NEW.email);
END TRG_CUSTOMER_EMAIL_LOWERCASE;
/

PROMPT 'Trigger TRG_CUSTOMER_EMAIL_LOWERCASE created.';


-- ============================================================================
-- TRIGGER 5: TRG_CASCADE_BOOKING_CANCEL
-- PURPOSE: When a booking is cancelled, update related payment status
-- FIRES: After UPDATE on Booking (when status changes to 'cancelled')
-- WHY: Demonstrates cascading updates - cancellation affects payments
-- ============================================================================
CREATE OR REPLACE TRIGGER travel_planner.TRG_CASCADE_BOOKING_CANCEL
AFTER UPDATE OF status ON travel_planner.Booking
FOR EACH ROW
WHEN (NEW.status = 'cancelled' AND OLD.status != 'cancelled')
BEGIN
    -- Mark pending payments as failed
    UPDATE travel_planner.Payment
    SET status = 'failed'
    WHERE bookingId = :NEW.bookingId
    AND status = 'pending';

    -- Mark completed payments as refunded
    UPDATE travel_planner.Payment
    SET status = 'refunded'
    WHERE bookingId = :NEW.bookingId
    AND status = 'completed';

END TRG_CASCADE_BOOKING_CANCEL;
/

PROMPT 'Trigger TRG_CASCADE_BOOKING_CANCEL created.';


PROMPT 'All 5 triggers created successfully.';
/