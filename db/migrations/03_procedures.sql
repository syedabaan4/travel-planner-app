-- FILE: db/migrations/03_procedures.sql
-- PURPOSE: Creates essential stored procedures for the application
-- NOTE: All procedures are explicitly created in the 'travel_planner' schema

PROMPT 'Creating stored procedures in travel_planner schema...';

-- ============================================================================
-- PROCEDURE 1: SP_CREATE_BOOKING_FROM_CATALOG
-- PURPOSE: Creates a complete booking from a catalog package atomically
--          Copies all hotels, transport, and food from catalog to booking
-- PARAMETERS:
--   p_customer_id   - Customer making the booking
--   p_catalog_id    - Catalog package to book
--   p_description   - Optional booking description
--   p_check_in      - Hotel check-in date
--   p_check_out     - Hotel check-out date
--   p_travel_date   - Transport travel date
--   p_booking_id    - OUT: Generated booking ID
--   p_total_cost    - OUT: Calculated total cost
-- ============================================================================
CREATE OR REPLACE PROCEDURE travel_planner.SP_CREATE_BOOKING_FROM_CATALOG(
    p_customer_id   IN NUMBER,
    p_catalog_id    IN NUMBER,
    p_description   IN VARCHAR2 DEFAULT NULL,
    p_check_in      IN DATE,
    p_check_out     IN DATE,
    p_travel_date   IN DATE,
    p_booking_id    OUT VARCHAR2,
    p_total_cost    OUT NUMBER
) AS
    v_booking_id VARCHAR2(36);
    v_hotel_cost NUMBER := 0;
    v_transport_cost NUMBER := 0;
    v_food_cost NUMBER := 0;
    v_catalog_exists NUMBER;
    v_customer_exists NUMBER;
    v_nights NUMBER;
BEGIN
    -- Validate customer exists
    SELECT COUNT(*) INTO v_customer_exists
    FROM travel_planner.Customer
    WHERE customerId = p_customer_id;

    IF v_customer_exists = 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Customer not found with ID: ' || p_customer_id);
    END IF;

    -- Validate catalog exists
    SELECT COUNT(*) INTO v_catalog_exists
    FROM travel_planner.Catalog
    WHERE catalogId = p_catalog_id;

    IF v_catalog_exists = 0 THEN
        RAISE_APPLICATION_ERROR(-20002, 'Catalog package not found with ID: ' || p_catalog_id);
    END IF;

    -- Validate dates
    IF p_check_in >= p_check_out THEN
        RAISE_APPLICATION_ERROR(-20003, 'Check-out date must be after check-in date');
    END IF;

    IF p_check_in < TRUNC(SYSDATE) THEN
        RAISE_APPLICATION_ERROR(-20004, 'Check-in date cannot be in the past');
    END IF;

    -- Calculate number of nights
    v_nights := p_check_out - p_check_in;

    -- Generate UUID for booking
    v_booking_id := SYS_GUID();

    -- Insert the booking record
    INSERT INTO travel_planner.Booking (
        bookingId, customerId, catalogId, isCustom, bookingDescription, status
    ) VALUES (
        v_booking_id,
        p_customer_id,
        p_catalog_id,
        0,  -- Not custom (from catalog)
        NVL(p_description, 'Booking from catalog package'),
        'pending'
    );

    -- Copy hotels from catalog to booking
    INSERT INTO travel_planner.Booking_Hotel (bookingId, hotelId, roomsBooked, checkIn, checkOut)
    SELECT v_booking_id, ch.hotelId, ch.roomsIncluded, p_check_in, p_check_out
    FROM travel_planner.Catalog_Hotel ch
    WHERE ch.catalogId = p_catalog_id;

    -- Calculate hotel cost (rent * rooms * nights)
    SELECT NVL(SUM(h.rent * ch.roomsIncluded * v_nights), 0) INTO v_hotel_cost
    FROM travel_planner.Catalog_Hotel ch
    JOIN travel_planner.Hotel h ON ch.hotelId = h.hotelId
    WHERE ch.catalogId = p_catalog_id;

    -- Copy transport from catalog to booking
    INSERT INTO travel_planner.Booking_Transport (bookingId, transportId, seatsBooked, travelDate)
    SELECT v_booking_id, ct.transportId, ct.seatsIncluded, p_travel_date
    FROM travel_planner.Catalog_Transport ct
    WHERE ct.catalogId = p_catalog_id;

    -- Calculate transport cost (fare * seats)
    SELECT NVL(SUM(t.fare * ct.seatsIncluded), 0) INTO v_transport_cost
    FROM travel_planner.Catalog_Transport ct
    JOIN travel_planner.Transport t ON ct.transportId = t.transportId
    WHERE ct.catalogId = p_catalog_id;

    -- Copy food from catalog to booking (quantity = number of nights)
    INSERT INTO travel_planner.Booking_Food (bookingId, foodId, quantity)
    SELECT v_booking_id, cf.foodId, v_nights
    FROM travel_planner.Catalog_Food cf
    WHERE cf.catalogId = p_catalog_id;

    -- Calculate food cost (price * nights)
    SELECT NVL(SUM(f.price * v_nights), 0) INTO v_food_cost
    FROM travel_planner.Catalog_Food cf
    JOIN travel_planner.Food f ON cf.foodId = f.foodId
    WHERE cf.catalogId = p_catalog_id;

    -- Set output parameters
    p_booking_id := v_booking_id;
    p_total_cost := v_hotel_cost + v_transport_cost + v_food_cost;

    COMMIT;

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END SP_CREATE_BOOKING_FROM_CATALOG;
/

