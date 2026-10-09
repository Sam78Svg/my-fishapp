import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { selectRows, insertRow } from './db.js';

dotenv.config();

const username = process.env.BOOTSTRAP_ADMIN_USERNAME?.trim();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const companyName = process.env.BOOTSTRAP_ADMIN_COMPANY_NAME?.trim();
const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim();

if (!username || !password || !companyName || !email) {
    throw new Error('Set BOOTSTRAP_ADMIN_USERNAME, BOOTSTRAP_ADMIN_PASSWORD, BOOTSTRAP_ADMIN_COMPANY_NAME, and BOOTSTRAP_ADMIN_EMAIL');
}

const existing = await selectRows('admins', {
    columns: 'admin_id',
    filters: { company_name: companyName },
    limit: 1
});
if (existing.length) throw new Error(`An admin already exists for ${companyName}; bootstrap made no changes`);

const passwordHash = await bcrypt.hash(password, 12);
await insertRow('admins', {
    username,
    password: passwordHash,
    company_name: companyName,
    email,
    role: 'admin'
});
process.stdout.write(`Created the first admin for ${companyName}. Remove the BOOTSTRAP_ADMIN_* values from the environment now.\n`);
