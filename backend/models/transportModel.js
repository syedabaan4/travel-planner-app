const db = require("../config/db");

// Get all transport options
async function getAllTransport() {
  let connection;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `SELECT transportId, type, noOfSeats, fare
       FROM Transport
       ORDER BY transportId`,
    );
    return result.rows.map((row) => ({
      transportId: row[0],
      type: row[1],
      noOfSeats: row[2],
      fare: row[3],
    }));
  } finally {
    if (connection) await connection.close();
  }
}

// Get transport by ID
async function getTransportById(transportId) {
  let connection;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `SELECT transportId, type, noOfSeats, fare
       FROM Transport
       WHERE transportId = :id`,
      [transportId],
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      transportId: row[0],
      type: row[1],
      noOfSeats: row[2],
      fare: row[3],
    };
  } finally {
    if (connection) await connection.close();
  }
}

// Create transport (admin only)
async function createTransport(transportData) {
  let connection;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `INSERT INTO Transport (type, noOfSeats, fare)
       VALUES (:type, :noOfSeats, :fare)
       RETURNING transportId INTO :id`,
      {
        type: transportData.type,
        noOfSeats: transportData.noOfSeats,
        fare: transportData.fare,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true },
    );
    return result.outBinds.id[0];
  } finally {
    if (connection) await connection.close();
  }
}

// Update transport
async function updateTransport(transportId, transportData) {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.execute(
      `UPDATE Transport
       SET type = :type, noOfSeats = :noOfSeats, fare = :fare
       WHERE transportId = :id`,
      {
        type: transportData.type,
        noOfSeats: transportData.noOfSeats,
        fare: transportData.fare,
        id: transportId,
      },
      { autoCommit: true },
    );
    return true;
  } finally {
    if (connection) await connection.close();
  }
}

// Delete transport
async function deleteTransport(transportId) {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.execute(
      `DELETE FROM Transport WHERE transportId = :id`,
      [transportId],
      { autoCommit: true },
    );
    return true;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = {
  getAllTransport,
  getTransportById,
  createTransport,
  updateTransport,
  deleteTransport,
};
