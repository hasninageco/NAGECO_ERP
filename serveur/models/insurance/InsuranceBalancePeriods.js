const { sequelize, Sequelize, DataTypes } = require("./_sequelize");

const InsuranceBalancePeriods = sequelize.define(
  "InsuranceBalancePeriods",
  {
    BalancePeriodId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    Ref_emp: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    PeriodName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ValidFrom: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    ValidTo: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    CurrencyCode: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      defaultValue: "LYD",
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

module.exports = InsuranceBalancePeriods;
