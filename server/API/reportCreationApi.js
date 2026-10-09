import express from 'express';
import { selectRows, insertRow, updateRows, deleteRows } from '../db.js';
import { authenticate, requireRole } from '../utils/auth.js';

const router = express.Router();

router.get('/feedback/:campaignId', async (req, res) => {
    try {
        const [campaign] = await selectRows('campaigns', {
            columns: 'id, feedback_page_type, company_name',
            filters: { id: req.params.campaignId },
            limit: 1
        });
        if (!campaign || !campaign.company_name) return res.status(404).json({ message: 'Campaign not found' });
        res.json({ feedback_page_type: campaign.feedback_page_type || 'generic' });
    } catch (err) {
        console.error('Feedback page lookup failed:', err.message);
        res.status(500).json({ message: 'Unable to load the feedback page' });
    }
});

router.post('/save_report', authenticate, requireRole('admin'), async (req, res) => {
    const { campaign_id, email, clicked, submitted } = req.body;
    try {
        const [campaign] = await selectRows('campaigns', {
            columns: 'id, name, target_group',
            filters: { id: campaign_id, company_name: req.auth.company_name },
            limit: 1
        });
        if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
        const [employee] = await selectRows('employees', {
            columns: 'name, email',
            filters: { email, company_name: req.auth.company_name },
            limit: 1
        });
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        await insertRow('tracking', {
            username: employee.name,
            email: employee.email,
            clicked: clicked ? 1 : 0,
            submitted: submitted ? 1 : 0,
            campaign_name: campaign.name,
            campaign_id: campaign.id,
            company_name: req.auth.company_name
        });
        res.json({ success: true });
    } catch (err) {
        console.error('Save report failed:', err.message);
        res.status(500).json({ message: 'Unable to save report' });
    }
});

router.get('/reports', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const campaigns = await selectRows('campaigns', {
            columns: 'id, name, template_type, feedback_page_type, target_group, created_at, email_sent, clicked',
            filters: { company_name: req.auth.company_name },
            order: 'created_at.desc'
        });
        const tracks = await selectRows('tracking', {
            columns: 'campaign_id, campaign_name, submitted',
            filters: { company_name: req.auth.company_name }
        });
        const submittedByCampaign = new Map();
        for (const track of tracks) {
            const campaign = campaigns.find((item) => item.id === track.campaign_id)
                || campaigns.find((item) => !track.campaign_id && item.name === track.campaign_name);
            if (campaign && Number(track.submitted) === 1) {
                submittedByCampaign.set(campaign.id, (submittedByCampaign.get(campaign.id) || 0) + 1);
            }
        }
        res.json({ data: campaigns.map((campaign) => ({
            ...campaign,
            reported: submittedByCampaign.get(campaign.id) || 0
        })) });
    } catch (err) {
        console.error('Fetch reports failed:', err.message);
        res.status(500).json({ message: 'Failed to fetch reports' });
    }
});

router.delete('/clear_reports', authenticate, requireRole('admin'), async (req, res) => {
    try {
        await deleteRows('tracking', { company_name: req.auth.company_name });
        await deleteRows('campaigns', { company_name: req.auth.company_name });
        res.json({ message: 'Company campaign reports cleared successfully' });
    } catch (err) {
        console.error('Clear reports failed:', err.message);
        res.status(500).json({ message: 'Failed to clear reports' });
    }
});

// The public training page accepts a campaign ID, but never stores the password entered on the page.
router.post('/capture', async (req, res) => {
    const { username, campaignId } = req.body;
    if (typeof username !== 'string' || !username.trim() || !/^\d+$/.test(String(campaignId || ''))) {
        return res.status(400).json({ success: false, message: 'Username and campaign are required' });
    }

    try {
        let [campaign] = await selectRows('campaigns', {
            columns: 'id, name, target_group, company_name, clicked',
            filters: { id: campaignId },
            limit: 1
        });
        let employee;
        const account = username.trim();

        if (campaign?.company_name) {
            for (const column of ['name', 'email']) {
                const employees = await selectRows('employees', {
                    columns: 'name, email, department, company_name',
                    filters: {
                        [column]: { op: 'ilike', value: account },
                        department: campaign.target_group,
                        company_name: campaign.company_name
                    },
                    limit: 2
                });
                if (employees.length > 1) break;
                if (employees.length === 1) {
                    employee = employees[0];
                    break;
                }
            }
        } else {
            // Older URLs encoded a timestamp. Resolve those only when the name is unambiguous.
            let employees = await selectRows('employees', {
                columns: 'name, email, department, company_name',
                filters: { name: { op: 'ilike', value: account } },
                limit: 2
            });
            if (!employees.length) {
                employees = await selectRows('employees', {
                    columns: 'name, email, department, company_name',
                    filters: { email: { op: 'ilike', value: account } },
                    limit: 2
                });
            }
            if (employees.length === 1 && employees[0].company_name) {
                employee = employees[0];
                [campaign] = await selectRows('campaigns', {
                    columns: 'id, name, target_group, company_name, clicked',
                    filters: { target_group: employee.department, company_name: employee.company_name },
                    order: 'created_at.desc',
                    limit: 1
                });
            }
        }

        if (!campaign || !employee) {
            return res.status(404).json({ success: false, message: 'User or campaign not found' });
        }

        await updateRows('campaigns', { clicked: Number(campaign.clicked || 0) + 1 }, { id: campaign.id });
        await insertRow('tracking', {
            username: employee.name,
            email: employee.email,
            clicked: 1,
            submitted: 1,
            campaign_name: campaign.name,
            campaign_id: campaign.id,
            company_name: campaign.company_name
        });
        res.json({ success: true, message: 'Simulation recorded' });
    } catch (err) {
        console.error('Capture failed:', err.message);
        res.status(500).json({ success: false, message: 'Unable to record the simulation' });
    }
});

router.post('/userExist', authenticate, async (req, res) => {
    const { username } = req.body;
    if (typeof username !== 'string' || username.toLowerCase() !== req.auth.sub.toLowerCase()) {
        return res.status(403).json({ success: false, message: 'You can only access your own account' });
    }
    try {
        if (req.auth.role === 'employee') {
            const [user] = await selectRows('employees', {
                columns: 'employee_id, name, department, designation, email, joining_date, company_name',
                filters: { name: { op: 'ilike', value: username }, company_name: req.auth.company_name },
                limit: 1
            });
            if (user) return res.json({ success: true, user });
        } else {
            const [user] = await selectRows('admins', {
                columns: 'username, role, company_name',
                filters: { username: { op: 'ilike', value: username }, company_name: req.auth.company_name },
                limit: 1
            });
            if (user) return res.json({ success: true, user });
        }
        return res.status(404).json({ success: false, message: 'User not found' });
    } catch (err) {
        console.error('Account lookup failed:', err.message);
        res.status(500).json({ message: 'Database error' });
    }
});

export default router;
