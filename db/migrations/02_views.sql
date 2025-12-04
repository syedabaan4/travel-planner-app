-- FILE: db/migrations/02_views.sql
-- PURPOSE: Creates essential views for the application
-- NOTE: All views are explicitly created in the 'travel_planner' schema

PROMPT 'Creating views in travel_planner schema...';

-- ============================================================================
-- VIEW 1: VW_CATALOG_FULL_DETAILS
-- PURPOSE: Comprehensive view of catalog packages with all included services
--          and calculated total price
-- USAGE: Display full package details on frontend, admin reports
-- ============================================================================
CREATE OR REPLACE VIEW travel_planner.VW_CATALOG_FULL_DETAILS AS
SELECT
    c.catalogId,
    c.packageName,
    c.destination,
    c.description,
    c.noOfDays,
    c.budget,
    c.departure,
    c.arrival,
    -- Aggregated hotel information
    (SELECT COUNT(*) FROM travel_planner.Catalog_Hotel ch WHERE ch.catalogId = c.catalogId) AS totalHotels,
    (SELECT NVL(SUM(h.rent * ch.roomsIncluded), 0)
     FROM travel_planner.Catalog_Hotel ch
     JOIN travel_planner.Hotel h ON ch.hotelId = h.hotelId
     WHERE ch.catalogId = c.catalogId) AS totalHotelCost,
    -- Aggregated transport information
    (SELECT COUNT(*) FROM travel_planner.Catalog_Transport ct WHERE ct.catalogId = c.catalogId) AS totalTransports,
    (SELECT NVL(SUM(t.fare * ct.seatsIncluded), 0)
     FROM travel_planner.Catalog_Transport ct
     JOIN travel_planner.Transport t ON ct.transportId = t.transportId
     WHERE ct.catalogId = c.catalogId) AS totalTransportCost,
    -- Aggregated food information
    (SELECT COUNT(*) FROM travel_planner.Catalog_Food cf WHERE cf.catalogId = c.catalogId) AS totalFoodPlans,
    (SELECT NVL(SUM(f.price), 0)
     FROM travel_planner.Catalog_Food cf
     JOIN travel_planner.Food f ON cf.foodId = f.foodId
     WHERE cf.catalogId = c.catalogId) AS totalFoodCost,
    -- Calculated total package cost (per night)
    (SELECT NVL(SUM(h.rent * ch.roomsIncluded), 0)
     FROM travel_planner.Catalog_Hotel ch
     JOIN travel_planner.Hotel h ON ch.hotelId = h.hotelId
     WHERE ch.catalogId = c.catalogId) +
    (SELECT NVL(SUM(t.fare * ct.seatsIncluded), 0)
     FROM travel_planner.Catalog_Transport ct
     JOIN travel_planner.Transport t ON ct.transportId = t.transportId
     WHERE ct.catalogId = c.catalogId) +
    (SELECT NVL(SUM(f.price), 0)
     FROM travel_planner.Catalog_Food cf
     JOIN travel_planner.Food f ON cf.foodId = f.foodId
     WHERE cf.catalogId = c.catalogId) AS calculatedTotalCost
FROM travel_planner.Catalog c;

PROMPT 'View VW_CATALOG_FULL_DETAILS created.';


