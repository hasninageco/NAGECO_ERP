const { sequelize, Sequelize, DataTypes } = require("./_sequelize");

const ClaimDocuments = sequelize.define(
  "ClaimDocuments",
  {
    DocId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    ClaimId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    FileName: {
      type: DataTypes.STRING(260),
      allowNull: false,
    },
    FileType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    StoragePath: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    FileContent: {
      type: DataTypes.BLOB("long"),
      allowNull: true,
    },
    UploadedAt: {
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

module.exports = ClaimDocuments;

