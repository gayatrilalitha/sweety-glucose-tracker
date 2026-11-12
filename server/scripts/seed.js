
import pool from "../config/db.js";
import bcrypt from "bcrypt";

const seedDatabase = async () => {
  try {
    // Create a sample user
    const name = "Test User";
    const email = "test@example.com";
    const password = "Test@123";

    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE
       SET
       name = EXCLUDED.name,
       password = EXCLUDED.password
       RETURNING id`,
      [name, email, hashedPassword]
    );

    const userId = userResult.rows[0].id;

    // Sample glucose readings
    const readings = [
      ["2026-11-10", "Morning", 110],
      ["2026-11-10", "After breakfast", 145],
      ["2026-11-10", "After lunch", 160],
      ["2026-11-10", "After dinner", 130],
      ["2026-11-11", "Morning", 105],
      ["2026-11-11", "After breakfast", 140],
    ];

    for (const [date, slot, value] of readings) {
      await pool.query(
        `INSERT INTO readings (user_id, reading_date, time_slot, value)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, reading_date, time_slot)
         DO NOTHING`,
        [userId, date, slot, value]
      );
    }

    console.log("Sample data inserted successfully!");
    console.log("Email:", email);
    console.log("Password:", password);
  } catch (error) {
    console.error("Seed error:", error.message);
  } finally {
    await pool.end();
  }
};

seedDatabase();
