const { sequelize, DataTypes } = require("./_sequelize");

const AdministrationArchive = sequelize.define(
  "ADMINISTRATION_ARCHIVE",
  {
    _ADMINISTRATION_ID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    _ADMINISTRATION_EMP_NO: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    _ADMINISTRATION_DATE_PAPER: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    _ADMINISTRATION_STE: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    _ADMINISTRATION_TYPE_PAPER: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    _ADMINISTRATION_CLASS: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    _ADMINISTRATION_DATE: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    _ADMINISTRATION_REF: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    _ADMINISTRATION_object: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    _ADMINISTRATION_comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    _ADMINISTRATION_USER: {
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

module.exports = AdministrationArchive;
