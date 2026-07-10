import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
import { AuthService } from "../services/authService.js";

const router = Router();
const service = new AuthService();
const controller = new AuthController(service);

router.get("/login", (req, res) => controller.getSignInPage(req, res));
router.post("/login", (req, res) => controller.signIn(req, res));
router.post("/logout", (req, res) => controller.signOut(req, res));

export default router;