-- ============================================================================
-- VIEW 2: VW_BOOKING_DETAILS
-- PURPOSE: Comprehensive booking view with customer info, services, and totals
-- USAGE: Booking detail pages, admin booking management
-- ============================================================================
CREATE OR REPLACE VIEW travel_planner.VW_BOOKING_DETAILS AS
SELECT
    b.bookingId,
    b.customerId,
    cust.name AS customerName,
    cust.email AS customerEmail,
    cust.phone AS customerPhone,
    b.catalogId,
    cat.packageName,
    cat.destination,
    b.isCustom,
    CASE WHEN b.isCustom = 1 THEN 'Custom Booking' ELSE 'Package Booking' END AS bookingType,
    b.bookingDescription,
    b.bookingDate,
    b.status,
    -- Hotel costs for this booking
    (SELECT NVL(SUM(h.rent * bh.roomsBooked * (bh.checkOut - bh.checkIn)), 0)
     FROM travel_planner.Booking_Hotel bh
     JOIN travel_planner.Hotel h ON bh.hotelId = h.hotelId
     WHERE bh.bookingId = b.bookingId) AS totalHotelCost,
    -- Transport costs for this booking
    (SELECT NVL(SUM(t.fare * bt.seatsBooked), 0)
     FROM travel_planner.Booking_Transport bt
     JOIN travel_planner.Transport t ON bt.transportId = t.transportId
     WHERE bt.bookingId = b.bookingId) AS totalTransportCost,
    -- Food costs for this booking
    (SELECT NVL(SUM(f.price * bf.quantity), 0)
     FROM travel_planner.Booking_Food bf
     JOIN travel_planner.Food f ON bf.foodId = f.foodId
     WHERE bf.bookingId = b.bookingId) AS totalFoodCost,
    -- Grand total
    (SELECT NVL(SUM(h.rent * bh.roomsBooked * (bh.checkOut - bh.checkIn)), 0)
     FROM travel_planner.Booking_Hotel bh
     JOIN travel_planner.Hotel h ON bh.hotelId = h.hotelId
     WHERE bh.bookingId = b.bookingId) +
    (SELECT NVL(SUM(t.fare * bt.seatsBooked), 0)
     FROM travel_planner.Booking_Transport bt
     JOIN travel_planner.Transport t ON bt.transportId = t.transportId
     WHERE bt.bookingId = b.bookingId) +
    (SELECT NVL(SUM(f.price * bf.quantity), 0)
     FROM travel_planner.Booking_Food bf
     JOIN travel_planner.Food f ON bf.foodId = f.foodId
     WHERE bf.bookingId = b.bookingId) AS grandTotal,
    -- Payment info
    (SELECT p.status FROM travel_planner.Payment p
     WHERE p.bookingId = b.bookingId AND ROWNUM = 1) AS paymentStatus,
    (SELECT p.amount FROM travel_planner.Payment p
     WHERE p.bookingId = b.bookingId AND ROWNUM = 1) AS paidAmount
FROM travel_planner.Booking b
JOIN travel_planner.Customer cust ON b.customerId = cust.customerId
LEFT JOIN travel_planner.Catalog cat ON b.catalogId = cat.catalogId;

PROMPT 'View VW_BOOKING_DETAILS created.';


-- ============================================================================
-- VIEW 3: VW_CUSTOMER_BOOKING_SUMMARY
-- PURPOSE: Customer statistics - total bookings, spending, membership tier
-- USAGE: Customer profile page, loyalty programs, admin reports
-- ============================================================================
CREATE OR REPLACE VIEW travel_planner.VW_CUSTOMER_BOOKING_SUMMARY AS
SELECT
    c.customerId,
    c.name,
    c.email,
    c.phone,
    c.username,
    -- Booking statistics
    (SELECT COUNT(*) FROM travel_planner.Booking b WHERE b.customerId = c.customerId) AS totalBookings,
    (SELECT COUNT(*) FROM travel_planner.Booking b
     WHERE b.customerId = c.customerId AND b.status = 'confirmed') AS confirmedBookings,
    (SELECT COUNT(*) FROM travel_planner.Booking b
     WHERE b.customerId = c.customerId AND b.status = 'cancelled') AS cancelledBookings,
    -- Payment statistics
    (SELECT NVL(SUM(p.amount), 0)
     FROM travel_planner.Payment p
     JOIN travel_planner.Booking b ON p.bookingId = b.bookingId
     WHERE b.customerId = c.customerId AND p.status = 'completed') AS totalSpent,
    -- Customer tier based on spending
    CASE
        WHEN (SELECT NVL(SUM(p.amount), 0)
              FROM travel_planner.Payment p
              JOIN travel_planner.Booking b ON p.bookingId = b.bookingId
              WHERE b.customerId = c.customerId AND p.status = 'completed') >= 200000 THEN 'Platinum'
        WHEN (SELECT NVL(SUM(p.amount), 0)
              FROM travel_planner.Payment p
              JOIN travel_planner.Booking b ON p.bookingId = b.bookingId
              WHERE b.customerId = c.customerId AND p.status = 'completed') >= 100000 THEN 'Gold'
        WHEN (SELECT NVL(SUM(p.amount), 0)
              FROM travel_planner.Payment p
              JOIN travel_planner.Booking b ON p.bookingId = b.bookingId
              WHERE b.customerId = c.customerId AND p.status = 'completed') >= 50000 THEN 'Silver'
        ELSE 'Bronze'
    END AS customerTier
