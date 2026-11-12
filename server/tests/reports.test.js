
import { jest } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";

jest.unstable_mockModule("../config/db.js", () => ({
    default: {
        query: jest.fn()
    }
}));

process.env.JWT_SECRET = "test_secret_key_for_jest";

const { default: app } = await import("../app.js");
const { default: pool } = await import("../config/db.js");

describe("Reports API Tests", () => {

    let token;

    beforeEach(() => {
        jest.clearAllMocks();

        token = jwt.sign(
            { id: 1, email: "testuser@example.com" },
            process.env.JWT_SECRET
        );
    });

    test("Should generate daily, month-to-date and previous-month reports", async () => {

        pool.query
            .mockResolvedValueOnce({
                rows: [{
                    max: 145,
                    min: 105,
                    average: "125.0",
                    count: 2
                }]
            })
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 1,
                        reading_date: "2026-11-11",
                        time_slot: "Morning",
                        value: 105
                    },
                    {
                        id: 2,
                        reading_date: "2026-11-11",
                        time_slot: "After breakfast",
                        value: 145
                    }
                ]
            })
            .mockResolvedValueOnce({
                rows: [{
                    max: 160,
                    min: 105,
                    average: "131.7",
                    count: 6
                }]
            })
            .mockResolvedValueOnce({
                rows: [{
                    max: 0,
                    min: 0,
                    average: null,
                    count: 0
                }]
            });

        const response = await request(app)
            .get("/api/reports?date=2026-11-11")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);

        expect(response.body.selected_date).toBe("2026-11-11");

        expect(response.body.daily.max).toBe(145);
        expect(response.body.daily.min).toBe(105);
        expect(response.body.daily.count).toBe(2);
        expect(response.body.daily.readings).toHaveLength(2);

        expect(response.body.month_to_date.max).toBe(160);
        expect(response.body.month_to_date.count).toBe(6);

        expect(response.body.previous_month.count).toBe(0);
    });

    test("Should reject a request without a date", async () => {

        const response = await request(app)
            .get("/api/reports")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(400);

        expect(response.body.message).toBe(
            "Please provide a valid date (YYYY-MM-DD)."
        );

        expect(pool.query).not.toHaveBeenCalled();
    });

    test("Should reject an invalid date", async () => {

        const response = await request(app)
            .get("/api/reports?date=2026-02-30")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(400);

        expect(response.body.message).toBe(
            "Invalid selected date."
        );

        expect(pool.query).not.toHaveBeenCalled();
    });

    test("Should reject report access without authentication", async () => {

        const response = await request(app)
            .get("/api/reports?date=2026-11-11");

        expect(response.statusCode).toBe(401);

        expect(response.body.message).toBe(
            "Access denied. Please login."
        );
    });

});
