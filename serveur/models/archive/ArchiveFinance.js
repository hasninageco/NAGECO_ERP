const { sequelize, DataTypes } = require("./_sequelize");

const ArchiveFinance = sequelize.define(
  "Archive_finance",
  {
    _finance_id_arch: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    _finance_date_arch: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    _finance_num_check: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    _finance_kidnot: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    _finance_date_document: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    _finance_type_document: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    _finance_ste: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    _finance_department: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    _finance_subject: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    _finance_comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    _finance_EMP: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    _finance_INVOICE: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    _finance_TAKLIF: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    _finance_CURRENCY: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    _finance_MONTANT: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: true,
    },
    _finance_BANQUE: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    _finance_NUM_SARF: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    _finance_USR: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    sate_copy: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    Archive_Type: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = ArchiveFinance;
