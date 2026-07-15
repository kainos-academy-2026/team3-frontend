import { Router } from "express";
import { ApplicationController } from "../controllers/applicationController.js";
import { JobRoleController } from "../controllers/jobRoleController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { JobRoleService } from "../services/jobRoleService.js";

const router = Router();
const service = new JobRoleService();
const jobRoleController = new JobRoleController(service);
const applicationController = new ApplicationController(service);

router.get("/job-roles", (req, res) => jobRoleController.getAllJobRoles(req, res));
router.get("/job-roles/:id", (req, res) =>
	jobRoleController.getJobRoleById(req, res),
);
router.get("/job-roles/:id/apply", requireAuth, (req, res) =>
	applicationController.getJobRoleApplicationPage(req, res),
);
router.post("/job-roles/:id/apply/upload-cv", requireAuth, (req, res) =>
	applicationController.getUploadCvUrl(req, res),
);
router.post("/job-roles/:id/apply", requireAuth, (req, res) =>
	applicationController.submitJobRoleApplication(req, res),
);

export default router;
