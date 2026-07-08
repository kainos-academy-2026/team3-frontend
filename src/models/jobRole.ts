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

export enum JobRoleStatus {
	Open = "Open",
	Closed = "Closed",
}
