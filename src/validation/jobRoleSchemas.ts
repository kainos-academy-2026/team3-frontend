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

export const JobRolePaginationQuerySchema = z.object({
	limit: z.coerce
		.number()
		.int("Limit must be a whole number.")
		.min(1, "Limit must be at least 1.")
		.max(30, "Limit must not exceed 30.")
		.default(10),
	page: z.coerce
		.number()
		.int("Page must be a whole number.")
		.min(1, "Page must be at least 1.")
		.default(1),
});

export type JobRolePaginationQueryData = z.infer<
	typeof JobRolePaginationQuerySchema
>;
