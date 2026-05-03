const { sequelize, Sequelize, DataTypes } = require("./_sequelize");

const InsuranceBalanceTransfers = sequelize.define(
  "InsuranceBalanceTransfers",
  {
    TransferId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    FromRef_emp: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    ToRef_emp: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    Amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    EffectiveDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    Notes: {
      type: DataTypes.STRING(300),
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

module.exports = InsuranceBalanceTransfers;
