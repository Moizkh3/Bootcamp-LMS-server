import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import dns from "node:dns";
import authRouter from "./routes/authRouter.js";
// import submissionRoutes from "./routes/submissionRoutes.js";
import userRouter from "./routes/userRouter.js";
import studentRouter from "./routes/studentRouter.js";
import cookieParser from "cookie-parser";
dns.setServers(["1.1.1.1", "8.8.8.8"]);
dotenv.config();
const PORT = process.env.PORT || 5000;
import cors from "cors";
import checkAuth from "./middlewares/checkAuth.js";
import checkAdmin from "./middlewares/checkAdmin.js";
import checkStudent from "./middlewares/checkStudent.js";
import adminDashboardRouter from "./routes/adminDashboardRouter.js";
import domainRouter from "./routes/domainRoute.js";
import studentDashboardRouter from "./routes/studentDashboardRouter.js";
import bootcampRouter from "./routes/bootcampRouter.js";
import teacherRouter from "./routes/teacherRoutes.js";
import progressRouter from "./routes/progressRouter.js";
const app = express();

const corsOptions = {
  origin: ["http://localhost:5173", "https://bootcamp-tracker-2-client.vercel.app"], // Add your frontend production URL here later
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Routes
// app.use("/submission", checkAuth ,submissionRoutes);
app.use("/user", checkAuth, userRouter);
app.use("/student", studentRouter);
app.use("/progress", progressRouter);

// testing api
app.get("/", (req, res) => {
  res.json({ message: "Server Working!" });
});

app.use('/user', checkAuth, userRouter);
app.use('/domain', checkAuth, checkAdmin, domainRouter);
app.use('/admin-dashboard', checkAuth, checkAdmin, adminDashboardRouter);
app.use('/student-dashboard', checkAuth, checkStudent, studentDashboardRouter);
app.use('/auth', authRouter);
app.use("/teacher", teacherRouter)


// currently working auth APIs
app.use('/bootcamp', bootcampRouter)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);

  // Ensure CORS headers even on error
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});

// Database connection
connectDB()
  .then(() => {
    // Only start the server if not running on Vercel
    if (process.env.NODE_ENV !== 'production') {
      app.listen(PORT, () => {
        console.log(`server is running on http://localhost:${PORT}`);
      });
    }
  })
  .catch((err) => {
    console.error("Failed to connect to DB:", err);
  });

export default app;
