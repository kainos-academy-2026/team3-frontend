import "dotenv/config";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import nunjucks from "nunjucks";
import jobRoleRoutes from "./routes/jobRoleRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicAssetsPath = path.join(__dirname, "..", "public", "assets");
const app = express();

app.use(express.urlencoded({ extended: true }));

app.use("/assets", express.static(publicAssetsPath));

nunjucks.configure([path.join(__dirname, "views")], {
	autoescape: true,
	express: app,
	noCache: process.env.NODE_ENV !== "production",
});

app.set("view engine", "njk");

app.get("/", (_req: express.Request, res: express.Response) => {
	res.render("pages/home.njk");
});

app.get("/health", (_req: express.Request, res: express.Response) => {
	res.status(200).json({
		status: "UP",
		time: new Date().toISOString(),
	});
});

app.use(express.json());
app.use(jobRoleRoutes);

export default app;
