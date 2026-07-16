import axios from "axios";
import apiClient from "../config/apiClient.js";
import type {
	HireApplicantResponse,
	JobRoleAdminApplicationsResponse,
	RejectApplicantResponse,
} from "../models/jobRole.js";

export function getFileExtension(fileName: string): string {
	const lowerFileName = fileName.toLowerCase();
	const extensionStartIndex = lowerFileName.lastIndexOf(".");

	return extensionStartIndex >= 0
		? lowerFileName.slice(extensionStartIndex)
		: "";
}

export class ApplicationService {
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
