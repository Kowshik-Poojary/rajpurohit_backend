// db.js
const mysql = require("mysql");
require('dotenv').config();

const pool = mysql.createPool({
  connectionLimit: 10, // max simultaneous connections
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Error connecting to MySQL:", err);
  } else {
    console.log("✅ Connected to MySQL database (via pool)");
    connection.release();
  }
});

module.exports = pool;
