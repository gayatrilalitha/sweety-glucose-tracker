import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import authMiddleware from "./middleware/authMiddleware.js";
import readingsRoutes from "./routes/readingsRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import pool from "./config/db.js";

const app = express();

app.use(cors({
    origin: "http://localhost:5173"
}));

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);

app.get("/api/protected", authMiddleware, (req, res) => {
    res.status(200).json({
        message: "You have accessed a protected route!",
        user: req.user
    });
});

app.use("/api/readings", readingsRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Sweety Glucose Tracker API is running"
    });
});

app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.status(200).json({
            message: "PostgreSQL connected successfully",
            time: result.rows[0].now
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Database connection failed"
        });
    }
});

export default app;