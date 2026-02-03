const { Sequelize, DataTypes } = require('sequelize');

// Use the shared DB credentials from environment to match other models
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
  }
);

const holidays = sequelize.define(
  'HOLIDAYS',
  {
    ID_HOLIDAYS: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    DATE_H: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    COMMENT_H: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    IN_CALL: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = holidays;
