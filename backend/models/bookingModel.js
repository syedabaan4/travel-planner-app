const db = require("../config/db");
const { generateUUID } = require("../middlewares/helpers");

// Get all bookings (admin only)
async function getAllBookings() {
  let connection;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `SELECT b.bookingId, b.customerId, c.name as customerName,
              b.catalogId, b.isCustom, b.bookingDescription,
              b.bookingDate, b.status
       FROM Booking b
       JOIN Customer c ON b.customerId = c.customerId
       ORDER BY b.bookingDate DESC`,
    );
    return result.rows.map((row) => ({
      bookingId: row[0],
      customerId: row[1],
      customerName: row[2],
      catalogId: row[3],
      isCustom: row[4] === 1,
      bookingDescription: row[5],
      bookingDate: row[6],
      status: row[7],
    }));
  } finally {
    if (connection) await connection.close();
  }
}

// Get bookings by customer ID
async function getBookingsByCustomerId(customerId) {
  let connection;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `SELECT bookingId, customerId, catalogId, isCustom,
              bookingDescription, bookingDate, status
       FROM Booking
       WHERE customerId = :customerId
       ORDER BY bookingDate DESC`,
      [customerId],
    );
    return result.rows.map((row) => ({
      bookingId: row[0],
      customerId: row[1],
      catalogId: row[2],
      isCustom: row[3] === 1,
      bookingDescription: row[4],
      bookingDate: row[5],
      status: row[6],
    }));
  } finally {
    if (connection) await connection.close();
  }
}

// Get booking by ID with full details
async function getBookingById(bookingId) {
  let connection;
  try {
    connection = await db.getConnection();

    // Get booking details
    const bookingResult = await connection.execute(
      `SELECT b.bookingId, b.customerId, c.name as customerName,
              b.catalogId, cat.packageName, b.isCustom,
              b.bookingDescription, b.bookingDate, b.status
       FROM Booking b
       JOIN Customer c ON b.customerId = c.customerId
       LEFT JOIN Catalog cat ON b.catalogId = cat.catalogId
       WHERE b.bookingId = :id`,
      [bookingId],
    );

    if (bookingResult.rows.length === 0) return null;

    const row = bookingResult.rows[0];
    const booking = {
      bookingId: row[0],
      customerId: row[1],
      customerName: row[2],
      catalogId: row[3],
      packageName: row[4],
      isCustom: row[5] === 1,
      bookingDescription: row[6],
      bookingDate: row[7],
      status: row[8],
    };

    // Get associated hotels
    const hotelsResult = await connection.execute(
      `SELECT h.hotelId, h.hotelName, h.hotelAddress, h.rent,
              bh.roomsBooked, bh.checkIn, bh.checkOut
       FROM Hotel h
       JOIN Booking_Hotel bh ON h.hotelId = bh.hotelId
       WHERE bh.bookingId = :id`,
      [bookingId],
    );
    booking.hotels = hotelsResult.rows.map((r) => ({
      hotelId: r[0],
      hotelName: r[1],
      hotelAddress: r[2],
      rent: r[3],
      roomsBooked: r[4],
      checkIn: r[5],
      checkOut: r[6],
    }));

    // Get associated transport
    const transportResult = await connection.execute(
      `SELECT t.transportId, t.type, t.fare,
              bt.seatsBooked, bt.travelDate
       FROM Transport t
       JOIN Booking_Transport bt ON t.transportId = bt.transportId
       WHERE bt.bookingId = :id`,
      [bookingId],
    );
    booking.transport = transportResult.rows.map((r) => ({
      transportId: r[0],
      type: r[1],
      fare: r[2],
      seatsBooked: r[3],
      travelDate: r[4],
    }));

    // Get associated food
    const foodResult = await connection.execute(
      `SELECT f.foodId, f.meals, f.price, bf.quantity
       FROM Food f
       JOIN Booking_Food bf ON f.foodId = bf.foodId
       WHERE bf.bookingId = :id`,
      [bookingId],
    );
    booking.food = foodResult.rows.map((r) => ({
      foodId: r[0],
      meals: r[1],
      price: r[2],
      quantity: r[3],
    }));

    // Get payment info
    const paymentResult = await connection.execute(
      `SELECT paymentId, amount, paymentDate, method, status, transactionId
       FROM Payment
       WHERE bookingId = :id`,
      [bookingId],
    );
    if (paymentResult.rows.length > 0) {
      const p = paymentResult.rows[0];
      booking.payment = {
        paymentId: p[0],
        amount: p[1],
        paymentDate: p[2],
        method: p[3],
        status: p[4],
        transactionId: p[5],
      };
    }

    return booking;
  } finally {
    if (connection) await connection.close();
  }
}

