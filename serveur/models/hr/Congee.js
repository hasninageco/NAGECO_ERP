const { Sequelize, Model, DataTypes } = require("sequelize");
const sequelize = new Sequelize('FC_NAGECO', 'sa', '123', {
    dialect: 'mssql'


});

const congee = sequelize.define("congee", {

    int_con:
    {
        autoIncrement: true,
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true
    },


    

    id_emp: DataTypes.INTEGER,
    id_can: DataTypes.INTEGER,
    date_depart: DataTypes.DATE,
    date_end: DataTypes.DATE,
    date_retour: DataTypes.DATE,
    nbr_jour: DataTypes.INTEGER,
    date_creation: DataTypes.DATE,
    reste_solde: DataTypes.INTEGER,
    state: DataTypes.TEXT,
    type_congeee: DataTypes.TEXT,
    jour_furier: DataTypes.INTEGER,
    directeur_direct: DataTypes.INTEGER,
    directeur_generale: DataTypes.INTEGER,
}, {
    freezeTableName: true,
    timestamps: false,
});

module.exports = sequelize.model("congee", congee);
