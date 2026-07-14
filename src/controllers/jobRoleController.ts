import axios from "axios";
import type { Request, Response } from "express";
import { JobRoleStatus } from "../models/jobRole.js";
import type { JobRoleService } from "../services/jobRoleService.js";
import { UploadCvRequestSchema } from "../validation/applicationSchemas.js";

function extractUserIdFromJwt(token: string): number | null {
	try {
		const payload = JSON.parse(
			Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
		) as Record<string, unknown>;

		const rawUserId = payload.id ?? payload.userId ?? payload.sub;
		const userId =
			typeof rawUserId === "number" ? rawUserId : Number(rawUserId);

		if (!Number.isInteger(userId) || userId <= 0) {
			return null;
		}

		return userId;
	} catch {
		return null;
	}
}

export class JobRoleController {
	constructor(private jobRoleService: JobRoleService) {}

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
			const canApply =
				jobRole.status === JobRoleStatus.Open &&
				jobRole.numberOfOpenPositions > 0;
			const applicationSubmitted = req.query.applicationSubmitted === "true";

			res.render("pages/job-role-information.njk", {
				jobRole,
				canApply,
				applicationSubmitted,
			});
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
			const { fileName, contentType } = validationResult.data;
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
