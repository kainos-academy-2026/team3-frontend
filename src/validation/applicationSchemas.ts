import { z } from "zod";

const MAX_CV_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const UploadCvFileSizeSchema = z
	.union([z.number(), z.string()])
	.transform((value) => Number(value))
	.refine((value) => Number.isFinite(value) && value > 0, {
		message: "File size is invalid.",
	})
	.refine((value) => value <= MAX_CV_FILE_SIZE_BYTES, {
		message: "File is too large. Maximum allowed size is 5MB.",
	});

export const UploadCvRequestSchema = z.object({
	fileName: z.string().min(1, "Please upload a CV to continue."),
	contentType: z.string().min(1, "Content type is required."),
	fileSizeBytes: UploadCvFileSizeSchema,
});

export type UploadCvRequestData = z.infer<typeof UploadCvRequestSchema>;
