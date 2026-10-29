import mysql from 'mysql2/promise';
import { config } from './env.js';

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: 'Z',
});

// Set MySQL's session timezone too, so CURRENT_TIMESTAMP values are UTC.
pool.on('connection', (connection) => {
  connection.query("SET time_zone = '+00:00'", (error) => {
    if (error) {
      console.error('Unable to configure the MySQL session timezone as UTC.');
    }
  });
});

export async function checkDatabaseConnection() {
  await pool.query('SELECT 1');
}
