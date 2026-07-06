import { Router } from "express";
import { JobApplicationController } from "../controllers/jobApplicationController";
import { JobApplicationService } from "../services/jobApplicationService";

const router = Router();
const service = new JobApplicationService();
const controller = new JobApplicationController(service);

// Define your job application routes here
router.get("/", (req, res) => controller.getAll(req, res));
router.get("/health", (req, res) => controller.getHealth(req, res));

export default router;