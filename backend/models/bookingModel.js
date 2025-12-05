const db = require("../config/db");
const oracledb = require("oracledb");
const { generateUUID } = require("../middlewares/helpers");

// Get all bookings (admin only) - uses VW_BOOKING_DETAILS view
async function getAllBookings() {
  let connection;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `SELECT bookingId, customerId, customerName, customerEmail,
              catalogId, packageName, destination, isCustom, bookingType,
              bookingDescription, bookingDate, status,
              totalHotelCost, totalTransportCost, totalFoodCost, grandTotal,
              paymentStatus, paidAmount
       FROM VW_BOOKING_DETAILS
       ORDER BY bookingDate DESC`,
    );
    return result.rows.map((row) => ({
      bookingId: row[0],
      customerId: row[1],
      customerName: row[2],
      customerEmail: row[3],
      catalogId: row[4],
      packageName: row[5],
      destination: row[6],
      isCustom: row[7] === 1,
      bookingType: row[8],
      bookingDescription: row[9],
      bookingDate: row[10],
      status: row[11],
      totalHotelCost: row[12],
      totalTransportCost: row[13],
      totalFoodCost: row[14],
      grandTotal: row[15],
      paymentStatus: row[16],
      paidAmount: row[17],
    }));
  } finally {
    if (connection) await connection.close();
  }
}

