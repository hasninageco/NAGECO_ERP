const { sequelize, DataTypes } = require("./_sequelize");

const TypePapier = sequelize.define(
  "Type_papier",
  {
    id_papier: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    name_papier: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    admn: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = TypePapier;
