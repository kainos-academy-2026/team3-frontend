import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

if (!process.env.BACKEND_API) {
	throw new Error("BACKEND_API environment variable is not defined");
}

app.listen(PORT, () => {
	console.log(`Frontend server running at http://localhost:${PORT}`);
});
