const db = require("../config/db");

// Get all food plans
async function getAllFood() {
  let connection;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `SELECT foodId, meals, price
       FROM Food
       ORDER BY foodId`,
    );
    return result.rows.map((row) => ({
      foodId: row[0],
      meals: row[1],
      price: row[2],
    }));
  } finally {
    if (connection) await connection.close();
  }
}

// Get food by ID
async function getFoodById(foodId) {
  let connection;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `SELECT foodId, meals, price
       FROM Food
       WHERE foodId = :id`,
      [foodId],
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      foodId: row[0],
      meals: row[1],
      price: row[2],
    };
  } finally {
    if (connection) await connection.close();
  }
}

// Create food plan (admin only)
async function createFood(foodData) {
  let connection;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `INSERT INTO Food (meals, price)
       VALUES (:meals, :price)
       RETURNING foodId INTO :id`,
      {
        meals: foodData.meals,
        price: foodData.price,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true },
    );
    return result.outBinds.id[0];
  } finally {
    if (connection) await connection.close();
  }
}

// Update food plan
async function updateFood(foodId, foodData) {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.execute(
      `UPDATE Food
       SET meals = :meals, price = :price
       WHERE foodId = :id`,
      {
        meals: foodData.meals,
        price: foodData.price,
        id: foodId,
      },
      { autoCommit: true },
    );
    return true;
  } finally {
    if (connection) await connection.close();
  }
}

// Delete food plan
async function deleteFood(foodId) {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.execute(`DELETE FROM Food WHERE foodId = :id`, [foodId], {
      autoCommit: true,
    });
    return true;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = {
  getAllFood,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
};
