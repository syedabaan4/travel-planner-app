-- FILE: db/migrations/01_create_tables.sql
-- PURPOSE: Creates all tables for the application.
-- NOTE: All tables are explicitly created in the 'travel_planner' schema.

PROMPT 'Creating tables in travel_planner schema...';

-- 1. CUSTOMER TABLE
CREATE TABLE travel_planner.Customer (
    customerId NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR2(100) NOT NULL,
    email VARCHAR2(100) UNIQUE NOT NULL,
    phone VARCHAR2(20),
    username VARCHAR2(50) UNIQUE NOT NULL,
    password VARCHAR2(255) NOT NULL
);

-- 2. ADMIN TABLE
CREATE TABLE travel_planner.Admin (
    adminId NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR2(100) NOT NULL,
    email VARCHAR2(100) UNIQUE NOT NULL,
    username VARCHAR2(50) UNIQUE NOT NULL,
    password VARCHAR2(255) NOT NULL
);

-- 3. CATALOG TABLE (Enhanced)
CREATE TABLE travel_planner.Catalog (
    catalogId NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    packageName VARCHAR2(200) NOT NULL,
    destination VARCHAR2(200) NOT NULL,
    description VARCHAR2(1000),
    noOfDays NUMBER NOT NULL,
    budget NUMBER(10,2) NOT NULL,
    departure DATE NOT NULL,
    arrival DATE NOT NULL
);

-- 4. HOTEL TABLE
CREATE TABLE travel_planner.Hotel (
    hotelId NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hotelName VARCHAR2(200) NOT NULL,
    hotelAddress VARCHAR2(500) NOT NULL,
    availableRooms NUMBER NOT NULL,
    rent NUMBER(10,2) NOT NULL
);

-- 5. TRANSPORT TABLE
CREATE TABLE travel_planner.Transport (
    transportId NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    type VARCHAR2(50) NOT NULL CHECK (type IN ('bus', 'van', 'flight', 'train')),
    noOfSeats NUMBER NOT NULL,
    fare NUMBER(10,2) NOT NULL
);

-- 6. FOOD TABLE
CREATE TABLE travel_planner.Food (
    foodId NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    meals VARCHAR2(500) NOT NULL,
    price NUMBER(10,2) NOT NULL
);

