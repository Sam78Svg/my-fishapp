import express from 'express';
import dbConfig from '../db.js';
import { sendEmail, sendSMS } from '../utils/messaging.js';
import { authenticate, requireRole } from '../utils/auth.js';
const router = express.Router();

// ================= CAMPAIGN SENDING API =================

// Endpoint to send campaign link to emails or phone numbers
router.post('/send_campaign', authenticate, requireRole('admin'), async (req, res) => {
    const { mode, recipients, link } = req.body;
    if (!['email', 'sms'].includes(mode) || !Array.isArray(recipients) || recipients.length === 0 || recipients.length > 100 || !recipients.every((recipient) => typeof recipient === 'string' && recipient.length <= 320) || typeof link !== 'string' || link.length > 2048 || !link) {
        return res.status(400).json({ message: 'Mode, recipients, and link are required.' });
    }
    try {
        if (mode === 'email') {
            const placeholders = recipients.map(() => '?').join(',');
            const [allowedRecipients] = await dbConfig.execute(
                `SELECT email FROM users WHERE company_name = ? AND email IN (${placeholders})`,
                [req.auth.company_name, ...recipients]
            );
            const allowed = new Set(allowedRecipients.map((row) => row.email.toLowerCase()));
            if (recipients.some((recipient) => typeof recipient !== 'string' || !allowed.has(recipient.toLowerCase()))) {
                return res.status(403).json({ message: 'Campaign emails can only be sent to employees in your company' });
            }
        }
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

router.get('/recipients', authenticate, requireRole('admin'), async (req, res) => {
    let { group, page = 1, limit } = req.query;
    const company = req.auth.company_name;

    // 🔥 Convert EVERYTHING to proper types
    page = Number(page);
    limit = Number(limit);

    if (!group) {
        return res.status(400).json({ message: "Group is required" });
    }

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100 || !company) {
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
            LIMIT ? OFFSET ?
        `;

        const [showData] = await dbConfig.execute(query, [group, company, limit, offset]);

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
router.post('/capturedUser', authenticate, requireRole('employee'), async (req, res) => {
    const { username } = req.body;
    if (typeof username !== 'string' || username.toLowerCase() !== req.auth.sub.toLowerCase()) {
        return res.status(403).json({ message: 'You can only access your own tracking data' });
    }

    try {
        const userCount = await dbConfig.execute(
            `select count(*) from tracking where username=? AND company_name=?`,
            [username, req.auth.company_name]
        );
        res.json({ userCount: userCount[0][0]['count(*)'] });
    } catch (err) {
        console.error("capturedUser error:", err);
        res.status(500).json({ message: "Database error" });
    }
});
//fetch email for emaployee
router.post('/fetchEmail', authenticate, requireRole('employee'), async (req, res) => {
    const { name } = req.body;
    if (typeof name !== 'string' || name.toLowerCase() !== req.auth.sub.toLowerCase()) {
        return res.status(403).json({ message: 'You can only access your own messages' });
    }

    try {
        // ✅ Get user
        const [userData] = await dbConfig.execute(
            "SELECT * FROM users WHERE LOWER(name) = LOWER(?) AND company_name = ?",
            [name, req.auth.company_name]
        );

        if (userData.length === 0) {
            return res.json({ mails: [] });
        }

        const user = userData[0];

        // ✅ Get campaigns for user's department
        const [campaigns] = await dbConfig.execute(
            "SELECT * FROM campaigns WHERE target_group = ? AND company_name = ? ORDER BY created_at DESC",
            [user.department, user.company_name]
        );

        let mails = [];

        for (const campaign of campaigns) {

            // ✅ Get template content
            const [templateData] = await dbConfig.execute(
                "SELECT content FROM templates WHERE name = ? AND company_name = ?",
                [campaign.template_type, user.company_name]
            );

            if (templateData.length === 0) continue;

            let template = templateData[0].content;

            // ✅ Get link
            const [linkData] = await dbConfig.execute(
                "SELECT * FROM links WHERE target_group = ? AND template_type = ? AND company_name = ? ORDER BY id DESC LIMIT 1",
                [user.department, campaign.template_type, user.company_name]
            );

            const [linkCount] = await dbConfig.execute(
                "SELECT COUNT(*) as total FROM tracking WHERE username = ? AND company_name = ?",
                [user.name, user.company_name]
            );
            const senderEmail = "admin@COMPANY.COM";
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
