import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../src/app.ts";
import * as authServiceModule from "../../src/services/authService.ts";

describe("Auth routes", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("should render login page on GET /login", async () => {
		const response = await request(app).get("/login");

		expect(response.status).toBe(200);
		expect(response.type).toMatch(/html/);
	});

	it("should redirect to job roles on successful POST /login", async () => {
		vi.spyOn(
			authServiceModule.AuthService.prototype,
			"login",
		).mockResolvedValue({
			token: "mock-jwt",
		});

		const response = await request(app)
			.post("/login")
			.type("form")
			.send({ email: "user@example.com", password: "password123" });
		const setCookieHeader = String(response.headers["set-cookie"] ?? "");

		expect(response.status).toBe(302);
		expect(response.headers.location).toBe("/job-roles");
		expect(setCookieHeader).toContain("connect.sid=");
	});

	it("should return 401 for invalid credentials on POST /login", async () => {
		vi.spyOn(
			authServiceModule.AuthService.prototype,
			"login",
		).mockRejectedValue({
			isAxiosError: true,
			response: { status: 401 },
		});

		const response = await request(app)
			.post("/login")
			.type("form")
			.send({ email: "user@example.com", password: "wrong" });

		expect(response.status).toBe(401);
		expect(response.text).toContain("Invalid email or password");
	});

	it("should clear session and redirect on POST /logout", async () => {
		const response = await request(app).post("/logout");

		expect(response.status).toBe(302);
		expect(response.headers.location).toBe("/");
	});
});
