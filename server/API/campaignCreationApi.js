import express from 'express';
import dbConfig from '../db.js';
import { authenticate, requireRole } from '../utils/auth.js';
const router = express.Router();
router.use(authenticate, requireRole('admin'));
// ================= CAMPAIGN CREATION APIs =================

// API endpoint to handle campaign creation and 
router.post('/save_campaign', async (req, res) => {
    const { campaign_name, email_template, target_group } = req.body;
    const company_name = req.auth.company_name;

    if (!campaign_name || !email_template || !target_group || !company_name) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const [templateRows] = await dbConfig.execute(
            'SELECT id FROM templates WHERE name = ? AND company_name = ?',
            [email_template, company_name]
        );
        const [groupRows] = await dbConfig.execute(
            'SELECT 1 FROM users WHERE department = ? AND company_name = ? LIMIT 1',
            [target_group, company_name]
        );
        if (!templateRows.length || !groupRows.length) {
            return res.status(400).json({ message: 'Select a template and target group from your company' });
        }

        const [emailCount] = await dbConfig.execute(
            "SELECT COUNT(*) AS count FROM users WHERE department = ? and company_name = ?",
            [target_group, company_name]
        );

    // Save campaign info and file path to MySQL
        const sql = `
            INSERT INTO campaigns (name, template_type, target_group, email_sent, created_at, company_name)
            VALUES (?, ?, ?, ?, NOW(), ?)
        `;
        const [result] = await dbConfig.execute(sql, [
            campaign_name,
            email_template,
            target_group,
            Number(emailCount[0].count),
            company_name
        ]);
        res.json({ message: "Campaign saved successfully", campaign_id: result.insertId });
    } catch (err) {
        console.error("DB error:", err);
        res.status(500).json({ message: "Database error" });
    }
});


// CREATE TEMPLATE
router.post('/templates', async (req, res) => {
    const { name, content } = req.body;

    if (!name || !content)
        return res.json({ success: false, message: "All fields required" });

    try {
        await dbConfig.execute(
            "INSERT INTO templates (name, content, company_name) VALUES (?, ?, ?)",
            [name, content, req.auth.company_name]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "DB error" });
    }
});

// GET ALL TEMPLATES
router.get('/templates', async (req, res) => {
    try {
        const [templates] = await dbConfig.execute("SELECT id, name, content FROM templates WHERE company_name = ?", [req.auth.company_name]);
        res.json(templates);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "DB error" });
    }
});

// UPDATE TEMPLATE
router.put('/templates/:id', async (req, res) => {
    const { name, content } = req.body;
    const { id } = req.params;

    try {
        await dbConfig.execute(
            "UPDATE templates SET name=?, content=? WHERE id=? AND company_name=?",
            [name, content, id, req.auth.company_name]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "DB error" });
    }
});

// DELETE TEMPLATE
router.delete('/templates/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await dbConfig.execute("DELETE FROM templates WHERE id=? AND company_name=?", [id, req.auth.company_name]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "DB error" });
    }
});


//load target groups for dropdown
router.get('/target-groups', async (req, res) => {
    try {
        const [rows] = await dbConfig.execute(
            `SELECT DISTINCT department FROM users WHERE company_name = ?`,
            [req.auth.company_name]
        );

        const groups = rows.map(r => r.department);

        res.json(groups); // ✅ MUST be array

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch groups" });
    }
});

// Api endpoint to save links
router.post('/saveLink', async (req, res) => {
    const { link_desc, link_status, target_group, template_type } = req.body;
    if (!link_desc || !link_status || !target_group || !template_type) {
        return res.status(400).json({ message: "All fields are required" });
    }
    try {
        const sql =
            "INSERT INTO links (link_desc, link_status, target_group, template_type, company_name) VALUES (?, ?, ?, ?, ?)"

        await dbConfig.execute(sql, [link_desc, link_status, target_group, template_type, req.auth.company_name]);
        res.json({ message: "Link saved successfully" });
    }
    catch (err) {
        console.error("DB error:", err);
        return res.status(500).json({ message: "Database error" });
    }
});

router.get('/links', async (req, res) => {
    try {
        const [links] = await dbConfig.execute("SELECT * FROM links WHERE company_name = ?", [req.auth.company_name]);
        res.json(links);
    } catch (err) {
        console.error("DB error:", err);
        res.status(500).json({ message: "Database error" });
    }
});


export default router;


