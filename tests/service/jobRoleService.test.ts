import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "../../src/config/apiClient.ts";
import { JobRoleService } from "../../src/services/jobRoleService.ts";

vi.mock("../../src/config/apiClient.ts", () => ({
	default: {
		get: vi.fn(),
		post: vi.fn(),
		patch: vi.fn(),
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

	describe("getUploadCvUrl", () => {
		it("should request upload URL and normalize key to objectKey", async () => {
			vi.mocked(apiClient.post).mockResolvedValue({
				data: {
					uploadUrl: "https://upload.example.com",
					key: "uploads/cv.pdf",
				},
			});

			const service = new JobRoleService();
			const result = await service.getUploadCvUrl(
				1,
				1,
				"cv.pdf",
				"application/pdf",
				token,
			);

			expect(apiClient.post).toHaveBeenCalledWith(
				"/job-roles/1/apply",
				{
					userId: 1,
					fileName: "cv.pdf",
					contentType: "application/pdf",
				},
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			expect(result).toEqual({
				uploadUrl: "https://upload.example.com",
				objectKey: "uploads/cv.pdf",
			});
		});

		it("should log and rethrow when upload URL request fails", async () => {
			const service = new JobRoleService();
			const logRequestErrorSpy = vi.spyOn(
				service as unknown as { logRequestError: (...args: unknown[]) => void },
				"logRequestError",
			);

			const axiosError = {
				isAxiosError: true,
				response: {
					status: 400,
					statusText: "Bad Request",
				},
				config: {
					method: "post",
					url: "/job-roles/1/apply",
				},
				code: "ERR_BAD_REQUEST",
				message: "Request failed with status code 400",
			};

			vi.mocked(apiClient.post).mockRejectedValue(axiosError);

			await expect(
				service.getUploadCvUrl(1, 1, "cv.pdf", "application/pdf", token),
			).rejects.toBe(axiosError);
			expect(logRequestErrorSpy).toHaveBeenCalledWith(
				"Failed to prepare CV upload",
				axiosError,
				expect.objectContaining({
					endpoint: "/job-roles/1/apply",
					jobRoleId: 1,
					userId: 1,
				}),
			);
		});
	});

	describe("updateJobRole", () => {
		const mockUpdatedJobRole = {
			id: 1,
			roleName: "Senior Engineer",
			location: "Belfast",
			capability: { capabilityId: 1, capabilityName: "Engineering" },
			band: { bandId: 2, bandName: "Senior Associate" },
			closingDate: "2027-01-01",
			status: "Open",
			description: "Updated description",
			responsibilities: "Updated responsibilities",
			sharepointUrl: "https://example.com/updated",
			numberOfOpenPositions: 3,
		};

		it("should call PATCH and return updated job role on happy path", async () => {
			vi.mocked(apiClient.patch).mockResolvedValue({
				data: mockUpdatedJobRole,
			});

			const service = new JobRoleService();
			const data = { roleName: "Senior Engineer" };
			const result = await service.updateJobRole(1, data, token);

			expect(apiClient.patch).toHaveBeenCalledWith("/job-roles/1", data, {
				headers: { Authorization: `Bearer ${token}` },
			});
			expect(result).toEqual(mockUpdatedJobRole);
		});

		it("should send correct request shape and authorization header", async () => {
			vi.mocked(apiClient.patch).mockResolvedValue({
				data: mockUpdatedJobRole,
			});

			const service = new JobRoleService();
			const data = { roleName: "Senior Engineer", location: "London" };
			await service.updateJobRole(1, data, token);

			expect(apiClient.patch).toHaveBeenCalledWith(
				"/job-roles/1",
				{ roleName: "Senior Engineer", location: "London" },
				{ headers: { Authorization: `Bearer ${token}` } },
			);
		});

		it("should log and rethrow when updateJobRole fails", async () => {
			const service = new JobRoleService();
			const logRequestErrorSpy = vi.spyOn(
				service as unknown as { logRequestError: (...args: unknown[]) => void },
				"logRequestError",
			);

			const axiosError = {
				isAxiosError: true,
				response: { status: 404, statusText: "Not Found" },
				config: { method: "patch", url: "/job-roles/1" },
				code: "ERR_BAD_RESPONSE",
				message: "Request failed with status code 404",
			};

			vi.mocked(apiClient.patch).mockRejectedValue(axiosError);

			await expect(
				service.updateJobRole(1, { roleName: "Test" }, token),
			).rejects.toBe(axiosError);
			expect(logRequestErrorSpy).toHaveBeenCalledWith(
				"Failed to update job role",
				axiosError,
				expect.objectContaining({
					endpoint: "/job-roles/1",
					jobRoleId: 1,
				}),
			);
		});
	});

	describe("getJobRoleMetadata", () => {
		it("should request metadata with authorization header", async () => {
			const metadata = {
				capabilities: [{ capabilityId: 1, capabilityName: "Engineering" }],
				bands: [{ bandId: 2, bandName: "Band 2" }],
			};

			vi.mocked(apiClient.get).mockResolvedValue({ data: metadata });

			const service = new JobRoleService();
			const result = await service.getJobRoleMetadata(token);

			expect(apiClient.get).toHaveBeenCalledWith("/job-roles/metadata", {
				headers: { Authorization: `Bearer ${token}` },
			});
			expect(result).toEqual(metadata);
		});
	});

	describe("createJobRole", () => {
		const payload = {
			roleName: "Senior Backend Engineer",
			location: "Dublin",
			capabilityId: 1,
			bandId: 2,
			closingDate: "2026-08-31",
			description: "Own backend services and integrations.",
			responsibilities: "Build APIs, review code, support delivery.",
			sharepointUrl: "https://example.sharepoint.com/job-role",
			numberOfOpenPositions: 2,
		};

		it("should post payload with authorization header", async () => {
			vi.mocked(apiClient.post).mockResolvedValue({ data: undefined });

			const service = new JobRoleService();
			await service.createJobRole(payload, token);

			expect(apiClient.post).toHaveBeenCalledWith("/job-roles", payload, {
				headers: { Authorization: `Bearer ${token}` },
			});
		});

		it("should log and rethrow on axios error", async () => {
			const service = new JobRoleService();
			const logRequestErrorSpy = vi.spyOn(
				service as unknown as { logRequestError: (...args: unknown[]) => void },
				"logRequestError",
			);

			const axiosError = {
				isAxiosError: true,
				response: { status: 400, statusText: "Bad Request" },
				config: { method: "post", url: "/job-roles" },
				code: "ERR_BAD_REQUEST",
				message: "Request failed with status code 400",
			};

			vi.mocked(apiClient.post).mockRejectedValue(axiosError);

			await expect(service.createJobRole(payload, token)).rejects.toBe(
				axiosError,
			);
			expect(logRequestErrorSpy).toHaveBeenCalledWith(
				"Failed to create job role",
				axiosError,
				expect.objectContaining({
					endpoint: "/job-roles",
					payload,
				}),
			);
		});
	});

	describe("admin application management", () => {
		it("should get admin applications list with auth header", async () => {
			const responsePayload = {
				jobRoleId: 1,
				roleName: "Software Engineer",
				numberOfOpenPositions: 2,
				applicants: [
					{
						applicationId: 10,
						userId: 2,
						username: "candidate@example.com",
						status: "In Progress",
						appliedAt: "2026-07-16T10:00:00.000Z",
						cvDownloadUrl: "https://signed.example.com/cv",
					},
				],
			};

			vi.mocked(apiClient.get).mockResolvedValue({ data: responsePayload });

			const service = new JobRoleService();
			const result = await service.getJobRoleApplicationsForAdmin(1, token);

			expect(apiClient.get).toHaveBeenCalledWith("/job-roles/1/applications", {
				headers: { Authorization: `Bearer ${token}` },
			});
			expect(result).toEqual(responsePayload);
		});

		it("should call hire applicant endpoint with patch", async () => {
			vi.mocked(apiClient.patch).mockResolvedValue({
				data: {
					applicationId: 10,
					status: "Hired",
					numberOfOpenPositions: 1,
				},
			});

			const service = new JobRoleService();
			const result = await service.hireApplicant(1, 10, token);

			expect(apiClient.patch).toHaveBeenCalledWith(
				"/job-roles/1/applications/10/hire",
				undefined,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			expect(result.status).toBe("Hired");
		});

		it("should call reject applicant endpoint with patch", async () => {
			vi.mocked(apiClient.patch).mockResolvedValue({
				data: {
					applicationId: 10,
					status: "Rejected",
				},
			});

			const service = new JobRoleService();
			const result = await service.rejectApplicant(1, 10, token);

			expect(apiClient.patch).toHaveBeenCalledWith(
				"/job-roles/1/applications/10/reject",
				undefined,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			expect(result.status).toBe("Rejected");
		});

		it("should log and rethrow when hire request fails", async () => {
			const service = new JobRoleService();
			const logRequestErrorSpy = vi.spyOn(
				service as unknown as { logRequestError: (...args: unknown[]) => void },
				"logRequestError",
			);

			const axiosError = {
				isAxiosError: true,
				response: { status: 400, statusText: "Bad Request" },
				config: { method: "patch", url: "/job-roles/1/applications/10/hire" },
				code: "ERR_BAD_REQUEST",
				message: "Request failed with status code 400",
			};

			vi.mocked(apiClient.patch).mockRejectedValue(axiosError);

			await expect(service.hireApplicant(1, 10, token)).rejects.toBe(
				axiosError,
			);
			expect(logRequestErrorSpy).toHaveBeenCalledWith(
				"Failed to hire applicant",
				axiosError,
				expect.objectContaining({
					endpoint: "/job-roles/1/applications/10/hire",
					jobRoleId: 1,
					applicationId: 10,
				}),
			);
		});
	});
});
