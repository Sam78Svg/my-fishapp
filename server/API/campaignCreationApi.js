import express from 'express';
import { selectRows, insertRow, updateRows, deleteRows, countRows } from '../db.js';
import { authenticate, requireRole } from '../utils/auth.js';
const router = express.Router();
router.use(authenticate, requireRole('admin'));
// ================= CAMPAIGN CREATION APIs =================

// API endpoint to handle campaign creation and 
router.post('/save_campaign', async (req, res) => {
    const { campaign_name, email_template, target_group } = req.body;
    const company_name = req.auth.company_name;
    const feedback_page_type = req.body.feedback_page_type || 'generic';

    if (!campaign_name || !email_template || !target_group || !company_name || !['generic', 'google', 'microsoft'].includes(feedback_page_type)) {
        return res.status(400).json({ message: "Campaign details and a supported feedback page are required" });
    }

    try {
        const templateRows = await selectRows('templates', {
            columns: 'id', filters: { name: email_template, company_name }
        });
        const groupRows = await selectRows('employees', {
            columns: 'employee_id', filters: { department: target_group, company_name }, limit: 1
        });
        if (!templateRows.length || !groupRows.length) {
            return res.status(400).json({ message: 'Select a template and target group from your company' });
        }

        const emailCount = await countRows('employees', { department: target_group, company_name });
        const campaign = await insertRow('campaigns', {
            name: campaign_name,
            template_type: email_template,
            target_group,
            email_sent: emailCount,
            company_name,
            feedback_page_type
        });
        res.json({ message: "Campaign saved successfully", campaign_id: campaign?.id });
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
        await insertRow('templates', { name, content, company_name: req.auth.company_name });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "DB error" });
    }
});

// GET ALL TEMPLATES
router.get('/templates', async (req, res) => {
    try {
        const templates = await selectRows('templates', {
            columns: 'id, name, content', filters: { company_name: req.auth.company_name }, order: 'id.asc'
        });
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
        await updateRows('templates', { name, content }, { id, company_name: req.auth.company_name });

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
        await deleteRows('templates', { id, company_name: req.auth.company_name });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "DB error" });
    }
});


//load target groups for dropdown
router.get('/target-groups', async (req, res) => {
    try {
        const rows = await selectRows('employees', {
            columns: 'department', filters: { company_name: req.auth.company_name }
        });
        const groups = [...new Set(rows.map((r) => r.department).filter(Boolean))];

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
        const [template] = await selectRows('templates', {
            columns: 'id', filters: { name: template_type, company_name: req.auth.company_name }, limit: 1
        });
        const [group] = await selectRows('employees', {
            columns: 'employee_id', filters: { department: target_group, company_name: req.auth.company_name }, limit: 1
        });
        if (!template || !group) return res.status(400).json({ message: 'Template or target group is not available to this company' });
        await insertRow('links', { link_desc, link_status, target_group, template_type, company_name: req.auth.company_name });
        res.json({ message: "Link saved successfully" });
    }
    catch (err) {
        console.error("DB error:", err);
        return res.status(500).json({ message: "Database error" });
    }
});

router.get('/links', async (req, res) => {
    try {
        const links = await selectRows('links', { filters: { company_name: req.auth.company_name }, order: 'link_id.desc' });
        res.json(links);
    } catch (err) {
        console.error("DB error:", err);
        res.status(500).json({ message: "Database error" });
    }
});


export default router;


