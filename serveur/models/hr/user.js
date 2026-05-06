const { Sequelize, DataTypes } = require("sequelize");
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
  }
);

const User = sequelize.define("userSN", {
  USER_ID: {
    autoIncrement: true,
    type: DataTypes.BIGINT,
    allowNull: false,
    primaryKey: true
  },
  Name_user: DataTypes.TEXT,
  login_user: DataTypes.TEXT,
  pwd_user: DataTypes.TEXT,
  Action_user: DataTypes.TEXT,
  Web_Permissions: DataTypes.TEXT,
  State: DataTypes.BOOLEAN,
  ref_emp: DataTypes.TEXT,
  ACCEPT_MODIFY: DataTypes.BOOLEAN,
  COST_CENTER_TO_MANAGE: DataTypes.TEXT,
  WhareHouse_To_Manage: DataTypes.TEXT,
}, {
  freezeTableName: true,
  timestamps: false,
});

module.exports = User;
