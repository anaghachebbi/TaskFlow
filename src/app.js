import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
//basic configs
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
//cors config
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  }),
);

//import the routes
import healthcheckrouter from "./routes/healthcheck.routes.js";
app.use("/api/v1/healthcheck", healthcheckrouter);
app.get("/", (req, res) => {
  res.send("Welcome to anagy");
});

import authRouter from "./routes/auth.routes.js";
app.use("/api/v1/auth", authRouter);
export default app;
