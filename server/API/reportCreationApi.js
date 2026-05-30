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

export default router;
