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

export interface JobRoleInformationViewModel {
	jobRole: JobRoleInformation;
	canApply: boolean;
	applicationSubmitted: boolean;
}
