import { Router } from "express";
import { JobRoleController } from "../controllers/jobRoleController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { JobRoleService } from "../services/jobRoleService.js";

const router = Router();
const service = new JobRoleService();
const controller = new JobRoleController(service);

router.get("/job-roles", (req, res) => controller.getAllJobRoles(req, res));
router.get("/job-roles/:id", (req, res) => controller.getJobRoleById(req, res));
router.get("/job-roles/:id/apply", requireAuth, (req, res) =>
	controller.getJobRoleApplicationPage(req, res),
);
router.post("/job-roles/:id/apply/upload-cv", requireAuth, (req, res) =>
	controller.getUploadCvUrl(req, res),
);
router.post("/job-roles/:id/apply", requireAuth, (req, res) =>
	controller.submitJobRoleApplication(req, res),
);

export default router;
