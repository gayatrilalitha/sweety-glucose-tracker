
import pool from "../config/db.js";

// GET DAILY, MONTH-TO-DATE AND MONTHLY REPORTS
export const getReports = async (req, res) => {
    try {
        const userId = req.user.id;

        // Selected date from frontend
        const selectedDate = req.query.date;

        if (
            !selectedDate ||
            !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)
        ) {
            return res.status(400).json({
                message: "Please provide a valid date (YYYY-MM-DD)."
            });
        }

        const parsedDate = new Date(
            `${selectedDate}T00:00:00Z`
        );

        if (
            Number.isNaN(parsedDate.getTime()) ||
            parsedDate.toISOString().slice(0, 10) !== selectedDate
        ) {
            return res.status(400).json({
                message: "Invalid selected date."
            });
        }

        // Calculate date ranges using UTC
        const year = parsedDate.getUTCFullYear();
        const month = parsedDate.getUTCMonth();

        const firstDay = new Date(
            Date.UTC(year, month, 1)
        ).toISOString().slice(0, 10);

        const nextMonthFirstDay = new Date(
            Date.UTC(year, month + 1, 1)
        ).toISOString().slice(0, 10);

        const previousMonthFirstDay = new Date(
            Date.UTC(year, month - 1, 1)
        ).toISOString().slice(0, 10);

        // Get summary for a date range
        const getSummary = async (startDate, endDate) => {
     const result = await pool.query(
        `SELECT
            COALESCE(MAX(value), 0)::int AS max,
            COALESCE(MIN(value), 0)::int AS min,
            ROUND(AVG(value), 1) AS average,
            COUNT(*)::int AS count
         FROM readings
         WHERE user_id = $1
         AND reading_date >= $2
         AND reading_date < $3`,
        [userId, startDate, endDate]
    );

    return result.rows[0];
};

        // DAILY REPORT
        const daily = await getSummary(
            selectedDate,
            new Date(Date.UTC(
                year,
                month,
                parsedDate.getUTCDate() + 1
            )).toISOString().slice(0, 10)
        );

        const dailyReadings = await pool.query(
            `SELECT id, reading_date, time_slot, value
             FROM readings
             WHERE user_id = $1
             AND reading_date = $2
             ORDER BY id ASC`,
            [userId, selectedDate]
        );

        // MONTH-TO-DATE REPORT
        const monthToDate = await getSummary(
            firstDay,
            new Date(Date.UTC(
                year,
                month,
                parsedDate.getUTCDate() + 1
            )).toISOString().slice(0, 10)
        );

        // PREVIOUS MONTH REPORT
        const previousMonth = await getSummary(
            previousMonthFirstDay,
            firstDay
        );

        res.status(200).json({
            selected_date: selectedDate,

            daily: {
                ...daily,
                readings: dailyReadings.rows
            },

            month_to_date: {
                start_date: firstDay,
                end_date: selectedDate,
                ...monthToDate
            },

            previous_month: {
                start_date: previousMonthFirstDay,
                end_date: new Date(
                    Date.UTC(year, month, 0)
                ).toISOString().slice(0, 10),
                ...previousMonth
            }
        });

    } catch (error) {
        console.error("Reports error:", error);

        res.status(500).json({
            message: "Failed to generate reports."
        });
    }
};
