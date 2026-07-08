import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app.ts";

describe("App", () => {
	it("should return 200 with UP status on happy path", async () => {
		const response = await request(app).get("/health");

		expect(response.status).toBe(200);
		expect(response.body.status).toBe("UP");
	});

	it("should return 404 for unknown routes on error", async () => {
		const response = await request(app).get("/unknown");

		expect(response.status).toBe(404);
	});
});
