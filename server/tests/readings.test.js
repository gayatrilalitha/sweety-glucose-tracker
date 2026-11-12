
import { jest } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";

jest.unstable_mockModule("../config/db.js", () => ({
    default: {
        query: jest.fn(),
        connect: jest.fn()
    }
}));

process.env.JWT_SECRET = "test_secret_key_for_jest";

const { default: app } = await import("../app.js");
const { default: pool } = await import("../config/db.js");

describe("Glucose Readings API Tests", () => {

    let token;

    beforeEach(() => {
        jest.clearAllMocks();

        token = jwt.sign(
            { id: 1, email: "testuser@example.com" },
            process.env.JWT_SECRET
        );
    });

    test("Should reject access without JWT token", async () => {
        const response = await request(app).get("/api/readings");

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe(
            "Access denied. Please login."
        );
    });

    test("Should reject an invalid JWT token", async () => {
        const response = await request(app)
            .get("/api/readings")
            .set("Authorization", "Bearer invalid_token");

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe(
            "Invalid or expired token."
        );
    });

    test("Should add a valid glucose reading", async () => {
        const client = {
            query: jest.fn(),
            release: jest.fn()
        };

        pool.connect.mockResolvedValueOnce(client);

        client.query
            .mockResolvedValueOnce({ rows: [] }) // BEGIN
            .mockResolvedValueOnce({ rows: [] }) // Advisory lock
            .mockResolvedValueOnce({ rows: [] }) // Duplicate check
            .mockResolvedValueOnce({ rows: [{ count: 0 }] }) // Count
            .mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    reading_date: "2026-11-11",
                    time_slot: "Morning",
                    value: 110
                }]
            }) // Insert
            .mockResolvedValueOnce({ rows: [] }); // COMMIT

        const response = await request(app)
            .post("/api/readings")
            .set("Authorization", `Bearer ${token}`)
            .send({
                reading_date: "2026-11-11",
                time_slot: "Morning",
                value: 110
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe(
            "Reading added successfully."
        );
        expect(response.body.reading.value).toBe(110);
        expect(client.release).toHaveBeenCalled();
    });

    test.each([39, 601])(
        "Should reject glucose value %i",
        async (value) => {
            const client = {
                query: jest.fn(),
                release: jest.fn()
            };

            pool.connect.mockResolvedValueOnce(client);

            const response = await request(app)
                .post("/api/readings")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    reading_date: "2026-11-11",
                    time_slot: "Morning",
                    value
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe(
                "Value must be between 40 and 600 mg/dl."
            );
            expect(client.query).not.toHaveBeenCalled();
            expect(client.release).toHaveBeenCalled();
        }
    );

    test("Should reject a duplicate reading for the same slot", async () => {
        const client = {
            query: jest.fn(),
            release: jest.fn()
        };

        pool.connect.mockResolvedValueOnce(client);

        client.query
            .mockResolvedValueOnce({ rows: [] }) // BEGIN
            .mockResolvedValueOnce({ rows: [] }) // Advisory lock
            .mockResolvedValueOnce({ rows: [{ id: 5 }] }) // Duplicate
            .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

        const response = await request(app)
            .post("/api/readings")
            .set("Authorization", `Bearer ${token}`)
            .send({
                reading_date: "2026-11-11",
                time_slot: "Morning",
                value: 120
            });

        expect(response.statusCode).toBe(409);
        expect(response.body.message).toBe(
            "You already have a Morning reading for this date."
        );
        expect(client.release).toHaveBeenCalled();
    });
 

    test("Should retrieve readings with pagination", async () => {
        pool.query
            .mockResolvedValueOnce({
                rows: [{ total: 1 }]
            })
            .mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    reading_date: "2026-11-11",
                    time_slot: "Morning",
                    value: 110
                }]
            });

        const response = await request(app)
            .get("/api/readings?page=1&limit=5")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.total).toBe(1);
        expect(response.body.page).toBe(1);
        expect(response.body.readings).toHaveLength(1);
        expect(response.body.readings[0].value).toBe(110);

        // Ensure the database queries are restricted to the logged-in user
        expect(pool.query.mock.calls[0][1]).toEqual([1]);
        expect(pool.query.mock.calls[1][1]).toEqual([1, 5, 0]);
    });

    test("Should return an empty list when user has no readings", async () => {
        pool.query
            .mockResolvedValueOnce({
                rows: [{ total: 0 }]
            })
            .mockResolvedValueOnce({
                rows: []
            });

        const response = await request(app)
            .get("/api/readings")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.total).toBe(0);
        expect(response.body.readings).toHaveLength(0);
        expect(response.body.totalPages).toBe(0);
    });


    test("Should delete a reading successfully", async () => {
        pool.query.mockResolvedValueOnce({
            rows: [{ id: 1 }]
        });

        const response = await request(app)
            .delete("/api/readings/1")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe(
            "Reading deleted successfully."
        );

        // Ensure deletion is restricted to the logged-in user
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining("WHERE id = $1 AND user_id = $2"),
            ["1", 1]
        );
    });

    test("Should return 404 when reading does not exist", async () => {
        pool.query.mockResolvedValueOnce({
            rows: []
        });

        const response = await request(app)
            .delete("/api/readings/999")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe("Reading not found.");
    });


    test("Should update a reading successfully", async () => {
        const client = {
            query: jest.fn(),
            release: jest.fn()
        };

        pool.connect.mockResolvedValueOnce(client);

        client.query
            .mockResolvedValueOnce({ rows: [] }) // BEGIN
            .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Ownership
            .mockResolvedValueOnce({ rows: [] }) // Advisory lock
            .mockResolvedValueOnce({ rows: [] }) // Duplicate check
            .mockResolvedValueOnce({ rows: [{ count: 0 }] }) // Count
            .mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    reading_date: "2026-11-11",
                    time_slot: "Morning",
                    value: 125
                }]
            }) // UPDATE
            .mockResolvedValueOnce({ rows: [] }); // COMMIT

        const response = await request(app)
            .put("/api/readings/1")
            .set("Authorization", `Bearer ${token}`)
            .send({
                reading_date: "2026-11-11",
                time_slot: "Morning",
                value: 125
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe(
            "Reading updated successfully."
        );
        expect(response.body.reading.value).toBe(125);
        expect(client.release).toHaveBeenCalled();
    });

});
