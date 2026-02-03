const mongoose = require("mssql");

const { Sequelize, DataTypes } = require('sequelize');
const connectDB = async () => {


  try {
    // mongodb connection string
    let config = {
      type: 'mssql',
      server: 'nageco-server',
      user: 'sa', password: '@Nageco2021',
      database: 'FC_NAGECO_WEB',
      Port: 1433,
      //instancename: 'NAG',
      options: {
        encrypt: false,
        trustServerCertificate: true
      }
      ,

    }

    return mongoose.connect(config, {
      useNewUrlParser: true,
      useUnifiedTopology: true,

    }).then(() => {
      console.log(`sql connected : ${config.server}`);
    }).catch((err) => {
      console.log(err);
      console.log(`sql NOT connected : ${config.server}`);
    });







  } catch (err) {
    console.log(err);
    process.exit(1);
  }



};







module.exports = connectDB;




