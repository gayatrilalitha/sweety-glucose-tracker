
import { jest } from "@jest/globals";
import request from "supertest";
import bcrypt from "bcrypt";

// Mock database before importing the application
jest.unstable_mockModule("../config/db.js", () => ({
    default: {
        query: jest.fn()
    }
}));

process.env.JWT_SECRET = "test_secret_key_for_jest";

const { default: app } = await import("../app.js");
const { default: pool } = await import("../config/db.js");

describe("Authentication API Tests", () => {

    beforeEach(() => {
        pool.query.mockReset();
    });

    test("Signup should register a new user", async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    name: "Test User",
                    email: "testuser@example.com"
                }]
            });

        const response = await request(app)
            .post("/api/auth/signup")
            .send({
                name: "Test User",
                email: "testuser@example.com",
                password: "Test@123"
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe("Registration successful.");
        expect(response.body.user.email).toBe("testuser@example.com");
    });

    test("Signup should reject missing fields", async () => {
        const response = await request(app)
            .post("/api/auth/signup")
            .send({
                name: "Test User"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("All fields are required.");
    });

    test("Login should reject invalid credentials", async () => {
        pool.query.mockResolvedValueOnce({
            rows: []
        });

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "wrong@example.com",
                password: "Wrong@123"
            });

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe(
            "Invalid email or password."
        );
    });

    test("Login should return a JWT for valid credentials", async () => {
        const hashedPassword = await bcrypt.hash("Test@123", 10);

        pool.query.mockResolvedValueOnce({
            rows: [{
                id: 1,
                name: "Test User",
                email: "testuser@example.com",
                password: hashedPassword
            }]
        });

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "testuser@example.com",
                password: "Test@123"
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe("Login successful.");
        expect(response.body.token).toBeDefined();
        expect(response.body.user.email).toBe("testuser@example.com");
    });

});
