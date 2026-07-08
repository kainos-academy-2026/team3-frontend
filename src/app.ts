import path from "node:path";
import express from "express";
import nunjucks from "nunjucks";
import jobRoleRoutes from "./routes/jobRoleRoutes.js";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/", jobRoleRoutes);

app.use(
	"/assets",
	express.static(
		path.join(process.cwd(), "node_modules/govuk-frontend/dist/govuk/assets"),
	),
);

app.use(
	"/govuk",
	express.static(
		path.join(process.cwd(), "node_modules/govuk-frontend/dist/govuk"),
	),
);

nunjucks.configure(
	[
		path.join(process.cwd(), "src/views"),
		path.join(process.cwd(), "node_modules/govuk-frontend/dist"),
	],
	{
		autoescape: true,
		express: app,
		noCache: process.env.NODE_ENV !== "production",
	},
);

app.set("view engine", "njk");

app.get("/health", (_req: express.Request, res: express.Response) => {
	res.status(200).json({
		status: "UP",
		time: new Date().toISOString(),
	});
});

export default app;
