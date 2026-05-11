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

const actionForm = sequelize.define(
  "Action_form",
  {
    Id_transaction: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    Date_transaction: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    Usr: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    id_emp: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    old_basic_salary: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    new_basic_salary: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    old_job: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    new_job: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    old_num_job: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    new_num_job: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    old_degree: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    new_degree: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    old_level_candidate: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    new_level_candidate: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    add_value: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    Evaluation_EMP: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = sequelize.model("Action_form", actionForm);
