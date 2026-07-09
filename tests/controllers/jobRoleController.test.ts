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
	it("should render job roles on happy path", async () => {
		const mockService = {
			getAllJobRoles: vi.fn().mockResolvedValue(mockJobRoles),
		} as unknown as JobRoleService;

		const controller = new JobRoleController(mockService);
		const req = {} as Request;
		const res = mockRes();

		await controller.getAllJobRoles(req, res);

		expect(mockService.getAllJobRoles).toHaveBeenCalledOnce();
		expect(res.render).toHaveBeenCalledWith("pages/job-role-list.njk", {
			jobRoles: mockJobRoles,
		});
	});

	it("should return 500 when the service throws an error", async () => {
		const mockService = {
			getAllJobRoles: vi.fn().mockRejectedValue(new Error("Service failure")),
		} as unknown as JobRoleService;

		const controller = new JobRoleController(mockService);
		const req = {} as Request;
		const res = mockRes();

		await controller.getAllJobRoles(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.send).toHaveBeenCalledWith("Internal Server Error");
	});

	it("should render job role information on happy path", async () => {
		const mockService = {
			getAllJobRoles: vi.fn(),
			getJobRoleById: vi.fn().mockResolvedValue(mockJobRoleInformation),
		} as unknown as JobRoleService;

		const controller = new JobRoleController(mockService);
		const req = { params: { id: "1" } } as unknown as Request;
		const res = mockRes();

		await controller.getJobRoleById(req, res);

		expect(mockService.getJobRoleById).toHaveBeenCalledWith(1);
		expect(res.render).toHaveBeenCalledWith("pages/job-role-information.njk", {
			jobRole: mockJobRoleInformation,
		});
	});

	it("should return 400 when id is invalid", async () => {
		const mockService = {
			getAllJobRoles: vi.fn(),
			getJobRoleById: vi.fn(),
		} as unknown as JobRoleService;

		const controller = new JobRoleController(mockService);
		const req = { params: { id: "abc" } } as unknown as Request;
		const res = mockRes();

		await controller.getJobRoleById(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.send).toHaveBeenCalledWith("Invalid job role ID");
	});
});
