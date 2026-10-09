import express from 'express';
import dbConfig from '../db.js';
import { authenticate, requireRole } from '../utils/auth.js';
const router = express.Router();

// Endpoint to save campaign report row
router.post('/save_report', authenticate, requireRole('admin'), async (req, res) => {
    const { campaign_id, email, clicked, submitted } = req.body;
    try {
        const [campaigns] = await dbConfig.execute(
            'SELECT id FROM campaigns WHERE id = ? AND company_name = ?',
            [campaign_id, req.auth.company_name]
        );
        if (!campaigns.length) return res.status(404).json({ message: 'Campaign not found' });
        await dbConfig.execute(
            "INSERT INTO reports (campaign_id, email, clicked, submitted) VALUES (?, ?, ?, ?)",
            [campaign_id, email, clicked, submitted]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "DB error" });
    }
});

// Campaign reports with tracking stats (for admin Reports tab)
router.get('/reports', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const [rows] = await dbConfig.execute(`
            SELECT
                c.id,
                c.name,
                c.template_type,
                c.target_group,
                c.created_at,
                c.email_sent,
                c.clicked,
                COALESCE(stats.submitted_count, 0) AS reported
            FROM campaigns c
            LEFT JOIN (
                SELECT
                    campaign_name,
                    company_name,
                    SUM(CASE WHEN submitted = 1 OR submitted = TRUE THEN 1 ELSE 0 END) AS submitted_count
                FROM tracking
                GROUP BY campaign_name, company_name
            ) stats ON stats.campaign_name = c.name AND stats.company_name = c.company_name
            WHERE c.company_name = ?
            ORDER BY c.created_at DESC
        `, [req.auth.company_name]);
        res.json({ data: rows });
    } catch (err) {
        console.error("Fetch reports error:", err);
        res.status(500).json({ message: "Failed to fetch reports" });
    }
});

// Clear all campaigns (existing behaviour)
router.delete('/clear_reports', authenticate, requireRole('admin'), async (req, res) => {
    try {
        await dbConfig.execute(`DELETE FROM tracking WHERE company_name = ?`, [req.auth.company_name]);
        await dbConfig.execute(`DELETE FROM campaigns WHERE company_name = ?`, [req.auth.company_name]);
        res.json({ message: "All reports cleared successfully" });
    } catch (err) {
        console.error("Clear reports error:", err);
        res.status(500).json({ message: "Failed to clear reports" });
    }
});

// Capture credentials endpoint
router.post("/capture", async (req, res) => {
    const { username, campaignId } = req.body;
    try {
        if (typeof username !== 'string' || !username.trim() || !/^\d+$/.test(String(campaignId || ''))) {
            return res.status(400).json({ success: false, message: 'Username and campaign are required' });
        }

        const [campaignRows] = await dbConfig.execute(
            'SELECT id, name, target_group, company_name FROM campaigns WHERE id = ?',
            [campaignId]
        );
        let campaign = campaignRows[0];
        let user;
        if (campaign?.company_name) {
            const [userRows] = await dbConfig.execute(
                'SELECT name, email, department, company_name FROM users WHERE LOWER(name) = LOWER(?) AND department = ? AND company_name = ?',
                [username.trim(), campaign.target_group, campaign.company_name]
            );
            user = userRows[0];
        }
        // Old campaign URLs used a timestamp instead of a campaign ID. Keep those links working.
        if (!campaign) {
            const [userRows] = await dbConfig.execute(
                'SELECT name, email, department, company_name FROM users WHERE LOWER(name) = LOWER(?)',
                [username.trim()]
            );
            if (userRows.length !== 1 || !userRows[0].company_name) {
                return res.status(404).json({ success: false, message: 'User not found or ambiguous' });
            }
            user = userRows[0];
            const [legacyCampaigns] = await dbConfig.execute(
                'SELECT id, name, target_group, company_name FROM campaigns WHERE target_group = ? AND company_name = ? ORDER BY created_at DESC LIMIT 1',
                [user.department, user.company_name]
            );
            campaign = legacyCampaigns[0];
        }
        if (!campaign || !user) {
            return res.status(404).json({
                success: false,
                message: "Campaign not found"
            });
        }

        // ================= UPDATE CAMPAIGN CLICK COUNT =================
        await dbConfig.execute(
            `
            UPDATE campaigns
            SET clicked = clicked + 1
            WHERE id = ?
            `,
            [campaign.id]
        );

        // ================= SAVE TRACKING =================
        await dbConfig.execute(
            `
            INSERT INTO tracking
            (username, email, clicked, submitted, campaign_name, company_name)
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [user.name, user.email, true, true, campaign.name, campaign.company_name]
        );

        return res.status(200).json({
            success: true,
            message: "Credentials captured"
        });

    } catch (err) {

        console.error("CAPTURE ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Database error"
        });
    }
});

// emloyee Data 
router.post('/userExist', authenticate, async (req, res) => {

    const { username } = req.body;
    const ownUsername = req.auth.sub;
    if (typeof username !== 'string' || username.toLowerCase() !== ownUsername.toLowerCase()) {
        return res.status(403).json({ success: false, message: 'You can only access your own account' });
    }

    try {

        const [getUser] = await dbConfig.execute(
            'SELECT employee_id, name, department, designation, email, joining_date, company_name FROM users WHERE LOWER(name) = LOWER(?) AND company_name = ?',
            [username, req.auth.company_name]
        );


        if (getUser.length > 0) {
            return res.status(200).json({
                success: true,
                user: getUser[0]
            });
        }

        const [getAdmin] = await dbConfig.execute(
            'SELECT username, role, company_name FROM admins WHERE LOWER(username) = LOWER(?) AND company_name = ?',
            [username, req.auth.company_name]
        );

        if (getAdmin.length > 0) {
            return res.status(200).json({
                success: true,
                user: getAdmin[0]
            });
        }

        return res.status(404).json({
            success: false,
            message: "User not found"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "db error"
        });
    }
});

export default router;
