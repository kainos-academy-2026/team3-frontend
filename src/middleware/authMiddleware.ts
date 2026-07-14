import type { NextFunction, Request, Response } from "express";

export function requireAuth(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	if (!req.session.jwtToken) {
		res.redirect("/login");
		return;
	}
	next();
}

export function requireAdmin(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	if (!req.session.jwtToken) {
		res.redirect("/login");
		return;
	}

	const role = req.session.userRole;
	const isAdmin = role === "ADMIN";

	if (!isAdmin) {
		res.status(403).render("pages/home.njk", {
			error: "You do not have permission to access this page.",
		});
		return;
	}

	next();
}
