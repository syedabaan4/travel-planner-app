const db = require("../config/db");
const bcrypt = require("bcrypt");
const oracledb = require("oracledb");

// Get all customers (admin only)
async function getAllCustomers() {
  let connection;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `SELECT customerId, name, email, phone, username FROM Customer ORDER BY customerId`,
    );
    return result.rows.map((row) => ({
      customerId: row[0],
      name: row[1],
      email: row[2],
      phone: row[3],
      username: row[4],
    }));
  } finally {
    if (connection) await connection.close();
  }
}

// Get customer by ID
async function getCustomerById(customerId) {
  let connection;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `SELECT customerId, name, email, phone, username FROM Customer WHERE customerId = :id`,
      [customerId],
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      customerId: row[0],
      name: row[1],
      email: row[2],
      phone: row[3],
      username: row[4],
    };
  } finally {
    if (connection) await connection.close();
  }
}

// Get customer by username (for login)
async function getCustomerByUsername(username) {
  let connection;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `SELECT customerId, name, email, phone, username, password FROM Customer WHERE username = :username`,
      [username],
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      customerId: row[0],
      name: row[1],
      email: row[2],
      phone: row[3],
      username: row[4],
      password: row[5],
    };
  } finally {
    if (connection) await connection.close();
  }
}

// Create new customer (registration)
async function createCustomer(customerData) {
  let connection;
  try {
    connection = await db.getConnection();

    // Hash password
    const hashedPassword = await bcrypt.hash(customerData.password, 10);

    const result = await connection.execute(
      `INSERT INTO Customer (name, email, phone, username, password)
       VALUES (:name, :email, :phone, :username, :password)
       RETURNING customerId INTO :id`,
      {
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        username: customerData.username,
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

// Update customer
async function updateCustomer(customerId, customerData) {
  let connection;
  try {
    connection = await db.getConnection();

    let query = `UPDATE Customer SET name = :name, email = :email, phone = :phone`;
    const binds = {
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      id: customerId,
    };

    // Only update password if provided
    if (customerData.password) {
      const hashedPassword = await bcrypt.hash(customerData.password, 10);
      query += `, password = :password`;
      binds.password = hashedPassword;
    }

    query += ` WHERE customerId = :id`;

    await connection.execute(query, binds, { autoCommit: true });
    return true;
  } finally {
    if (connection) await connection.close();
  }
}

// Delete customer
async function deleteCustomer(customerId) {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.execute(
      `DELETE FROM Customer WHERE customerId = :id`,
      [customerId],
      { autoCommit: true },
    );
    return true;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = {
  getAllCustomers,
  getCustomerById,
  getCustomerByUsername,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
