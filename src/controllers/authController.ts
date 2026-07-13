import axios from "axios";
import type { Request, Response } from "express";
import type { AuthService } from "../services/authService.js";

export class AuthController {
	constructor(private authService: AuthService) {}

	getSignInPage(_req: Request, res: Response): void {
		res.render("pages/signin.njk", { error: null });
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

	signOut(req: Request, res: Response): void {
		req.session.destroy((err) => {
			if (err) {
				res.status(500).send("Unable to log out");
				return;
			}
			res.clearCookie("connect.sid");
			res.redirect("/");
		});
	}
}
