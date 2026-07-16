import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { ApplicationController } from "../../src/controllers/applicationController.ts";
import {
	AdminApplicationActionStatus,
	JobRoleApplicationStatus,
} from "../../src/models/jobRole.ts";
import type { ApplicationService } from "../../src/services/applicationService.ts";
import type { JobRoleService } from "../../src/services/jobRoleService.ts";

const mockRes = () => {
	const res = {} as Response;
	res.render = vi.fn();
	res.status = vi.fn().mockReturnValue(res);
	res.send = vi.fn().mockReturnValue(res);
	res.redirect = vi.fn().mockReturnValue(res);
	res.json = vi.fn().mockReturnValue(res);
	return res;
};

const createJwtWithId = (id: number): string => {
	const payload = Buffer.from(JSON.stringify({ id }), "utf8").toString(
		"base64url",
	);
	return `header.${payload}.signature`;
};

const createJwtWithPayload = (
	payloadValue: Record<string, unknown>,
): string => {
	const payload = Buffer.from(JSON.stringify(payloadValue), "utf8").toString(
		"base64url",
	);
	return `header.${payload}.signature`;
};

describe("ApplicationController", () => {
	describe("getUploadCvUrl", () => {
		it("should return upload details on happy path", async () => {
			const mockJobRoleService = {
				getUploadCvUrl: vi.fn().mockResolvedValue({
					uploadUrl: "https://s3.example/upload",
					objectKey: "cvs/user1-file.pdf",
				}),
			} as unknown as JobRoleService;
			const mockApplicationService = {} as ApplicationService;

			const controller = new ApplicationController(
				mockJobRoleService,
				mockApplicationService,
			);
			const req = {
				params: { id: "1" },
				body: {
					fileName: "cv.pdf",
					contentType: "application/pdf",
					fileSizeBytes: 1024,
				},
				session: { jwtToken: createJwtWithId(1) },
			} as unknown as Request;
			const res = mockRes();

			await controller.getUploadCvUrl(req, res);

			expect(mockJobRoleService.getUploadCvUrl).toHaveBeenCalledWith(
				1,
				1,
				"cv.pdf",
				"application/pdf",
				expect.any(String),
			);
			expect(res.json).toHaveBeenCalledWith({
				uploadUrl: "https://s3.example/upload",
				objectKey: "cvs/user1-file.pdf",
			});
		});

		it("should return 400 JSON when id is invalid", async () => {
			const mockJobRoleService = {
				getUploadCvUrl: vi.fn(),
			} as unknown as JobRoleService;
			const mockApplicationService = {} as ApplicationService;

			const controller = new ApplicationController(
				mockJobRoleService,
				mockApplicationService,
			);
			const req = {
				params: { id: "abc" },
				body: {
					fileName: "cv.pdf",
					contentType: "application/pdf",
					fileSizeBytes: 1024,
				},
				session: { jwtToken: createJwtWithId(1) },
			} as unknown as Request;
			const res = mockRes();

			await controller.getUploadCvUrl(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ error: "Invalid job role ID" });
		});

		it("should return 400 JSON when body validation fails", async () => {
			const mockJobRoleService = {
				getUploadCvUrl: vi.fn(),
			} as unknown as JobRoleService;
			const mockApplicationService = {} as ApplicationService;

			const controller = new ApplicationController(
				mockJobRoleService,
				mockApplicationService,
			);
			const req = {
				params: { id: "1" },
				body: {
					fileName: "",
					contentType: "application/pdf",
					fileSizeBytes: 1024,
				},
				session: { jwtToken: createJwtWithId(1) },
			} as unknown as Request;
			const res = mockRes();

			await controller.getUploadCvUrl(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				error: "Please upload a CV to continue.",
			});
		});

		it("should return 400 JSON when file extension is not allowed", async () => {
			const mockJobRoleService = {
				getUploadCvUrl: vi.fn(),
			} as unknown as JobRoleService;
			const mockApplicationService = {} as ApplicationService;

			const controller = new ApplicationController(
				mockJobRoleService,
				mockApplicationService,
			);
			const req = {
				params: { id: "1" },
				body: {
					fileName: "cv.exe",
					contentType: "application/octet-stream",
					fileSizeBytes: 1024,
				},
				session: { jwtToken: createJwtWithId(1) },
			} as unknown as Request;
			const res = mockRes();

			await controller.getUploadCvUrl(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				error: "Invalid file type. Please upload a PDF, DOC, or DOCX file.",
			});
			expect(mockJobRoleService.getUploadCvUrl).not.toHaveBeenCalled();
		});

		it("should return 400 JSON when file exceeds max size", async () => {
			const mockJobRoleService = {
				getUploadCvUrl: vi.fn(),
			} as unknown as JobRoleService;
			const mockApplicationService = {} as ApplicationService;

			const controller = new ApplicationController(
				mockJobRoleService,
				mockApplicationService,
			);
			const req = {
				params: { id: "1" },
				body: {
					fileName: "cv.pdf",
					contentType: "application/pdf",
					fileSizeBytes: 6 * 1024 * 1024,
				},
				session: { jwtToken: createJwtWithId(1) },
			} as unknown as Request;
			const res = mockRes();

			await controller.getUploadCvUrl(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				error: "File is too large. Maximum allowed size is 5MB.",
			});
			expect(mockJobRoleService.getUploadCvUrl).not.toHaveBeenCalled();
		});

		it("should return 401 JSON when token is missing", async () => {
			const mockJobRoleService = {
				getUploadCvUrl: vi.fn(),
			} as unknown as JobRoleService;
			const mockApplicationService = {} as ApplicationService;

			const controller = new ApplicationController(
				mockJobRoleService,
				mockApplicationService,
			);
			const req = {
				params: { id: "1" },
				body: {
					fileName: "cv.pdf",
					contentType: "application/pdf",
					fileSizeBytes: 1024,
				},
				session: {},
			} as unknown as Request;
			const res = mockRes();

			await controller.getUploadCvUrl(req, res);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({ error: "Not authenticated" });
		});

		it("should return 401 JSON when token payload has invalid user id", async () => {
			const mockJobRoleService = {
				getUploadCvUrl: vi.fn(),
			} as unknown as JobRoleService;
			const mockApplicationService = {} as ApplicationService;

			const controller = new ApplicationController(
				mockJobRoleService,
				mockApplicationService,
			);
			const req = {
				params: { id: "1" },
				body: {
					fileName: "cv.pdf",
					contentType: "application/pdf",
					fileSizeBytes: 1024,
				},
				session: { jwtToken: createJwtWithId(0) },
			} as unknown as Request;
			const res = mockRes();

			await controller.getUploadCvUrl(req, res);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({ error: "Invalid session" });
			expect(mockJobRoleService.getUploadCvUrl).not.toHaveBeenCalled();
		});

		it("should return 401 JSON when token is malformed", async () => {
			const mockJobRoleService = {
				getUploadCvUrl: vi.fn(),
			} as unknown as JobRoleService;
			const mockApplicationService = {} as ApplicationService;

			const controller = new ApplicationController(
				mockJobRoleService,
				mockApplicationService,
			);
			const req = {
				params: { id: "1" },
				body: {
					fileName: "cv.pdf",
					contentType: "application/pdf",
					fileSizeBytes: 1024,
				},
				session: { jwtToken: "not-a-jwt" },
			} as unknown as Request;
			const res = mockRes();

			await controller.getUploadCvUrl(req, res);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({ error: "Invalid session" });
			expect(mockJobRoleService.getUploadCvUrl).not.toHaveBeenCalled();
		});

		it("should accept userId claim from JWT payload", async () => {
			const mockJobRoleService = {
				getUploadCvUrl: vi.fn().mockResolvedValue({
					uploadUrl: "https://s3.example/upload",
					objectKey: "cvs/user2-file.pdf",
				}),
			} as unknown as JobRoleService;
			const mockApplicationService = {} as ApplicationService;

			const controller = new ApplicationController(
				mockJobRoleService,
				mockApplicationService,
			);
			const req = {
				params: { id: "1" },
				body: {
					fileName: "cv.pdf",
					contentType: "application/pdf",
					fileSizeBytes: 1024,
				},
				session: { jwtToken: createJwtWithPayload({ userId: 2 }) },
			} as unknown as Request;
			const res = mockRes();

			await controller.getUploadCvUrl(req, res);

			expect(mockJobRoleService.getUploadCvUrl).toHaveBeenCalledWith(
				1,
				2,
				"cv.pdf",
				"application/pdf",
				expect.any(String),
			);
		});

		it("should accept numeric string sub claim from JWT payload", async () => {
			const mockJobRoleService = {
				getUploadCvUrl: vi.fn().mockResolvedValue({
					uploadUrl: "https://s3.example/upload",
					objectKey: "cvs/user3-file.pdf",
				}),
			} as unknown as JobRoleService;
			const mockApplicationService = {} as ApplicationService;

			const controller = new ApplicationController(
				mockJobRoleService,
				mockApplicationService,
			);
			const req = {
				params: { id: "1" },
				body: {
					fileName: "cv.pdf",
					contentType: "application/pdf",
					fileSizeBytes: 1024,
				},
				session: { jwtToken: createJwtWithPayload({ sub: "3" }) },
			} as unknown as Request;
			const res = mockRes();

			await controller.getUploadCvUrl(req, res);

			expect(mockJobRoleService.getUploadCvUrl).toHaveBeenCalledWith(
				1,
				3,
				"cv.pdf",
				"application/pdf",
				expect.any(String),
			);
		});

		it("should return 400 JSON when service throws axios 400", async () => {
			const mockJobRoleService = {
				getUploadCvUrl: vi.fn().mockRejectedValue({
					isAxiosError: true,
					response: { status: 400 },
				}),
			} as unknown as JobRoleService;
			const mockApplicationService = {} as ApplicationService;

			const controller = new ApplicationController(
				mockJobRoleService,
				mockApplicationService,
			);
			const req = {
				params: { id: "1" },
				body: {
					fileName: "cv.pdf",
					contentType: "application/pdf",
					fileSizeBytes: 1024,
				},
				session: { jwtToken: createJwtWithId(1) },
			} as unknown as Request;
			const res = mockRes();

			await controller.getUploadCvUrl(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				error: "Invalid upload request",
			});
		});

		it("should return 404 JSON when service throws axios 404", async () => {
			const mockJobRoleService = {
				getUploadCvUrl: vi.fn().mockRejectedValue({
					isAxiosError: true,
					response: { status: 404 },
				}),
			} as unknown as JobRoleService;
			const mockApplicationService = {} as ApplicationService;

			const controller = new ApplicationController(
				mockJobRoleService,
				mockApplicationService,
			);
			const req = {
				params: { id: "1" },
				body: {
					fileName: "cv.pdf",
					contentType: "application/pdf",
					fileSizeBytes: 1024,
				},
				session: { jwtToken: createJwtWithId(1) },
			} as unknown as Request;
			const res = mockRes();

			await controller.getUploadCvUrl(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({ error: "Job role not found" });
		});

		it("should return 409 JSON when service throws axios 409", async () => {
			const mockJobRoleService = {
				getUploadCvUrl: vi.fn().mockRejectedValue({
					isAxiosError: true,
					response: { status: 409 },
				}),
			} as unknown as JobRoleService;
			const mockApplicationService = {} as ApplicationService;

			const controller = new ApplicationController(
				mockJobRoleService,
				mockApplicationService,
			);
			const req = {
				params: { id: "1" },
				body: {
					fileName: "cv.pdf",
					contentType: "application/pdf",
					fileSizeBytes: 1024,
				},
				session: { jwtToken: createJwtWithId(1) },
			} as unknown as Request;
			const res = mockRes();

			await controller.getUploadCvUrl(req, res);

			expect(res.status).toHaveBeenCalledWith(409);
			expect(res.json).toHaveBeenCalledWith({
				error: "You have already applied for this role.",
			});
		});

		it("should return 500 JSON when service throws non-axios error", async () => {
			const mockJobRoleService = {
				getUploadCvUrl: vi.fn().mockRejectedValue(new Error("boom")),
			} as unknown as JobRoleService;
			const mockApplicationService = {} as ApplicationService;

			const controller = new ApplicationController(
				mockJobRoleService,
				mockApplicationService,
			);
			const req = {
				params: { id: "1" },
				body: {
					fileName: "cv.pdf",
					contentType: "application/pdf",
					fileSizeBytes: 1024,
				},
				session: { jwtToken: createJwtWithId(1) },
			} as unknown as Request;
			const res = mockRes();

			await controller.getUploadCvUrl(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				error: "Could not prepare CV upload. Please try again.",
			});
		});

		it("should return 500 JSON when service throws axios error with unhandled status", async () => {
			const mockJobRoleService = {
				getUploadCvUrl: vi.fn().mockRejectedValue({
					isAxiosError: true,
					response: { status: 422 },
				}),
			} as unknown as JobRoleService;
			const mockApplicationService = {} as ApplicationService;

			const controller = new ApplicationController(
				mockJobRoleService,
				mockApplicationService,
			);
			const req = {
				params: { id: "1" },
				body: {
					fileName: "cv.pdf",
					contentType: "application/pdf",
					fileSizeBytes: 1024,
				},
				session: { jwtToken: createJwtWithId(1) },
			} as unknown as Request;
			const res = mockRes();

			await controller.getUploadCvUrl(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				error: "Could not prepare CV upload. Please try again.",
			});
		});
	});

	describe("getJobRoleApplicationPage", () => {
		it("should render application page with jobRoleId for valid id", async () => {
			const mockService = {} as JobRoleService;
			const controller = new ApplicationController(
				mockService,
				{} as ApplicationService,
			);
			const req = { params: { id: "4" } } as unknown as Request;
			const res = mockRes();

			await controller.getJobRoleApplicationPage(req, res);

			expect(res.render).toHaveBeenCalledWith(
				"pages/job-role-application.njk",
				{
					jobRoleId: 4,
				},
			);
		});

		it("should return 400 when application page id is invalid", async () => {
			const mockService = {} as JobRoleService;
			const controller = new ApplicationController(
				mockService,
				{} as ApplicationService,
			);
			const req = { params: { id: "abc" } } as unknown as Request;
			const res = mockRes();

			await controller.getJobRoleApplicationPage(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith("Invalid job role ID");
		});
	});

	describe("submitJobRoleApplication", () => {
		it("should redirect to details page with applicationSubmitted flag", async () => {
			const mockService = {} as JobRoleService;
			const controller = new ApplicationController(
				mockService,
				{} as ApplicationService,
			);
			const req = { params: { id: "7" } } as unknown as Request;
			const res = mockRes();

			await controller.submitJobRoleApplication(req, res);

			expect(res.redirect).toHaveBeenCalledWith(
				"/job-roles/7?applicationSubmitted=true",
			);
		});

		it("should return 400 when submit id is invalid", async () => {
			const mockService = {} as JobRoleService;
			const controller = new ApplicationController(
				mockService,
				{} as ApplicationService,
			);
			const req = { params: { id: "abc" } } as unknown as Request;
			const res = mockRes();

			await controller.submitJobRoleApplication(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith("Invalid job role ID");
		});
	});

	describe("getAdminApplicationsPage", () => {
		it("should render admin applications page on happy path", async () => {
			const mockJobRoleService = {} as JobRoleService;
			const mockApplicationService = {
				getJobRoleApplicationsForAdmin: vi.fn().mockResolvedValue({
					jobRoleId: 1,
					roleName: "Software Engineer",
					numberOfOpenPositions: 2,
					applicants: [
						{
							applicationId: 101,
							userId: 5,
							username: "candidate@example.com",
							status: JobRoleApplicationStatus.InProgress,
							appliedAt: "2026-07-16T10:00:00.000Z",
							cvDownloadUrl: "https://example.com/cv",
						},
					],
				}),
			} as unknown as ApplicationService;

			const controller = new ApplicationController(
				mockJobRoleService,
				mockApplicationService,
			);
			const req = {
				params: { id: "1" },
				session: { jwtToken: createJwtWithId(1) },
				query: { applicationAction: AdminApplicationActionStatus.HireSuccess },
			} as unknown as Request;
			const res = mockRes();

			await controller.getAdminApplicationsPage(req, res);

			expect(
				mockApplicationService.getJobRoleApplicationsForAdmin,
			).toHaveBeenCalledWith(1, expect.any(String));
			expect(res.render).toHaveBeenCalledWith(
				"pages/job-role-applications-admin.njk",
				expect.objectContaining({
					jobRoleId: 1,
					applicationAction: AdminApplicationActionStatus.HireSuccess,
				}),
			);
		});

		it("should return 400 for invalid job role id", async () => {
			const controller = new ApplicationController(
				{} as JobRoleService,
				{} as ApplicationService,
			);
			const req = {
				params: { id: "abc" },
				session: { jwtToken: createJwtWithId(1) },
				query: {},
			} as unknown as Request;
			const res = mockRes();

			await controller.getAdminApplicationsPage(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith("Invalid job role ID");
		});

		it("should redirect to login when token is missing", async () => {
			const controller = new ApplicationController(
				{} as JobRoleService,
				{} as ApplicationService,
			);
			const req = {
				params: { id: "1" },
				session: {},
				query: {},
			} as unknown as Request;
			const res = mockRes();

			await controller.getAdminApplicationsPage(req, res);

			expect(res.redirect).toHaveBeenCalledWith("/login");
		});
	});

	describe("hireApplicant", () => {
		it("should redirect with hire-success on success", async () => {
			const mockApplicationService = {
				hireApplicant: vi.fn().mockResolvedValue({}),
			} as unknown as ApplicationService;
			const controller = new ApplicationController(
				{} as JobRoleService,
				mockApplicationService,
			);

			const req = {
				params: { id: "1", applicationId: "10" },
				session: { jwtToken: createJwtWithId(1) },
			} as unknown as Request;
			const res = mockRes();

			await controller.hireApplicant(req, res);

			expect(mockApplicationService.hireApplicant).toHaveBeenCalledWith(
				1,
				10,
				expect.any(String),
			);
			expect(res.redirect).toHaveBeenCalledWith(
				`/job-roles/1/applications?applicationAction=${AdminApplicationActionStatus.HireSuccess}`,
			);
		});
	});

	describe("rejectApplicant", () => {
		it("should redirect with reject-success on success", async () => {
			const mockApplicationService = {
				rejectApplicant: vi.fn().mockResolvedValue({}),
			} as unknown as ApplicationService;
			const controller = new ApplicationController(
				{} as JobRoleService,
				mockApplicationService,
			);

			const req = {
				params: { id: "1", applicationId: "10" },
				session: { jwtToken: createJwtWithId(1) },
			} as unknown as Request;
			const res = mockRes();

			await controller.rejectApplicant(req, res);

			expect(mockApplicationService.rejectApplicant).toHaveBeenCalledWith(
				1,
				10,
				expect.any(String),
			);
			expect(res.redirect).toHaveBeenCalledWith(
				`/job-roles/1/applications?applicationAction=${AdminApplicationActionStatus.RejectSuccess}`,
			);
		});
	});
});
