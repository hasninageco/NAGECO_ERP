const { Sequelize, Model, DataTypes } = require("sequelize");
const sequelize = new Sequelize('FC_NAGECO', 'sa', '123', {
    dialect: 'mssql'


});

const ww = sequelize.define("WADH3_WADHIFI", {

    int_can:
    {
        autoIncrement: true,
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true
    },

 
    desig_can: DataTypes.TEXT,
    code: DataTypes.TEXT ,
}, {
    freezeTableName: true,
    timestamps: false,
});

module.exports = sequelize.model("WADH3_WADHIFI", ww);
