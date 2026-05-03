const { sequelize, Sequelize, DataTypes } = require('./_sequelize');

const ClaimLinePayments = sequelize.define(
  'ClaimLinePayments',
  {
    PaymentId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    ClaimLineId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    ClaimId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    AmountCompany: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    AmountEmployee: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    Status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'Paid',
    },
    PaidAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    PaidBy: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    Notes: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    CreatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('SYSDATETIME()'),
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = ClaimLinePayments;
