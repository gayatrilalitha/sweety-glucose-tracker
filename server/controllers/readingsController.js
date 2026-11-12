
import pool from "../config/db.js";

// Allowed glucose reading slots
const validSlots = [
    "Morning",
    "After breakfast",
    "After lunch",
    "After dinner"
];

// Validate reading data
const validateReading = (date, timeSlot, value) => {

    if (!value && value !== 0) {
        return "Please enter a glucose value.";
    }

    if (
        typeof value === "boolean" ||
        !/^\d+$/.test(String(value).trim()) ||
        Number(value) < 40 ||
        Number(value) > 600
    ) {
        return "Value must be between 40 and 600 mg/dl.";
    }

    if (!date) {
        return "Please select a date.";
    }

    // Validate actual YYYY-MM-DD date
    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date
    ) {
        return "Please enter a valid date.";
    }

    const today = new Date();
    const todayString = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    if (date > todayString) {
        return "Date cannot be in the future.";
    }

    if (!validSlots.includes(timeSlot)) {
        return "Please select a valid time slot.";
    }

    return null;
};

// ADD READING
export const addReading = async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.id;
        const { reading_date, time_slot, value } = req.body;

        const error = validateReading(
            reading_date,
            time_slot,
            value
        );

        if (error) {
            return res.status(400).json({ message: error });
        }

        await client.query("BEGIN");

        // Serialize additions for the same user and date
        await client.query(
            "SELECT pg_advisory_xact_lock(hashtext($1))",
            [`${userId}:${reading_date}`]
        );

        const existing = await client.query(
            `SELECT id FROM readings
             WHERE user_id = $1
             AND reading_date = $2
             AND time_slot = $3`,
            [userId, reading_date, time_slot]
        );

        if (existing.rows.length > 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message: `You already have a ${time_slot} reading for this date.`
            });
        }

        const countResult = await client.query(
            `SELECT COUNT(*)::int AS count
             FROM readings
             WHERE user_id = $1 AND reading_date = $2`,
            [userId, reading_date]
        );

        if (countResult.rows[0].count >= 4) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "You can add only 4 readings per day."
            });
        }

        const result = await client.query(
            `INSERT INTO readings
             (user_id, reading_date, time_slot, value)
             VALUES ($1, $2, $3, $4)
             RETURNING id, reading_date, time_slot, value`,
            [userId, reading_date, time_slot, Number(value)]
        );

        await client.query("COMMIT");

        res.status(201).json({
            message: "Reading added successfully.",
            reading: result.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Add reading error:", error);

        res.status(500).json({
            message: "Failed to add reading."
        });

    } finally {
        client.release();
    }
};

// GET ALL READINGS

// GET READINGS WITH PAGINATION
export const getReadings = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get pagination values from query parameters
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(
            50,
            Math.max(1, parseInt(req.query.limit, 10) || 5)
        );

        const offset = (page - 1) * limit;

        // Get total number of readings for this user
        const countResult = await pool.query(
            `SELECT COUNT(*)::int AS total
             FROM readings
             WHERE user_id = $1`,
            [userId]
        );

        const total = countResult.rows[0].total;
        const totalPages = Math.ceil(total / limit);

        // Get readings for the requested page
        const result = await pool.query(
            `SELECT id, reading_date, time_slot, value, created_at
             FROM readings
             WHERE user_id = $1
             ORDER BY reading_date DESC, id DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        res.status(200).json({
            readings: result.rows,
            total,
            page,
            limit,
            totalPages
        });

    } catch (error) {
        console.error("Get readings error:", error);

        res.status(500).json({
            message: "Failed to retrieve readings."
        });
    }
};


// UPDATE READING
export const updateReading = async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.id;
        const readingId = req.params.id;

        if (!/^\d+$/.test(readingId) || Number(readingId) < 1) {
            return res.status(400).json({
                message: "Invalid reading ID."
            });
        }

        const { reading_date, time_slot, value } = req.body;

        const error = validateReading(
            reading_date,
            time_slot,
            value
        );

        if (error) {
            return res.status(400).json({ message: error });
        }

        await client.query("BEGIN");

        // Check ownership
        const current = await client.query(
            `SELECT id FROM readings
             WHERE id = $1 AND user_id = $2`,
            [readingId, userId]
        );

        if (current.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Reading not found."
            });
        }

        // Serialize updates targeting this user/date
        await client.query(
            "SELECT pg_advisory_xact_lock(hashtext($1))",
            [`${userId}:${reading_date}`]
        );

        const duplicate = await client.query(
            `SELECT id FROM readings
             WHERE user_id = $1
             AND reading_date = $2
             AND time_slot = $3
             AND id != $4`,
            [userId, reading_date, time_slot, readingId]
        );

        if (duplicate.rows.length > 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message: `You already have a ${time_slot} reading for this date.`
            });
        }

        const countResult = await client.query(
            `SELECT COUNT(*)::int AS count
             FROM readings
             WHERE user_id = $1
             AND reading_date = $2
             AND id != $3`,
            [userId, reading_date, readingId]
        );

        if (countResult.rows[0].count >= 4) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "You can add only 4 readings per day."
            });
        }

        const result = await client.query(
            `UPDATE readings
             SET reading_date = $1,
                 time_slot = $2,
                 value = $3
             WHERE id = $4 AND user_id = $5
             RETURNING id, reading_date, time_slot, value`,
            [reading_date, time_slot, Number(value), readingId, userId]
        );

        await client.query("COMMIT");

        res.status(200).json({
            message: "Reading updated successfully.",
            reading: result.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Update reading error:", error);

        res.status(500).json({
            message: "Failed to update reading."
        });

    } finally {
        client.release();
    }
};

// DELETE READING
export const deleteReading = async (req, res) => {
    try {
        const userId = req.user.id;
        const readingId = req.params.id;

        if (!/^\d+$/.test(readingId) || Number(readingId) < 1) {
            return res.status(400).json({
                message: "Invalid reading ID."
            });
        }

        const result = await pool.query(
            `DELETE FROM readings
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [readingId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Reading not found."
            });
        }

        res.status(200).json({
            message: "Reading deleted successfully."
        });

    } catch (error) {
        console.error("Delete reading error:", error);

        res.status(500).json({
            message: "Failed to delete reading."
        });
    }
};
