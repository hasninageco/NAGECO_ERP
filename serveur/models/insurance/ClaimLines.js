const { sequelize, DataTypes } = require("./_sequelize");

const ClaimLines = sequelize.define(
  "ClaimLines",
  {
    ClaimLineId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    ClaimId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    ServiceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Qty: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1,
    },
    UnitPrice: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    // Computed column in SQL: (ROUND(Qty * UnitPrice, 2))
    ClaimedAmount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    CoverageUsed: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    ApprovedAmount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    CompanyPay: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    EmployeePay: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    LineStatus: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "Submitted",
    },
    Notes: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = ClaimLines;

