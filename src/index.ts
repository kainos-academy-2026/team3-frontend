import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
 
import healthRouter from "./routes/healthRouter.js";
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 
dotenv.config();
 
const app = express();
const PORT = Number(process.env.PORT) || 3000;
 
app.use(express.urlencoded({ extended: true }));
 
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
 
 
app.use(healthRouter);