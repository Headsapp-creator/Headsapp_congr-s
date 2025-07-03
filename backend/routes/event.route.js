import express from "express";
import { body, param } from "express-validator";
import multer from "multer";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  subscribeToEvent,
  getUserBadges,
  getEventPrograms
} from "../controllers/eventController.js";

import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer(); // For handling multipart/form-data

router.post(
  "/",
  verifyToken,
  authorizeRoles(["ADMIN"]),
  [
    body("nom").notEmpty().withMessage("Event name is required"),
    body("dateDebut").isISO8601().withMessage("Invalid start date"),
    body("dateFin").isISO8601().withMessage("Invalid end date"),
    body("description").notEmpty().withMessage("Description is required"),
    body("image").notEmpty().withMessage("Image URL is required"),
    body("workshops")
      .isArray({ min: 1 })
      .withMessage("At least one workshop is required")
      .custom((workshops) => {
        // Validate each workshop
        workshops.forEach((workshop) => {
          if (!workshop.nom || typeof workshop.nom !== "string") {
            throw new Error("Each workshop must have a valid name");
          }
          if (!workshop.description || typeof workshop.description !== "string") {
            throw new Error("Each workshop must have a valid description");
          }
          if (
            workshop.capacity != null &&
            (typeof workshop.capacity !== "number" || workshop.capacity < 0)
          ) {
            throw new Error("Each workshop must have a valid capacity (non-negative number)");
          }
        });
        return true;
      }),
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

// Updated: Accept takeover document file upload (multipart/form-data)
router.post(
  "/:eventId/subscribe",
  verifyToken,
  upload.single("takeoverDocument"),
  [
    param("eventId").notEmpty().withMessage("Event ID is required"),
    // Validation for programmeIds and formData will be handled in controller for multipart/form-data
  ],
  subscribeToEvent
);

router.get(
  "/badges/:userId",
  verifyToken,
  getUserBadges
);

router.get('/:eventId/programs', getEventPrograms);

export default router;
