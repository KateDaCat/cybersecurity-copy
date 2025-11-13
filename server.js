import "dotenv/config";
import express from "express";
import session from "express-session";

import authRoutes from "./routes/auth_routes.js";
import adminRoutes from "./routes/admin_routes.js";
import userRoutes from "./routes/user_routes.js";
import plantObservationRoutes from "./routes/plant_observation_routes.js";

const app = express();

const NODE_ENV = process.env.NODE_ENV || "development";
const DEV = NODE_ENV !== "production";
const PORT = Number(process.env.PORT || 3000);
const SESSION_MAX_AGE_MS = Number(process.env.SESSION_MAX_AGE_MS || 1000 * 60 * 60 * 4); // 4 hours

const rawAllowedOrigins = process.env.ALLOWED_ORIGINS ?? "";
const allowedOrigins = rawAllowedOrigins
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isOriginAllowed(origin) {
  if (!origin) return false;
  if (!allowedOrigins.length) return true; // allow any origin in dev by default
  return allowedOrigins.includes(origin);
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (isOriginAllowed(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  }
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

const secureCookie =
  process.env.COOKIE_SECURE === "true" || (!DEV && process.env.COOKIE_SECURE !== "false");
let sameSite = process.env.COOKIE_SAMESITE || (secureCookie ? "none" : "lax");
if (!secureCookie && sameSite === "none") {
  sameSite = "lax"; // browsers reject SameSite=None without Secure
}

app.set("trust proxy", process.env.TRUST_PROXY === "true");

app.use(
  session({
    secret: process.env.SESSION_SECRET || "smartplant-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: secureCookie,
      sameSite,
      maxAge: SESSION_MAX_AGE_MS,
    },
  })
);

app.use((req, _res, next) => {
  if (!req.user && req.session?.user) {
    req.user = { ...req.session.user };
  }
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, status: "healthy", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", userRoutes);
app.use("/api/observations", plantObservationRoutes);

app.use((req, res) => {
  res.status(404).json({ ok: false, message: "Route not found" });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res
    .status(err.status || 500)
    .json({ ok: false, message: err.message || "Unexpected server error" });
});

app.listen(PORT, () => {
  console.log(`SmartPlant API running on http://localhost:${PORT}`);
});
