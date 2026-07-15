import { Router } from "express";
import { JobRoleController } from "../controllers/jobRoleController.js";
import { requireAdmin, requireAuth } from "../middleware/authMiddleware.js";
import { JobRoleService } from "../services/jobRoleService.js";

const router = Router();
const service = new JobRoleService();
const jobRoleController = new JobRoleController(service);

router.get("/job-roles", requireAuth, (req, res) =>
	jobRoleController.getAllJobRoles(req, res),
);
router.get("/job-roles/report", requireAdmin, (req, res) =>
	jobRoleController.downloadJobRoleReport(req, res),
);
router.get("/job-roles/:id", requireAuth, (req, res) =>
	jobRoleController.getJobRoleById(req, res),
);

export default router;
