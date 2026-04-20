const sql = require('mssql');
require('dotenv').config();

const config = {
  server: 'LAPTOP-IUB9BKJG\\SQLEXPRESS',
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: 61263,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
    console.log('Kết nối SQL Server thành công!');
  }
  return pool;
}

module.exports = { getPool, sql };