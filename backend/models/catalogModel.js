const db = require("../config/db");
const oracledb = require("oracledb");

// Get all catalog packages with full details using VW_CATALOG_FULL_DETAILS view
async function getAllCatalogs() {
  let connection;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `SELECT catalogId, packageName, destination, description, noOfDays,
              budget, departure, arrival,
              totalHotels, totalHotelCost,
              totalTransports, totalTransportCost,
              totalFoodPlans, totalFoodCost,
              calculatedTotalCost
       FROM VW_CATALOG_FULL_DETAILS
       ORDER BY catalogId`,
    );
    return result.rows.map((row) => ({
      catalogId: row[0],
      packageName: row[1],
      destination: row[2],
      description: row[3],
      noOfDays: row[4],
      budget: row[5],
      departure: row[6],
      arrival: row[7],
      totalHotels: row[8],
      totalHotelCost: row[9],
      totalTransports: row[10],
      totalTransportCost: row[11],
      totalFoodPlans: row[12],
      totalFoodCost: row[13],
      calculatedTotalCost: row[14],
    }));
  } finally {
    if (connection) await connection.close();
  }
}

// Get catalog by ID with details (hotels, transport, food)
async function getCatalogById(catalogId) {
  let connection;
  try {
    connection = await db.getConnection();

    // Get catalog details from view
    const catalogResult = await connection.execute(
      `SELECT catalogId, packageName, destination, description, noOfDays,
              budget, departure, arrival,
              totalHotels, totalHotelCost,
              totalTransports, totalTransportCost,
              totalFoodPlans, totalFoodCost,
              calculatedTotalCost
       FROM VW_CATALOG_FULL_DETAILS
       WHERE catalogId = :id`,
      [catalogId],
    );

    if (catalogResult.rows.length === 0) return null;

    const row = catalogResult.rows[0];
    const catalog = {
      catalogId: row[0],
      packageName: row[1],
      destination: row[2],
      description: row[3],
      noOfDays: row[4],
      budget: row[5],
      departure: row[6],
      arrival: row[7],
      totalHotels: row[8],
      totalHotelCost: row[9],
      totalTransports: row[10],
      totalTransportCost: row[11],
      totalFoodPlans: row[12],
      totalFoodCost: row[13],
      calculatedTotalCost: row[14],
    };

    // Get associated hotels
    const hotelsResult = await connection.execute(
      `SELECT h.hotelId, h.hotelName, h.hotelAddress, h.rent, ch.roomsIncluded
       FROM Hotel h
       JOIN Catalog_Hotel ch ON h.hotelId = ch.hotelId
       WHERE ch.catalogId = :id`,
      [catalogId],
    );
    catalog.hotels = hotelsResult.rows.map((r) => ({
      hotelId: r[0],
      hotelName: r[1],
      hotelAddress: r[2],
      rent: r[3],
      roomsIncluded: r[4],
    }));

    // Get associated transport
    const transportResult = await connection.execute(
      `SELECT t.transportId, t.type, t.fare, ct.seatsIncluded
       FROM Transport t
       JOIN Catalog_Transport ct ON t.transportId = ct.transportId
       WHERE ct.catalogId = :id`,
      [catalogId],
    );
    catalog.transport = transportResult.rows.map((r) => ({
      transportId: r[0],
      type: r[1],
      fare: r[2],
      seatsIncluded: r[3],
    }));

    // Get associated food
    const foodResult = await connection.execute(
      `SELECT f.foodId, f.meals, f.price
       FROM Food f
       JOIN Catalog_Food cf ON f.foodId = cf.foodId
       WHERE cf.catalogId = :id`,
      [catalogId],
    );
    catalog.food = foodResult.rows.map((r) => ({
      foodId: r[0],
      meals: r[1],
      price: r[2],
    }));

    return catalog;
  } finally {
    if (connection) await connection.close();
  }
}

// Create new catalog package (admin only)
async function createCatalog(catalogData) {
  let connection;
  try {
    connection = await db.getConnection();

    const result = await connection.execute(
      `INSERT INTO Catalog (packageName, destination, description, noOfDays, budget, departure, arrival)
       VALUES (:packageName, :destination, :description, :noOfDays, :budget,
               TO_DATE(:departure, 'YYYY-MM-DD'), TO_DATE(:arrival, 'YYYY-MM-DD'))
       RETURNING catalogId INTO :id`,
      {
        packageName: catalogData.packageName,
        destination: catalogData.destination,
        description: catalogData.description,
        noOfDays: catalogData.noOfDays,
        budget: catalogData.budget,
        departure: catalogData.departure,
        arrival: catalogData.arrival,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true },
    );

    return result.outBinds.id[0];
  } finally {
    if (connection) await connection.close();
  }
}

// Update catalog
async function updateCatalog(catalogId, catalogData) {
  let connection;
  try {
    connection = await db.getConnection();

    await connection.execute(
      `UPDATE Catalog
       SET packageName = :packageName, destination = :destination,
           description = :description, noOfDays = :noOfDays, budget = :budget,
           departure = TO_DATE(:departure, 'YYYY-MM-DD'),
           arrival = TO_DATE(:arrival, 'YYYY-MM-DD')
       WHERE catalogId = :id`,
      {
        packageName: catalogData.packageName,
        destination: catalogData.destination,
        description: catalogData.description,
        noOfDays: catalogData.noOfDays,
        budget: catalogData.budget,
        departure: catalogData.departure,
        arrival: catalogData.arrival,
        id: catalogId,
      },
      { autoCommit: true },
    );

    return true;
  } finally {
    if (connection) await connection.close();
  }
}

// Delete catalog
async function deleteCatalog(catalogId) {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.execute(
      `DELETE FROM Catalog WHERE catalogId = :id`,
      [catalogId],
      { autoCommit: true },
    );
    return true;
  } finally {
    if (connection) await connection.close();
  }
}

// Add hotel to catalog
async function addHotelToCatalog(catalogId, hotelId, roomsIncluded = 1) {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.execute(
      `INSERT INTO Catalog_Hotel (catalogId, hotelId, roomsIncluded)
       VALUES (:catalogId, :hotelId, :roomsIncluded)`,
      { catalogId, hotelId, roomsIncluded },
      { autoCommit: true },
    );
    return true;
  } finally {
    if (connection) await connection.close();
  }
}

// Add transport to catalog
async function addTransportToCatalog(
  catalogId,
  transportId,
  seatsIncluded = 1,
) {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.execute(
      `INSERT INTO Catalog_Transport (catalogId, transportId, seatsIncluded)
           VALUES (:catalogId, :transportId, :seatsIncluded)`,
      { catalogId, transportId, seatsIncluded },
      { autoCommit: true },
    );
    return true;
  } finally {
    if (connection) await connection.close();
  }
}

// Add food to catalog
async function addFoodToCatalog(catalogId, foodId) {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.execute(
      `INSERT INTO Catalog_Food (catalogId, foodId)
           VALUES (:catalogId, :foodId)`,
      { catalogId, foodId },
      { autoCommit: true },
    );
    return true;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = {
  getAllCatalogs,
  getCatalogById,
  createCatalog,
  updateCatalog,
  deleteCatalog,
  addHotelToCatalog,
  addTransportToCatalog,
  addFoodToCatalog,
};
