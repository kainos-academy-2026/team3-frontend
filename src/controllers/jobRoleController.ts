import axios from "axios";
import type { Request, Response } from "express";
import {
	type CreateJobRolePayload,
	type EditJobRoleViewModel,
	type JobRoleInformationViewModel,
	JobRoleStatus,
} from "../models/jobRole.js";
import {
	type CreateJobRoleFieldErrors,
	type CreateJobRoleFormValues,
	type CreateJobRolePageModel,
	defaultCreateJobRoleFormValues,
} from "../models/jobRoleForm.js";
import type { JobRoleService } from "../services/jobRoleService.js";
import {
	type CreateJobRoleData,
	CreateJobRoleSchema,
	JobRolePaginationQuerySchema,
	UpdateJobRoleRequestSchema,
} from "../validation/jobRoleSchemas.js";

const defaultPagination = {
	totalItems: 0,
	totalPages: 0,
	currentPage: 1,
	pageSize: 10,
	hasNext: false,
	hasPrevious: false,
};

const defaultPaginationLinks = {
	first: null,
	next: null,
	previous: null,
	last: null,
};

const toFrontendPaginationLink = (link: string | null): string | null => {
	if (!link) {
		return null;
	}

	return link.replace(/^\/api\/job-roles/, "/job-roles");
};

const toFrontendPaginationLinks = (links: {
	first: string | null;
	next: string | null;
	previous: string | null;
	last: string | null;
}) => ({
	first: toFrontendPaginationLink(links.first),
	next: toFrontendPaginationLink(links.next),
	previous: toFrontendPaginationLink(links.previous),
	last: toFrontendPaginationLink(links.last),
});

const toCreateJobRoleFormValues = (body: unknown): CreateJobRoleFormValues => {
	if (!body || typeof body !== "object") {
		return { ...defaultCreateJobRoleFormValues };
	}

	return {
		...defaultCreateJobRoleFormValues,
		...(body as CreateJobRoleFormValues),
	};
};

const createJobRoleFields = [
	"roleName",
	"location",
	"capabilityId",
	"bandId",
	"closingDate",
	"description",
	"responsibilities",
	"sharepointUrl",
	"numberOfOpenPositions",
] as const satisfies readonly (keyof CreateJobRolePayload)[];

const isCreateJobRoleField = (
	value: PropertyKey,
): value is keyof CreateJobRolePayload => {
	return (
		typeof value === "string" &&
		(createJobRoleFields as readonly string[]).includes(value)
	);
};

const toFieldErrors = (
	issues: { path: PropertyKey[]; message: string }[],
): CreateJobRoleFieldErrors => {
	const fieldErrors: CreateJobRoleFieldErrors = {};

	for (const issue of issues) {
		const field = issue.path[0];
		if (isCreateJobRoleField(field)) {
			fieldErrors[field] ??= issue.message;
		}
	}

	return fieldErrors;
};

export class JobRoleController {
	constructor(private jobRoleService: JobRoleService) {}

	async getAllJobRoles(req: Request, res: Response): Promise<void> {
		const token = req.session.jwtToken;
		const created = req.query?.created === "true";
		const roleDeleted = req.query?.roleDeleted === "true";
		const deleteError = req.query?.deleteError
			? (req.query.deleteError as string)
			: null;

		const queryValidation = JobRolePaginationQuerySchema.safeParse(req.query);
		if (!queryValidation.success) {
			res.status(400).render("pages/job-role-list.njk", {
				jobRoles: [],
				created,
				pagination: defaultPagination,
				links: defaultPaginationLinks,
				errorTitle: "Invalid pagination parameters",
				errorMessage: queryValidation.error.issues[0]?.message,
				roleDeleted,
				deleteError,
			});
			return;
		}

		const { limit, page } = queryValidation.data;

		try {
			const paginatedResponse = await this.jobRoleService.getAllJobRoles(
				token,
				limit,
				page,
			);
			res.render("pages/job-role-list.njk", {
				jobRoles: paginatedResponse.data,
				created,
				pagination: paginatedResponse.pagination,
				links: toFrontendPaginationLinks(paginatedResponse.links),
				roleDeleted,
				deleteError,
			});
		} catch (error) {
			if (axios.isAxiosError(error) && error.response?.status === 400) {
				res.status(400).render("pages/job-role-list.njk", {
					jobRoles: [],
					created,
					pagination: defaultPagination,
					links: defaultPaginationLinks,
					errorTitle: "Invalid pagination parameters",
					errorMessage:
						"Invalid page or limit values. Please update your query and try again.",
					roleDeleted,
					deleteError,
				});
				return;
			}

			console.error("Failed to get job roles:", error);
			res.status(500).render("pages/job-role-list.njk", {
				jobRoles: [],
				created,
				pagination: defaultPagination,
				links: defaultPaginationLinks,
				roleDeleted,
				deleteError,
				errorTitle: "Unable to load job roles",
				errorMessage:
					"We could not fetch job roles right now. Please try again shortly.",
			});
		}
	}

