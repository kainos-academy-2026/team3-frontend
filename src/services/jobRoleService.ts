import axios from "axios";
import apiClient from "../config/apiClient.js";
import type {
	CreateJobRolePayload,
	HireApplicantResponse,
	JobRole,
	JobRoleAdminApplicationsResponse,
	JobRoleInformation,
	JobRoleMetadataResponse,
	RejectApplicantResponse,
	UploadCvResponse,
} from "../models/jobRole.js";
import type { UpdateJobRoleRequestData } from "../validation/jobRoleSchemas.js";

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
			});
			throw error;
		}
	}

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

	async updateJobRole(
		id: number,
		data: UpdateJobRoleRequestData,
		token: string,
	): Promise<JobRoleInformation> {
		try {
			const response = await apiClient.patch<JobRoleInformation>(
				`/job-roles/${id}`,
				data,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			return response.data;
		} catch (error) {
			this.logRequestError("Failed to update job role", error, {
				endpoint: `/job-roles/${id}`,
				jobRoleId: id,
			});
			throw error;
		}
	}

	async getJobRoleMetadata(token: string): Promise<JobRoleMetadataResponse> {
		try {
			const response = await apiClient.get<JobRoleMetadataResponse>(
				"/job-roles/metadata",
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			return response.data;
		} catch (error) {
			this.logRequestError("Failed to fetch job role metadata", error, {
				endpoint: "/job-roles/metadata",
			});
			throw error;
		}
	}

	async createJobRole(
		payload: CreateJobRolePayload,
		token: string,
	): Promise<JobRoleInformation | undefined> {
		try {
			const response = await apiClient.post<JobRoleInformation>(
				"/job-roles",
				payload,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			return response.data;
		} catch (error) {
			this.logRequestError("Failed to create job role", error, {
				endpoint: "/job-roles",
				payload,
			});
			throw error;
		}
	}

	async getJobRoleApplicationsForAdmin(
		jobRoleId: number,
		token: string,
	): Promise<JobRoleAdminApplicationsResponse> {
		try {
			const response = await apiClient.get<JobRoleAdminApplicationsResponse>(
				`/job-roles/${jobRoleId}/applications`,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			return response.data;
		} catch (error) {
			this.logRequestError(
				"Failed to fetch job role applications for admin",
				error,
				{
					endpoint: `/job-roles/${jobRoleId}/applications`,
					jobRoleId,
				},
			);
			throw error;
		}
	}

	async hireApplicant(
		jobRoleId: number,
		applicationId: number,
		token: string,
	): Promise<HireApplicantResponse> {
		try {
			const response = await apiClient.patch<HireApplicantResponse>(
				`/job-roles/${jobRoleId}/applications/${applicationId}/hire`,
				undefined,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			return response.data;
		} catch (error) {
			this.logRequestError("Failed to hire applicant", error, {
				endpoint: `/job-roles/${jobRoleId}/applications/${applicationId}/hire`,
				jobRoleId,
				applicationId,
			});
			throw error;
		}
	}

	async rejectApplicant(
		jobRoleId: number,
		applicationId: number,
		token: string,
	): Promise<RejectApplicantResponse> {
		try {
			const response = await apiClient.patch<RejectApplicantResponse>(
				`/job-roles/${jobRoleId}/applications/${applicationId}/reject`,
				undefined,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			return response.data;
		} catch (error) {
			this.logRequestError("Failed to reject applicant", error, {
				endpoint: `/job-roles/${jobRoleId}/applications/${applicationId}/reject`,
				jobRoleId,
				applicationId,
			});
			throw error;
		}
	}
}
