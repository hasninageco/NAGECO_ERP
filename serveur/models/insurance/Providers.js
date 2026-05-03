const { sequelize, Sequelize, DataTypes } = require("./_sequelize");

const Providers = sequelize.define(
  "Providers",
  {
    ProviderId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    ProviderCode: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    ProviderName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    ProviderType: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    City: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    Address: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    Phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    IsActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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

module.exports = Providers;

