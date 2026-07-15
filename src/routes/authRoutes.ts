import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { AuthService } from "../services/authService.js";

const router = Router();
const service = new AuthService();
const controller = new AuthController(service);

// Public routes
router.get("/login", (req, res) => controller.getSignInPage(req, res));
router.post("/login", (req, res) => controller.signIn(req, res));

router.get("/register", (req, res) => controller.getRegisterPage(req, res));
router.get("/register/success", (req, res) =>
	controller.getRegisterSuccessPage(req, res),
);
router.post("/register", (req, res) => controller.register(req, res));

// Protected route
router.post("/logout", requireAuth, (req, res) => controller.signOut(req, res));

export default router;
