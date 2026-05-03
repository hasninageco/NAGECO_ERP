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

const Child = sequelize.define("CHILD", {
  ID_CHILD: {
    autoIncrement: true,
    type: DataTypes.BIGINT,
    allowNull: false,
    primaryKey: true,
  },
  NAME_CHILD: DataTypes.STRING(100),
  NUM_NATIONAL: DataTypes.STRING(50),
  DATE_NAISSANCE: DataTypes.DATE,
  SEX: DataTypes.STRING(50),
  EMP_CHILD: DataTypes.BIGINT,
  type_child: DataTypes.STRING(50),
  STATE: DataTypes.BOOLEAN,
  NOTIONALITY: DataTypes.STRING(50),
  Passport_Number: DataTypes.STRING(50),
  English_Name: DataTypes.STRING(50),
  TEL: DataTypes.STRING(50),
  ADRESS: DataTypes.STRING(500),
  MAIL: DataTypes.STRING(50),
}, {
  freezeTableName: true,
  timestamps: false,
});

module.exports = sequelize.model("CHILD", Child);
