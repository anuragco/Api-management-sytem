const mysql = require('mysql2/promise');

const dotenv = require('dotenv');
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  // port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Add this near the start of your application
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection error on startup:', err);
    // Consider process.exit(1) if you want to stop the server
  } else {
    console.log('Database connection verified successfully on startup');
    connection.release();
  }
});

module.exports = pool;
