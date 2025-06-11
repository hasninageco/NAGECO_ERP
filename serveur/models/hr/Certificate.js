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


const Certificate = sequelize.define("moahel_3ilmi", {
  id_m3: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      desig_m3: {
        type: DataTypes.STRING(1000),
        allowNull: true
      } 
    }, {
      freezeTableName: true,  
      timestamps: false       
    });
    

module.exports = sequelize.model("moahel_3ilmi", Certificate);
