const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize(process.env.SRV, process.env.USER, process.env.PASSWORD, { dialect: 'mssql' });

const currency = sequelize.define("curr", {

  INt_c:
  {
    autoIncrement: true,
    type: DataTypes.BIGINT,
    allowNull: false,
    primaryKey: true
  },


  name_c: DataTypes.TEXT,
  Code_TIP: DataTypes.TEXT,
  is_local: DataTypes.BOOLEAN,


}, {
  freezeTableName: true,
  timestamps: false,
});

module.exports = sequelize.model("curr", currency);
