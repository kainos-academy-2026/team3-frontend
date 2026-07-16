import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "../../src/config/apiClient.ts";
import {
	ApplicationService,
	getFileExtension,
} from "../../src/services/applicationService.ts";

vi.mock("../../src/config/apiClient.ts", () => ({
	default: {
		get: vi.fn(),
		post: vi.fn(),
		patch: vi.fn(),
	},
}));

describe("applicationService", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	describe("getFileExtension", () => {
		it("should return lowercase extension when a file has extension", () => {
			expect(getFileExtension("My-CV.PDF")).toBe(".pdf");
		});

		it("should return empty string when file has no extension", () => {
			expect(getFileExtension("cv")).toBe("");
		});
	});

	describe("ApplicationService", () => {
		const token = "mock-token";

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

			const service = new ApplicationService();
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

			const service = new ApplicationService();
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

			const service = new ApplicationService();
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
			const service = new ApplicationService();
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
