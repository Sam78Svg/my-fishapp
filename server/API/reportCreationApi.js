import express from 'express';
import dbConfig from '../db.js';
const router = express.Router();

// Endpoint to save campaign report row
router.post('/save_report', async (req, res) => {
    const { campaign_id, email, clicked, submitted } = req.body;
    try {
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
router.get('/reports', async (req, res) => {
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
                    SUM(CASE WHEN submitted = 1 OR submitted = TRUE THEN 1 ELSE 0 END) AS submitted_count
                FROM tracking
                GROUP BY campaign_name
            ) stats ON stats.campaign_name = c.name
            ORDER BY c.created_at DESC
        `);
        res.json({ data: rows });
    } catch (err) {
        console.error("Fetch reports error:", err);
        res.status(500).json({ message: "Failed to fetch reports" });
    }
});

// Clear all campaigns (existing behaviour)
router.delete('/clear_reports', async (req, res) => {
    try {
        await dbConfig.execute(`DELETE FROM campaigns`);
        res.json({ message: "All reports cleared successfully" });
    } catch (err) {
        console.error("Clear reports error:", err);
        res.status(500).json({ message: "Failed to clear reports" });
    }
});

// Capture credentials endpoint
router.post("/capture", async (req, res) => {
    const { username, password } = req.body;
    console.log(`Capture attempt for user: ${username}`);
    try {

        // ================= FIND USER =================
        const [rows] = await dbConfig.execute(
            "SELECT * FROM users WHERE LOWER(name) = LOWER(?)",
            [username]
        );

        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // IMPORTANT
        // define user BEFORE using it
        const user = rows[0];

        // ================= GET LATEST CAMPAIGN =================
        const [latestCampaign] = await dbConfig.execute(
            `
            SELECT * 
            FROM campaigns 
            WHERE target_group = ?
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [user.department]
        );

        if (latestCampaign.length === 0) {

            return res.status(404).json({
                success: false,
                message: "No active campaign found"
            });
        }

        const campaign = latestCampaign[0];

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
            (username, email, clicked, submitted, campaign_name)
            VALUES (?, ?, ?, ?, ?)
            `,
            [username, user.email, true, true, campaign.name]
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
router.post('/userExist', async (req, res) => {

    const { username } = req.body;
    console.log(req.body);
    console.log(username);

    try {

        const [getUser] = await dbConfig.execute(
            'SELECT * FROM users WHERE LOWER(name) = LOWER(?)',
            [username]
        );


        if (getUser.length > 0) {
            return res.status(200).json({
                success: true,
                user: getUser[0]
            });
        }

        const [getAdmin] = await dbConfig.execute(
            'SELECT * FROM admins WHERE LOWER(username) = LOWER(?)',
            [username]
        );

        if (getAdmin.length > 0) {
            console.log("Admin found:", getAdmin[0]);
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