PROMPT 'Procedure SP_CREATE_BOOKING_FROM_CATALOG created.';


-- ============================================================================
-- PROCEDURE 2: SP_CALCULATE_BOOKING_TOTAL
-- PURPOSE: Calculates the total cost breakdown of a booking
-- PARAMETERS:
--   p_booking_id    - Booking to calculate
--   p_hotel_cost    - OUT: Total hotel cost
--   p_transport_cost- OUT: Total transport cost
--   p_food_cost     - OUT: Total food cost
--   p_total_cost    - OUT: Grand total
-- ============================================================================
CREATE OR REPLACE PROCEDURE travel_planner.SP_CALCULATE_BOOKING_TOTAL(
    p_booking_id        IN VARCHAR2,
    p_hotel_cost        OUT NUMBER,
    p_transport_cost    OUT NUMBER,
    p_food_cost         OUT NUMBER,
    p_total_cost        OUT NUMBER
) AS
    v_booking_exists NUMBER;
BEGIN
    -- Validate booking exists
    SELECT COUNT(*) INTO v_booking_exists
    FROM travel_planner.Booking
    WHERE bookingId = p_booking_id;

    IF v_booking_exists = 0 THEN
        RAISE_APPLICATION_ERROR(-20005, 'Booking not found with ID: ' || p_booking_id);
    END IF;

    -- Calculate hotel cost (rent * rooms * nights)
    SELECT NVL(SUM(h.rent * bh.roomsBooked * (bh.checkOut - bh.checkIn)), 0)
    INTO p_hotel_cost
    FROM travel_planner.Booking_Hotel bh
    JOIN travel_planner.Hotel h ON bh.hotelId = h.hotelId
    WHERE bh.bookingId = p_booking_id;

    -- Calculate transport cost (fare * seats)
    SELECT NVL(SUM(t.fare * bt.seatsBooked), 0)
    INTO p_transport_cost
    FROM travel_planner.Booking_Transport bt
    JOIN travel_planner.Transport t ON bt.transportId = t.transportId
    WHERE bt.bookingId = p_booking_id;

    -- Calculate food cost (price * quantity)
    SELECT NVL(SUM(f.price * bf.quantity), 0)
    INTO p_food_cost
    FROM travel_planner.Booking_Food bf
    JOIN travel_planner.Food f ON bf.foodId = f.foodId
    WHERE bf.bookingId = p_booking_id;

    -- Calculate grand total
    p_total_cost := p_hotel_cost + p_transport_cost + p_food_cost;

END SP_CALCULATE_BOOKING_TOTAL;
/

PROMPT 'Procedure SP_CALCULATE_BOOKING_TOTAL created.';


-- ============================================================================
-- PROCEDURE 3: SP_PROCESS_PAYMENT
-- PURPOSE: Creates a payment record for a booking with validation
-- PARAMETERS:
--   p_booking_id    - Booking to pay for
--   p_method        - Payment method (credit_card, debit_card, paypal, bank_transfer)
--   p_transaction_id- External transaction ID (optional)
--   p_payment_id    - OUT: Generated payment ID
--   p_amount        - OUT: Payment amount (calculated from booking)
-- ============================================================================
CREATE OR REPLACE PROCEDURE travel_planner.SP_PROCESS_PAYMENT(
    p_booking_id        IN VARCHAR2,
    p_method            IN VARCHAR2,
    p_transaction_id    IN VARCHAR2 DEFAULT NULL,
    p_payment_id        OUT VARCHAR2,
    p_amount            OUT NUMBER
) AS
    v_booking_status VARCHAR2(20);
    v_existing_payment NUMBER;
    v_hotel_cost NUMBER;
    v_transport_cost NUMBER;
    v_food_cost NUMBER;
