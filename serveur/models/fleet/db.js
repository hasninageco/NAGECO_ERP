const sql = require("mssql");

const dbConfig = {
  server: process.env.DB_SERVER || process.env.DB_HOST || "10.0.2.2",
  user: process.env.DB_USER || "nageco",
  password: process.env.DB_PASSWORD || "pass@pass1",
  database: process.env.DB_DATABASE || process.env.DB_NAME || "FC_NAGECO_WEB",
  port: Number(process.env.DB_PORT || 1433),
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT !== "false"
  },
  pool: {
    max: Number(process.env.DB_POOL_MAX || 10),
    min: Number(process.env.DB_POOL_MIN || 0),
    idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_MS || 30000)
  }
};

let poolPromise = null;

async function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(dbConfig)
      .connect()
      .then((pool) => {
        pool.on("error", (error) => {
          console.error("Fleet SQL pool error:", error.message);
        });
        return pool;
      })
      .catch((error) => {
        poolPromise = null;
        throw error;
      });
  }

  return poolPromise;
}

async function createRequest(transaction = null) {
  const pool = await getPool();
  return transaction ? new sql.Request(transaction) : pool.request();
}

async function withTransaction(workFn) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const result = await workFn(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("Fleet transaction rollback failed:", rollbackError.message);
    }

    throw error;
  }
}

module.exports = {
  sql,
  getPool,
  createRequest,
  withTransaction
};
