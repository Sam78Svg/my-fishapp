import express from 'express';
import dbConfig from '../db.js';
import { sendEmail, sendSMS } from '../utils/messaging.js';
const router = express.Router();

// ================= CAMPAIGN SENDING API =================

// Endpoint to send campaign link to emails or phone numbers
router.post('/send_campaign', async (req, res) => {
    const { mode, recipients, link } = req.body;
    console.log("MODE:", mode);
    console.log("RECIPIENTS:", recipients);
    console.log("LINK:", link);
    if (!mode || !recipients || !Array.isArray(recipients) || recipients.length === 0 || !link) {
        return res.status(400).json({ message: 'Mode, recipients, and link are required.' });
    }
    try {
        if (mode === 'sms') {
            await sendSMS(recipients, link);
        } else {
            await sendEmail(recipients, link);
        }
        res.json({ message: 'Campaign link sent successfully.' });
    } catch (err) {
        console.error('Send campaign error:', err);
        res.status(500).json({ message: 'Failed to send campaign link.' });
    }
});

router.get('/recipients', async (req, res) => {
    let { group, company, page = 1, limit } = req.query;
    console.log("COMPANY:", company);
    console.log("GROUP:", group);

    console.log("FETCH RECIPIENTS:", { group, page, limit });

    // 🔥 Convert EVERYTHING to proper types
    page = parseInt(page);
    limit = parseInt(limit);

    if (!group) {
        return res.status(400).json({ message: "Group is required" });
    }

    if (isNaN(page) || isNaN(limit)) {
        return res.status(400).json({ message: "Invalid pagination values" });
    }

    const offset = (page - 1) * limit;

    try {
        const [count] = await dbConfig.execute(
            `SELECT COUNT(*) as total 
            FROM users 
            WHERE department = ? AND company_name = ?`,
            [group, company]
        );
        const query = `
            SELECT name, email 
            FROM users 
            WHERE department = ? 
            AND company_name = ?
            LIMIT ${limit} OFFSET ${offset}
        `;

        const [showData] = await dbConfig.execute(query, [group, company]);

        res.json({
            data: showData,
            total: count[0].total
        });

    } catch (err) {
        console.error("DB ERROR:", err);
        res.status(500).json({ message: "Failed to fetch recipients" });
    }
});

// Endpoint to captured users
router.post('/capturedUser', async (req, res) => {
    const { username } = req.body;
    console.log("CAPTURED USER:", { username });

    try {
        const userCount = await dbConfig.execute(
            `select count(*) from tracking where username=?`,
            [username]
        );
        res.json({ userCount: userCount[0][0]['count(*)'] });
    } catch (err) {
        console.error("capturedUser error:", err);
        res.status(500).json({ message: "Database error" });
    }
});
//fetch email for emaployee
router.post('/fetchEmail', async (req, res) => {
    const { name } = req.body;

    try {
        // ✅ Get user
        const [userData] = await dbConfig.execute(
            "SELECT * FROM users WHERE name = ?",
            [name]
        );

        if (userData.length === 0) {
            return res.json({ mails: [] });
        }

        const user = userData[0];

        // ✅ Get campaigns for user's department
        const [campaigns] = await dbConfig.execute(
            "SELECT * FROM campaigns WHERE target_group = ? ORDER BY created_at DESC",
            [user.department]
        );

        let mails = [];

        for (const campaign of campaigns) {

            // ✅ Get template content
            const [templateData] = await dbConfig.execute(
                "SELECT content FROM templates WHERE name = ?",
                [campaign.template_type]
            );

            if (templateData.length === 0) continue;

            let template = templateData[0].content;

            // ✅ Get link
            const [linkData] = await dbConfig.execute(
                "SELECT * FROM links WHERE target_group = ? LIMIT 1",
                [user.department]
            );

            const [linkCount] = await dbConfig.execute(
                "SELECT COUNT(*) as total FROM tracking WHERE username = ?",
                [user.name]
            );
            const senderEmail = "admin@COMPANY.COM";
            console.log(linkData);
            const linkDes = linkData.length ? linkData[0].link_desc : "#";
            const converLink = `<a href="${linkDes}">${linkDes}</a>`;
            // ✅ Replace variables
            const finalMessage = template
                .replace(/{{sender}}/g, senderEmail)
                .replace(/{{name}}/g, user.name)
                .replace(/{{email}}/g, user.email)
                .replace(/{{targetGroup}}/g, user.department)
                .replace(/{{link}}/g, converLink);

            mails.push({
                subject: campaign.name,
                message: finalMessage,
                received_at: campaign.created_at,
                senderMail: senderEmail,
            });

            // await dbConfig.execute(
            //     `INSERT INTO Email (email_subject, email_message,receiver,receiverEmail) VALUES (?, ?, ?, ?)`,
            //     [campaign.name, finalMessage, user.name, user.email]
            // );
        }

        res.json({ mails });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching emails" });
    }
});


export default router;