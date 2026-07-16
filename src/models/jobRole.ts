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

export interface JobRoleInformationViewModel {
	jobRole: JobRoleInformation;
	canApply: boolean;
	applicationSubmitted: boolean;
}
