const oracledb = require("oracledb");

require("dotenv").config();

// Connection pool configuration
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECTION_STRING,
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 1,
};

// Initialize connection pool
async function initialize() {
  try {
    await oracledb.createPool(dbConfig);
    console.log("✅ Oracle Database connection pool created successfully");
  } catch (err) {
    console.error("❌ Error creating connection pool:", err);
    process.exit(1);
  }
}

// Get connection from pool
async function getConnection() {
  try {
    return await oracledb.getConnection();
  } catch (err) {
    console.error("Error getting connection from pool:", err);
    throw err;
  }
}

// Close connection pool
async function close() {
  try {
    await oracledb.getPool().close(0);
    console.log("Oracle Database connection pool closed");
  } catch (err) {
    console.error("Error closing connection pool:", err);
  }
}

module.exports = {
  initialize,
  getConnection,
  close,
  oracledb
};
