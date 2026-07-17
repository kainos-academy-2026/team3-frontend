import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../src/app.ts";
import { ApplicationController } from "../../src/controllers/applicationController.ts";
import { JobRoleController } from "../../src/controllers/jobRoleController.ts";
import {
	type JobRoleInformation,
	JobRoleStatus,
} from "../../src/models/jobRole.ts";
import * as jobRoleServiceModule from "../../src/services/jobRoleService.ts";

let mockIsAuthenticated = true;
let mockIsAdmin = true;
const { mockJwtToken } = vi.hoisted(() => {
	const jwtPayload = Buffer.from(JSON.stringify({ id: 1 }), "utf8").toString(
		"base64url",
	);
	return {
		mockJwtToken: `header.${jwtPayload}.signature`,
	};
});

vi.mock("express-session", () => ({
	default:
		() =>
		(
			req: { session: { jwtToken?: string } },
			_res: unknown,
			next: () => void,
		) => {
			req.session = {
				...(req.session ?? {}),
				jwtToken: mockJwtToken,
				userRole: mockIsAdmin ? "ADMIN" : "APPLICANT",
			};
			next();
		},
}));

vi.mock("../../src/middleware/authMiddleware.js", () => ({
	requireAuth: (
		req: { session: { jwtToken?: string } },
		res: { redirect: (path: string) => unknown },
		next: () => void,
	) => {
		if (!mockIsAuthenticated) {
			res.redirect("/login");
			return;
		}
		req.session.jwtToken = mockJwtToken;
		next();
	},
	requireAdmin: (
		req: { session: { userRole?: string; jwtToken?: string } },
		res: {
			status: (code: number) => {
				send: (text: string) => void;
			};
			redirect: (path: string) => void;
		},
		next: () => void,
	) => {
		if (!mockIsAuthenticated) {
			res.redirect("/login");
			return;
		}
		if (!mockIsAdmin) {
			res.status(403).send("Forbidden");
			return;
		}
		req.session.jwtToken = mockJwtToken;
		next();
	},
}));

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

