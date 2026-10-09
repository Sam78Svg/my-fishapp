import express from 'express';
import { selectRows, selectRowsWithCount, countRows } from '../db.js';
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
            const allowedRecipients = await selectRows('employees', {
                columns: 'email',
                filters: { company_name: req.auth.company_name, email: { op: 'in', value: recipients } }
            });
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
        const result = await selectRowsWithCount('employees', {
            columns: 'name, email', filters: { department: group, company_name: company },
            limit, offset, order: 'employee_id.asc'
        });

        res.json({
            data: result.data,
            total: result.total ?? result.data.length
        });

    } catch (err) {
        console.error("DB ERROR:", err);
        res.status(500).json({ message: "Failed to fetch recipients" });
    }
});

// Count simulations for the signed-in employee only.
router.post('/capturedUser', authenticate, requireRole('employee'), async (req, res) => {
    const { username } = req.body;
    if (typeof username !== 'string' || username.toLowerCase() !== req.auth.sub.toLowerCase()) {
        return res.status(403).json({ message: 'You can only access your own tracking data' });
    }

    try {
        const userCount = await countRows('tracking', { username, company_name: req.auth.company_name });
        res.json({ userCount });
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
        const userData = await selectRows('employees', {
            filters: { name: { op: 'ilike', value: name }, company_name: req.auth.company_name }, limit: 2
        });

        if (userData.length !== 1) {
            return res.json({ mails: [] });
        }

        const user = userData[0];

        // ✅ Get campaigns for user's department
        const campaigns = await selectRows('campaigns', {
            filters: { target_group: user.department, company_name: user.company_name },
            order: 'created_at.desc'
        });

        let mails = [];

        for (const campaign of campaigns) {

            // ✅ Get template content
            const templateData = await selectRows('templates', {
                columns: 'content', filters: { name: campaign.template_type, company_name: user.company_name }, limit: 1
            });

            if (templateData.length === 0) continue;

            let template = templateData[0].content;

            // ✅ Get link
            const linkData = await selectRows('links', {
                filters: { target_group: user.department, template_type: campaign.template_type, company_name: user.company_name },
                order: 'link_id.desc', limit: 1
            });
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
                campaign_id: campaign.id,
                feedback_page_type: campaign.feedback_page_type || 'generic'
            });

        }

        res.json({ mails });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching emails" });
    }
});


export default router;
