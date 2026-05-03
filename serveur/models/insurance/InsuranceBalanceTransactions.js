const { sequelize, Sequelize, DataTypes } = require("./_sequelize");

const InsuranceBalanceTransactions = sequelize.define(
  "InsuranceBalanceTransactions",
  {
    TxnId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    BalancePeriodId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    Ref_emp: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    TxnType: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    Amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    TxnDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("SYSDATETIME()"),
    },
    EffectiveDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    Source: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    ClaimId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    ClaimLineId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    ServiceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    CoveragePercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    Qty: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    UnitPrice: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    ClaimedAmount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    CoveredAmount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    TransferId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    CounterpartyRef_emp: {
      type: DataTypes.STRING(50),
      allowNull: true,
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

module.exports = InsuranceBalanceTransactions;
