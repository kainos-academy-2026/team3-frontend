import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../src/app.ts";
import {
	type JobRoleInformation,
	JobRoleStatus,
} from "../../src/models/jobRole.ts";
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
}));

const mockJobRoleInformation: JobRoleInformation = {
	id: 1,
	roleName: "Software Engineer",
	location: "Belfast",
	capability: { capabilityId: 1, capabilityName: "Engineering" },
	band: { bandId: 1, bandName: "Associate" },
	closingDate: "2026-12-31",
	status: JobRoleStatus.Open,
	description: "Builds backend services",
	responsibilities: "Write code and review pull requests",
	sharepointUrl: "https://example.com/job-role/1",
	numberOfOpenPositions: 2,
};

describe("GET /job-roles routes", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		mockIsAuthenticated = true;
	});

	it("should return 200 and render job roles on happy path", async () => {
		vi.spyOn(
			jobRoleServiceModule.JobRoleService.prototype,
			"getAllJobRoles",
		).mockResolvedValue([
			{
				id: 1,
				roleName: "Software Engineer",
				location: "Belfast",
				capability: { capabilityId: 1, capabilityName: "Engineering" },
				band: { bandId: 1, bandName: "Associate" },
				closingDate: "2026-12-31",
				status: JobRoleStatus.Open,
			},
		]);

		const response = await request(app).get("/job-roles");

		expect(response.status).toBe(200);
		expect(response.type).toMatch(/html/);
		expect(response.text).toContain("Software Engineer");
	});

	it("should return 500 when the service throws an error for GET /job-roles", async () => {
		vi.spyOn(
			jobRoleServiceModule.JobRoleService.prototype,
			"getAllJobRoles",
		).mockRejectedValue(new Error("Service failure"));

		const response = await request(app).get("/job-roles");

		expect(response.status).toBe(500);
		expect(response.text).toContain("Unable to load job roles");
		expect(response.text).toContain(
			"We could not fetch job roles right now. Please try again shortly.",
		);
	});

	it("should return 200 and render html for GET /job-roles/:id", async () => {
		vi.spyOn(
			jobRoleServiceModule.JobRoleService.prototype,
			"getJobRoleById",
		).mockResolvedValue(mockJobRoleInformation);

		const response = await request(app).get("/job-roles/1");

		expect(response.status).toBe(200);
		expect(response.type).toMatch(/html/);
		expect(response.text).toContain("Software Engineer");
		expect(response.text).toContain("Builds backend services");
	});

	it("should return 400 for invalid id in GET /job-roles/:id", async () => {
		const response = await request(app).get("/job-roles/abc");

		expect(response.status).toBe(400);
		expect(response.text).toContain("Invalid job role ID");
	});

	it("should return 404 when job role is not found", async () => {
		vi.spyOn(
			jobRoleServiceModule.JobRoleService.prototype,
			"getJobRoleById",
		).mockRejectedValue({
			isAxiosError: true,
			response: { status: 404 },
		});

		const response = await request(app).get("/job-roles/99999");

		expect(response.status).toBe(404);
		expect(response.text).toContain("Job role not found");
	});

	it("should return 500 when the backend returns 500 for GET /job-roles/:id", async () => {
		vi.spyOn(
			jobRoleServiceModule.JobRoleService.prototype,
			"getJobRoleById",
		).mockRejectedValue({
			isAxiosError: true,
			response: { status: 500 },
		});

		const response = await request(app).get("/job-roles/1");

		expect(response.status).toBe(500);
		expect(response.text).toContain("Backend server error");
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
