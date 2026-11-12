import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
    getReports
} from "../controllers/reportController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getReports);

export default router;