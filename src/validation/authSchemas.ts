import { z } from "zod";

export const RegisterSchema = z
	.object({
		email: z.string().email("Enter a valid email address."),
		password: z
			.string()
			.min(9, "Password must be more than 8 characters.")
			.regex(/[A-Z]/, "Password must include an uppercase letter.")
			.regex(/[a-z]/, "Password must include a lowercase letter.")
			.regex(/[^A-Za-z0-9]/, "Password must include a special character."),
		confirmPassword: z.string().min(1, "Please confirm your password."),
	})
	.refine((data) => data.password === data.confirmPassword, {
		path: ["confirmPassword"],
		message: "Passwords do not match.",
	});

export type RegisterFormData = z.infer<typeof RegisterSchema>;
