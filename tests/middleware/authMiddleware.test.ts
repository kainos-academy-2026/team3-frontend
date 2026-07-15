import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import {
	requireAdmin,
	requireAuth,
} from "../../src/middleware/authMiddleware.ts";

describe("requireAuth", () => {
	it("should redirect to /login when jwt token is missing", () => {
		const req = { session: {} } as unknown as Request;
		const res = { redirect: vi.fn() } as unknown as Response;
		const next = vi.fn() as unknown as NextFunction;

		requireAuth(req, res, next);

		expect(res.redirect).toHaveBeenCalledWith("/login");
		expect(next).not.toHaveBeenCalled();
	});

	it("should call next when jwt token exists", () => {
		const req = { session: { jwtToken: "token" } } as unknown as Request;
		const res = { redirect: vi.fn() } as unknown as Response;
		const next = vi.fn() as unknown as NextFunction;

		requireAuth(req, res, next);

		expect(next).toHaveBeenCalledOnce();
		expect(res.redirect).not.toHaveBeenCalled();
	});
});

describe("requireAdmin", () => {
	it("should redirect to /login when jwt token is missing", () => {
		const req = { session: {} } as unknown as Request;
		const res = { redirect: vi.fn() } as unknown as Response;
		const next = vi.fn() as unknown as NextFunction;

		requireAdmin(req, res, next);

		expect(res.redirect).toHaveBeenCalledWith("/login");
		expect(next).not.toHaveBeenCalled();
	});

	it("should return 403 for non-admin role", () => {
		const req = {
			session: { jwtToken: "token", userRole: "applicant" },
		} as unknown as Request;
		const res = {
			status: vi.fn().mockReturnThis(),
			render: vi.fn(),
		} as unknown as Response;
		const next = vi.fn() as unknown as NextFunction;

		requireAdmin(req, res, next);

		expect(res.status).toHaveBeenCalledWith(403);
		expect(res.render).toHaveBeenCalledWith("pages/home.njk", {
			error: "You do not have permission to access this page.",
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("should call next for admin role", () => {
		const req = {
			session: { jwtToken: "token", userRole: "ADMIN" },
		} as unknown as Request;
		const res = {
			redirect: vi.fn(),
			status: vi.fn().mockReturnThis(),
			render: vi.fn(),
		} as unknown as Response;
		const next = vi.fn() as unknown as NextFunction;

		requireAdmin(req, res, next);

		expect(next).toHaveBeenCalledOnce();
		expect(res.redirect).not.toHaveBeenCalled();
	});
});
