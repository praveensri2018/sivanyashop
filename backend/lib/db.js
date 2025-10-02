// => PLACE: backend/lib/db.js
const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_NAME,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_ENCRYPT === 'false'
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

let poolPromise = null;

async function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(config);
  }
  return poolPromise;
}

async function query(queryString, inputs = {}) {
  const pool = await getPool();
  const request = pool.request();
  for (const [name, { type, value }] of Object.entries(inputs)) {
    request.input(name, type, value);
  }
  const result = await request.query(queryString);
  return result;
}

module.exports = { getPool, query, sql };