describe("GET /job-roles routes", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		mockIsAuthenticated = true;
		mockIsAdmin = true;
	});

	it("should return 200 and render job roles on happy path", async () => {
		vi.spyOn(
			jobRoleServiceModule.JobRoleService.prototype,
			"getAllJobRoles",
		).mockResolvedValue({
			data: [
				{
					id: 1,
					roleName: "Software Engineer",
					location: "Belfast",
					capability: { capabilityId: 1, capabilityName: "Engineering" },
					band: { bandId: 1, bandName: "Associate" },
					closingDate: "2026-12-31",
					status: JobRoleStatus.Open,
				},
			],
			pagination: {
				totalItems: 1,
				totalPages: 1,
				currentPage: 1,
				pageSize: 10,
				hasNext: false,
				hasPrevious: false,
			},
			links: {
				first: "/api/job-roles?limit=10&page=1",
				next: null,
				previous: null,
				last: "/api/job-roles?limit=10&page=1",
			},
		});

		const response = await request(app).get("/job-roles");

		expect(response.status).toBe(200);
		expect(response.type).toMatch(/html/);
		expect(response.text).toContain("Software Engineer");
	});

	it("should not require auth for GET /job-roles?limit=10&page=1", async () => {
		mockIsAuthenticated = false;
		vi.spyOn(
			jobRoleServiceModule.JobRoleService.prototype,
			"getAllJobRoles",
		).mockResolvedValue({
			data: [],
			pagination: {
				totalItems: 0,
				totalPages: 0,
				currentPage: 1,
				pageSize: 10,
				hasNext: false,
				hasPrevious: false,
			},
			links: {
				first: null,
				next: null,
				previous: null,
				last: null,
			},
		});

		const response = await request(app).get("/job-roles?limit=10&page=1");

		expect(response.status).toBe(200);
	});

	it("should delegate to controller for authenticated GET /job-roles?limit=10&page=1", async () => {
		const listSpy = vi
			.spyOn(JobRoleController.prototype, "getAllJobRoles")
			.mockImplementation(async (_req, res) => {
				res.status(200).send("list ok");
			});

		const response = await request(app).get("/job-roles?limit=10&page=1");

		expect(response.status).toBe(200);
		expect(response.text).toContain("list ok");
		expect(listSpy).toHaveBeenCalledOnce();
	});

	it("should not show delete action on list page for admins", async () => {
		mockIsAdmin = true;
		vi.spyOn(
			jobRoleServiceModule.JobRoleService.prototype,
			"getAllJobRoles",
		).mockResolvedValue({
			data: [
				{
					id: 1,
					roleName: "Software Engineer",
					location: "Belfast",
					capability: { capabilityId: 1, capabilityName: "Engineering" },
					band: { bandId: 1, bandName: "Associate" },
					closingDate: "2026-12-31",
					status: JobRoleStatus.Open,
				},
			],
			pagination: {
				totalItems: 1,
				totalPages: 1,
				currentPage: 1,
				pageSize: 10,
				hasNext: false,
				hasPrevious: false,
			},
			links: {
				first: "/api/job-roles?limit=10&page=1",
				next: null,
				previous: null,
				last: "/api/job-roles?limit=10&page=1",
			},
		});

		const response = await request(app).get("/job-roles");

		expect(response.status).toBe(200);
		expect(response.text).not.toContain("Delete role");
	});

	it("should hide delete action on list page for non-admins", async () => {
		mockIsAdmin = false;
		vi.spyOn(
			jobRoleServiceModule.JobRoleService.prototype,
			"getAllJobRoles",
		).mockResolvedValue({
			data: [
				{
					id: 1,
					roleName: "Software Engineer",
					location: "Belfast",
					capability: { capabilityId: 1, capabilityName: "Engineering" },
					band: { bandId: 1, bandName: "Associate" },
					closingDate: "2026-12-31",
					status: JobRoleStatus.Open,
				},
			],
			pagination: {
				totalItems: 1,
				totalPages: 1,
				currentPage: 1,
				pageSize: 10,
				hasNext: false,
				hasPrevious: false,
			},
			links: {
				first: "/api/job-roles?limit=10&page=1",
				next: null,
				previous: null,
				last: "/api/job-roles?limit=10&page=1",
			},
		});

		const response = await request(app).get("/job-roles");

		expect(response.status).toBe(200);
		expect(response.text).not.toContain("Delete role");
	});

	it("should return 500 when the service throws an error for GET /job-roles", async () => {
		vi.spyOn(
			jobRoleServiceModule.JobRoleService.prototype,
			"getAllJobRoles",
		).mockRejectedValue(new Error("Service failure"));

		const response = await request(app).get("/job-roles");

		expect(response.status).toBe(500);
		expect(response.text).toContain("Unable to load job roles");
		expect(response.text).toContain(
			"We could not fetch job roles right now. Please try again shortly.",
		);
	});

	it("should return rendered validation error for invalid query values", async () => {
		const response = await request(app).get("/job-roles?limit=31&page=1");

		expect(response.status).toBe(400);
		expect(response.text).toContain("Invalid pagination parameters");
		expect(response.text).toContain("Limit must not exceed 30.");
	});

	it("should return 200 and render html for GET /job-roles/:id", async () => {
		vi.spyOn(
			jobRoleServiceModule.JobRoleService.prototype,
			"getJobRoleById",
		).mockResolvedValue(mockJobRoleInformation);

		const response = await request(app).get("/job-roles/1");

		expect(response.status).toBe(200);
		expect(response.type).toMatch(/html/);
		expect(response.text).toContain("Software Engineer");
		expect(response.text).toContain("Builds backend services");
	});

	it("should allow unauthenticated access to GET /job-roles/:id", async () => {
		mockIsAuthenticated = false;
		vi.spyOn(
			jobRoleServiceModule.JobRoleService.prototype,
			"getJobRoleById",
		).mockResolvedValue(mockJobRoleInformation);

		const response = await request(app).get("/job-roles/1");

		expect(response.status).toBe(200);
		expect(response.text).toContain("Software Engineer");
	});

	it("should show delete action on detail page for admins", async () => {
		mockIsAdmin = true;
		vi.spyOn(
			jobRoleServiceModule.JobRoleService.prototype,
			"getJobRoleById",
		).mockResolvedValue(mockJobRoleInformation);

		const response = await request(app).get("/job-roles/1");

		expect(response.status).toBe(200);
		expect(response.text).toContain("Software Engineer");
		expect(response.text).toContain("Delete role");
	});

	it("should hide delete action on detail page for non-admins", async () => {
		mockIsAdmin = false;
		vi.spyOn(
			jobRoleServiceModule.JobRoleService.prototype,
			"getJobRoleById",
		).mockResolvedValue(mockJobRoleInformation);

		const response = await request(app).get("/job-roles/1");

		expect(response.status).toBe(200);
		expect(response.text).not.toContain("Delete role");
	});

	it("should return 400 for invalid id in GET /job-roles/:id", async () => {
		const response = await request(app).get("/job-roles/abc");

		expect(response.status).toBe(400);
		expect(response.text).toContain("Invalid job role ID");
	});

	it("should return 404 when job role is not found", async () => {
		vi.spyOn(
			jobRoleServiceModule.JobRoleService.prototype,
			"getJobRoleById",
		).mockRejectedValue({
			isAxiosError: true,
			response: { status: 404 },
		});

		const response = await request(app).get("/job-roles/99999");

		expect(response.status).toBe(404);
		expect(response.text).toContain("Job role not found");
	});

	it("should return 500 when the backend returns 500 for GET /job-roles/:id", async () => {
		vi.spyOn(
			jobRoleServiceModule.JobRoleService.prototype,
			"getJobRoleById",
		).mockRejectedValue({
			isAxiosError: true,
			response: { status: 500 },
		});

		const response = await request(app).get("/job-roles/1");

		expect(response.status).toBe(500);
		expect(response.text).toContain("Backend server error");
	});

	describe("GET /job-roles/new", () => {
		it("should redirect to /login when unauthenticated", async () => {
			mockIsAuthenticated = false;

			const response = await request(app).get("/job-roles/new");

			expect(response.status).toBe(302);
			expect(response.headers.location).toBe("/login");
		});

		it("should return 403 for authenticated non-admin users", async () => {
			mockIsAdmin = false;

			const response = await request(app).get("/job-roles/new");

			expect(response.status).toBe(403);
		});

		it("should delegate to controller for admins", async () => {
			const createPageSpy = vi
				.spyOn(JobRoleController.prototype, "getCreateJobRolePage")
				.mockImplementation(async (_req, res) => {
					res.status(200).send("create form");
				});

			const response = await request(app).get("/job-roles/new");

			expect(response.status).toBe(200);
			expect(response.text).toContain("create form");
			expect(createPageSpy).toHaveBeenCalledOnce();
		});
	});

	describe("POST /job-roles", () => {
		it("should redirect to /login when unauthenticated", async () => {
			mockIsAuthenticated = false;

			const response = await request(app).post("/job-roles").send({});

			expect(response.status).toBe(302);
			expect(response.headers.location).toBe("/login");
		});

		it("should return 403 for authenticated non-admin users", async () => {
			mockIsAdmin = false;

			const response = await request(app).post("/job-roles").send({});

			expect(response.status).toBe(403);
		});

		it("should allow admins and follow controller success path", async () => {
			vi.spyOn(
				jobRoleServiceModule.JobRoleService.prototype,
				"createJobRole",
			).mockResolvedValue(undefined);

			const response = await request(app).post("/job-roles").send({
				roleName: "Senior Backend Engineer",
				location: "Dublin",
				capabilityId: "1",
				bandId: "2",
				closingDate: "2026-08-31",
				description: "Own backend services and integrations.",
				responsibilities: "Build APIs, review code, support delivery.",
				sharepointUrl: "https://example.sharepoint.com/job-role",
				numberOfOpenPositions: "2",
			});

			expect(response.status).toBe(302);
			expect(response.headers.location).toBe("/job-roles?created=true");
		});
	});

	describe("POST /job-roles/:id/applications/:applicationId/hire", () => {
		it("should redirect to /login when unauthenticated", async () => {
			mockIsAuthenticated = false;

			const response = await request(app)
				.post("/job-roles/1/applications/10/hire")
				.send({});

			expect(response.status).toBe(302);
			expect(response.headers.location).toBe("/login");
		});

		it("should return 403 for authenticated non-admin users", async () => {
			mockIsAdmin = false;

			const response = await request(app)
				.post("/job-roles/1/applications/10/hire")
				.send({});

			expect(response.status).toBe(403);
		});

		it("should delegate to controller for admins", async () => {
			const hireSpy = vi
				.spyOn(ApplicationController.prototype, "hireApplicant")
				.mockImplementation(async (_req, res) => {
					res
						.status(302)
						.redirect(
							"/job-roles/1/applications?applicationAction=hire-success",
						);
				});

			const response = await request(app)
				.post("/job-roles/1/applications/10/hire")
				.send({});

			expect(response.status).toBe(302);
			expect(hireSpy).toHaveBeenCalledOnce();
		});
	});

	describe("POST /job-roles/:id/applications/:applicationId/reject", () => {
		it("should redirect to /login when unauthenticated", async () => {
			mockIsAuthenticated = false;

			const response = await request(app)
				.post("/job-roles/1/applications/10/reject")
				.send({});

			expect(response.status).toBe(302);
			expect(response.headers.location).toBe("/login");
		});

		it("should return 403 for authenticated non-admin users", async () => {
			mockIsAdmin = false;

			const response = await request(app)
				.post("/job-roles/1/applications/10/reject")
				.send({});

			expect(response.status).toBe(403);
		});

		it("should delegate to controller for admins", async () => {
			const rejectSpy = vi
				.spyOn(ApplicationController.prototype, "rejectApplicant")
				.mockImplementation(async (_req, res) => {
					res
						.status(302)
						.redirect(
							"/job-roles/1/applications?applicationAction=reject-success",
						);
				});

			const response = await request(app)
				.post("/job-roles/1/applications/10/reject")
				.send({});

			expect(response.status).toBe(302);
			expect(rejectSpy).toHaveBeenCalledOnce();
		});
	});

	describe("GET /job-roles/:id/applications", () => {
		it("should redirect to /login when unauthenticated", async () => {
			mockIsAuthenticated = false;

			const response = await request(app).get("/job-roles/1/applications");

			expect(response.status).toBe(302);
			expect(response.headers.location).toBe("/login");
		});

		it("should return 403 for authenticated non-admin users", async () => {
			mockIsAdmin = false;

			const response = await request(app).get("/job-roles/1/applications");

			expect(response.status).toBe(403);
		});

		it("should delegate to ApplicationController for admins", async () => {
			const pageSpy = vi
				.spyOn(ApplicationController.prototype, "getAdminApplicationsPage")
				.mockImplementation(async (_req, res) => {
					res.status(200).send("applications admin page");
				});

			const response = await request(app).get("/job-roles/1/applications");

			expect(response.status).toBe(200);
			expect(response.text).toContain("applications admin page");
			expect(pageSpy).toHaveBeenCalledOnce();
		});
	});

	it("should return csv report for GET /job-roles/report", async () => {
		vi.spyOn(
			jobRoleServiceModule.JobRoleService.prototype,
			"getJobRoleReport",
		).mockResolvedValue(Buffer.from("id,roleName\n1,Software Engineer"));

		const response = await request(app).get("/job-roles/report");

		expect(response.status).toBe(200);
		expect(response.headers["content-type"]).toContain("text/csv");
		expect(response.text).toContain("id,roleName");
	});

	it("should redirect to login for POST /job-roles/:id/delete when unauthenticated", async () => {
		mockIsAuthenticated = false;

		const response = await request(app).post("/job-roles/1/delete");

		expect(response.status).toBe(302);
		expect(response.headers.location).toBe("/login");
	});

	it("should return 403 for POST /job-roles/:id/delete when not admin", async () => {
		mockIsAdmin = false;

		const response = await request(app).post("/job-roles/1/delete");

		expect(response.status).toBe(403);
		expect(response.text).toContain("Forbidden");
	});

	it("should delegate delete to controller for POST /job-roles/:id/delete when admin", async () => {
		const deleteSpy = vi
			.spyOn(jobRoleServiceModule.JobRoleService.prototype, "deleteJobRole")
			.mockResolvedValue(undefined);

		const response = await request(app).post("/job-roles/1/delete");

		expect(response.status).toBe(302);
		expect(response.headers.location).toBe("/job-roles?roleDeleted=true");
		expect(deleteSpy).toHaveBeenCalledWith(1, mockJwtToken);
	});
});

