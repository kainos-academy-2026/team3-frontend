import apiClient from "../config/apiClient.js";
import type { JobRole, JobRoleInformation } from "../models/jobRole.js";

export class JobRoleService {
	async getAllJobRoles(): Promise<JobRole[]> {
		try {
			const response = await apiClient.get<JobRole[]>("/job-roles");
			return response.data;
		} catch (error) {
			console.error("Failed to fetch job roles:", error);
			throw error;
		}
	}

	async getJobRoleById(id: number): Promise<JobRoleInformation> {
		try {
			const response = await apiClient.get<JobRoleInformation>(
				`/job-roles/${id}`,
			);
			return response.data;
		} catch (error) {
			console.error(`Failed to fetch job role with id ${id}:`, error);
			throw error;
		}
	}
}
