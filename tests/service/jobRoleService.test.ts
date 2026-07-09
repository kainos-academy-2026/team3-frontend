import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "../../src/config/apiClient.ts";
import { JobRoleService } from "../../src/services/jobRoleService.ts";

vi.mock("../../src/config/apiClient.ts", () => ({
	default: {
		get: vi.fn(),
	},
}));

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
		vi.resetAllMocks();
	});

	it("should return job roles on happy path", async () => {
		vi.mocked(apiClient.get).mockResolvedValue({ data: mockJobRoles });

		const service = new JobRoleService();
		const result = await service.getAllJobRoles();

		expect(apiClient.get).toHaveBeenCalledWith("/job-roles");
		expect(result).toEqual(mockJobRoles);
	});

	it("should throw an error when axios fails", async () => {
		const error = new Error("Network error");
		vi.mocked(apiClient.get).mockRejectedValue(error);

		const service = new JobRoleService();

		await expect(service.getAllJobRoles()).rejects.toThrow("Network error");
		expect(apiClient.get).toHaveBeenCalledWith("/job-roles");
	});
});
