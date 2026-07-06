import { Router } from "express";
import { HealthController } from "../controllers/healthController.js";
import { HealthService } from "../services/healthService.js";

const router = Router();
const service = new HealthService();
const controller = new HealthController(service);

// Define your health routes here
router.get("/", (req, res) => controller.getAll(req, res));
router.get("/health", (req, res) => controller.getHealth(req, res));

export default router;