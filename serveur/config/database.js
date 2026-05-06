const mongoose = require("mssql");

const { Sequelize, DataTypes } = require('sequelize');
const connectDB = async () => {


  try {
    // mongodb connection string
    let config = {
      type: 'mssql',
      server: '10.0.2.2',
      user: 'nageco', password: 'pass@pass1',
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




