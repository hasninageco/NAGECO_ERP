const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
  }
);

const BonEntrer = sequelize.define("Bon_entrer", {
  Id_bn: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  date_bn: { type: DataTypes.DATE },
  num_bn: { type: DataTypes.INTEGER },
  id_art: { type: DataTypes.INTEGER },
  qty: { type: DataTypes.FLOAT },
  client: { type: DataTypes.INTEGER },
  num_bc: { type: DataTypes.STRING(50) },
  contenaire: { type: DataTypes.STRING(500) },
  price_bn: { type: DataTypes.DECIMAL },
  IS_DEVICE: { type: DataTypes.BOOLEAN },
  USR: { type: DataTypes.INTEGER },
  EXPIRE_DATE: { type: DataTypes.DATE },
  PATCH_NO: { type: DataTypes.STRING(50) },
  CURRENCY: { type: DataTypes.INTEGER },
  curr: { type: DataTypes.STRING(50) },
  T: { type: DataTypes.STRING(50) },
  store: { type: DataTypes.INTEGER },
  receive_qty: { type: DataTypes.FLOAT },
  rate: { type: DataTypes.FLOAT },
  is_closed: { type: DataTypes.BOOLEAN },
  Solde_final: { type: DataTypes.DECIMAL },
  benefiary_depart: { type: DataTypes.INTEGER },
  num_quotation: { type: DataTypes.STRING(50) },
  num_quot: { type: DataTypes.STRING(50) },
  COMMENT_ART: { type: DataTypes.STRING(500) },
  IS_LOCAL: { type: DataTypes.BOOLEAN },
  COMMENT_ART_ar: { type: DataTypes.TEXT },
  id_requisition_item_system: { type: DataTypes.INTEGER }
}, {
  freezeTableName: true,
  timestamps: false
});

module.exports = BonEntrer;
