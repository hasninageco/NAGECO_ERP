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

const CostCenter = sequelize.define("Adminstration", {
  id_administratin: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      administration: {
        type: DataTypes.STRING(1000),
        allowNull: true
      },
      Branche: {
        type: DataTypes.STRING(200),
        allowNull: true
      },
      administration_ar: {
        type: DataTypes.STRING(1000),
        allowNull: true
      }  
    }, {
      freezeTableName: true,  
      timestamps: false       
    });
    

module.exports = sequelize.model("Adminstration", CostCenter);
