import { Router } from "express";
import { JobRoleController } from "../controllers/jobRoleController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { JobRoleService } from "../services/jobRoleService.js";

const router = Router();
const service = new JobRoleService();
const controller = new JobRoleController(service);

router.get("/job-roles", requireAuth, (req, res) =>
	controller.getAllJobRoles(req, res),
);
router.get("/job-roles/:id", requireAuth, (req, res) =>
	controller.getJobRoleById(req, res),
);

export default router;
