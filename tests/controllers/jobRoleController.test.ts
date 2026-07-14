import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { JobRoleController } from "../../src/controllers/jobRoleController.ts";
import {
	type JobRoleInformation,
	JobRoleStatus,
} from "../../src/models/jobRole.ts";
import type { JobRoleService } from "../../src/services/jobRoleService.ts";

const mockJobRoles = [
	{
		id: 1,
		roleName: "Software Engineer",
		location: "Belfast",
		capability: { capabilityId: 1, capabilityName: "Engineering" },
		band: { bandId: 1, bandName: "Associate" },
		status: "Open",
	},
];

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

describe("JobRoleController", () => {
	const token = "mock-token";

	it("should render job roles on happy path", async () => {
		const mockService = {
			getAllJobRoles: vi.fn().mockResolvedValue(mockJobRoles),
		} as unknown as JobRoleService;

		const controller = new JobRoleController(mockService);
		const req = { session: { jwtToken: token } } as unknown as Request;
		const res = mockRes();

		await controller.getAllJobRoles(req, res);

		expect(mockService.getAllJobRoles).toHaveBeenCalledWith(token);
		expect(res.render).toHaveBeenCalledWith("pages/job-role-list.njk", {
			jobRoles: mockJobRoles,
		});
	});

	it("should return 500 when the service throws an error", async () => {
		const mockService = {
			getAllJobRoles: vi.fn().mockRejectedValue(new Error("Service failure")),
		} as unknown as JobRoleService;

		const controller = new JobRoleController(mockService);
		const req = { session: { jwtToken: token } } as unknown as Request;
		const res = mockRes();

		await controller.getAllJobRoles(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.render).toHaveBeenCalledWith("pages/job-role-list.njk", {
			jobRoles: [],
			errorTitle: "Unable to load job roles",
			errorMessage:
				"We could not fetch job roles right now. Please try again shortly.",
		});
	});

	it("should redirect to login when token is missing for list route", async () => {
		const mockService = {
			getAllJobRoles: vi.fn(),
		} as unknown as JobRoleService;

		const controller = new JobRoleController(mockService);
		const req = { session: {} } as unknown as Request;
		const res = mockRes();

		await controller.getAllJobRoles(req, res);

		expect(res.redirect).toHaveBeenCalledWith("/login");
		expect(mockService.getAllJobRoles).not.toHaveBeenCalled();
	});

	it("should render job role information on happy path", async () => {
		const mockService = {
			getAllJobRoles: vi.fn(),
			getJobRoleById: vi.fn().mockResolvedValue(mockJobRoleInformation),
		} as unknown as JobRoleService;

		const controller = new JobRoleController(mockService);
		const req = {
			params: { id: "1" },
			session: { jwtToken: token },
			query: {},
		} as unknown as Request;
		const res = mockRes();

		await controller.getJobRoleById(req, res);

		expect(mockService.getJobRoleById).toHaveBeenCalledWith(1, token);
		expect(res.render).toHaveBeenCalledWith("pages/job-role-information.njk", {
			jobRole: mockJobRoleInformation,
			canApply: true,
			applicationSubmitted: false,
		});
	});

	it("should render canApply false when role is closed", async () => {
		const mockService = {
			getAllJobRoles: vi.fn(),
			getJobRoleById: vi.fn().mockResolvedValue({
				...mockJobRoleInformation,
				status: JobRoleStatus.Closed,
			}),
		} as unknown as JobRoleService;

		const controller = new JobRoleController(mockService);
		const req = {
			params: { id: "1" },
			session: { jwtToken: token },
			query: {},
		} as unknown as Request;
		const res = mockRes();

		await controller.getJobRoleById(req, res);

		expect(res.render).toHaveBeenCalledWith("pages/job-role-information.njk", {
			jobRole: { ...mockJobRoleInformation, status: JobRoleStatus.Closed },
			canApply: false,
			applicationSubmitted: false,
		});
	});

	it("should render applicationSubmitted true when query param is true", async () => {
		const mockService = {
			getAllJobRoles: vi.fn(),
			getJobRoleById: vi.fn().mockResolvedValue(mockJobRoleInformation),
		} as unknown as JobRoleService;

		const controller = new JobRoleController(mockService);
		const req = {
			params: { id: "1" },
			session: { jwtToken: token },
			query: { applicationSubmitted: "true" },
		} as unknown as Request;
		const res = mockRes();

		await controller.getJobRoleById(req, res);

		expect(res.render).toHaveBeenCalledWith("pages/job-role-information.njk", {
			jobRole: mockJobRoleInformation,
			canApply: true,
			applicationSubmitted: true,
		});
	});

	it("should render canApply false when open positions are zero", async () => {
		const mockService = {
			getAllJobRoles: vi.fn(),
			getJobRoleById: vi.fn().mockResolvedValue({
				...mockJobRoleInformation,
				numberOfOpenPositions: 0,
			}),
		} as unknown as JobRoleService;

		const controller = new JobRoleController(mockService);
		const req = {
			params: { id: "1" },
			session: { jwtToken: token },
			query: {},
		} as unknown as Request;
		const res = mockRes();

		await controller.getJobRoleById(req, res);

		expect(res.render).toHaveBeenCalledWith("pages/job-role-information.njk", {
			jobRole: { ...mockJobRoleInformation, numberOfOpenPositions: 0 },
			canApply: false,
			applicationSubmitted: false,
		});
	});

	it("should return 400 when id is invalid", async () => {
		const mockService = {
			getAllJobRoles: vi.fn(),
			getJobRoleById: vi.fn(),
		} as unknown as JobRoleService;

		const controller = new JobRoleController(mockService);
		const req = {
			params: { id: "abc" },
			session: { jwtToken: token },
			query: {},
		} as unknown as Request;
		const res = mockRes();

		await controller.getJobRoleById(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.send).toHaveBeenCalledWith("Invalid job role ID");
	});

	it("should redirect to login when token is missing for detail route", async () => {
		const mockService = {
			getAllJobRoles: vi.fn(),
			getJobRoleById: vi.fn(),
		} as unknown as JobRoleService;

		const controller = new JobRoleController(mockService);
		const req = {
			params: { id: "1" },
			session: {},
			query: {},
		} as unknown as Request;
		const res = mockRes();

		await controller.getJobRoleById(req, res);

		expect(res.redirect).toHaveBeenCalledWith("/login");
		expect(mockService.getJobRoleById).not.toHaveBeenCalled();
	});

	it("should return generic 500 for unhandled detail errors", async () => {
		const mockService = {
			getAllJobRoles: vi.fn(),
			getJobRoleById: vi.fn().mockRejectedValue({
				isAxiosError: true,
				response: { status: 403 },
			}),
		} as unknown as JobRoleService;

		const controller = new JobRoleController(mockService);
		const req = {
			params: { id: "1" },
			session: { jwtToken: token },
			query: {},
		} as unknown as Request;
		const res = mockRes();

		await controller.getJobRoleById(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.send).toHaveBeenCalledWith("Internal Server Error");
	});

	it("should return 500 when getJobRoleById throws a non-axios error", async () => {
		const mockService = {
			getAllJobRoles: vi.fn(),
			getJobRoleById: vi.fn().mockRejectedValue(new Error("boom")),
		} as unknown as JobRoleService;

		const controller = new JobRoleController(mockService);
		const req = {
			params: { id: "1" },
			session: { jwtToken: token },
			query: {},
		} as unknown as Request;
		const res = mockRes();

		await controller.getJobRoleById(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.send).toHaveBeenCalledWith("Internal Server Error");
	});

	describe("getUploadCvUrl", () => {
		it("should return upload details on happy path", async () => {
			const mockService = {
				getUploadCvUrl: vi.fn().mockResolvedValue({
					uploadUrl: "https://s3.example/upload",
					objectKey: "cvs/user1-file.pdf",
				}),
			} as unknown as JobRoleService;

			const controller = new JobRoleController(mockService);
			const req = {
				params: { id: "1" },
				body: { fileName: "cv.pdf", contentType: "application/pdf" },
				session: { jwtToken: createJwtWithId(1) },
			} as unknown as Request;
			const res = mockRes();

			await controller.getUploadCvUrl(req, res);

			expect(mockService.getUploadCvUrl).toHaveBeenCalledWith(
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
			const mockService = {
				getUploadCvUrl: vi.fn(),
			} as unknown as JobRoleService;

			const controller = new JobRoleController(mockService);
			const req = {
				params: { id: "abc" },
				body: { fileName: "cv.pdf", contentType: "application/pdf" },
				session: { jwtToken: createJwtWithId(1) },
			} as unknown as Request;
			const res = mockRes();

			await controller.getUploadCvUrl(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ error: "Invalid job role ID" });
		});

		it("should return 400 JSON when body validation fails", async () => {
			const mockService = {
				getUploadCvUrl: vi.fn(),
			} as unknown as JobRoleService;

			const controller = new JobRoleController(mockService);
			const req = {
				params: { id: "1" },
				body: { fileName: "", contentType: "application/pdf" },
				session: { jwtToken: createJwtWithId(1) },
			} as unknown as Request;
			const res = mockRes();

			await controller.getUploadCvUrl(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				error: "File name is required.",
			});
		});

		it("should return 401 JSON when token is missing", async () => {
			const mockService = {
				getUploadCvUrl: vi.fn(),
			} as unknown as JobRoleService;

			const controller = new JobRoleController(mockService);
			const req = {
				params: { id: "1" },
				body: { fileName: "cv.pdf", contentType: "application/pdf" },
				session: {},
			} as unknown as Request;
			const res = mockRes();

			await controller.getUploadCvUrl(req, res);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({ error: "Not authenticated" });
		});

		it("should return 401 JSON when token payload has invalid user id", async () => {
			const mockService = {
				getUploadCvUrl: vi.fn(),
			} as unknown as JobRoleService;

			const controller = new JobRoleController(mockService);
			const req = {
				params: { id: "1" },
				body: { fileName: "cv.pdf", contentType: "application/pdf" },
				session: { jwtToken: createJwtWithId(0) },
			} as unknown as Request;
			const res = mockRes();

			await controller.getUploadCvUrl(req, res);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({ error: "Invalid session" });
			expect(mockService.getUploadCvUrl).not.toHaveBeenCalled();
		});

		it("should return 401 JSON when token is malformed", async () => {
			const mockService = {
				getUploadCvUrl: vi.fn(),
			} as unknown as JobRoleService;

			const controller = new JobRoleController(mockService);
			const req = {
				params: { id: "1" },
				body: { fileName: "cv.pdf", contentType: "application/pdf" },
				session: { jwtToken: "not-a-jwt" },
			} as unknown as Request;
			const res = mockRes();

			await controller.getUploadCvUrl(req, res);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({ error: "Invalid session" });
			expect(mockService.getUploadCvUrl).not.toHaveBeenCalled();
		});

		it("should accept userId claim from JWT payload", async () => {
			const mockService = {
				getUploadCvUrl: vi.fn().mockResolvedValue({
					uploadUrl: "https://s3.example/upload",
					objectKey: "cvs/user2-file.pdf",
				}),
			} as unknown as JobRoleService;

			const controller = new JobRoleController(mockService);
			const req = {
				params: { id: "1" },
				body: { fileName: "cv.pdf", contentType: "application/pdf" },
				session: { jwtToken: createJwtWithPayload({ userId: 2 }) },
			} as unknown as Request;
			const res = mockRes();

			await controller.getUploadCvUrl(req, res);

			expect(mockService.getUploadCvUrl).toHaveBeenCalledWith(
				1,
				2,
				"cv.pdf",
				"application/pdf",
				expect.any(String),
			);
		});

		it("should accept numeric string sub claim from JWT payload", async () => {
			const mockService = {
				getUploadCvUrl: vi.fn().mockResolvedValue({
					uploadUrl: "https://s3.example/upload",
					objectKey: "cvs/user3-file.pdf",
				}),
			} as unknown as JobRoleService;

			const controller = new JobRoleController(mockService);
			const req = {
				params: { id: "1" },
				body: { fileName: "cv.pdf", contentType: "application/pdf" },
				session: { jwtToken: createJwtWithPayload({ sub: "3" }) },
			} as unknown as Request;
			const res = mockRes();

			await controller.getUploadCvUrl(req, res);

			expect(mockService.getUploadCvUrl).toHaveBeenCalledWith(
				1,
				3,
				"cv.pdf",
				"application/pdf",
				expect.any(String),
			);
		});

		it("should return 400 JSON when service throws axios 400", async () => {
			const mockService = {
				getUploadCvUrl: vi.fn().mockRejectedValue({
					isAxiosError: true,
					response: { status: 400 },
				}),
			} as unknown as JobRoleService;

			const controller = new JobRoleController(mockService);
			const req = {
				params: { id: "1" },
				body: { fileName: "cv.pdf", contentType: "application/pdf" },
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
			const mockService = {
				getUploadCvUrl: vi.fn().mockRejectedValue({
					isAxiosError: true,
					response: { status: 404 },
				}),
			} as unknown as JobRoleService;

			const controller = new JobRoleController(mockService);
			const req = {
				params: { id: "1" },
				body: { fileName: "cv.pdf", contentType: "application/pdf" },
				session: { jwtToken: createJwtWithId(1) },
			} as unknown as Request;
			const res = mockRes();

			await controller.getUploadCvUrl(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({ error: "Job role not found" });
		});

		it("should return 500 JSON when service throws non-axios error", async () => {
			const mockService = {
				getUploadCvUrl: vi.fn().mockRejectedValue(new Error("boom")),
			} as unknown as JobRoleService;

			const controller = new JobRoleController(mockService);
			const req = {
				params: { id: "1" },
				body: { fileName: "cv.pdf", contentType: "application/pdf" },
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
			const mockService = {
				getUploadCvUrl: vi.fn().mockRejectedValue({
					isAxiosError: true,
					response: { status: 422 },
				}),
			} as unknown as JobRoleService;

			const controller = new JobRoleController(mockService);
			const req = {
				params: { id: "1" },
				body: { fileName: "cv.pdf", contentType: "application/pdf" },
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
			const controller = new JobRoleController(mockService);
			const req = { params: { id: "4" } } as unknown as Request;
			const res = mockRes();

			await controller.getJobRoleApplicationPage(req, res);

			expect(res.render).toHaveBeenCalledWith("pages/job-role-application.njk", {
				jobRoleId: 4,
			});
		});

		it("should return 400 when application page id is invalid", async () => {
			const mockService = {} as JobRoleService;
			const controller = new JobRoleController(mockService);
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
			const controller = new JobRoleController(mockService);
			const req = { params: { id: "7" } } as unknown as Request;
			const res = mockRes();

			await controller.submitJobRoleApplication(req, res);

			expect(res.redirect).toHaveBeenCalledWith(
				"/job-roles/7?applicationSubmitted=true",
			);
		});

		it("should return 400 when submit id is invalid", async () => {
			const mockService = {} as JobRoleService;
			const controller = new JobRoleController(mockService);
			const req = { params: { id: "abc" } } as unknown as Request;
			const res = mockRes();

			await controller.submitJobRoleApplication(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith("Invalid job role ID");
		});
	});
});
