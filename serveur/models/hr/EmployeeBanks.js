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

const EmployeeBanks = sequelize.define("Banque", {
  id_Banque: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      desig_banque: {
        type: DataTypes.STRING(1000),
        allowNull: true
      },
      checkkkkkk: {
        type: DataTypes.STRING(200),
        allowNull: true
      },
      BankID: {
        type: DataTypes.INTEGER,
        allowNull: true
      }  
    }, {
      freezeTableName: true,  
      timestamps: false       
    });
    

module.exports = sequelize.model("Banque", EmployeeBanks);
