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
});
