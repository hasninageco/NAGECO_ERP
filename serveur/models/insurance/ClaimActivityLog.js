const { sequelize, Sequelize, DataTypes } = require("./_sequelize");

// Append-only audit log for claim workflow events (NeedDocuments, uploads, resubmissions, etc.)
const ClaimActivityLog = sequelize.define(
  "ClaimActivityLog",
  {
    ActivityId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    ClaimId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    Action: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    Actor: {
      // JSON string (from JWT payload). Keep as string for MSSQL compatibility.
      type: DataTypes.TEXT,
      allowNull: true,
    },
    Meta: {
      // JSON string
      type: DataTypes.TEXT,
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

module.exports = ClaimActivityLog;
