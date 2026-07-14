import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { AuthController } from "../../src/controllers/authController.ts";
import type { AuthService } from "../../src/services/authService.ts";
import { RegisterSchema } from "../../src/validation/authSchemas.ts";

const mockRes = () => {
	const res = {} as Response;
	res.render = vi.fn();
	res.status = vi.fn().mockReturnValue(res);
	res.send = vi.fn().mockReturnValue(res);
	res.redirect = vi.fn().mockReturnValue(res);
	res.clearCookie = vi.fn().mockReturnValue(res);
	return res;
};

describe("AuthController", () => {
	it("should render login page", () => {
		const service = {} as AuthService;
		const controller = new AuthController(service);
		const req = {} as Request;
		const res = mockRes();

		controller.getSignInPage(req, res);

		expect(res.render).toHaveBeenCalledWith("pages/signin.njk", {
			error: null,
		});
	});

	it("should render register success page", () => {
		const service = {} as AuthService;
		const controller = new AuthController(service);
		const req = {} as Request;
		const res = mockRes();

		controller.getRegisterSuccessPage(req, res);

		expect(res.render).toHaveBeenCalledWith("pages/register-success.njk");
	});

	it("should render register page", () => {
		const service = {} as AuthService;
		const controller = new AuthController(service);
		const req = {} as Request;
		const res = mockRes();

		controller.getRegisterPage(req, res);

		expect(res.render).toHaveBeenCalledWith("pages/register.njk", {
			error: null,
			fieldErrors: {},
			formValues: { email: "" },
		});
	});

	it("should return 400 when email or password missing on login", async () => {
		const service = {
			login: vi.fn(),
		} as unknown as AuthService;

		const controller = new AuthController(service);
		const req = {
			body: { email: "user@example.com" },
			session: {},
		} as unknown as Request;
		const res = mockRes();

		await controller.signIn(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.render).toHaveBeenCalledWith("pages/signin.njk", {
			error: "Email and password are required.",
		});
	});

	it("should store token in session and redirect on successful login", async () => {
		const service = {
			login: vi.fn().mockResolvedValue({ token: "mock-jwt" }),
		} as unknown as AuthService;

		const controller = new AuthController(service);
		const req = {
			body: { email: "user@example.com", password: "password123" },
			session: {},
		} as unknown as Request;
		const res = mockRes();

		await controller.signIn(req, res);

		expect(service.login).toHaveBeenCalledWith(
			"user@example.com",
			"password123",
		);
		expect((req.session as { jwtToken?: string }).jwtToken).toBe("mock-jwt");
		expect(res.redirect).toHaveBeenCalledWith("/job-roles");
	});

	it("should return 401 when backend rejects login credentials", async () => {
		const service = {
			login: vi.fn().mockRejectedValue({
				isAxiosError: true,
				response: { status: 401 },
			}),
		} as unknown as AuthService;

		const controller = new AuthController(service);
		const req = {
			body: { email: "user@example.com", password: "wrong" },
			session: {},
		} as unknown as Request;
		const res = mockRes();

		await controller.signIn(req, res);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.render).toHaveBeenCalledWith("pages/signin.njk", {
			error: "Invalid email or password.",
		});
	});

	it("should return 500 when login throws unexpected error", async () => {
		const service = {
			login: vi.fn().mockRejectedValue(new Error("Unexpected failure")),
		} as unknown as AuthService;

		const controller = new AuthController(service);
		const req = {
			body: { email: "user@example.com", password: "password123" },
			session: {},
		} as unknown as Request;
		const res = mockRes();

		await controller.signIn(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.render).toHaveBeenCalledWith("pages/signin.njk", {
			error: "Unable to sign in right now.",
		});
	});

	it("should redirect to register success page on successful register", async () => {
		const service = {
			login: vi.fn(),
			register: vi.fn().mockResolvedValue({
				id: 1,
				email: "new@example.com",
				role: "user",
			}),
		} as unknown as AuthService;

		const controller = new AuthController(service);
		const req = {
			body: {
				email: "new@example.com",
				password: "StrongPass!1",
				confirmPassword: "StrongPass!1",
			},
		} as unknown as Request;
		const res = mockRes();

		await controller.register(req, res);

		expect(service.register).toHaveBeenCalledWith(
			"new@example.com",
			"StrongPass!1",
		);
		expect(res.redirect).toHaveBeenCalledWith("/register/success");
	});

	it("should return 400 with register field errors for invalid body", async () => {
		const service = {
			register: vi.fn(),
		} as unknown as AuthService;

		const controller = new AuthController(service);
		const req = {
			body: {
				email: "bad-email",
				password: "weak",
				confirmPassword: "different",
			},
		} as unknown as Request;
		const res = mockRes();

		await controller.register(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.render).toHaveBeenCalledWith(
			"pages/register.njk",
			expect.objectContaining({
				error: "Please fix the highlighted fields.",
				formValues: { email: "bad-email" },
			}),
		);
	});

	it("should keep first field error message when a field has multiple validation issues", async () => {
		const service = {
			register: vi.fn(),
		} as unknown as AuthService;

		const controller = new AuthController(service);
		const req = {
			body: {
				email: "valid@example.com",
				password: "aaaaaaaaa",
				confirmPassword: "aaaaaaaaa",
			},
		} as unknown as Request;
		const res = mockRes();

		await controller.register(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.render).toHaveBeenCalledWith(
			"pages/register.njk",
			expect.objectContaining({
				fieldErrors: expect.objectContaining({
					password: "Password must include an uppercase letter.",
				}),
			}),
		);
	});

	it("should use empty email string in form values when invalid register body has no email", async () => {
		const service = {
			register: vi.fn(),
		} as unknown as AuthService;

		const controller = new AuthController(service);
		const req = {
			body: {
				password: "StrongPass!1",
				confirmPassword: "StrongPass!1",
			},
		} as unknown as Request;
		const res = mockRes();

		await controller.register(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.render).toHaveBeenCalledWith(
			"pages/register.njk",
			expect.objectContaining({
				formValues: { email: "" },
			}),
		);
	});

	it("should ignore non-form fields and keep first message when validation returns duplicate field issues", async () => {
		const service = {
			register: vi.fn(),
		} as unknown as AuthService;

		const safeParseSpy = vi.spyOn(RegisterSchema, "safeParse").mockReturnValue({
			success: false,
			error: {
				issues: [
					{ path: ["password"], message: "First password issue" },
					{ path: ["password"], message: "Second password issue" },
					{ path: ["otherField"], message: "Other issue" },
				],
			},
		} as never);

		const controller = new AuthController(service);
		const req = {
			body: { email: "valid@example.com" },
		} as unknown as Request;
		const res = mockRes();

		await controller.register(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.render).toHaveBeenCalledWith(
			"pages/register.njk",
			expect.objectContaining({
				fieldErrors: { password: "First password issue" },
			}),
		);

		safeParseSpy.mockRestore();
	});

	it("should return 409 when backend says email already exists", async () => {
		const service = {
			register: vi.fn().mockRejectedValue({
				isAxiosError: true,
				response: { status: 409 },
			}),
		} as unknown as AuthService;

		const controller = new AuthController(service);
		const req = {
			body: {
				email: "used@example.com",
				password: "StrongPass!1",
				confirmPassword: "StrongPass!1",
			},
		} as unknown as Request;
		const res = mockRes();

		await controller.register(req, res);

		expect(res.status).toHaveBeenCalledWith(409);
		expect(res.render).toHaveBeenCalledWith("pages/register.njk", {
			error: "That email is already registered.",
			fieldErrors: {},
			formValues: { email: "used@example.com" },
		});
	});

	it("should return 400 when backend rejects register payload", async () => {
		const service = {
			register: vi.fn().mockRejectedValue({
				isAxiosError: true,
				response: { status: 400 },
			}),
		} as unknown as AuthService;

		const controller = new AuthController(service);
		const req = {
			body: {
				email: "valid@example.com",
				password: "StrongPass!1",
				confirmPassword: "StrongPass!1",
			},
		} as unknown as Request;
		const res = mockRes();

		await controller.register(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.render).toHaveBeenCalledWith("pages/register.njk", {
			error: "Please check your details and try again.",
			fieldErrors: {},
			formValues: { email: "valid@example.com" },
		});
	});

	it("should return 500 when register throws axios error with unhandled status", async () => {
		const service = {
			register: vi.fn().mockRejectedValue({
				isAxiosError: true,
				response: { status: 422 },
			}),
		} as unknown as AuthService;

		const controller = new AuthController(service);
		const req = {
			body: {
				email: "valid@example.com",
				password: "StrongPass!1",
				confirmPassword: "StrongPass!1",
			},
		} as unknown as Request;
		const res = mockRes();

		await controller.register(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.render).toHaveBeenCalledWith("pages/register.njk", {
			error: "Unable to register right now.",
			fieldErrors: {},
			formValues: { email: "valid@example.com" },
		});
	});

	it("should return 500 when register throws unexpected error", async () => {
		const service = {
			register: vi.fn().mockRejectedValue(new Error("Unexpected failure")),
		} as unknown as AuthService;

		const controller = new AuthController(service);
		const req = {
			body: {
				email: "valid@example.com",
				password: "StrongPass!1",
				confirmPassword: "StrongPass!1",
			},
		} as unknown as Request;
		const res = mockRes();

		await controller.register(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.render).toHaveBeenCalledWith("pages/register.njk", {
			error: "Unable to register right now.",
			fieldErrors: {},
			formValues: { email: "valid@example.com" },
		});
	});

	it("should clear cookie and redirect on successful logout", () => {
		const service = {} as AuthService;
		const controller = new AuthController(service);

		const destroy = vi.fn((cb: (err?: unknown) => void) => cb());
		const req = {
			session: { destroy },
		} as unknown as Request;
		const res = mockRes();

		controller.signOut(req, res);

		expect(destroy).toHaveBeenCalled();
		expect(res.clearCookie).toHaveBeenCalledWith("connect.sid");
		expect(res.redirect).toHaveBeenCalledWith("/");
	});

	it("should return 500 when logout destroy fails", () => {
		const service = {} as AuthService;
		const controller = new AuthController(service);

		const destroy = vi.fn((cb: (err?: unknown) => void) =>
			cb(new Error("fail")),
		);
		const req = {
			session: { destroy },
		} as unknown as Request;
		const res = mockRes();

		controller.signOut(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.render).toHaveBeenCalledWith("pages/signin.njk", {
			error: "Unable to log out right now.",
		});
	});
});
