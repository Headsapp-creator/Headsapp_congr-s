import express from "express";
import {
  login,
  logout,
  signup,
  verifyEmail,
  forgotPassword,
  resetPassword,
  checkAuth,
} from "../controllers/authController.js";
import { body } from "express-validator";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Invalid email format"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  ],
  login
);

router.post(
  "/signup",
  [
    body("email").isEmail().withMessage("Invalid email format"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body("fullName").notEmpty().withMessage("Full name is required"),
  ],
  signup
);

router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/check-auth", verifyToken, checkAuth);
router.post("/logout", logout);

export default router;
