import request from "supertest";
import app from "../app.js";

describe("Sweety Glucose Tracker API", () => {

    test("GET / should return API running message", async () => {
        const response = await request(app).get("/");

        expect(response.statusCode).toBe(200);

        expect(response.body.message).toBe(
            "Sweety Glucose Tracker API is running"
        );
    });

});