	async getJobRoleById(req: Request, res: Response): Promise<void> {
		const token = req.session.jwtToken;

		const jobRoleId = Number(req.params.id);

		if (!Number.isInteger(jobRoleId) || jobRoleId <= 0) {
			res.status(400).send("Invalid job role ID");
			return;
		}

		try {
			const jobRole = await this.jobRoleService.getJobRoleById(
				jobRoleId,
				token,
			);
			const isAdmin = req.session.userRole === "ADMIN";
			const canEdit = isAdmin;
			const editSuccess = req.query.editSuccess === "true";
			const deleteError = req.query?.deleteError
				? (req.query.deleteError as string)
				: null;
			const viewModel: JobRoleInformationViewModel = {
				jobRole,
				canApply:
					jobRole.status === JobRoleStatus.Open &&
					jobRole.numberOfOpenPositions > 0,
				applicationSubmitted: req.query.applicationSubmitted === "true",
				canEdit,
				editSuccess,
				isAdmin,
				deleteError,
			};

			res.render("pages/job-role-information.njk", viewModel);
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const status = error.response?.status;
				if (status === 404) {
					res.status(404).send("Job role not found");
					return;
				}
				if (status === 500) {
					res.status(500).send("Backend server error");
					return;
				}
			}
			res.status(500).send("Internal Server Error");
		}
	}

	private async buildCreateJobRolePageModel(
		token: string,
		overrides: Partial<CreateJobRolePageModel> = {},
	): Promise<CreateJobRolePageModel> {
		const metadata = await this.jobRoleService.getJobRoleMetadata(token);

		return {
			capabilities: metadata.capabilities,
			bands: metadata.bands,
			formValues: { ...defaultCreateJobRoleFormValues },
			fieldErrors: {},
			error: null,
			...overrides,
		};
	}

	async getCreateJobRolePage(req: Request, res: Response): Promise<void> {
		const token = req.session.jwtToken;
		if (!token) {
			res.redirect("/login");
			return;
		}

		try {
			const model = await this.buildCreateJobRolePageModel(token);
			res.render("pages/job-role-form.njk", model);
		} catch (error) {
			console.error("Failed to get create job role page:", error);
			res.status(500).render("pages/job-role-form.njk", {
				capabilities: [],
				bands: [],
				formValues: { ...defaultCreateJobRoleFormValues },
				fieldErrors: {},
				error: "Unable to load create role form right now.",
			});
		}
	}

	async createJobRole(req: Request, res: Response): Promise<void> {
		const token = req.session.jwtToken;
		if (!token) {
			res.redirect("/login");
			return;
		}

		const parseResult = CreateJobRoleSchema.safeParse(req.body);

		if (!parseResult.success) {
			try {
				const model = await this.buildCreateJobRolePageModel(token, {
					formValues: toCreateJobRoleFormValues(req.body),
					fieldErrors: toFieldErrors(parseResult.error.issues),
					error: "Please fix the highlighted fields.",
				});
				res.status(400).render("pages/job-role-form.njk", model);
				return;
			} catch {
				res.status(400).render("pages/job-role-form.njk", {
					capabilities: [],
					bands: [],
					formValues: toCreateJobRoleFormValues(req.body),
					fieldErrors: toFieldErrors(parseResult.error.issues),
					error: "Please fix the highlighted fields.",
				});
				return;
			}
		}

		const payload: CreateJobRoleData = parseResult.data;

		try {
			await this.jobRoleService.createJobRole(payload, token);
			res.redirect("/job-roles?created=true");
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const status = error.response?.status;

				if (status === 401) {
					res.redirect("/login");
					return;
				}

				if (status === 403) {
					res.status(403).render("pages/home.njk", {
						error: "You do not have permission to access this page.",
					});
					return;
				}

				if (status === 400) {
					const responseError = error.response?.data as { message?: unknown };
					const errorMessage =
						typeof responseError?.message === "string"
							? responseError.message
							: "Please check the form details and try again.";

					try {
						const model = await this.buildCreateJobRolePageModel(token, {
							formValues: toCreateJobRoleFormValues(req.body),
							fieldErrors: {},
							error: errorMessage,
						});
						res.status(400).render("pages/job-role-form.njk", model);
						return;
					} catch {
						res.status(400).render("pages/job-role-form.njk", {
							capabilities: [],
							bands: [],
							formValues: toCreateJobRoleFormValues(req.body),
							fieldErrors: {},
							error: errorMessage,
						});
						return;
					}
				}
			}

			try {
				const model = await this.buildCreateJobRolePageModel(token, {
					formValues: toCreateJobRoleFormValues(req.body),
					fieldErrors: {},
					error: "Unable to create job role right now. Please try again.",
				});
				res.status(500).render("pages/job-role-form.njk", model);
			} catch {
				res.status(500).render("pages/job-role-form.njk", {
					capabilities: [],
					bands: [],
					formValues: toCreateJobRoleFormValues(req.body),
					fieldErrors: {},
					error: "Unable to create job role right now. Please try again.",
				});
			}
		}
	}

	async downloadJobRoleReport(req: Request, res: Response): Promise<void> {
		const token = req.session.jwtToken;
		if (!token) {
			res.redirect("/login");
			return;
		}

		try {
			const reportBuffer = await this.jobRoleService.getJobRoleReport(token);
			const today = new Date().toISOString().split("T")[0];

			res.setHeader("Content-Type", "text/csv; charset=utf-8");
			res.setHeader(
				"Content-Disposition",
				`attachment; filename="job-roles-report-${today}.csv"`,
			);
			res.status(200).send(reportBuffer);
		} catch (error) {
			console.error("Failed to generate job role report:", error);
			res.status(500).send("Unable to generate report");
		}
	}

	async getEditJobRolePage(req: Request, res: Response): Promise<void> {
		const jobRoleId = Number(req.params.id);

		const token = req.session.jwtToken;
		if (!token) {
			res.redirect("/login");
			return;
		}

		try {
			const jobRole = await this.jobRoleService.getJobRoleById(
				jobRoleId,
				token,
			);
			const viewModel: EditJobRoleViewModel = { jobRole };
			res.render("pages/job-role-edit.njk", viewModel);
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const status = error.response?.status;
				if (status === 400) {
					res.status(400).send("Invalid job role ID");
					return;
				}
				if (status === 404) {
					res.status(404).send("Job role not found");
					return;
				}
			}
			res.status(500).send("Internal Server Error");
		}
	}

	async submitEditJobRole(req: Request, res: Response): Promise<void> {
		const jobRoleId = Number(req.params.id);
		if (!Number.isInteger(jobRoleId) || jobRoleId <= 0) {
			res.status(400).send("Invalid job role ID");
			return;
		}

		const token = req.session.jwtToken;
		if (!token) {
			res.redirect("/login");
			return;
		}
		const authenticatedToken: string = token;

		const parseResult = UpdateJobRoleRequestSchema.safeParse(req.body);
		if (!parseResult.success) {
			try {
				const jobRole = await this.jobRoleService.getJobRoleById(
					jobRoleId,
					authenticatedToken,
				);
				const viewModel: EditJobRoleViewModel = {
					jobRole,
					error: parseResult.error.issues[0].message,
					formValues: req.body as Record<string, string>,
				};
				res.status(400).render("pages/job-role-edit.njk", viewModel);
			} catch {
				res.status(500).send("Internal Server Error");
			}
			return;
		}

		try {
			await this.jobRoleService.updateJobRole(
				jobRoleId,
				parseResult.data,
				authenticatedToken,
			);
			res.redirect(`/job-roles/${jobRoleId}?editSuccess=true`);
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const status = error.response?.status;
				if (status === 404) {
					res.status(404).send("Job role not found");
					return;
				}
				if (status === 400) {
					res.status(400).send("Invalid update data");
					return;
				}
			}
			res.status(500).send("Could not update job role. Please try again.");
		}
	}

	async deleteJobRole(req: Request, res: Response): Promise<void> {
		const jobRoleId = Number(req.params.id);
		if (!Number.isInteger(jobRoleId) || jobRoleId <= 0) {
			res.status(400).send("Invalid job role ID");
			return;
		}

		const token = req.session.jwtToken;
		if (!token) {
			res.redirect("/login");
			return;
		}

		try {
			await this.jobRoleService.deleteJobRole(jobRoleId, token);
			res.redirect("/job-roles?roleDeleted=true");
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const status = error.response?.status;
				if (status === 404) {
					res.redirect("/job-roles?deleteError=not-found");
					return;
				}
				if (status === 409) {
					res.redirect(`/job-roles/${jobRoleId}?deleteError=has-applications`);
					return;
				}
			}
			res.redirect("/job-roles?deleteError=unknown");
		}
	}
}
