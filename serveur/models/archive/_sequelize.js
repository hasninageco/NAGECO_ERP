const { Sequelize, DataTypes } = require("sequelize");

const archiveDbName = process.env.ARCHIVE_DB_NAME || "Archive_Test";
const archiveDbUser = process.env.ARCHIVE_DB_USER || process.env.DB_USER;
const archiveDbPassword = process.env.ARCHIVE_DB_PASSWORD || process.env.DB_PASSWORD;
const archiveDbHost = process.env.ARCHIVE_DB_HOST || process.env.DB_HOST;
const archiveDbDialect = process.env.ARCHIVE_DB_DIALECT || process.env.DB_DIALECT || "mssql";

const sequelize = new Sequelize(archiveDbName, archiveDbUser, archiveDbPassword, {
  host: archiveDbHost,
  dialect: archiveDbDialect,
  logging: false,
});

module.exports = {
  sequelize,
  DataTypes,
};
