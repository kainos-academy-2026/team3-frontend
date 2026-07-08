import axios from "axios";
import type { JobRole } from "../models/jobRole.js";

export class JobRoleService {
	async getAllJobRoles(): Promise<JobRole[]> {
		const apiURL = `${process.env.BACKEND_API}/job-roles`;

		if (!apiURL) {
			throw new Error("BACKEND_API environment variable is not defined");
		}
		try {
			const response = await axios.get<JobRole[]>(apiURL);
			return response.data;
		} catch (error) {
			console.error("Failed to fetch job roles:", error);
			throw error;
		}
	}
}
