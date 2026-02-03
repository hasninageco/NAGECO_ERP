const { Sequelize, Model, DataTypes } = require("sequelize");
// Use the shared DB credentials from environment to match other models
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
    }
);

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

// Export the defined model directly
module.exports = ww;
