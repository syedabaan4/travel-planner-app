-- FILE: db/seed/01_add_sample_data.sql
-- PURPOSE: Inserts sample data into the tables.
-- NOTE: All tables are explicitly referenced in the 'travel_planner' schema.

PROMPT 'Inserting sample data into travel_planner schema...';

-- SAMPLE CUSTOMERS (passwords will be hashed in backend, these are plain for now)
INSERT INTO travel_planner.Customer (name, email, phone, username, password) VALUES
('John Doe', 'john@example.com', '+923001234567', 'johndoe', '$2b$10$6P3S4bAR5u9lS8eAJc8GxeQS3hd/lUUKRU7Gbl5a6S5kEza.CXHgK');
INSERT INTO travel_planner.Customer (name, email, phone, username, password) VALUES
('Sarah Khan', 'sarah@example.com', '+923009876543', 'sarahk', '$2b$10$6P3S4bAR5u9lS8eAJc8GxeQS3hd/lUUKRU7Gbl5a6S5kEza.CXHgK');
INSERT INTO travel_planner.Customer (name, email, phone, username, password) VALUES
('Ali Ahmed', 'ali@example.com', '+923007654321', 'ali_ahmed', '$2b$10$6P3S4bAR5u9lS8eAJc8GxeQS3hd/lUUKRU7Gbl5a6S5kEza.CXHgK');

-- SAMPLE ADMIN
INSERT INTO travel_planner.Admin (name, email, username, password) VALUES
('Admin User', 'admin@travelplanner.com', 'admin', '$2b$10$YJk1syjZPVKX0hRDJz/e9OY5SIrr4hxu/X3oOwhKVjDGT62DBPeGG');

-- SAMPLE HOTELS
INSERT INTO travel_planner.Hotel (hotelName, hotelAddress, availableRooms, rent) VALUES
('Pearl Continental', 'Club Road, Karachi', 50, 15000);
INSERT INTO travel_planner.Hotel (hotelName, hotelAddress, availableRooms, rent) VALUES
('Serena Hotel', 'Khyaban-e-Suhrawardy, Islamabad', 30, 25000);
INSERT INTO travel_planner.Hotel (hotelName, hotelAddress, availableRooms, rent) VALUES
('Mövenpick Hotel', 'Mall Road, Karachi', 40, 18000);
INSERT INTO travel_planner.Hotel (hotelName, hotelAddress, availableRooms, rent) VALUES
('Hotel One', 'Gulberg, Lahore', 60, 8000);

-- SAMPLE TRANSPORT
INSERT INTO travel_planner.Transport (type, noOfSeats, fare) VALUES ('flight', 180, 12000);
INSERT INTO travel_planner.Transport (type, noOfSeats, fare) VALUES ('bus', 40, 2500);
INSERT INTO travel_planner.Transport (type, noOfSeats, fare) VALUES ('van', 12, 5000);
INSERT INTO travel_planner.Transport (type, noOfSeats, fare) VALUES ('train', 200, 3000);

-- SAMPLE FOOD PLANS
INSERT INTO travel_planner.Food (meals, price) VALUES ('Breakfast + Lunch', 2000);
INSERT INTO travel_planner.Food (meals, price) VALUES ('Full Board (Breakfast, Lunch, Dinner)', 3500);
INSERT INTO travel_planner.Food (meals, price) VALUES ('Breakfast Only', 1000);
INSERT INTO travel_planner.Food (meals, price) VALUES ('Lunch + Dinner', 2500);

-- SAMPLE CATALOG PACKAGES
INSERT INTO travel_planner.Catalog (packageName, destination, description, noOfDays, budget, departure, arrival) VALUES
('Karachi City Explorer', 'Karachi, Pakistan', 'Explore the vibrant city of Karachi with beach visits and historical sites', 3, 35000, TO_DATE('2025-12-01', 'YYYY-MM-DD'), TO_DATE('2025-12-03', 'YYYY-MM-DD'));

INSERT INTO travel_planner.Catalog (packageName, destination, description, noOfDays, budget, departure, arrival) VALUES
('Northern Areas Adventure', 'Hunza Valley, Pakistan', 'Experience the breathtaking beauty of northern Pakistan', 7, 85000, TO_DATE('2025-12-15', 'YYYY-MM-DD'), TO_DATE('2025-12-21', 'YYYY-MM-DD'));

INSERT INTO travel_planner.Catalog (packageName, destination, description, noOfDays, budget, departure, arrival) VALUES
('Lahore Heritage Tour', 'Lahore, Pakistan', 'Discover the rich cultural heritage of Lahore', 4, 45000, TO_DATE('2025-11-25', 'YYYY-MM-DD'), TO_DATE('2025-11-28', 'YYYY-MM-DD'));

-- LINK CATALOG 1 (Karachi Explorer) with Hotels, Transport, Food
INSERT INTO travel_planner.Catalog_Hotel (catalogId, hotelId, roomsIncluded) VALUES (1, 1, 1);
INSERT INTO travel_planner.Catalog_Hotel (catalogId, hotelId, roomsIncluded) VALUES (1, 3, 1);
INSERT INTO travel_planner.Catalog_Transport (catalogId, transportId, seatsIncluded) VALUES (1, 3, 1);
INSERT INTO travel_planner.Catalog_Food (catalogId, foodId) VALUES (1, 1);
INSERT INTO travel_planner.Catalog_Food (catalogId, foodId) VALUES (1, 3);

-- LINK CATALOG 2 (Northern Areas) with Hotels, Transport, Food
INSERT INTO travel_planner.Catalog_Hotel (catalogId, hotelId, roomsIncluded) VALUES (2, 2, 1);
INSERT INTO travel_planner.Catalog_Transport (catalogId, transportId, seatsIncluded) VALUES (2, 1, 1);
INSERT INTO travel_planner.Catalog_Food (catalogId, foodId) VALUES (2, 2);

-- LINK CATALOG 3 (Lahore Heritage) with Hotels, Transport, Food
INSERT INTO travel_planner.Catalog_Hotel (catalogId, hotelId, roomsIncluded) VALUES (3, 4, 1);
INSERT INTO travel_planner.Catalog_Transport (catalogId, transportId, seatsIncluded) VALUES (3, 2, 1);
INSERT INTO travel_planner.Catalog_Food (catalogId, foodId) VALUES (3, 1);

COMMIT;

PROMPT 'Sample data inserted successfully.';

-- Optional: Verify data after script runs
PROMPT 'Verifying data...';
SELECT COUNT(*) as total_customers FROM travel_planner.Customer;
SELECT COUNT(*) as total_admins FROM travel_planner.Admin;
SELECT COUNT(*) as total_catalogs FROM travel_planner.Catalog;
-- Note: Booking is empty by default
SELECT COUNT(*) as total_bookings FROM travel_planner.Booking;

/
