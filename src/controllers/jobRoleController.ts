import axios from "axios";
import type { Request, Response } from "express";
import type { JobRoleService } from "../services/jobRoleService.js";

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
			res.render("pages/job-role-information.njk", { jobRole });
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
}
