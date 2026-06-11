// db.js
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

let pool;

const commonConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

if (process.env.NODE_ENV === "test") {
    // Configuration for the test environment
    pool = mysql.createPool({
        host: process.env.DB_HOST_TEST || 'localhost',
        database: process.env.DB_NAME_TEST,
        ...commonConfig,
        ssl: undefined
    });
} else {
    // Configuration for development/production environment
    pool = mysql.createPool({
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        ...commonConfig,
        ssl: {
            minVersion: "TLSv1.2",
            rejectUnauthorized: true
        }
    });
}

console.log("DB_HOST:", process.env.NODE_ENV === "test" ? process.env.DB_HOST_TEST || 'localhost' : process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.NODE_ENV === "test" ? process.env.DB_NAME_TEST : process.env.DB_NAME);

export default pool.promise();