describe("Edit job role routes", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		mockIsAuthenticated = true;
		mockIsAdmin = true;
	});

	it("GET /job-roles/1/edit without auth should redirect to /login", async () => {
		mockIsAuthenticated = false;

		const response = await request(app).get("/job-roles/1/edit");

		expect(response.status).toBe(302);
		expect(response.headers.location).toBe("/login");
	});

	it("GET /job-roles/1/edit with admin auth should reach the controller", async () => {
		vi.spyOn(
			jobRoleServiceModule.JobRoleService.prototype,
			"getJobRoleById",
		).mockResolvedValue(mockJobRoleInformation);

		const response = await request(app).get("/job-roles/1/edit");

		expect(response.status).toBe(200);
		expect(response.type).toMatch(/html/);
	});

	it("GET /job-roles/1/edit as non-admin should return 403", async () => {
		mockIsAdmin = false;

		const response = await request(app).get("/job-roles/1/edit");

		expect(response.status).toBe(403);
	});

	it("POST /job-roles/1/edit without auth should redirect to /login", async () => {
		mockIsAuthenticated = false;

		const response = await request(app)
			.post("/job-roles/1/edit")
			.send({ roleName: "Updated" });

		expect(response.status).toBe(302);
		expect(response.headers.location).toBe("/login");
	});

	it("POST /job-roles/1/edit with admin auth should reach the controller", async () => {
		vi.spyOn(
			jobRoleServiceModule.JobRoleService.prototype,
			"updateJobRole",
		).mockResolvedValue(mockJobRoleInformation);

		const response = await request(app)
			.post("/job-roles/1/edit")
			.send({ roleName: "Updated Engineer" });

		expect(response.status).toBe(302);
		expect(response.headers.location).toBe("/job-roles/1?editSuccess=true");
	});

	it("POST /job-roles/1/edit as non-admin should return 403", async () => {
		mockIsAdmin = false;

		const response = await request(app)
			.post("/job-roles/1/edit")
			.send({ roleName: "Updated" });

		expect(response.status).toBe(403);
	});
});

