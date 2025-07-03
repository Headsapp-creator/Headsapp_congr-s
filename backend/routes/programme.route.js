import express from "express";
import { body } from "express-validator";
import {
  createProgramme,
  getProgrammes,
  getProgrammeById,
  updateProgramme,
  deleteProgramme,
} from "../controllers/programmeController.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  verifyToken,
  [
    body("nom").notEmpty().withMessage("Programme name is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("eventId").notEmpty().withMessage("Event ID is required"),
  ],
  createProgramme
);

router.get("/", getProgrammes);

router.get("/:id", getProgrammeById);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles(["ADMIN"]),
  [
    body("nom").optional().notEmpty().withMessage("Programme name is required"),
    body("description").optional().notEmpty().withMessage("Description is required"),
    body("eventId").optional().notEmpty().withMessage("Event ID is required"),
    body("locationId").optional().notEmpty().withMessage("Location ID is required")
  ],
  updateProgramme
);

router.delete("/:id", verifyToken, authorizeRoles(["ADMIN"]), deleteProgramme);


export default router;
