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

// Model maps to table: Chash_Book_Check
const ChashBookCheck = sequelize.define(
  "Chash_Book_Check",
  {
    ID_transaction: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    date_trandsaction: { type: DataTypes.DATE, allowNull: true },
    Checks_number: { type: DataTypes.STRING(50), allowNull: true },
    Note: { type: DataTypes.STRING(500), allowNull: true },
    Project: { type: DataTypes.STRING(100), allowNull: true },
    Account_number1: { type: DataTypes.STRING(11), allowNull: true },
    Account_number2: { type: DataTypes.STRING(11), allowNull: true },
    montant: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
    num_sarf: { type: DataTypes.INTEGER, allowNull: true },
    utilisateur: { type: DataTypes.INTEGER, allowNull: true },
    NUM_FACTURE: { type: DataTypes.STRING(50), allowNull: true },
    En_tete: { type: DataTypes.STRING(500), allowNull: true },
    IS_OK: { type: DataTypes.BOOLEAN, allowNull: true },
    ref_emp: { type: DataTypes.INTEGER, allowNull: true },
    usr: { type: DataTypes.INTEGER, allowNull: true },
    is_auto: { type: DataTypes.BOOLEAN, allowNull: true },
    Id_Well: { type: DataTypes.INTEGER, allowNull: true },
    id_area: { type: DataTypes.INTEGER, allowNull: true },
    id_supp_cuss: { type: DataTypes.INTEGER, allowNull: true },
    Cost_center: { type: DataTypes.INTEGER, allowNull: true },
    Note_en: { type: DataTypes.STRING(500), allowNull: true },
    sor: { type: DataTypes.INTEGER, allowNull: true },
    Elements: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = sequelize.model("Chash_Book_Check", ChashBookCheck);
