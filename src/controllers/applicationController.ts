import axios from "axios";
import type { Request, Response } from "express";
import { getFileExtension } from "../services/applicationService.js";
import type { JobRoleService } from "../services/jobRoleService.js";
import { extractUserIdFromJwt } from "../services/jwtService.js";
import { UploadCvRequestSchema } from "../validation/applicationSchemas.js";

const ALLOWED_CV_EXTENSIONS = [".pdf", ".doc", ".docx"];

export class ApplicationController {
	constructor(private jobRoleService: JobRoleService) {}

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
