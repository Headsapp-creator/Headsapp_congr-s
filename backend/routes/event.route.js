import express from "express";
import { body, param } from "express-validator";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  subscribeToEvent,
  getUserBadges
} from "../controllers/eventController.js";

import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();


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

router.post(
  "/:eventId/subscribe",
  verifyToken,
  [
    param("eventId").notEmpty().withMessage("Event ID is required"),
    body("programmeIds").isArray().withMessage("programmeIds must be an array")
  ],
  subscribeToEvent
);

router.get(
  "/badges/:userId",
  verifyToken,
  getUserBadges
);

export default router;
