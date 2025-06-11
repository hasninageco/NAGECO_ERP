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


const Products = sequelize.define("Article", {
  Id_art: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  } 
  
   ,
  desig_art: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  BARCODE: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  Alternante_Code: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  ID_SECTION: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  Place_item: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  SECT: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  Price: {
    type: DataTypes.DECIMAL, // or DataTypes.MONEY if your dialect supports it
    allowNull: true
  },
  QTY_SECURIT: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  SCIENTIFIC_NAME: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  PREPARATEUR: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  Comment: {
    type: DataTypes.TEXT, // For nvarchar(MAX)
    allowNull: true
  },
  Is_Verified: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  expir_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  SIZE_ART: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  contents: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  CLASSEMENT: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  CURRENCY: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  MANUFACRURE: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  COUNTRY: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  tt: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  day_expired: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  pharmacy: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  }
}, {
  freezeTableName: true,
  timestamps: false
});

module.exports = sequelize.model("Article", Products);