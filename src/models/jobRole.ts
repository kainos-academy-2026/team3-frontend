export interface JobRole {
	id: number;
	roleName: string;
	location: string;
	capability: {
		capabilityId: number;
		capabilityName: string;
	};
	band: {
		bandId: number;
		bandName: string;
	};
	closingDate: string;
	status: JobRoleStatus;
}

export interface JobRoleInformation {
	id: number;
	roleName: string;
	location: string;
	capability: {
		capabilityId: number;
		capabilityName: string;
	};
	band: {
		bandId: number;
		bandName: string;
	};
	closingDate: string;
	status: JobRoleStatus;
	description: string;
	responsibilities: string;
	sharepointUrl: string;
	numberOfOpenPositions: number;
}

export enum JobRoleStatus {
	Open = "Open",
	Closed = "Closed",
}

export interface UploadCvResponse {
	uploadUrl: string;
	objectKey: string;
}

export interface CapabilityOption {
	capabilityId: number;
	capabilityName: string;
}

export interface BandOption {
	bandId: number;
	bandName: string;
}

export interface JobRoleMetadataResponse {
	capabilities: CapabilityOption[];
	bands: BandOption[];
}

export interface CreateJobRolePayload {
	roleName: string;
	location: string;
	capabilityId: number;
	bandId: number;
	closingDate: string;
	description: string;
	responsibilities: string;
	sharepointUrl: string;
	numberOfOpenPositions: number;
}

export enum JobRoleApplicationStatus {
	InProgress = "In Progress",
	Hired = "Hired",
	Rejected = "Rejected",
}

export interface JobRoleApplicantSummary {
	applicationId: number;
	userId: number;
	username: string;
	status: JobRoleApplicationStatus;
	appliedAt: string;
	cvDownloadUrl: string;
}

export interface JobRoleAdminApplicationsResponse {
	jobRoleId: number;
	roleName: string;
	numberOfOpenPositions: number;
	applicants: JobRoleApplicantSummary[];
}

export interface HireApplicantResponse {
	applicationId: number;
	status: JobRoleApplicationStatus;
	numberOfOpenPositions: number;
}

export interface RejectApplicantResponse {
	applicationId: number;
	status: JobRoleApplicationStatus;
}

export enum AdminApplicationActionStatus {
	HireSuccess = "hire-success",
	RejectSuccess = "reject-success",
	Error = "error",
}

export interface AdminApplicationsPageViewModel {
	jobRoleId: number;
	roleName: string;
	numberOfOpenPositions: number;
	applicants: JobRoleApplicantSummary[];
	adminApplicationsError: string | null;
	applicationAction: AdminApplicationActionStatus | null;
}

export interface JobRoleInformationViewModel {
	jobRole: JobRoleInformation;
	canApply: boolean;
	applicationSubmitted: boolean;
	isAdmin?: boolean;
	canEdit?: boolean;
	editSuccess?: boolean;
}

export interface EditJobRoleViewModel {
	jobRole: JobRoleInformation;
	error?: string;
	formValues?: Record<string, string>;
}
