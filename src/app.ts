import "dotenv/config";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import session from "express-session";
import nunjucks from "nunjucks";
import authRoutes from "./routes/authRoutes.js";
import jobRoleRoutes from "./routes/jobRoleRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicAssetsPath = path.join(__dirname, "..", "public", "assets");

const app = express();

const allowedOrigins = [
	"http://localhost:3000",
	"https://academy-test-team3-067502745215.s3.us-east-1.amazonaws.com",
];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
	session({
		secret: process.env.SESSION_SECRET || "dev-secret-change-me",
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			sameSite: "strict",
			secure: process.env.NODE_ENV === "production",
		},
	}),
);

app.use(
	cors({
		origin: allowedOrigins,
	}),
);

app.use((req, res, next) => {
	res.locals.isAuthenticated = Boolean(req.session.jwtToken);
	next();
});

app.use("/assets", express.static(publicAssetsPath));

nunjucks.configure([path.join(__dirname, "views")], {
	autoescape: true,
	express: app,
	noCache: process.env.NODE_ENV !== "production",
});

app.set("view engine", "njk");

app.get("/", (_req, res) => {
	res.render("pages/home.njk");
});

app.get("/health", (_req, res) => {
	res.status(200).json({
		status: "UP",
		time: new Date().toISOString(),
	});
});

app.use(authRoutes);
app.use(jobRoleRoutes);

export default app;
