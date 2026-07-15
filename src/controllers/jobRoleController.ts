import axios from "axios";
import type { Request, Response } from "express";
import {
	type JobRoleInformationViewModel,
	JobRoleStatus,
} from "../models/jobRole.js";
import type { JobRoleService } from "../services/jobRoleService.js";
import { extractUserIdFromJwt } from "../services/jwtService.js";
import { UploadCvRequestSchema } from "../validation/applicationSchemas.js";

const ALLOWED_CV_EXTENSIONS = [".pdf", ".doc", ".docx"];
const MAX_CV_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export class JobRoleController {
	constructor(private jobRoleService: JobRoleService) {}

	private getFileExtension(fileName: string): string {
		const lowerFileName = fileName.toLowerCase();
		const extensionStartIndex = lowerFileName.lastIndexOf(".");
		return extensionStartIndex >= 0
			? lowerFileName.slice(extensionStartIndex)
			: "";
	}

	async getAllJobRoles(req: Request, res: Response): Promise<void> {
		const token = req.session.jwtToken;
		if (!token) {
			res.redirect("/login");
			return;
		}

		try {
			const jobRoles = await this.jobRoleService.getAllJobRoles(token);
			res.render("pages/job-role-list.njk", { jobRoles });
		} catch (error) {
			console.error("Failed to get job roles:", error);
			res.status(500).render("pages/job-role-list.njk", {
				jobRoles: [],
				errorTitle: "Unable to load job roles",
				errorMessage:
					"We could not fetch job roles right now. Please try again shortly.",
			});
		}
	}

	async getJobRoleById(req: Request, res: Response): Promise<void> {
		const token = req.session.jwtToken;
		if (!token) {
			res.redirect("/login");
			return;
		}

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
			const viewModel: JobRoleInformationViewModel = {
				jobRole,
				canApply:
					jobRole.status === JobRoleStatus.Open &&
					jobRole.numberOfOpenPositions > 0,
				applicationSubmitted: req.query.applicationSubmitted === "true",
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
		const fileExtension = this.getFileExtension(fileName);
		if (!ALLOWED_CV_EXTENSIONS.includes(fileExtension)) {
			res.status(400).json({
				error: "Invalid file type. Please upload a PDF, DOC, or DOCX file.",
			});
			return;
		}

		const hasFileSizeInRequest = req.body.fileSizeBytes !== undefined;
		if (hasFileSizeInRequest) {
			const fileSizeBytes = Number(req.body.fileSizeBytes);
			if (!Number.isFinite(fileSizeBytes) || fileSizeBytes <= 0) {
				res.status(400).json({ error: "File size is invalid." });
				return;
			}

			if (fileSizeBytes > MAX_CV_FILE_SIZE_BYTES) {
				res
					.status(400)
					.json({ error: "File is too large. Maximum allowed size is 5MB." });
				return;
			}
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
