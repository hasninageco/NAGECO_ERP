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

const SupplierClient = sequelize.define("Supp_Cuss", {
  id_supplier_client: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  Name_supplier_client: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  Code__supplier_client: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  Tel: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  Adress: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  Control_Account: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  Email: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  List_currency: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  TYPE_CUS_SUPP: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  logo: {
  type: DataTypes.TEXT, // This maps to nvarchar(max) in SQL Server
  allowNull: false
}

,
  Files: {
  type: DataTypes.TEXT, // or DataTypes.STRING(4000) for short file lists
  allowNull: false,
  get() {
    const raw = this.getDataValue('Files');
    return raw ? JSON.parse(raw) : [];
  },
  set(val) {
    this.setDataValue('Files', JSON.stringify(val));
  }
}
 
}, {
  freezeTableName: true,
  timestamps: false
});

module.exports = SupplierClient;