const { sequelize, Sequelize, DataTypes } = require("./_sequelize");

const Claims = sequelize.define(
  "Claims",
  {
    ClaimId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    ClaimNo: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    Ref_emp: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    EMP_CHILD: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ProviderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ClaimDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    SubmissionDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    ClaimType: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    BeneficiaryType: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    Status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "Draft",
    },
    TotalClaimed: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    TotalApproved: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    CompanyShare: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    EmployeeShare: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
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

module.exports = Claims;

