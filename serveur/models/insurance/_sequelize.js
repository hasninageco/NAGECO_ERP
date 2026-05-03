const { Sequelize, DataTypes } = require("sequelize");

// Shared Sequelize instance for all insurance models.
// This enables cross-model transactions (e.g. claim line + balance deduction).
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
  }
);

module.exports = {
  sequelize,
  Sequelize,
  DataTypes,
};
