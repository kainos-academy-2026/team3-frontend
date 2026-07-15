import axios from "axios";
import apiClient from "../config/apiClient.js";
import type {
	JobRole,
	JobRoleInformation,
	UploadCvResponse,
} from "../models/jobRole.js";

export class JobRoleService {
	private logRequestError(
		action: string,
		error: unknown,
		context: Record<string, unknown>,
	): void {
		if (axios.isAxiosError(error)) {
			console.error(action, {
				...context,
				status: error.response?.status,
				statusText: error.response?.statusText,
				method: error.config?.method?.toUpperCase(),
				url: error.config?.url,
				code: error.code,
				message: error.message,
			});
			return;
		}

		if (error instanceof Error) {
			console.error(action, {
				...context,
				message: error.message,
			});
			return;
		}

		console.error(action, {
			...context,
			error,
		});
	}

	async getAllJobRoles(token: string): Promise<JobRole[]> {
		try {
			const response = await apiClient.get<JobRole[]>("/job-roles", {
				headers: { Authorization: `Bearer ${token}` },
			});
			return response.data;
		} catch (error) {
			this.logRequestError("Failed to fetch job roles", error, {
				endpoint: "/job-roles",
			});
			throw error;
		}
	}

	async getJobRoleById(id: number, token: string): Promise<JobRoleInformation> {
		try {
			const response = await apiClient.get<JobRoleInformation>(
				`/job-roles/${id}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			return response.data;
		} catch (error) {
			this.logRequestError("Failed to fetch job role by id", error, {
				endpoint: `/job-roles/${id}`,
				jobRoleId: id,
			});
			throw error;
		}
	}

	async getJobRoleReport(token: string): Promise<Buffer> {
		try {
			const response = await apiClient.get<ArrayBuffer>("/job-roles/report", {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "text/csv",
				},
				responseType: "arraybuffer",
			});

			return Buffer.from(response.data);
		} catch (error) {
			this.logRequestError("Failed to fetch job role report", error, {
				endpoint: "/job-roles/report",
	async getUploadCvUrl(
		jobRoleId: number,
		userId: number,
		fileName: string,
		contentType: string,
		token: string,
	): Promise<UploadCvResponse> {
		try {
			const response = await apiClient.post<{ uploadUrl: string; key: string }>(
				`/job-roles/${jobRoleId}/apply`,
				{ userId, fileName, contentType },
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);

			return {
				uploadUrl: response.data.uploadUrl,
				objectKey: response.data.key,
			};
		} catch (error) {
			this.logRequestError("Failed to prepare CV upload", error, {
				endpoint: `/job-roles/${jobRoleId}/apply`,
				jobRoleId,
				userId,
			});
			throw error;
		}
	}
}