// Get bookings by customer ID - uses VW_BOOKING_DETAILS view
async function getBookingsByCustomerId(customerId) {
  let connection;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `SELECT bookingId, customerId, customerName, catalogId, packageName,
              destination, isCustom, bookingType, bookingDescription,
              bookingDate, status, grandTotal, paymentStatus
       FROM VW_BOOKING_DETAILS
       WHERE customerId = :customerId
       ORDER BY bookingDate DESC`,
      [customerId],
    );
    return result.rows.map((row) => ({
      bookingId: row[0],
      customerId: row[1],
      customerName: row[2],
      catalogId: row[3],
      packageName: row[4],
      destination: row[5],
      isCustom: row[6] === 1,
      bookingType: row[7],
      bookingDescription: row[8],
      bookingDate: row[9],
      status: row[10],
      grandTotal: row[11],
      paymentStatus: row[12],
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

    // Get booking details from view
    const bookingResult = await connection.execute(
      `SELECT bookingId, customerId, customerName, customerEmail, customerPhone,
              catalogId, packageName, destination, isCustom, bookingType,
              bookingDescription, bookingDate, status,
              totalHotelCost, totalTransportCost, totalFoodCost, grandTotal,
              paymentStatus, paidAmount
       FROM VW_BOOKING_DETAILS
       WHERE bookingId = :id`,
      [bookingId],
    );

    if (bookingResult.rows.length === 0) return null;

    const row = bookingResult.rows[0];
    const booking = {
      bookingId: row[0],
      customerId: row[1],
      customerName: row[2],
      customerEmail: row[3],
      customerPhone: row[4],
      catalogId: row[5],
      packageName: row[6],
      destination: row[7],
      isCustom: row[8] === 1,
      bookingType: row[9],
      bookingDescription: row[10],
      bookingDate: row[11],
      status: row[12],
      totalHotelCost: row[13],
      totalTransportCost: row[14],
      totalFoodCost: row[15],
      grandTotal: row[16],
      paymentStatus: row[17],
      paidAmount: row[18],
    };

    // Get associated hotels
    const hotelsResult = await connection.execute(
      `SELECT h.hotelId, h.hotelName, h.hotelAddress, h.rent,
              bh.roomsBooked, bh.checkIn, bh.checkOut,
              (h.rent * bh.roomsBooked * (bh.checkOut - bh.checkIn)) AS totalCost
       FROM travel_planner.Hotel h
       JOIN travel_planner.Booking_Hotel bh ON h.hotelId = bh.hotelId
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
      totalCost: r[7],
    }));

    // Get associated transport
    const transportResult = await connection.execute(
      `SELECT t.transportId, t.type, t.fare,
              bt.seatsBooked, bt.travelDate,
              (t.fare * bt.seatsBooked) AS totalCost
       FROM travel_planner.Transport t
       JOIN travel_planner.Booking_Transport bt ON t.transportId = bt.transportId
       WHERE bt.bookingId = :id`,
      [bookingId],
    );
    booking.transport = transportResult.rows.map((r) => ({
      transportId: r[0],
      type: r[1],
      fare: r[2],
      seatsBooked: r[3],
      travelDate: r[4],
      totalCost: r[5],
    }));

    // Get associated food
    const foodResult = await connection.execute(
      `SELECT f.foodId, f.meals, f.price, bf.quantity,
              (f.price * bf.quantity) AS totalCost
       FROM travel_planner.Food f
       JOIN travel_planner.Booking_Food bf ON f.foodId = bf.foodId
       WHERE bf.bookingId = :id`,
      [bookingId],
    );
    booking.food = foodResult.rows.map((r) => ({
      foodId: r[0],
      meals: r[1],
      price: r[2],
      quantity: r[3],
      totalCost: r[4],
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

// Create booking from catalog using stored procedure SP_CREATE_BOOKING_FROM_CATALOG
async function createBookingFromCatalog(bookingData) {
  let connection;
  try {
    connection = await db.getConnection();

    const result = await connection.execute(
      `BEGIN
         SP_CREATE_BOOKING_FROM_CATALOG(
           p_customer_id   => :customerId,
           p_catalog_id    => :catalogId,
           p_description   => :description,
           p_check_in      => TO_DATE(:checkIn, 'YYYY-MM-DD'),
           p_check_out     => TO_DATE(:checkOut, 'YYYY-MM-DD'),
           p_travel_date   => TO_DATE(:travelDate, 'YYYY-MM-DD'),
           p_booking_id    => :bookingId,
           p_total_cost    => :totalCost
         );
       END;`,
      {
        customerId: bookingData.customerId,
        catalogId: bookingData.catalogId,
        description: bookingData.bookingDescription || null,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        travelDate: bookingData.travelDate,
        bookingId: {
          dir: oracledb.BIND_OUT,
          type: oracledb.STRING,
          maxSize: 36,
        },
        totalCost: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
    );

    return {
      bookingId: result.outBinds.bookingId,
      totalCost: result.outBinds.totalCost,
    };
  } finally {
    if (connection) await connection.close();
  }
}

// Calculate booking total using stored procedure SP_CALCULATE_BOOKING_TOTAL
async function calculateBookingTotal(bookingId) {
  let connection;
  try {
    connection = await db.getConnection();

    const result = await connection.execute(
      `BEGIN
         SP_CALCULATE_BOOKING_TOTAL(
           p_booking_id     => :bookingId,
           p_hotel_cost     => :hotelCost,
           p_transport_cost => :transportCost,
           p_food_cost      => :foodCost,
           p_total_cost     => :totalCost
         );
       END;`,
      {
        bookingId: bookingId,
        hotelCost: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        transportCost: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        foodCost: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        totalCost: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
    );

    return {
      hotelCost: result.outBinds.hotelCost,
      transportCost: result.outBinds.transportCost,
      foodCost: result.outBinds.foodCost,
      totalCost: result.outBinds.totalCost,
    };
  } finally {
    if (connection) await connection.close();
  }
}

// Cancel booking using stored procedure SP_CANCEL_BOOKING
async function cancelBooking(bookingId, reason = null) {
  let connection;
  try {
    connection = await db.getConnection();

    const result = await connection.execute(
      `BEGIN
         SP_CANCEL_BOOKING(
           p_booking_id    => :bookingId,
           p_reason        => :reason,
           p_refund_issued => :refundIssued
         );
       END;`,
      {
        bookingId: bookingId,
        reason: reason,
        refundIssued: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
    );

    return {
      success: true,
      refundIssued: result.outBinds.refundIssued === 1,
    };
  } finally {
    if (connection) await connection.close();
  }
}

// Create custom booking (manual - not using stored procedure as it allows flexibility)
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
  calculateBookingTotal,
  cancelBooking,
  createCustomBooking,
  updateBookingStatus,
  deleteBooking,
};
