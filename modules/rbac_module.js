export const ROLES = {
  ADMIN: "admin",
  RESEARCHER: "researcher",
  PUBLIC: "public",          // same as "user"
};

// ---- Permissions -------------------------------------------
export const PERMISSIONS = {
  // Table views
  VIEW_ROLES: "tables:roles:view",
  VIEW_USERS: "tables:users:view",
  VIEW_SPECIES_FULL: "tables:species:view_full",
  VIEW_SPECIES_PUBLIC: "tables:species:view_public",
  VIEW_SENSOR_DEVICES: "tables:sensor_devices:view",
  VIEW_SENSOR_READINGS: "tables:sensor_readings:view",
  VIEW_PLANT_OBSERVATIONS_FULL: "tables:plant_observations:view_full",
  VIEW_PLANT_OBSERVATIONS_PUBLIC: "tables:plant_observations:view_public",
  VIEW_AI_RESULTS: "tables:ai_results:view",
  VIEW_ALERTS: "tables:alerts:view",

  // Admin actions
  ASSIGN_ROLES: "roles:assign",
  ACCOUNT_ACTIVATION: "account:activation", 
};

// ---- Policy (role → permission) -----------------------------
const POLICY = {
  // Admin-only
  [PERMISSIONS.VIEW_ROLES]: [ROLES.ADMIN],
  [PERMISSIONS.VIEW_USERS]: [ROLES.ADMIN],
  [PERMISSIONS.ASSIGN_ROLES]: [ROLES.ADMIN],
  [PERMISSIONS.ACCOUNT_ACTIVATION]: [ROLES.ADMIN],

  // Admin + Researcher
  [PERMISSIONS.VIEW_SPECIES_FULL]: [ROLES.ADMIN, ROLES.RESEARCHER],
  [PERMISSIONS.VIEW_SENSOR_DEVICES]: [ROLES.ADMIN, ROLES.RESEARCHER],
  [PERMISSIONS.VIEW_SENSOR_READINGS]: [ROLES.ADMIN, ROLES.RESEARCHER],
  [PERMISSIONS.VIEW_PLANT_OBSERVATIONS_FULL]: [ROLES.ADMIN, ROLES.RESEARCHER],
  [PERMISSIONS.VIEW_AI_RESULTS]: [ROLES.ADMIN, ROLES.RESEARCHER],
  [PERMISSIONS.VIEW_ALERTS]: [ROLES.ADMIN, ROLES.RESEARCHER],

  // Public (non-sensitive)
  [PERMISSIONS.VIEW_SPECIES_PUBLIC]: [
    ROLES.ADMIN, ROLES.RESEARCHER, ROLES.PUBLIC
  ],
  [PERMISSIONS.VIEW_PLANT_OBSERVATIONS_PUBLIC]: [
    ROLES.ADMIN, ROLES.RESEARCHER, ROLES.PUBLIC
  ],
};

// ---- Helpers -----------------------------------------------
function normalizeRole(value) {
  if (!value) return ROLES.PUBLIC;
  const r = String(value).toLowerCase().trim();
  if (r === "user") return ROLES.PUBLIC;
  if (r === ROLES.ADMIN) return ROLES.ADMIN;
  if (r === ROLES.RESEARCHER) return ROLES.RESEARCHER;
  if (r === ROLES.PUBLIC) return ROLES.PUBLIC;
  return ROLES.PUBLIC;
}

// Attach role to the request (prefer auth-populated role)
export function attachRole(req, _res, next) {
  const fromAuth = req.user?.role || req.user?.role_name;
  const fromHeader = req.headers["x-user-role"];
  const fromQuery = req.query?.role;
  const fromBody = req.body?.role;
  const fromSession = req.session?.user?.role;
  req.role = normalizeRole(fromAuth || fromHeader || fromQuery || fromBody || fromSession);
  next();
}

// Basic permission checks
export function hasPermission(role, permission) {
  const allowed = POLICY[permission] || [];
  return allowed.includes(role);
}

export function requirePermission(permission) {
  return (req, res, next) => {
    if (!hasPermission(req.role, permission)) {
      return res.status(403).json({ message: "Forbidden: permission denied" });
    }
    next();
  };
}

// Table-view convenience middleware
export function requireTableView(tableName, scope = "public") {
  const t = String(tableName).toLowerCase().trim();
  const s = String(scope).toLowerCase().trim();

  let perm = null;
  if (t === "roles" && s === "full") perm = PERMISSIONS.VIEW_ROLES;
  if (t === "users" && s === "full") perm = PERMISSIONS.VIEW_USERS;
  if (t === "species" && s === "full") perm = PERMISSIONS.VIEW_SPECIES_FULL;
  if (t === "species" && s === "public") perm = PERMISSIONS.VIEW_SPECIES_PUBLIC;
  if (t === "sensor_devices" && s === "full") perm = PERMISSIONS.VIEW_SENSOR_DEVICES;
  if (t === "sensor_readings" && s === "full") perm = PERMISSIONS.VIEW_SENSOR_READINGS;
  if (t === "plant_observations" && s === "full") perm = PERMISSIONS.VIEW_PLANT_OBSERVATIONS_FULL;
  if (t === "plant_observations" && s === "public") perm = PERMISSIONS.VIEW_PLANT_OBSERVATIONS_PUBLIC;
  if (t === "ai_results" && s === "full") perm = PERMISSIONS.VIEW_AI_RESULTS;
  if (t === "alerts" && s === "full") perm = PERMISSIONS.VIEW_ALERTS;

  return requirePermission(perm);
}

export function requireActiveAccount(req, res, next) {
  // expect auth middleware to have set req.user with is_active
  const isActive = (req.user?.is_active ?? true) === true || (req.user?.is_active === 1);
  if (!isActive) {
    return res.status(403).json({
      message: "Access denied: your account is deactivated.",
    });
  }
  next();
}

// Admin-only: must be active AND must be admin
export function requireAdminActive(req, res, next) {
  const isActive = (req.user?.is_active ?? true) === true || (req.user?.is_active === 1);
  const isAdmin = req.role === ROLES.ADMIN;
  if (!isActive) {
    return res.status(403).json({ message: "Access denied: admin account is deactivated." });
  }
  if (!isAdmin) {
    return res.status(403).json({ message: "Forbidden: admin role required." });
  }
  next();
}
