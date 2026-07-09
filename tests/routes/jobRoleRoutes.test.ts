import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../src/app.ts";
import type { JobRoleStatus } from "../../src/models/jobRole.ts";
import * as jobRoleServiceModule from "../../src/services/jobRoleService.ts";

describe("GET /job-roles route", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
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
				status: "Open" as JobRoleStatus,
			},
		]);

		const response = await request(app).get("/job-roles");

		expect(response.status).toBe(200);
		expect(response.type).toMatch(/html/);
	});

	it("should return 500 when the service throws an error", async () => {
		vi.spyOn(
			jobRoleServiceModule.JobRoleService.prototype,
			"getAllJobRoles",
		).mockRejectedValue(new Error("Service failure"));

		const response = await request(app).get("/job-roles");

		expect(response.status).toBe(500);
	});

	it("should return 200 and render html for GET /job-roles/:id", async () => {
		vi.spyOn(
			jobRoleServiceModule.JobRoleService.prototype,
			"getJobRoleById",
		).mockResolvedValue({
			id: 1,
			roleName: "Software Engineer",
			location: "Belfast",
			capability: { capabilityId: 1, capabilityName: "Engineering" },
			band: { bandId: 1, bandName: "Associate" },
			closingDate: "2026-12-31",
			status: "Open" as JobRoleStatus,
		});

		const response = await request(app).get("/job-roles/1");

		expect(response.status).toBe(200);
		expect(response.type).toMatch(/html/);
	});

	it("should return 400 for invalid id in GET /job-roles/:id", async () => {
		const response = await request(app).get("/job-roles/abc");
		expect(response.status).toBe(400);
	});

	it("should return 404 when job role is not found", async () => {
		const notFoundAxiosError = {
			isAxiosError: true,
			response: { status: 404 },
		};

		vi.spyOn(
			jobRoleServiceModule.JobRoleService.prototype,
			"getJobRoleById",
		).mockRejectedValue(notFoundAxiosError);

		const response = await request(app).get("/job-roles/99999");
		expect(response.status).toBe(404);
	});
});
