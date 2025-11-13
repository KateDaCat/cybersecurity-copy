import "dotenv/config";
import express from "express";
import session from "express-session";

import authRoutes from "./routes/auth_routes.js";
import speciesRoutes from "./routes/species_routes.js";
import observationsRoutes from "./routes/observations_routes.js";
import sensorsRoutes from "./routes/sensors_routes.js";
import aiRoutes from "./routes/ai_routes.js";
import adminRoutes from "./routes/admin_routes.js";
import userRoutes from "./routes/user_routes.js";
import plantObservationSubmitRoutes from "./routes/plant_observation_routes.js";
import { attachRole, ROLES } from "./modules/rbac_module.js";

const app = express();

app.use(express.json());

const SESSION_MAX_AGE_MS = Number(process.env.SESSION_MAX_AGE_MS || 1000 * 60 * 60 * 8); // 8h

app.use(
  session({
    name: process.env.SESSION_NAME || "smartplant.sid",
    secret: process.env.SESSION_SECRET || "smartplant-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE_MS,
    },
  })
);

// Attach session user (if any) to req.user so RBAC can read it.
const ROLE_ID_TO_NAME = {
  1: ROLES.ADMIN,
  2: ROLES.RESEARCHER,
  3: ROLES.PUBLIC,
};

app.use((req, _res, next) => {
  if (req.session?.user) {
    const roleId = req.session.user.role_id;
    const roleName = roleId ? ROLE_ID_TO_NAME[Number(roleId)] : null;

    if (roleName && !req.session.user.role) {
      req.session.user.role = roleName;
      req.session.user.role_name = roleName;
    }

    req.user = { ...(req.user || {}), ...req.session.user };

    if (roleName) {
      req.user.role = roleName;
      req.user.role_name = roleName;
    }
  }
  next();
});

app.use(attachRole);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRoutes);
app.use("/public", userRoutes);
app.use("/observations", plantObservationSubmitRoutes);
app.use("/species", speciesRoutes);
app.use("/observations", observationsRoutes);
app.use("/sensors", sensorsRoutes);
app.use("/ai", aiRoutes);
app.use("/admin", adminRoutes);

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
