const { Sequelize, Model, DataTypes } = require("sequelize");
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
  }
);


const congee = sequelize.define("congee", {
    int_con: {
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
    state: { type: DataTypes.STRING(50) },
    type_congeee: { type: DataTypes.STRING(5) },
    jour_furier: DataTypes.INTEGER,
    
    adresse: { type: DataTypes.STRING(100) },
    Cause: { type: DataTypes.STRING(500) },
    source_songee: { type: DataTypes.STRING(50) },
    id_view: DataTypes.BOOLEAN,
    nbr_jour_demande: DataTypes.INTEGER,
    nbr_furier: DataTypes.INTEGER,
    DATE_ISTIHKAK: DataTypes.DATEONLY,
    ALAWA_SAFAR: DataTypes.REAL,
    id_ok_istihkak: DataTypes.BOOLEAN,
    id_view1: DataTypes.BOOLEAN,
    IS_TOTAL: DataTypes.BOOLEAN,
    IS_PARCIEL: DataTypes.BOOLEAN,
    
    COMMENT: { type: DataTypes.TEXT },
    NEW_SOLDE: { type: DataTypes.STRING(50) },
    SOLDE_INITIAL: { type: DataTypes.STRING(50) },
    NIVEAU_CANDIDAT: { type: DataTypes.STRING(50) },
    DEGREEEE: { type: DataTypes.STRING(50) },
    MONTANT: DataTypes.DECIMAL(19,4),
    usr: DataTypes.INTEGER,
    Comminucation: DataTypes.DECIMAL(19,4),
    Transport: DataTypes.DECIMAL(19,4),
    currency: { type: DataTypes.STRING(50) },
    RATE_TO_USD: DataTypes.REAL,
   
}, {
    freezeTableName: true,
    timestamps: false,
});

module.exports = sequelize.model("congee", congee);
