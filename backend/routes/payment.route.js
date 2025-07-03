import express from "express";

import { createPaymeePayment } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/paymee", createPaymeePayment);

export default router;