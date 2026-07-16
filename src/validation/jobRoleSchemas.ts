import { z } from "zod";

export const CreateJobRoleSchema = z.object({
	roleName: z.string().trim().min(1, "Role name is required."),
	location: z.string().trim().min(1, "Location is required."),
	capabilityId: z.coerce.number().int().positive("Capability is required."),
	bandId: z.coerce.number().int().positive("Band is required."),
	closingDate: z
		.string()
		.trim()
		.min(1, "Closing date is required.")
		.refine(
			(value) => !Number.isNaN(Date.parse(value)),
			"Closing date must be valid.",
		),
	description: z.string().trim().min(1, "Description is required."),
	responsibilities: z.string().trim().min(1, "Responsibilities are required."),
	sharepointUrl: z.string().trim().url("SharePoint URL must be a valid URL."),
	numberOfOpenPositions: z.coerce
		.number()
		.int("Number of open positions must be an integer.")
		.positive("Number of open positions must be greater than 0."),
});

export type CreateJobRoleData = z.infer<typeof CreateJobRoleSchema>;
