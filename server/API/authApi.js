import express from 'express';
import { selectRows, insertRow } from '../db.js';
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

            const existing = await selectRows('employees', {
                columns: 'employee_id', filters: { email, company_name }
            });

            if (existing.length > 0)
                return res.json({ success: false, message: "Employee already exists" });

            const hashed = await bcrypt.hash(password, 10);

            await insertRow('employees', {
                name, department, designation, email, joining_date: joining_date || null,
                password: hashed, company_name
            });

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
        const admins = await selectRows('admins', { filters: { username: { op: 'ilike', value: username } }, limit: 2 });

        if (admins.length > 1) {
            return res.json({ success: false, message: 'Invalid credentials' });
        }

        if (admins.length === 1) {

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
        const employees = await selectRows('employees', { filters: { name: { op: 'ilike', value: username } }, limit: 2 });

        if (employees.length !== 1) {
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
