import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JobRoleService } from "../../src/services/jobRoleService.ts";

vi.mock("axios");

const mockJobRoles = [
	{
		id: 1,
		roleName: "Software Engineer",
		location: "Belfast",
		capability: { capabilityId: 1, capabilityName: "Engineering" },
		band: { bandId: 1, bandName: "Associate" },
		closingDate: "2026-12-31",
		status: "Open",
	},
];

describe("JobRoleService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.BACKEND_API = "http://localhost:3000/api/job-roles";
	});

	it("should return job roles on happy path", async () => {
		vi.mocked(axios.get).mockResolvedValue({ data: mockJobRoles });

		const service = new JobRoleService();
		const result = await service.getAllJobRoles();

		expect(axios.get).toHaveBeenCalledWith(
			"http://localhost:3000/api/job-roles",
		);
		expect(result).toEqual(mockJobRoles);
	});

	it("should throw an error when axios fails", async () => {
		const error = new Error("Network error");
		vi.mocked(axios.get).mockRejectedValue(error);

		const service = new JobRoleService();

		await expect(service.getAllJobRoles()).rejects.toThrow("Network error");
		expect(axios.get).toHaveBeenCalledWith(
			"http://localhost:3000/api/job-roles",
		);
	});

	it("should throw an error when BACKEND_API is not defined", async () => {
		delete process.env.BACKEND_API;

		const service = new JobRoleService();

		await expect(service.getAllJobRoles()).rejects.toThrow(
			"BACKEND_API environment variable is not defined",
		);
	});
});
