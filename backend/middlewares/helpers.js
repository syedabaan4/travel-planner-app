const { v4: uuidv4 } = require("uuid");

// Generate UUID for bookings and payments
function generateUUID() {
  return uuidv4();
}

// Format Oracle date
function formatDate(date) {
  if (!date) return null;
  return new Date(date).toISOString().split("T")[0];
}

module.exports = {
  generateUUID,
  formatDate,
};
