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

const BonSortie = sequelize.define("Bon_sortie", {
  Id_bn: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  date_bn: { type: DataTypes.DATE },
  num_bn: { type: DataTypes.INTEGER },
  id_art: { type: DataTypes.INTEGER },
  qty: { type: DataTypes.FLOAT },
  client: { type: DataTypes.INTEGER },
  Req_Item: { type: DataTypes.STRING(50) },
  Ref_Item: { type: DataTypes.STRING(50) },
  Crew: { type: DataTypes.INTEGER },
  IS_DEVICE: { type: DataTypes.BOOLEAN },
  USR: { type: DataTypes.INTEGER },
  Expire_date: { type: DataTypes.DATE },
  Patch_No: { type: DataTypes.STRING(50) },
  store: { type: DataTypes.INTEGER },
  qty_received: { type: DataTypes.FLOAT },
  is_received: { type: DataTypes.BOOLEAN },
  request_no: { type: DataTypes.INTEGER },
  request_usr: { type: DataTypes.INTEGER },
  qty_desp: { type: DataTypes.FLOAT },
  client_original: { type: DataTypes.INTEGER },
  is_closed: { type: DataTypes.BOOLEAN },
  account: { type: DataTypes.STRING(50) },
  COMMENT_ART: { type: DataTypes.TEXT },
  COMMENT_ART_ar: { type: DataTypes.TEXT },
  id_requisition_item_system: { type: DataTypes.INTEGER }
}, {
  freezeTableName: true,
  timestamps: false
});

module.exports = BonSortie;
