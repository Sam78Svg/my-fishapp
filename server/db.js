// db.js
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// Creating a connection pool to the database
const pool = mysql.createPool({
    host: process.env.DB_HOST, // your host
    user: process.env.DB_USER, // your username
    password: process.env.DB_PASSWORD, // your password
    database: process.env.DB_NAME, // your database name

    // ssl: {
    //     minVersion: "TLSv1.2",
    //     rejectUnauthorized: true

    // },

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);
export default pool.promise();