import express from 'express';
import dbConfig from '../db.js';
import bcrypt from 'bcryptjs';
import { createAuthToken, authenticate, requireRole } from '../utils/auth.js';
const router = express.Router();

// Employee provisioning is an administrative operation.
router.use('/signup', authenticate, requireRole('admin'));

// Signup endpoint (updated with employee password)
router.post('/signup', async (req, res) => {
    const { type } = req.body;

    try {
        // ================= EMPLOYEE =================
        if (type === "employee") {
            const { name, department, designation, email, joining_date, password } = req.body;
            const company_name = req.auth.company_name;

            if (!name || !email || !password)
                return res.json({ success: false, message: "Name, email & password required" });

            const [existing] = await dbConfig.execute(
                "SELECT employee_id FROM users WHERE email=?",
                [email]
            );

            if (existing.length > 0)
                return res.json({ success: false, message: "Employee already exists" });

            const hashed = await bcrypt.hash(password, 10);

            await dbConfig.execute(
                "INSERT INTO users (name, department, designation, email, joining_date, password, company_name) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [name, department, designation, email, joining_date, hashed, company_name]
            );

            return res.json({ success: true });
        }
        return res.json({ success: false, message: "Invalid type" });

    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Database error" });
    }
});

// Login endpoint (supports both employee & admin)
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.json({
            success: false,
            message: "All fields required"
        });
    }

    try {

        // ===== ADMIN LOGIN =====
        const [admins] = await dbConfig.execute(
            "SELECT * FROM admins WHERE LOWER(username)=LOWER(?)",
            [username]
        );

        if (admins.length > 0) {

            const admin = admins[0];

            const adminMatch = await bcrypt.compare(
                password,
                admin.password
            );

            if (adminMatch) {
                return res.json({
                    success: true,
                    type: "admin",
                    username: admin.username,
                    role: admin.role,
                    company_name: admin.company_name,
                    token: createAuthToken({ type: 'admin', username: admin.username, company_name: admin.company_name })
                });
            }
            else {
                return res.json({
                    success: false,
                    message: "Invalid credentials"
                });
            }
        }

        // ===== EMPLOYEE LOGIN =====
        const [employees] = await dbConfig.execute(
            "SELECT * FROM users WHERE LOWER(name)=LOWER(?) Limit 1",
            [username]
        );

        if (employees.length === 0) {
            return res.json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const employee = employees[0];
        const employeeMatch = await bcrypt.compare(
            password,
            employee.password
        );

        if (!employeeMatch) {
            return res.json({
                success: false,
                message: "Invalid credentials"
            });
        }

        return res.json({
            success: true,
            type: "employee",
            name: employee.name,
            email: employee.email,
            department: employee.department,
            designation: employee.designation,
            company_name: employee.company_name,
            token: createAuthToken({ type: 'employee', name: employee.name, company_name: employee.company_name })
        });

    } catch (err) {
        console.error(err);
        return res.json({
            success: false,
            message: "Database error"
        });
    }

});

export default router;
