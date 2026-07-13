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

	it("should render register page on GET /register", async () => {
		const response = await request(app).get("/register");

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

		expect(response.status).toBe(302);
		expect(response.headers.location).toBe("/job-roles");
	});

	it("should redirect to login on successful POST /register", async () => {
		vi.spyOn(
			authServiceModule.AuthService.prototype,
			"register",
		).mockResolvedValue({
			id: 1,
			email: "new@example.com",
			role: "user",
		});

		const response = await request(app).post("/register").type("form").send({
			email: "new@example.com",
			password: "StrongPass!1",
			confirmPassword: "StrongPass!1",
		});

		expect(response.status).toBe(302);
		expect(response.headers.location).toBe("/login");
	});

	it("should return 409 for duplicate email on POST /register", async () => {
		vi.spyOn(
			authServiceModule.AuthService.prototype,
			"register",
		).mockRejectedValue({
			isAxiosError: true,
			response: { status: 409 },
		});

		const response = await request(app).post("/register").type("form").send({
			email: "used@example.com",
			password: "StrongPass!1",
			confirmPassword: "StrongPass!1",
		});

		expect(response.status).toBe(409);
		expect(response.text).toContain("That email is already registered");
	});

	it("should clear session and redirect on POST /logout", async () => {
		const response = await request(app).post("/logout");

		expect(response.status).toBe(302);
		expect(response.headers.location).toBe("/");
	});
});
