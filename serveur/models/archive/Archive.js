const { sequelize, DataTypes } = require("./_sequelize");

const ArchiveRecord = sequelize.define(
  "Archive",
  {
    id_arch: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    date_tran: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    date_document: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    ref_document: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    type_document: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    id_administration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    digit_psth: {
      type: DataTypes.STRING(4000),
      allowNull: true,
    },
    phys_path: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    Comment: {
      type: DataTypes.STRING(4000),
      allowNull: true,
    },
    num_archive: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    NUM_TRAN: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    STE: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    SUJET: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    usr: {
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

module.exports = ArchiveRecord;
