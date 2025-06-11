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

const Section = sequelize.define('SECTION_FOUR', {
  ID_SECTION: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  DESIG: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  CODE_SECTION: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  Account: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  Debit_Account: {
    type: DataTypes.STRING(50),
    allowNull: false
  }
}, {
  tableName: 'SECTION_FOUR',
  timestamps: false
});

module.exports = Section;