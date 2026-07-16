import { Router } from "express";
import { ApplicationController } from "../controllers/applicationController.js";
import { JobRoleController } from "../controllers/jobRoleController.js";
import { requireAdmin, requireAuth } from "../middleware/authMiddleware.js";
import { JobRoleService } from "../services/jobRoleService.js";

const router = Router();
const service = new JobRoleService();
const jobRoleController = new JobRoleController(service);

router.get("/job-roles/report", requireAdmin, (req, res) =>
	jobRoleController.downloadJobRoleReport(req, res),
);
const applicationController = new ApplicationController(service);

router.get("/job-roles", (req, res) =>
	jobRoleController.getAllJobRoles(req, res),
);
router.get("/job-roles/:id/edit", requireAdmin, (req, res) =>
	jobRoleController.getEditJobRolePage(req, res),
);
router.post("/job-roles/:id/edit", requireAdmin, (req, res) =>
	jobRoleController.submitEditJobRole(req, res),
);
router.get("/job-roles/new", requireAuth, requireAdmin, (req, res) =>
	jobRoleController.getCreateJobRolePage(req, res),
);
router.post("/job-roles", requireAuth, requireAdmin, (req, res) =>
	jobRoleController.createJobRole(req, res),
);
router.get("/job-roles/:id", (req, res) =>
	jobRoleController.getJobRoleById(req, res),
);
router.post(
	"/job-roles/:id/applications/:applicationId/hire",
	requireAuth,
	requireAdmin,
	(req, res) => jobRoleController.hireApplicant(req, res),
);
router.post(
	"/job-roles/:id/applications/:applicationId/reject",
	requireAuth,
	requireAdmin,
	(req, res) => jobRoleController.rejectApplicant(req, res),
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