FROM travel_planner.Customer c;

PROMPT 'View VW_CUSTOMER_BOOKING_SUMMARY created.';


-- ============================================================================
-- VIEW 4: VW_REVENUE_REPORT
-- PURPOSE: Admin dashboard - revenue analytics by month
-- USAGE: Admin reports, business analytics
-- ============================================================================
CREATE OR REPLACE VIEW travel_planner.VW_REVENUE_REPORT AS
SELECT
    TO_CHAR(p.paymentDate, 'YYYY-MM') AS paymentMonth,
    COUNT(DISTINCT p.paymentId) AS totalTransactions,
    COUNT(DISTINCT b.bookingId) AS totalBookings,
    COUNT(DISTINCT b.customerId) AS uniqueCustomers,
    SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) AS completedRevenue,
    SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END) AS pendingRevenue,
    SUM(CASE WHEN p.status = 'refunded' THEN p.amount ELSE 0 END) AS refundedAmount,
    -- Revenue by booking type
    SUM(CASE WHEN b.isCustom = 0 AND p.status = 'completed' THEN p.amount ELSE 0 END) AS packageRevenue,
    SUM(CASE WHEN b.isCustom = 1 AND p.status = 'completed' THEN p.amount ELSE 0 END) AS customBookingRevenue
FROM travel_planner.Payment p
JOIN travel_planner.Booking b ON p.bookingId = b.bookingId
GROUP BY TO_CHAR(p.paymentDate, 'YYYY-MM')
ORDER BY paymentMonth DESC;

PROMPT 'View VW_REVENUE_REPORT created.';


-- ============================================================================
-- VIEW 5: VW_HOTEL_AVAILABILITY
-- PURPOSE: Real-time hotel availability status
-- USAGE: Booking forms, availability checks
-- ============================================================================
CREATE OR REPLACE VIEW travel_planner.VW_HOTEL_AVAILABILITY AS
SELECT
    h.hotelId,
    h.hotelName,
    h.hotelAddress,
    h.availableRooms AS totalRooms,
    h.rent AS pricePerNight,
    -- Currently booked rooms (for confirmed bookings with future checkout dates)
    NVL((SELECT SUM(bh.roomsBooked)
         FROM travel_planner.Booking_Hotel bh
         JOIN travel_planner.Booking b ON bh.bookingId = b.bookingId
         WHERE bh.hotelId = h.hotelId
         AND b.status = 'confirmed'
         AND bh.checkOut >= SYSDATE), 0) AS currentlyBookedRooms,
    -- Available rooms right now
    h.availableRooms - NVL((SELECT SUM(bh.roomsBooked)
                            FROM travel_planner.Booking_Hotel bh
                            JOIN travel_planner.Booking b ON bh.bookingId = b.bookingId
                            WHERE bh.hotelId = h.hotelId
                            AND b.status = 'confirmed'
                            AND bh.checkOut >= SYSDATE), 0) AS availableRoomsNow
FROM travel_planner.Hotel h;

PROMPT 'View VW_HOTEL_AVAILABILITY created.';


PROMPT 'All 5 views created successfully.';
/
