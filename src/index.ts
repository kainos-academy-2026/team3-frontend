import dotenv from "dotenv";
import express from "express";
 
dotenv.config();
 
const app = express();
const PORT = Number(process.env.PORT) || 3000;
 
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: "UP",
    time: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

export default app;