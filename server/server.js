// server.js
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import camCreationRoutes from './API/campaignCreationApi.js';
import sendCampaignRoutes from './API/sendCampaignApi.js';
import dbConfig from './db.js';
import reportCreationRoutes from './API/reportCreationApi.js';
import authRoutes from './API/authApi.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env'), quiet: true });

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection (server kept running):', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception (server kept running):', err);
});

//MiddleWares
const app = express();
import cors from "cors";

app.use(cors({
    origin: "https://my-fishapp.vercel.app/",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Api Route
app.use("/api", camCreationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', reportCreationRoutes);
app.use('/api', sendCampaignRoutes);

// Capture credentials endpoint
app.post("/api/capture", async (req, res) => {

    const { username, password } = req.body;

    console.log(`Capture attempt for user: ${username}`);

    try {

        // ================= FIND USER =================
        const [rows] = await dbConfig.execute(
            "SELECT * FROM users WHERE name = ?",
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

        // ================= UPDATE USER CLICK COUNT =================
        // await dbConfig.execute(
        //     `
        //     UPDATE users
        //     SET links_clicked = links_clicked + 1
        //     WHERE id = ?
        //     `,
        //     [user.id]
        // );

        // ================= SAVE TRACKING =================
        await dbConfig.execute(
            `
            INSERT INTO tracking
            (
                username,
                email,
                clicked,
                submitted,
                campaign_name
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                username,
                user.email,
                true,
                true,
                campaign.name
            ]
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
app.post('/api/userExist', async (req, res) => {

    const { username } = req.body;
    console.log(req.body);
    console.log(username);

    try {

        const [getUser] = await dbConfig.execute(
            'SELECT * FROM users WHERE name=?',
            [username]
        );


        if (getUser.length > 0) {
            return res.status(200).json({
                success: true,
                user: getUser[0]
            });
        }

        const [getAdmin] = await dbConfig.execute(
            'SELECT * FROM admins WHERE username=?',
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

//gemini api logic
app.post("/api/chat", async (req, res) => {
    const { message } = req.body;

    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ message: "Gemini API key not configured" });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent(message);
        const response = result.response.text();

        res.json({ reply: response });

    } catch (err) {
        console.error("Gemini Error:", err);
        res.status(500).json({ message: "AI error" });
    }
});

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the other process or set PORT in .env`);
    } else {
        console.error('Server failed to start:', err);
    }
    process.exit(1);
});