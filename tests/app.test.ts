import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app.ts";

describe("Express App", () => {
	it("should return 200 and UP status on happy path", async () => {
		const response = await request(app).get("/health");

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("status", "UP");
		expect(response.body).toHaveProperty("time");
	});

	it("should return 404 for unknown route", async () => {
		const response = await request(app).get("/unknown-route");

		expect(response.status).toBe(404);
	});
});
