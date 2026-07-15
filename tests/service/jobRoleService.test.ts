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

	const token = "mock-token";

	it("should return job roles on happy path", async () => {
		vi.mocked(apiClient.get).mockResolvedValue({ data: mockJobRoles });

		const service = new JobRoleService();
		const result = await service.getAllJobRoles(token);

		expect(apiClient.get).toHaveBeenCalledWith("/job-roles", {
			headers: { Authorization: `Bearer ${token}` },
		});
		expect(result).toEqual(mockJobRoles);
	});

	it("should throw an error when axios fails", async () => {
		const error = new Error("Network error");
		vi.mocked(apiClient.get).mockRejectedValue(error);

		const service = new JobRoleService();

		await expect(service.getAllJobRoles(token)).rejects.toThrow(
			"Network error",
		);
		expect(apiClient.get).toHaveBeenCalledWith("/job-roles", {
			headers: { Authorization: `Bearer ${token}` },
		});
	});

	it("should log axios metadata when getAllJobRoles fails with axios error", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);

		const axiosError = {
			isAxiosError: true,
			response: {
				status: 503,
				statusText: "Service Unavailable",
			},
			config: {
				method: "get",
				url: "/job-roles",
			},
			code: "ERR_BAD_RESPONSE",
			message: "Request failed with status code 503",
		};

		vi.mocked(apiClient.get).mockRejectedValue(axiosError);

		const service = new JobRoleService();

		await expect(service.getAllJobRoles(token)).rejects.toBe(axiosError);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Failed to fetch job roles",
			expect.objectContaining({
				endpoint: "/job-roles",
				status: 503,
				statusText: "Service Unavailable",
				method: "GET",
				url: "/job-roles",
				code: "ERR_BAD_RESPONSE",
				message: "Request failed with status code 503",
			}),
		);

		consoleErrorSpy.mockRestore();
	});

	it("should return a job role by id on happy path", async () => {
		const mockJobRole = {
			id: 1,
			roleName: "Software Engineer",
			location: "Belfast",
			capability: { capabilityId: 1, capabilityName: "Engineering" },
			band: { bandId: 1, bandName: "Associate" },
			closingDate: "2026-12-31",
			status: "Open",
		};

		vi.mocked(apiClient.get).mockResolvedValue({ data: mockJobRole });

		const service = new JobRoleService();
		const result = await service.getJobRoleById(1, token);

		expect(apiClient.get).toHaveBeenCalledWith("/job-roles/1", {
			headers: { Authorization: `Bearer ${token}` },
		});
		expect(result).toEqual(mockJobRole);
	});

	it("should throw an error when get by id fails", async () => {
		const error = new Error("Network error");
		vi.mocked(apiClient.get).mockRejectedValue(error);

		const service = new JobRoleService();

		await expect(service.getJobRoleById(1, token)).rejects.toThrow(
			"Network error",
		);
		expect(apiClient.get).toHaveBeenCalledWith("/job-roles/1", {
			headers: { Authorization: `Bearer ${token}` },
		});
	});

	it("should log unknown error payload when getJobRoleById fails with non-Error", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);

		vi.mocked(apiClient.get).mockRejectedValue("boom");

		const service = new JobRoleService();

		await expect(service.getJobRoleById(1, token)).rejects.toBe("boom");
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Failed to fetch job role by id",
			expect.objectContaining({
				endpoint: "/job-roles/1",
				jobRoleId: 1,
				error: "boom",
			}),
		);

		consoleErrorSpy.mockRestore();
	});

	it("should return report buffer on happy path", async () => {
		const mockArrayBuffer = new TextEncoder().encode(
			"id,roleName\n1,Engineer",
		).buffer;
		vi.mocked(apiClient.get).mockResolvedValue({ data: mockArrayBuffer });

		const service = new JobRoleService();
		const result = await service.getJobRoleReport(token);

		expect(apiClient.get).toHaveBeenCalledWith("/job-roles/report", {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "text/csv",
			},
			responseType: "arraybuffer",
		});
		expect(result.toString()).toContain("id,roleName");
	});

	it("should throw when report API call fails", async () => {
		const error = new Error("Network error");
		vi.mocked(apiClient.get).mockRejectedValue(error);

		const service = new JobRoleService();

		await expect(service.getJobRoleReport(token)).rejects.toThrow(
			"Network error",
		);
	});
});
