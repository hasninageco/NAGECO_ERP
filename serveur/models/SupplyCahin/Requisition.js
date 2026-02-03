const { Sequelize, DataTypes } = require("sequelize");

// Create a sequelize instance (following existing project pattern)
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
  }
);

// Requisition model mapped to existing SQL table with exact column names
const Requisition = sequelize.define(
  "Request_art",
  {
    ID_REQ: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    art: { type: DataTypes.STRING(100), allowNull: true },
    date_req: { type: DataTypes.DATE, allowNull: true },
    usr: { type: DataTypes.INTEGER, allowNull: true },
    num_bn: { type: DataTypes.INTEGER, allowNull: true },
    qty: { type: DataTypes.FLOAT, allowNull: true },
    Crew: { type: DataTypes.STRING(50), allowNull: true },
    Field_Req: { type: DataTypes.STRING(50), allowNull: true },
    Req_item: { type: DataTypes.STRING(50), allowNull: true },
    Destination: { type: DataTypes.STRING(15), allowNull: true },
    Is_ok: { type: DataTypes.BOOLEAN, allowNull: true },
    list_four: { type: DataTypes.STRING(500), allowNull: true },
    qty_preparer: { type: DataTypes.INTEGER, allowNull: true },
    pour_preparer: { type: DataTypes.BOOLEAN, allowNull: true },
    state: { type: DataTypes.STRING(50), allowNull: true },
    is_local: { type: DataTypes.BOOLEAN, allowNull: true },
    Desp_qty: { type: DataTypes.FLOAT, allowNull: true },
    benefiary_depart: { type: DataTypes.INTEGER, allowNull: true },
    STATE_TO_ALARM: { type: DataTypes.BOOLEAN, allowNull: true },
    Request_type: { type: DataTypes.INTEGER, allowNull: true },
    Comment: { type: DataTypes.TEXT, allowNull: true },
    Is_approved_l2: { type: DataTypes.BOOLEAN, allowNull: true },
    Is_approved_l2_comment: { type: DataTypes.TEXT, allowNull: true },
    Requestrefrence: { type: DataTypes.STRING(500), allowNull: true },
    Is_urgent: { type: DataTypes.BOOLEAN, allowNull: true },
    nbr_ended_by_email: { type: DataTypes.INTEGER, allowNull: true },
    is_draft: { type: DataTypes.BOOLEAN, allowNull: true },
    PROJECT: { type: DataTypes.INTEGER, allowNull: true },
    Related_Document: { type: DataTypes.BLOB("long"), allowNull: true },
    part_number: { type: DataTypes.STRING(50), allowNull: true },
    unit: { type: DataTypes.STRING(50), allowNull: true },
    IS_IMAGE: { type: DataTypes.BOOLEAN, allowNull: true },
    requisition_status: { type: DataTypes.STRING(50), allowNull: true },
    Comment_ar: { type: DataTypes.TEXT, allowNull: true },
    DOC_FILE: { type: DataTypes.TEXT, allowNull: true },
    Received_Qty: { type: DataTypes.FLOAT, allowNull: true },
    Date_Received: { type: DataTypes.DATE, allowNull: true },
    Comment_Receive: { type: DataTypes.TEXT, allowNull: true },
    state_receive: { type: DataTypes.BOOLEAN, allowNull: true },
    TRANSMITTAL_NO: { type: DataTypes.INTEGER, allowNull: true },
    ASSET_ID: { type: DataTypes.INTEGER, allowNull: true },
    Requisition_Title: { type: DataTypes.TEXT, allowNull: true },
    Requisition_Status_Manual: { type: DataTypes.TEXT, allowNull: true },
    dateIs_approved_l2: { type: DataTypes.DATE, allowNull: true },
    warehouse_approvals_user: { type: DataTypes.TEXT, allowNull: true },
    EXISTANE_IN_WAREHOUSE: { type: DataTypes.STRING(50), allowNull: true },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = sequelize.model("Request_art", Requisition);
