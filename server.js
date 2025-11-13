import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";

import adminRoutes from "./routes/admin_routes.js";
import authRoutes from "./routes/auth_routes.js";
import plantObservationRoutes from "./routes/plant_observation_routes.js";
import userRoutes from "./routes/user_routes.js";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const sessionSecret = process.env.SESSION_SECRET || "change-me";
const sessionMaxAge =
  Number(process.env.SESSION_MAX_AGE_MS || 1000 * 60 * 60 * 4);

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionMaxAge,
    },
  })
);

app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/plant-observations", plantObservationRoutes);
app.use("/api/public", userRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
