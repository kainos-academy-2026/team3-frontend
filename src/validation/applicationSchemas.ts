import { z } from "zod";

export const UploadCvRequestSchema = z.object({
	fileName: z.string().min(1, "File name is required."),
	contentType: z.string().min(1, "Content type is required."),
});

export type UploadCvRequestData = z.infer<typeof UploadCvRequestSchema>;
