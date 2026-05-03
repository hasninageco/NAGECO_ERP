const { sequelize, Sequelize, DataTypes } = require("./_sequelize");

const Services = sequelize.define(
  "Services",
  {
    ServiceId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    ServiceCode: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    ServiceName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    ArabicName: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    ServiceType: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    CoveragePercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    ValidFrom: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    ValidTo: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    IsActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    Notes: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    clinic_category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    CreatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("SYSDATETIME()"),
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = Services;

