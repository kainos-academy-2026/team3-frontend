import axios from "axios";
import type { Request, Response } from "express";
import type { AuthService } from "../services/authService.js";
import { RegisterSchema } from "../validation/authSchemas.js";

type RegisterPageModel = {
	error: string | null;
	fieldErrors: Partial<
		Record<"email" | "password" | "confirmPassword", string>
	>;
	formValues: {
		email: string;
	};
};

export class AuthController {
	constructor(private authService: AuthService) {}

	getSignInPage(_req: Request, res: Response): void {
		res.render("pages/signin.njk", { error: null });
	}

	getRegisterSuccessPage(_req: Request, res: Response): void {
		res.render("pages/register-success.njk");
	}

	getRegisterPage(_req: Request, res: Response): void {
		const model: RegisterPageModel = {
			error: null,
			fieldErrors: {},
			formValues: { email: "" },
		};
		res.render("pages/register.njk", model);
	}

	async signIn(req: Request, res: Response): Promise<void> {
		const { email, password } = req.body as {
			email?: string;
			password?: string;
		};

		if (!email || !password) {
			res.status(400).render("pages/signin.njk", {
				error: "Email and password are required.",
			});
			return;
		}

		try {
			const { token } = await this.authService.login(email, password);
			req.session.jwtToken = token;
			res.redirect("/job-roles");
		} catch (error) {
			if (axios.isAxiosError(error) && error.response?.status === 401) {
				res.status(401).render("pages/signin.njk", {
					error: "Invalid email or password.",
				});
				return;
			}

			res.status(500).render("pages/signin.njk", {
				error: "Unable to sign in right now.",
			});
		}
	}

	async register(req: Request, res: Response): Promise<void> {
		const parseResult = RegisterSchema.safeParse(req.body);

		if (!parseResult.success) {
			const fieldErrors: RegisterPageModel["fieldErrors"] = {};

			for (const issue of parseResult.error.issues) {
				const field = issue.path[0];
				if (
					field === "email" ||
					field === "password" ||
					field === "confirmPassword"
				) {
					if (!fieldErrors[field]) {
						fieldErrors[field] = issue.message;
					}
				}
			}

			res.status(400).render("pages/register.njk", {
				error: "Please fix the highlighted fields.",
				fieldErrors,
				formValues: {
					email: String((req.body as { email?: unknown }).email ?? ""),
				},
			});
			return;
		}

		const { email, password } = parseResult.data;

		try {
			await this.authService.register(email, password);
			res.redirect("/register/success");
		} catch (error) {
			if (axios.isAxiosError(error)) {
				if (error.response?.status === 409) {
					res.status(409).render("pages/register.njk", {
						error: "That email is already registered.",
						fieldErrors: {},
						formValues: { email },
					});
					return;
				}

				if (error.response?.status === 400) {
					res.status(400).render("pages/register.njk", {
						error: "Please check your details and try again.",
						fieldErrors: {},
						formValues: { email },
					});
					return;
				}
			}

			res.status(500).render("pages/register.njk", {
				error: "Unable to register right now.",
				fieldErrors: {},
				formValues: { email },
			});
		}
	}

	signOut(req: Request, res: Response): void {
		req.session.destroy((err) => {
			if (err) {
				res.status(500).render("pages/signin.njk", {
					error: "Unable to log out right now.",
				});
				return;
			}
			res.clearCookie("connect.sid");
			res.redirect("/");
		});
	}
}
