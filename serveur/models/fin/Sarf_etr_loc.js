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

// Model maps to table: Sarf_etr_loc
const SarfEtrLoc = sequelize.define(
  "Sarf_etr_loc",
  {
    ID_transaction: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    date_trandsaction: { type: DataTypes.DATE, allowNull: true },
    Note: { type: DataTypes.TEXT, allowNull: true },
    Project: { type: DataTypes.STRING(100), allowNull: true },
    Account_number1: { type: DataTypes.STRING(11), allowNull: true },
    Account_number2: { type: DataTypes.STRING(11), allowNull: true },
    montant: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
    num_sarf: { type: DataTypes.INTEGER, allowNull: true },
    usr: { type: DataTypes.INTEGER, allowNull: true },
    test_code: { type: DataTypes.STRING(100), allowNull: true },
    Total_fixee: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
    coff: { type: DataTypes.REAL, allowNull: true },
    curr: { type: DataTypes.INTEGER, allowNull: true },
    Info_account: { type: DataTypes.STRING(500), allowNull: true },
    NUM_FACTURE: { type: DataTypes.STRING(500), allowNull: true },
    En_tete: { type: DataTypes.STRING(500), allowNull: true },
    TIP: { type: DataTypes.INTEGER, allowNull: true },
    IS_OK: { type: DataTypes.BOOLEAN, allowNull: true },
    coffffffff: { type: DataTypes.REAL, allowNull: true },
    nettttttt: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
    DATE_FACT: { type: DataTypes.DATEONLY, allowNull: true },
    ref_emp: { type: DataTypes.INTEGER, allowNull: true },
    Id_Well: { type: DataTypes.INTEGER, allowNull: true },
    id_area: { type: DataTypes.INTEGER, allowNull: true },
    id_supp_cuss: { type: DataTypes.INTEGER, allowNull: true },
    Cost_center: { type: DataTypes.INTEGER, allowNull: true },
    sor: { type: DataTypes.INTEGER, allowNull: true },
    Elements: { type: DataTypes.INTEGER, allowNull: true },
    Info__Swift_Code: { type: DataTypes.STRING(500), allowNull: true },
    Info__Address: { type: DataTypes.STRING(500), allowNull: true },
    Info_IBAN: { type: DataTypes.STRING(500), allowNull: true },
    Info_Received_Bank: { type: DataTypes.STRING(500), allowNull: true },
    Info_Beneficiary: { type: DataTypes.STRING(500), allowNull: true },
    note_lettre: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = sequelize.model("Sarf_etr_loc", SarfEtrLoc);
