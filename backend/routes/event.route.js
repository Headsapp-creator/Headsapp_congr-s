import express from "express";
import { body } from "express-validator";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
} from "../controllers/eventController.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create Event (Only Admin)
router.post(
  "/",
  verifyToken,
  authorizeRoles(["ADMIN"]),
  [
    body("nom").notEmpty().withMessage("Event name is required"),
    body("dateDebut").isISO8601().withMessage("Invalid start date"),
    body("dateFin").isISO8601().withMessage("Invalid end date"),
    body("description").notEmpty().withMessage("Description is required")
  ],
  createEvent
);

router.get("/", getEvents);

router.get("/:id", getEventById);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles(["ADMIN"]),
  [
    body("status").optional().isString().withMessage("Invalid status"),
    body("dateDebut").optional().isISO8601().withMessage("Invalid start date"),
    body("dateFin").optional().isISO8601().withMessage("Invalid end date"),
  ],
  updateEvent
);

router.delete("/:id", verifyToken, authorizeRoles(["ADMIN"]), deleteEvent);

export default router;
