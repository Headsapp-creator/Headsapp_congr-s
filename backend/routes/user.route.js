import express from "express";
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, authorizeRoles(["ADMIN"]), getUsers);
router.get("/:id", verifyToken, getUserById);
router.put("/:id", verifyToken, authorizeRoles(["ADMIN"]), updateUser);
router.delete("/:id", verifyToken, authorizeRoles(["ADMIN"]), deleteUser);

export default router;
