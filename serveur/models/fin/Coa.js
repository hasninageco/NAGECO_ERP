const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
  }
);


const Coa = sequelize.define("Master", {
  IND: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  Acc_No: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  Name_M: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  Date_m: {
    type: DataTypes.DATE,
    allowNull: true
  },
  State: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  solde_initiale: {
    type: DataTypes.DECIMAL, // or MONEY depending on your preference
    allowNull: true
  },
  type_acc: {
    type: DataTypes.STRING(2),
    allowNull: true
  },
  ancien_acc_no: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  percent_budget: {
    type: DataTypes.FLOAT, // or REAL depending on your preference
    allowNull: true
  },
  solde_by_currency: {
    type: DataTypes.DECIMAL, // or MONEY depending on your preference
    allowNull: true
  },
  d1: {
    type: DataTypes.DATE,
    allowNull: true
  },
  d2: {
    type: DataTypes.DATE,
    allowNull: true
  },
  L10: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  freezeTableName: true,
  timestamps: false
});

module.exports = sequelize.model("Master", Coa);
