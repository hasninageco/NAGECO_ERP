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


const positions = sequelize.define("job", {
    id_job: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      job_name: {
        type: DataTypes.STRING(200),
        allowNull: true
      },
      year_job: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      Job_degree: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      Job_level: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      Job_title: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      Job_code: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      job_categories: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      NBR_YEAR_FOR_JOB: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    }, {
      freezeTableName: true,  
      timestamps: false       
    });
    

module.exports = sequelize.model("job", positions);