describe("Edit job role routes", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		mockIsAuthenticated = true;
		mockIsAdmin = true;
	});

	it("GET /job-roles/1/edit without auth should redirect to /login", async () => {
		mockIsAuthenticated = false;

		const response = await request(app).get("/job-roles/1/edit");

		expect(response.status).toBe(302);
		expect(response.headers.location).toBe("/login");
	});

	it("GET /job-roles/1/edit with admin auth should reach the controller", async () => {
		vi.spyOn(
			jobRoleServiceModule.JobRoleService.prototype,
			"getJobRoleById",
		).mockResolvedValue(mockJobRoleInformation);

		const response = await request(app).get("/job-roles/1/edit");

		expect(response.status).toBe(200);
		expect(response.type).toMatch(/html/);
	});

	it("GET /job-roles/1/edit as non-admin should return 403", async () => {
		mockIsAdmin = false;

		const response = await request(app).get("/job-roles/1/edit");

		expect(response.status).toBe(403);
	});

	it("POST /job-roles/1/edit without auth should redirect to /login", async () => {
		mockIsAuthenticated = false;

		const response = await request(app)
			.post("/job-roles/1/edit")
			.send({ roleName: "Updated" });

		expect(response.status).toBe(302);
		expect(response.headers.location).toBe("/login");
	});

	it("POST /job-roles/1/edit with admin auth should reach the controller", async () => {
		vi.spyOn(
			jobRoleServiceModule.JobRoleService.prototype,
			"updateJobRole",
		).mockResolvedValue(mockJobRoleInformation);

		const response = await request(app)
			.post("/job-roles/1/edit")
			.send({ roleName: "Updated Engineer" });

		expect(response.status).toBe(302);
		expect(response.headers.location).toBe("/job-roles/1?editSuccess=true");
	});

	it("POST /job-roles/1/edit as non-admin should return 403", async () => {
		mockIsAdmin = false;

		const response = await request(app)
			.post("/job-roles/1/edit")
			.send({ roleName: "Updated" });

		expect(response.status).toBe(403);
	});
});
