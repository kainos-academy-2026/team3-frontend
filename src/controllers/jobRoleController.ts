import axios from "axios";
import type { Request, Response } from "express";
import {
	type EditJobRoleViewModel,
	type JobRoleInformationViewModel,
	JobRoleStatus,
} from "../models/jobRole.js";
import type { JobRoleService } from "../services/jobRoleService.js";
import { UpdateJobRoleRequestSchema } from "../validation/jobRoleSchemas.js";

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
			const canEdit = req.session.userRole === "ADMIN";
			const editSuccess = req.query.editSuccess === "true";
			const viewModel: JobRoleInformationViewModel = {
				jobRole,
				canApply:
					jobRole.status === JobRoleStatus.Open &&
					jobRole.numberOfOpenPositions > 0,
				applicationSubmitted: req.query.applicationSubmitted === "true",
				canEdit,
				editSuccess,
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
			const jobRole = await this.jobRoleService.getJobRoleById(jobRoleId, token);
			const viewModel: EditJobRoleViewModel = { jobRole };
			res.render("pages/job-role-edit.njk", viewModel);
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const status = error.response?.status;
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

		const parseResult = UpdateJobRoleRequestSchema.safeParse(req.body);
		if (!parseResult.success) {
			const token = req.session.jwtToken;
			if (!token) {
				res.redirect("/login");
				return;
			}
			try {
				const jobRole = await this.jobRoleService.getJobRoleById(jobRoleId, token);
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

		const token = req.session.jwtToken;
		if (!token) {
			res.redirect("/login");
			return;
		}

		try {
			await this.jobRoleService.updateJobRole(jobRoleId, parseResult.data, token);
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
}
