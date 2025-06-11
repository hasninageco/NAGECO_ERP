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


const TypeFond = sequelize.define("Type_fond", {
  id_type_fond: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      desig_type_font: {
        type: DataTypes.STRING(1000),
        allowNull: true
      } ,
      Account_numbrer_debit: {
        type: DataTypes.STRING(100),
        allowNull: true
      } ,
      Account_numbrer_credit: {
        type: DataTypes.STRING(100),
        allowNull: true
      } 
    }, {
      freezeTableName: true,  
      timestamps: false       
    });
    

module.exports = sequelize.model("Type_fond", TypeFond);
