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

app.use(cors({
    origin: function (origin, callback) {

        if (
            !origin ||
            origin.includes("vercel.app") ||
            origin.includes("localhost")
        ) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }

    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Api Route
app.get('/', (req, res) => {
    res.send("Hello from PhishAware API ==> Deploy live 🎉");
});
app.use("/api", camCreationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', reportCreationRoutes);
app.use('/api', sendCampaignRoutes);

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