import { Router } from "express";
import { JobRoleController } from "../controllers/jobRoleController.js";
import { JobRoleService } from "../services/jobRoleService.js";

const router = Router();
const service = new JobRoleService();
const controller = new JobRoleController(service);

router.get("/job-roles", (req, res) => controller.getAllJobRoles(req, res));

export default router;
