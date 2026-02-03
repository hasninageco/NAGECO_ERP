const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
  }
);

const MeetingRoom = sequelize.define('MeetingRoom', {
  id_room: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  Name_room: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  Comment: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Address: {
    type: DataTypes.STRING,
    allowNull: false
  }
  ,InServices: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  
  }
}, {
  freezeTableName: true,
  timestamps: false
});

module.exports = sequelize.model('MeetingRoom', MeetingRoom);