// Create booking from catalog (pre-made package)
async function createBookingFromCatalog(bookingData) {
  let connection;
  try {
    connection = await db.getConnection();
    const bookingId = generateUUID();

    // Insert booking
    await connection.execute(
      `INSERT INTO Booking (bookingId, customerId, catalogId, isCustom,
                            bookingDescription, status)
       VALUES (:bookingId, :customerId, :catalogId, 0, :description, 'pending')`,
      {
        bookingId,
        customerId: bookingData.customerId,
        catalogId: bookingData.catalogId,
        description:
          bookingData.bookingDescription || "Catalog package booking",
      },
      { autoCommit: false },
    );

    // Copy hotels from catalog to booking
    await connection.execute(
      `INSERT INTO Booking_Hotel (bookingId, hotelId, roomsBooked, checkIn, checkOut)
       SELECT :bookingId, ch.hotelId, ch.roomsIncluded,
              TO_DATE(:checkIn, 'YYYY-MM-DD'), TO_DATE(:checkOut, 'YYYY-MM-DD')
       FROM Catalog_Hotel ch
       WHERE ch.catalogId = :catalogId`,
      {
        bookingId,
        catalogId: bookingData.catalogId,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
      },
      { autoCommit: false },
    );

    // Copy transport from catalog to booking
    await connection.execute(
      `INSERT INTO Booking_Transport (bookingId, transportId, seatsBooked, travelDate)
       SELECT :bookingId, ct.transportId, ct.seatsIncluded,
              TO_DATE(:travelDate, 'YYYY-MM-DD')
       FROM Catalog_Transport ct
       WHERE ct.catalogId = :catalogId`,
      {
        bookingId,
        catalogId: bookingData.catalogId,
        travelDate: bookingData.travelDate,
      },
      { autoCommit: false },
    );

    // Copy food from catalog to booking
    await connection.execute(
      `INSERT INTO Booking_Food (bookingId, foodId, quantity)
       SELECT :bookingId, cf.foodId, 1
       FROM Catalog_Food cf
       WHERE cf.catalogId = :catalogId`,
      { bookingId, catalogId: bookingData.catalogId },
      { autoCommit: false },
    );

    await connection.commit();
    return bookingId;
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Create custom booking
async function createCustomBooking(bookingData) {
  let connection;
  try {
    connection = await db.getConnection();
    const bookingId = generateUUID();

    // Insert booking
    await connection.execute(
      `INSERT INTO Booking (bookingId, customerId, catalogId, isCustom,
                            bookingDescription, status)
       VALUES (:bookingId, :customerId, NULL, 1, :description, 'pending')`,
      {
        bookingId,
        customerId: bookingData.customerId,
        description: bookingData.bookingDescription || "Custom booking",
      },
      { autoCommit: false },
    );

    // Add hotels if provided
    if (bookingData.hotels && bookingData.hotels.length > 0) {
      for (const hotel of bookingData.hotels) {
        await connection.execute(
          `INSERT INTO Booking_Hotel (bookingId, hotelId, roomsBooked, checkIn, checkOut)
           VALUES (:bookingId, :hotelId, :roomsBooked,
                   TO_DATE(:checkIn, 'YYYY-MM-DD'), TO_DATE(:checkOut, 'YYYY-MM-DD'))`,
          {
            bookingId,
            hotelId: hotel.hotelId,
            roomsBooked: hotel.roomsBooked || 1,
            checkIn: hotel.checkIn,
            checkOut: hotel.checkOut,
          },
          { autoCommit: false },
        );
      }
    }

    // Add transport if provided
    if (bookingData.transport && bookingData.transport.length > 0) {
      for (const trans of bookingData.transport) {
        await connection.execute(
          `INSERT INTO Booking_Transport (bookingId, transportId, seatsBooked, travelDate)
           VALUES (:bookingId, :transportId, :seatsBooked, TO_DATE(:travelDate, 'YYYY-MM-DD'))`,
          {
            bookingId,
            transportId: trans.transportId,
            seatsBooked: trans.seatsBooked || 1,
            travelDate: trans.travelDate,
          },
          { autoCommit: false },
        );
      }
    }

    // Add food if provided
    if (bookingData.food && bookingData.food.length > 0) {
      for (const food of bookingData.food) {
        await connection.execute(
          `INSERT INTO Booking_Food (bookingId, foodId, quantity)
           VALUES (:bookingId, :foodId, :quantity)`,
          {
            bookingId,
            foodId: food.foodId,
            quantity: food.quantity || 1,
          },
          { autoCommit: false },
        );
      }
    }

    await connection.commit();
    return bookingId;
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Update booking status
async function updateBookingStatus(bookingId, status) {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.execute(
      `UPDATE Booking SET status = :status WHERE bookingId = :id`,
      { status, id: bookingId },
      { autoCommit: true },
    );
    return true;
  } finally {
    if (connection) await connection.close();
  }
}

// Delete booking
async function deleteBooking(bookingId) {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.execute(
      `DELETE FROM Booking WHERE bookingId = :id`,
      [bookingId],
      { autoCommit: true },
    );
    return true;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = {
  getAllBookings,
  getBookingsByCustomerId,
  getBookingById,
  createBookingFromCatalog,
  createCustomBooking,
  updateBookingStatus,
  deleteBooking,
};
