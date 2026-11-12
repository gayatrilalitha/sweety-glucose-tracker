
import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
    addReading,
    getReadings,
    updateReading,
    deleteReading
} from "../controllers/readingsController.js";

const router = express.Router();

// Protect all reading routes
router.use(authMiddleware);

router.post("/", addReading);

router.get("/", getReadings);

router.put("/:id", updateReading);

router.delete("/:id", deleteReading);

export default router;
