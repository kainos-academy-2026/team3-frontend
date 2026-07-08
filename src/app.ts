import path from "path";
import express from "express";
import nunjucks from "nunjucks";
import { dirname } from "path";
import { fileURLToPath } from "url";
import jobRoleRoutes from "./routes/jobRoleRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(
	"/assets",
	express.static(
		path.join(__dirname, "node_modules/govuk-frontend/dist/govuk/assets"),
	),
);

nunjucks.configure(
	[
		path.join(__dirname, "views"),
		path.join(__dirname, "node_modules/govuk-frontend/dist"),
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

app.use(express.json());
app.use("/", jobRoleRoutes);

export default app;
