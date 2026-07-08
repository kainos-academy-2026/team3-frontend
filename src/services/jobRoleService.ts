import axios from "axios";
import dotenv from "dotenv";
import type { JobRole } from "../models/jobRole";

dotenv.config();

export class JobRoleService {
	private apiURL = process.env.BACKEND_API;

	async getAllJobRoles(): Promise<JobRole[]> {
		if (!this.apiURL) {
			throw new Error("BACKEND_API environment variable is not defined");
		}
		try {
			const response = await axios.get<JobRole[]>(this.apiURL);
			return response.data;
		} catch (error) {
			console.error("Failed to fetch job roles:", error);
			throw error;
		}
	}
}
