import type {
	CreateJobRolePayload,
	JobRoleMetadataResponse,
} from "./jobRole.js";

export type CreateJobRoleFieldErrors = Partial<
	Record<keyof CreateJobRolePayload, string>
>;

export type CreateJobRoleFormValues = Partial<
	Record<keyof CreateJobRolePayload, string | number>
>;

export interface CreateJobRolePageModel {
	capabilities: JobRoleMetadataResponse["capabilities"];
	bands: JobRoleMetadataResponse["bands"];
	formValues: CreateJobRoleFormValues;
	fieldErrors: CreateJobRoleFieldErrors;
	error: string | null;
}

export const defaultCreateJobRoleFormValues: CreateJobRoleFormValues = {
	roleName: "",
	location: "",
	capabilityId: "",
	bandId: "",
	closingDate: "",
	description: "",
	responsibilities: "",
	sharepointUrl: "",
	numberOfOpenPositions: "",
};
