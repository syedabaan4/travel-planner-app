const db = require("../config/db");
const bcrypt = require("bcrypt");

// Get admin by username (for login)
async function getAdminByUsername(username) {
  let connection;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `SELECT adminId, name, email, username, password FROM Admin WHERE username = :username`,
      [username],
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      adminId: row[0],
      name: row[1],
      email: row[2],
      username: row[3],
      password: row[4],
    };
  } finally {
    if (connection) await connection.close();
  }
}

// Create admin (typically done once)
async function createAdmin(adminData) {
  let connection;
  try {
    connection = await db.getConnection();
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    const result = await connection.execute(
      `INSERT INTO Admin (name, email, username, password)
       VALUES (:name, :email, :username, :password)
       RETURNING adminId INTO :id`,
      {
        name: adminData.name,
        email: adminData.email,
        username: adminData.username,
        password: hashedPassword,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true },
    );

    return result.outBinds.id[0];
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = {
  getAdminByUsername,
  createAdmin,
};
