const db = require("../config/db");

// Get all hotels
async function getAllHotels() {
  let connection;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `SELECT hotelId, hotelName, hotelAddress, availableRooms, rent
       FROM Hotel
       ORDER BY hotelId`,
    );
    return result.rows.map((row) => ({
      hotelId: row[0],
      hotelName: row[1],
      hotelAddress: row[2],
      availableRooms: row[3],
      rent: row[4],
    }));
  } finally {
    if (connection) await connection.close();
  }
}

// Get hotel by ID
async function getHotelById(hotelId) {
  let connection;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `SELECT hotelId, hotelName, hotelAddress, availableRooms, rent
       FROM Hotel
       WHERE hotelId = :id`,
      [hotelId],
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      hotelId: row[0],
      hotelName: row[1],
      hotelAddress: row[2],
      availableRooms: row[3],
      rent: row[4],
    };
  } finally {
    if (connection) await connection.close();
  }
}

// Create hotel (admin only)
async function createHotel(hotelData) {
  let connection;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `INSERT INTO Hotel (hotelName, hotelAddress, availableRooms, rent)
       VALUES (:hotelName, :hotelAddress, :availableRooms, :rent)
       RETURNING hotelId INTO :id`,
      {
        hotelName: hotelData.hotelName,
        hotelAddress: hotelData.hotelAddress,
        availableRooms: hotelData.availableRooms,
        rent: hotelData.rent,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true },
    );
    return result.outBinds.id[0];
  } finally {
    if (connection) await connection.close();
  }
}

// Update hotel
async function updateHotel(hotelId, hotelData) {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.execute(
      `UPDATE Hotel
       SET hotelName = :hotelName, hotelAddress = :hotelAddress,
           availableRooms = :availableRooms, rent = :rent
       WHERE hotelId = :id`,
      {
        hotelName: hotelData.hotelName,
        hotelAddress: hotelData.hotelAddress,
        availableRooms: hotelData.availableRooms,
        rent: hotelData.rent,
        id: hotelId,
      },
      { autoCommit: true },
    );
    return true;
  } finally {
    if (connection) await connection.close();
  }
}

// Delete hotel
async function deleteHotel(hotelId) {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.execute(
      `DELETE FROM Hotel WHERE hotelId = :id`,
      [hotelId],
      { autoCommit: true },
    );
    return true;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = {
  getAllHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
};