BEGIN
    -- Validate booking exists and get status
    BEGIN
        SELECT status INTO v_booking_status
        FROM travel_planner.Booking
        WHERE bookingId = p_booking_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20005, 'Booking not found with ID: ' || p_booking_id);
    END;

    -- Cannot pay for cancelled booking
    IF v_booking_status = 'cancelled' THEN
        RAISE_APPLICATION_ERROR(-20006, 'Cannot process payment for cancelled booking');
    END IF;

    -- Check if payment already exists for this booking
    SELECT COUNT(*) INTO v_existing_payment
    FROM travel_planner.Payment
    WHERE bookingId = p_booking_id AND status IN ('pending', 'completed');

    IF v_existing_payment > 0 THEN
        RAISE_APPLICATION_ERROR(-20007, 'Payment already exists for this booking');
    END IF;

    -- Validate payment method
    IF p_method NOT IN ('credit_card', 'debit_card', 'paypal', 'bank_transfer') THEN
        RAISE_APPLICATION_ERROR(-20008, 'Invalid payment method: ' || p_method);
    END IF;

    -- Calculate booking total using our other procedure
    travel_planner.SP_CALCULATE_BOOKING_TOTAL(
        p_booking_id,
        v_hotel_cost,
        v_transport_cost,
        v_food_cost,
        p_amount
    );

    -- Ensure there's something to pay for
    IF p_amount <= 0 THEN
        RAISE_APPLICATION_ERROR(-20009, 'Booking has no items to pay for');
    END IF;

    -- Generate payment ID
    p_payment_id := SYS_GUID();

    -- Create payment record
    INSERT INTO travel_planner.Payment (
        paymentId, bookingId, amount, method, status, transactionId
    ) VALUES (
        p_payment_id,
        p_booking_id,
        p_amount,
        p_method,
        'pending',
        p_transaction_id
    );

    COMMIT;

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END SP_PROCESS_PAYMENT;
/

PROMPT 'Procedure SP_PROCESS_PAYMENT created.';


-- ============================================================================
-- PROCEDURE 4: SP_COMPLETE_PAYMENT
-- PURPOSE: Marks a payment as completed and confirms the booking
-- PARAMETERS:
--   p_payment_id    - Payment to complete
--   p_transaction_id- External transaction ID (optional update)
-- ============================================================================
CREATE OR REPLACE PROCEDURE travel_planner.SP_COMPLETE_PAYMENT(
    p_payment_id        IN VARCHAR2,
    p_transaction_id    IN VARCHAR2 DEFAULT NULL
) AS
    v_payment_status VARCHAR2(20);
    v_booking_id VARCHAR2(36);
BEGIN
    -- Validate payment exists and get details
    BEGIN
        SELECT status, bookingId INTO v_payment_status, v_booking_id
        FROM travel_planner.Payment
        WHERE paymentId = p_payment_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20010, 'Payment not found with ID: ' || p_payment_id);
    END;

    -- Payment must be pending
    IF v_payment_status != 'pending' THEN
        RAISE_APPLICATION_ERROR(-20011, 'Payment is not pending. Current status: ' || v_payment_status);
    END IF;

    -- Update payment to completed
    UPDATE travel_planner.Payment
    SET status = 'completed',
        transactionId = NVL(p_transaction_id, transactionId),
        paymentDate = SYSDATE
    WHERE paymentId = p_payment_id;

    -- Confirm the booking
    UPDATE travel_planner.Booking
    SET status = 'confirmed'
    WHERE bookingId = v_booking_id;

    COMMIT;

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END SP_COMPLETE_PAYMENT;
/

PROMPT 'Procedure SP_COMPLETE_PAYMENT created.';


-- ============================================================================
-- PROCEDURE 5: SP_CANCEL_BOOKING
-- PURPOSE: Cancels a booking and handles refund if payment was made
-- PARAMETERS:
--   p_booking_id    - Booking to cancel
--   p_reason        - Cancellation reason (optional)
--   p_refund_issued - OUT: 1 if refund was issued, 0 otherwise
-- ============================================================================
CREATE OR REPLACE PROCEDURE travel_planner.SP_CANCEL_BOOKING(
    p_booking_id    IN VARCHAR2,
    p_reason        IN VARCHAR2 DEFAULT NULL,
    p_refund_issued OUT NUMBER
) AS
    v_booking_status VARCHAR2(20);
    v_payment_id VARCHAR2(36);
    v_payment_status VARCHAR2(20);
BEGIN
    p_refund_issued := 0;

    -- Validate booking exists and get status
    BEGIN
        SELECT status INTO v_booking_status
        FROM travel_planner.Booking
        WHERE bookingId = p_booking_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20005, 'Booking not found with ID: ' || p_booking_id);
    END;

    -- Cannot cancel already cancelled booking
    IF v_booking_status = 'cancelled' THEN
        RAISE_APPLICATION_ERROR(-20012, 'Booking is already cancelled');
    END IF;

    -- Check if there's a completed payment (needs refund)
    BEGIN
        SELECT paymentId, status INTO v_payment_id, v_payment_status
        FROM travel_planner.Payment
        WHERE bookingId = p_booking_id AND status = 'completed'
        AND ROWNUM = 1;

        -- Mark payment as refunded
        UPDATE travel_planner.Payment
        SET status = 'refunded'
        WHERE paymentId = v_payment_id;

        p_refund_issued := 1;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            -- No completed payment, check for pending payment
            UPDATE travel_planner.Payment
            SET status = 'failed'
            WHERE bookingId = p_booking_id AND status = 'pending';
    END;

    -- Cancel the booking and append reason to description
    UPDATE travel_planner.Booking
    SET status = 'cancelled',
        bookingDescription = bookingDescription || ' [CANCELLED: ' || NVL(p_reason, 'No reason provided') || ']'
    WHERE bookingId = p_booking_id;

    COMMIT;

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END SP_CANCEL_BOOKING;
/

PROMPT 'Procedure SP_CANCEL_BOOKING created.';


PROMPT 'All 5 stored procedures created successfully.';
/