-- 7. BOOKING TABLE (with isCustom flag)
CREATE TABLE travel_planner.Booking (
    bookingId VARCHAR2(36) PRIMARY KEY,
    customerId NUMBER NOT NULL,
    catalogId NUMBER,
    isCustom NUMBER(1) DEFAULT 0 CHECK (isCustom IN (0, 1)),
    bookingDescription VARCHAR2(1000),
    bookingDate DATE DEFAULT SYSDATE,
    status VARCHAR2(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    CONSTRAINT fk_booking_customer FOREIGN KEY (customerId) REFERENCES travel_planner.Customer(customerId) ON DELETE CASCADE,
    CONSTRAINT fk_booking_catalog FOREIGN KEY (catalogId) REFERENCES travel_planner.Catalog(catalogId) ON DELETE SET NULL
);

-- 8. PAYMENT TABLE
CREATE TABLE travel_planner.Payment (
    paymentId VARCHAR2(36) PRIMARY KEY,
    bookingId VARCHAR2(36) NOT NULL,
    amount NUMBER(10,2) NOT NULL,
    paymentDate DATE DEFAULT SYSDATE,
    method VARCHAR2(50) NOT NULL CHECK (method IN ('credit_card', 'debit_card', 'paypal', 'bank_transfer')),
    status VARCHAR2(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transactionId VARCHAR2(100),
    CONSTRAINT fk_payment_booking FOREIGN KEY (bookingId) REFERENCES travel_planner.Booking(bookingId) ON DELETE CASCADE
);

-- 9. JUNCTION TABLE: Catalog_Hotel
CREATE TABLE travel_planner.Catalog_Hotel (
    catalogId NUMBER NOT NULL,
    hotelId NUMBER NOT NULL,
    roomsIncluded NUMBER DEFAULT 1,
    PRIMARY KEY (catalogId, hotelId),
    CONSTRAINT fk_cat_hotel_catalog FOREIGN KEY (catalogId) REFERENCES travel_planner.Catalog(catalogId) ON DELETE CASCADE,
    CONSTRAINT fk_cat_hotel_hotel FOREIGN KEY (hotelId) REFERENCES travel_planner.Hotel(hotelId) ON DELETE CASCADE
);

-- 10. JUNCTION TABLE: Catalog_Transport
CREATE TABLE travel_planner.Catalog_Transport (
    catalogId NUMBER NOT NULL,
    transportId NUMBER NOT NULL,
    seatsIncluded NUMBER DEFAULT 1,
    PRIMARY KEY (catalogId, transportId),
    CONSTRAINT fk_cat_trans_catalog FOREIGN KEY (catalogId) REFERENCES travel_planner.Catalog(catalogId) ON DELETE CASCADE,
    CONSTRAINT fk_cat_trans_transport FOREIGN KEY (transportId) REFERENCES travel_planner.Transport(transportId) ON DELETE CASCADE
);

-- 11. JUNCTION TABLE: Catalog_Food
CREATE TABLE travel_planner.Catalog_Food (
    catalogId NUMBER NOT NULL,
    foodId NUMBER NOT NULL,
    PRIMARY KEY (catalogId, foodId),
    CONSTRAINT fk_cat_food_catalog FOREIGN KEY (catalogId) REFERENCES travel_planner.Catalog(catalogId) ON DELETE CASCADE,
    CONSTRAINT fk_cat_food_food FOREIGN KEY (foodId) REFERENCES travel_planner.Food(foodId) ON DELETE CASCADE
);

-- 12. JUNCTION TABLE: Booking_Hotel
CREATE TABLE travel_planner.Booking_Hotel (
    bookingId VARCHAR2(36) NOT NULL,
    hotelId NUMBER NOT NULL,
    roomsBooked NUMBER DEFAULT 1,
    checkIn DATE NOT NULL,
    checkOut DATE NOT NULL,
    PRIMARY KEY (bookingId, hotelId),
    CONSTRAINT fk_book_hotel_booking FOREIGN KEY (bookingId) REFERENCES travel_planner.Booking(bookingId) ON DELETE CASCADE,
    CONSTRAINT fk_book_hotel_hotel FOREIGN KEY (hotelId) REFERENCES travel_planner.Hotel(hotelId) ON DELETE CASCADE
);

-- 13. JUNCTION TABLE: Booking_Transport
CREATE TABLE travel_planner.Booking_Transport (
    bookingId VARCHAR2(36) NOT NULL,
    transportId NUMBER NOT NULL,
    seatsBooked NUMBER DEFAULT 1,
    travelDate DATE NOT NULL,
    PRIMARY KEY (bookingId, transportId),
    CONSTRAINT fk_book_trans_booking FOREIGN KEY (bookingId) REFERENCES travel_planner.Booking(bookingId) ON DELETE CASCADE,
    CONSTRAINT fk_book_trans_transport FOREIGN KEY (transportId) REFERENCES travel_planner.Transport(transportId) ON DELETE CASCADE
);

-- 14. JUNCTION TABLE: Booking_Food
CREATE TABLE travel_planner.Booking_Food (
    bookingId VARCHAR2(36) NOT NULL,
    foodId NUMBER NOT NULL,
    quantity NUMBER DEFAULT 1,
    PRIMARY KEY (bookingId, foodId),
    CONSTRAINT fk_book_food_booking FOREIGN KEY (bookingId) REFERENCES travel_planner.Booking(bookingId) ON DELETE CASCADE,
    CONSTRAINT fk_book_food_food FOREIGN KEY (foodId) REFERENCES travel_planner.Food(foodId) ON DELETE CASCADE
);

PROMPT 'All tables created successfully.';
/