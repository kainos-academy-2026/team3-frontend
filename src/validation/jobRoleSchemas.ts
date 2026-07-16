import { z } from "zod";
import { JobRoleStatus } from "../models/jobRole.js";

export const UpdateJobRoleRequestSchema = z
	.object({
		roleName: z.string().trim().min(1, "Role name is required.").optional(),
		location: z.string().trim().min(1, "Location is required.").optional(),
		capabilityId: z
			.union([z.number(), z.string()])
			.transform((v) => Number(v))
			.refine((v) => Number.isInteger(v) && v > 0, {
				message: "Capability must be a positive integer.",
			})
			.optional(),
		bandId: z
			.union([z.number(), z.string()])
			.transform((v) => Number(v))
			.refine((v) => Number.isInteger(v) && v > 0, {
				message: "Band must be a positive integer.",
			})
			.optional(),
		closingDate: z
			.string()
			.refine((v) => !Number.isNaN(Date.parse(v)), {
				message: "Closing date must be a valid date.",
			})
			.optional(),
		status: z
			.nativeEnum(JobRoleStatus, {
				message: "Status must be Open or Closed.",
			})
			.optional(),
		description: z
			.string()
			.trim()
			.min(1, "Description is required.")
			.optional(),
		responsibilities: z
			.string()
			.trim()
			.min(1, "Responsibilities are required.")
			.optional(),
		sharepointUrl: z
			.string()
			.url("SharePoint URL must be a valid URL.")
			.optional(),
		numberOfOpenPositions: z
			.union([z.number(), z.string()])
			.transform((v) => Number(v))
			.refine((v) => Number.isInteger(v) && v > 0, {
				message: "Number of open positions must be a positive integer.",
			})
			.optional(),
	})
	.refine(
		(data) =>
			Object.keys(data).some((k) => data[k as keyof typeof data] !== undefined),
		{ message: "At least one field must be provided." },
	);

export type UpdateJobRoleRequestData = z.infer<
	typeof UpdateJobRoleRequestSchema
>;
