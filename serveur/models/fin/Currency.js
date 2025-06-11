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


const Currency = sequelize.define("curr", {
  INt_c: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name_c: {
        type: DataTypes.STRING(1000),
        allowNull: true
      } ,
      Code_TIP: {
        type: DataTypes.STRING(1000),
        allowNull: true
      } ,
      is_local: {
        type: DataTypes.BOOLEAN,
        allowNull: true
      } 
    }, {
      freezeTableName: true,  
      timestamps: false       
    });
    

module.exports = sequelize.model("curr", Currency);
