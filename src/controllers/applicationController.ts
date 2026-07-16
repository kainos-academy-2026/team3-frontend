import axios from "axios";
import type { Request, Response } from "express";
import {
	AdminApplicationActionStatus,
	type AdminApplicationsPageViewModel,
} from "../models/jobRole.js";
import {
	type ApplicationService,
	getFileExtension,
} from "../services/applicationService.js";
import type { JobRoleService } from "../services/jobRoleService.js";
import { extractUserIdFromJwt } from "../services/jwtService.js";
import { UploadCvRequestSchema } from "../validation/applicationSchemas.js";

const ALLOWED_CV_EXTENSIONS = [".pdf", ".doc", ".docx"];

export class ApplicationController {
	constructor(
		private jobRoleService: JobRoleService,
		private applicationService: ApplicationService,
	) {}

	private toPositiveInteger(
		value: string | string[] | undefined,
	): number | null {
		if (Array.isArray(value)) {
			return null;
		}
		if (!value) {
			return null;
		}
		const parsed = Number(value);
		if (!Number.isInteger(parsed) || parsed <= 0) {
			return null;
		}
		return parsed;
	}

	private getApplicationActionStatus(
		value: unknown,
	): AdminApplicationActionStatus | null {
		if (value === AdminApplicationActionStatus.HireSuccess) {
			return AdminApplicationActionStatus.HireSuccess;
		}
		if (value === AdminApplicationActionStatus.RejectSuccess) {
			return AdminApplicationActionStatus.RejectSuccess;
		}
		if (value === AdminApplicationActionStatus.Error) {
			return AdminApplicationActionStatus.Error;
		}
		return null;
	}

	async getAdminApplicationsPage(req: Request, res: Response): Promise<void> {
		const jobRoleId = this.toPositiveInteger(req.params.id);
		if (!jobRoleId) {
			res.status(400).send("Invalid job role ID");
			return;
		}

		const token = req.session.jwtToken;
		if (!token) {
			res.redirect("/login");
			return;
		}

		const applicationAction = this.getApplicationActionStatus(
			req.query.applicationAction,
		);

		try {
			const response =
				await this.applicationService.getJobRoleApplicationsForAdmin(
					jobRoleId,
					token,
				);

			const viewModel: AdminApplicationsPageViewModel = {
				jobRoleId: response.jobRoleId,
				roleName: response.roleName,
				numberOfOpenPositions: response.numberOfOpenPositions,
				applicants: response.applicants,
				adminApplicationsError: null,
				applicationAction,
			};

			res.render("pages/job-role-applications-admin.njk", viewModel);
		} catch (error) {
			console.error("Failed to load admin applications page:", error);
			const fallbackViewModel: AdminApplicationsPageViewModel = {
				jobRoleId,
				roleName: "Job role",
				numberOfOpenPositions: 0,
				applicants: [],
				adminApplicationsError:
					"Unable to load applicant list right now. Please try again shortly.",
				applicationAction,
			};
			res
				.status(500)
				.render("pages/job-role-applications-admin.njk", fallbackViewModel);
		}
	}

	async hireApplicant(req: Request, res: Response): Promise<void> {
		const token = req.session.jwtToken;
		if (!token) {
			res.redirect("/login");
			return;
		}

		const jobRoleId = this.toPositiveInteger(req.params.id);
		const applicationId = this.toPositiveInteger(req.params.applicationId);

		if (!jobRoleId || !applicationId) {
			res.status(400).send("Invalid IDs provided");
			return;
		}

		try {
			await this.applicationService.hireApplicant(
				jobRoleId,
				applicationId,
				token,
			);
			res.redirect(
				`/job-roles/${jobRoleId}/applications?applicationAction=${AdminApplicationActionStatus.HireSuccess}`,
			);
		} catch (error) {
			if (axios.isAxiosError(error) && error.response?.status === 401) {
				res.redirect("/login");
				return;
			}

			res.redirect(
				`/job-roles/${jobRoleId}/applications?applicationAction=${AdminApplicationActionStatus.Error}`,
			);
		}
	}

	async rejectApplicant(req: Request, res: Response): Promise<void> {
		const token = req.session.jwtToken;
		if (!token) {
			res.redirect("/login");
			return;
		}

		const jobRoleId = this.toPositiveInteger(req.params.id);
		const applicationId = this.toPositiveInteger(req.params.applicationId);

		if (!jobRoleId || !applicationId) {
			res.status(400).send("Invalid IDs provided");
			return;
		}

		try {
			await this.applicationService.rejectApplicant(
				jobRoleId,
				applicationId,
				token,
			);
			res.redirect(
				`/job-roles/${jobRoleId}/applications?applicationAction=${AdminApplicationActionStatus.RejectSuccess}`,
			);
		} catch (error) {
			if (axios.isAxiosError(error) && error.response?.status === 401) {
				res.redirect("/login");
				return;
			}

			res.redirect(
				`/job-roles/${jobRoleId}/applications?applicationAction=${AdminApplicationActionStatus.Error}`,
			);
		}
	}

	async getJobRoleApplicationPage(req: Request, res: Response): Promise<void> {
		const jobRoleId = Number(req.params.id);
		if (!Number.isInteger(jobRoleId) || jobRoleId <= 0) {
			res.status(400).send("Invalid job role ID");
			return;
		}

		res.render("pages/job-role-application.njk", { jobRoleId });
	}

	async submitJobRoleApplication(req: Request, res: Response): Promise<void> {
		const jobRoleId = Number(req.params.id);
		if (!Number.isInteger(jobRoleId) || jobRoleId <= 0) {
			res.status(400).send("Invalid job role ID");
			return;
		}

		res.redirect(`/job-roles/${jobRoleId}?applicationSubmitted=true`);
	}

	async getUploadCvUrl(req: Request, res: Response): Promise<void> {
		const jobRoleId = Number(req.params.id);
		if (!Number.isInteger(jobRoleId) || jobRoleId <= 0) {
			res.status(400).json({ error: "Invalid job role ID" });
			return;
		}

		const validationResult = UploadCvRequestSchema.safeParse(req.body);
		if (!validationResult.success) {
			res.status(400).json({ error: validationResult.error.issues[0].message });
			return;
		}

		const { fileName, contentType } = validationResult.data;
		const fileExtension = getFileExtension(fileName);
		if (!ALLOWED_CV_EXTENSIONS.includes(fileExtension)) {
			res.status(400).json({
				error: "Invalid file type. Please upload a PDF, DOC, or DOCX file.",
			});
			return;
		}

		const token = req.session.jwtToken;
		if (!token) {
			res.status(401).json({ error: "Not authenticated" });
			return;
		}

		const userId = extractUserIdFromJwt(token);
		if (!userId) {
			res.status(401).json({ error: "Invalid session" });
			return;
		}

		try {
			const { uploadUrl, objectKey } = await this.jobRoleService.getUploadCvUrl(
				jobRoleId,
				userId,
				fileName,
				contentType,
				token,
			);

			res.json({ uploadUrl, objectKey });
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const status = error.response?.status;
				if (status === 400) {
					res.status(400).json({ error: "Invalid upload request" });
					return;
				}
				if (status === 409) {
					res.status(409).json({
						error: "You have already applied for this role.",
					});
					return;
				}
				if (status === 404) {
					res.status(404).json({ error: "Job role not found" });
					return;
				}
			}

			res
				.status(500)
				.json({ error: "Could not prepare CV upload. Please try again." });
		}
	}
}
