import express from "express";

const app = express();

app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req: express.Request, res: express.Response) => {
	res.status(200).json({
		status: "UP",
		time: new Date().toISOString(),
	});
});

export default app;
