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

const MeetingSchedule = sequelize.define('MeetingSchedule', {
  id_meeting: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_room: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  date_meeting: {
    type: DataTypes.STRING, // Changed from DataTypes.DATE
    allowNull: false
  },
  date_meeting_end: {
    type: DataTypes.STRING, // For compatibility with current working solution
    allowNull: true
  },
  members_meeting: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'members_meeting'
  },
  Other_members_meeting: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'Other_members_meeting'
  },
  comment: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Notes: {
    type: DataTypes.STRING,
    allowNull: true
  },
  creation_date: {
    type: DataTypes.STRING, // Changed from DataTypes.DATE
    allowNull: false
  },
  usr: {
    type: DataTypes.STRING(50),
    allowNull: false
  }
}, {
  freezeTableName: true,
  timestamps: false
});

module.exports = sequelize.model('MeetingSchedule', MeetingSchedule);
