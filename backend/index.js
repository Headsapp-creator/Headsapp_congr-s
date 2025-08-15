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
import { Server } from 'socket.io';
import http from 'http';

const app = express();
app.use(helmet());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

app.use(
  cors({ 
  origin: ["http://localhost:3000", "http://localhost:5173"],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true 
}));
app.set('io', io);
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/events", eventRoutes)
app.use("/programmes", programmeRoutes);
app.use("/payments",paymentRoutes);
app.use("/communications", communicationRoutes);

io.on('connection', (socket) => {
  socket.on("joinReviewerRoom", (reviewerId) => {
    if (reviewerId) {
      socket.join(`reviewer_${reviewerId}`);
    }
  });
  socket.on("joinUserRoom", (userId) => {
    if (userId) socket.join(`user_${userId}`);
  });
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("Server running on port ${PORT}"));
