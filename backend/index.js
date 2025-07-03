import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.route.js"
import userRoutes from "./routes/user.route.js";
import eventRoutes from "./routes/event.route.js"
import programmeRoutes from "./routes/programme.route.js"
import paymentRoutes from "./routes/payment.route.js";
import communicationRoutes from "./routes/communication.route.js";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
const app = express();
app.use(helmet());

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'], methods: ['GET', 'POST', 'PUT', 'DELETE'],credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Rate limiter to prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per IP
  message: "Too many requests from this IP, please try again later",
});
app.use(limiter);


app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/events", eventRoutes)
app.use("/programmes", programmeRoutes);
app.use("/payments",paymentRoutes);
app.use("/communications", communicationRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
