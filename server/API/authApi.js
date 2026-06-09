import express from 'express';
import dbConfig from '../db.js';
import bcrypt from 'bcryptjs';
const router = express.Router();

// Signup endpoint (updated with employee password)
router.post('/signup', async (req, res) => {
    const { type } = req.body;

    try {
        // ================= EMPLOYEE =================
        if (type === "employee") {
            console.log(req.body.name, "\n", req.body);
            const { name, department, designation, email, joining_date, password, company_name } = req.body;

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
    let { username, password } = req.body;

    if (!username || !password)
        return res.json({ success: false, message: "All fields required" });

    try {
        // ===== try admin login =====
        const [admins] = await dbConfig.execute(
            "SELECT * FROM admins WHERE username=?",
            [username]
        );

        if (admins.length === 0) {
            return res.json({ success: false, message: "Invalid credentials" });
            console.log(admin);
        }

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
                role: admin.role
            });
        }

        // ===== try employee login (using email as username) =====
        const [employees] = await dbConfig.execute(
            "SELECT * FROM users WHERE name=?",
            [username]
        );

        if (employees.length === 0)
            return res.json({
                success: false,
                message: "Invalid credentials"
            });

        const employee = employees[0];

        const match = await bcrypt.compare(
            password,
            employee.password
        );

        if (!match)
            return res.json({
                success: false,
                message: "Invalid credentials"
            });

        res.json({
            success: true,
            type: "employee",
            name: employee.name,
            email: employee.email,
            department: employee.department,
            designation: employee.designation,
            company_name: employee.company_name
        });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Database error" });
    }
});
export default router;
