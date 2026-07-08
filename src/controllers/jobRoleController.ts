import type { Request, Response } from "express";
import type { JobRoleService } from "../services/jobRoleService.js";

export class JobRoleController {
	constructor(private jobRoleService: JobRoleService) {}

	async getAllJobRoles(_req: Request, res: Response): Promise<void> {
		try {
			const jobRoles = await this.jobRoleService.getAllJobRoles();
			res.render("pages/job-role-list.njk", { jobRoles });
		} catch (error) {
			console.error("Failed to get job roles:", error);
			res.status(500).send("Internal Server Error");
		}
	}
}
