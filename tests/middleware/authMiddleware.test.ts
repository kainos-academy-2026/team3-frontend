import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { requireAuth } from "../../src/middleware/authMiddleware.ts";

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
