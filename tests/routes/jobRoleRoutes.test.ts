import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../src/app";
import * as jobRoleServiceModule from "../../src/services/jobRoleService";

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
				openPositions: 2,
			} as never,
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
});
