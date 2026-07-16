import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../src/app.ts";
import * as jobRoleServiceModule from "../../src/services/jobRoleService.ts";

let mockIsAuthenticated = true;
const { mockJwtToken } = vi.hoisted(() => {
	const jwtPayload = Buffer.from(JSON.stringify({ id: 1 }), "utf8").toString(
		"base64url",
	);
	return {
		mockJwtToken: `header.${jwtPayload}.signature`,
	};
});

vi.mock("express-session", () => ({
	default:
		() =>
		(
			req: { session: { jwtToken?: string } },
			_res: unknown,
			next: () => void,
		) => {
			req.session = { ...(req.session ?? {}), jwtToken: mockJwtToken };
			next();
		},
}));

vi.mock("../../src/middleware/authMiddleware.js", () => ({
	requireAuth: (
		req: { session: { jwtToken?: string } },
		res: { redirect: (path: string) => unknown },
		next: () => void,
	) => {
		if (!mockIsAuthenticated) {
			res.redirect("/login");
			return;
		}
		req.session.jwtToken = mockJwtToken;
		next();
	},
	requireAdmin: (
		req: { session: { jwtToken?: string } },
		res: {
			redirect: (path: string) => unknown;
			status: (code: number) => {
				render: (view: string, data?: unknown) => unknown;
			};
		},
		next: () => void,
	) => {
		if (!mockIsAuthenticated) {
			res.redirect("/login");
			return;
		}
		req.session.jwtToken = mockJwtToken;
		next();
	},
}));

describe("Application routes", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		mockIsAuthenticated = true;
	});

	it("should redirect to /login for POST /job-roles/:id/apply/upload-cv when unauthenticated", async () => {
		mockIsAuthenticated = false;

		const response = await request(app)
			.post("/job-roles/1/apply/upload-cv")
			.send({
				fileName: "cv.pdf",
				contentType: "application/pdf",
				fileSizeBytes: 1024,
			});

		expect(response.status).toBe(302);
		expect(response.headers.location).toBe("/login");
	});

	it("should delegate to controller for POST /job-roles/:id/apply/upload-cv when authenticated", async () => {
		const getUploadCvUrlSpy = vi
			.spyOn(jobRoleServiceModule.JobRoleService.prototype, "getUploadCvUrl")
			.mockResolvedValue({
				uploadUrl: "https://upload.example.com",
				objectKey: "uploads/cv.pdf",
			});

		const response = await request(app)
			.post("/job-roles/1/apply/upload-cv")
			.send({
				fileName: "cv.pdf",
				contentType: "application/pdf",
				fileSizeBytes: 1024,
			});

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			uploadUrl: "https://upload.example.com",
			objectKey: "uploads/cv.pdf",
		});
		expect(getUploadCvUrlSpy).toHaveBeenCalled();
	});

	it("should delegate to controller for GET /job-roles/:id/apply when authenticated", async () => {
		const response = await request(app).get("/job-roles/1/apply");

		expect(response.status).toBe(200);
		expect(response.type).toMatch(/html/);
		expect(response.text).toContain("Submit application");
	});

	it("should delegate to controller for POST /job-roles/:id/apply when authenticated", async () => {
		const response = await request(app).post("/job-roles/1/apply");

		expect(response.status).toBe(302);
		expect(response.headers.location).toBe(
			"/job-roles/1?applicationSubmitted=true",
		);
	});
});
