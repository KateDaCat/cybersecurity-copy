// Define all roles in the system
export const ROLES = {                                           // Role constants
  ADMIN: "admin",                                                // Admin = full access, can assign roles
  RESEARCHER: "researcher",                                      // Researcher = can view plant-related data
  USER: "user"                                                   // General user = limited access
};


// Define permissions for accessing and managing resources
export const PERMISSIONS = {                                     // Permission names
  // Viewing database tables
  VIEW_ROLES: "tables:roles:view",                               // View roles table
  VIEW_USERS: "tables:users:view",                               // View users table
  VIEW_SPECIES: "tables:species:view",                           // View full species data
  VIEW_SPECIES_PUBLIC: "tables:species:view_public",             // View public (non-sensitive) species
  VIEW_SENSOR_DEVICES: "tables:sensor_devices:view",             // View sensor devices table
  VIEW_SENSOR_READINGS: "tables:sensor_readings:view",           // View sensor readings table
  VIEW_PLANT_OBSERVATIONS: "tables:plant_observations:view",     // View full plant observation data
  VIEW_PLANT_OBSERVATIONS_PUBLIC: "tables:plant_observations:view_public", // View public (masked) plant observations
  VIEW_AI_RESULTS: "tables:ai_results:view",                     // View AI results table
  VIEW_ALERTS: "tables:alerts:view",                             // View alerts table

  // Managing user roles (new)
  ASSIGN_ROLES: "roles:assign"                                   // Permission to assign roles to others
};


// Define which roles can do what
const POLICY = {                                                 // Role-to-permission mapping

  // Admin: full access to everything
  [PERMISSIONS.VIEW_ROLES]: [ROLES.ADMIN],                       // Only admin can view roles
  [PERMISSIONS.VIEW_USERS]: [ROLES.ADMIN],                       // Only admin can view users
  [PERMISSIONS.VIEW_SPECIES]: [ROLES.ADMIN],                     // Admin can view full species data
  [PERMISSIONS.VIEW_SENSOR_DEVICES]: [ROLES.ADMIN],              // Admin can view sensor devices
  [PERMISSIONS.VIEW_SENSOR_READINGS]: [ROLES.ADMIN],             // Admin can view sensor readings
  [PERMISSIONS.VIEW_PLANT_OBSERVATIONS]: [ROLES.ADMIN],          // Admin can view all plant observations
  [PERMISSIONS.VIEW_AI_RESULTS]: [ROLES.ADMIN],                  // Admin can view AI results
  [PERMISSIONS.VIEW_ALERTS]: [ROLES.ADMIN],                      // Admin can view alerts
  [PERMISSIONS.ASSIGN_ROLES]: [ROLES.ADMIN],                     // Only admin can assign or change roles

  // Researcher: access to plant/scientific data
  [PERMISSIONS.VIEW_SPECIES]: [ROLES.ADMIN, ROLES.RESEARCHER],   // Researcher can view full species
  [PERMISSIONS.VIEW_SENSOR_DEVICES]: [ROLES.ADMIN, ROLES.RESEARCHER], // Researcher can view sensor devices
  [PERMISSIONS.VIEW_SENSOR_READINGS]: [ROLES.ADMIN, ROLES.RESEARCHER], // Researcher can view sensor readings
  [PERMISSIONS.VIEW_PLANT_OBSERVATIONS]: [ROLES.ADMIN, ROLES.RESEARCHER], // Researcher can view all observations
  [PERMISSIONS.VIEW_AI_RESULTS]: [ROLES.ADMIN, ROLES.RESEARCHER], // Researcher can view AI results
  [PERMISSIONS.VIEW_ALERTS]: [ROLES.ADMIN, ROLES.RESEARCHER],     // Researcher can view alerts

  // User: only public non-sensitive data
  [PERMISSIONS.VIEW_SPECIES_PUBLIC]: [ROLES.ADMIN, ROLES.RESEARCHER, ROLES.USER], // Everyone can view public species
  [PERMISSIONS.VIEW_PLANT_OBSERVATIONS_PUBLIC]: [ROLES.ADMIN, ROLES.RESEARCHER, ROLES.USER] // Everyone can view public observations
};


// Convert user input role text into a valid system role
function normalizeRole(value) {                                  // Make sure input is valid role
  if (!value) return ROLES.USER;                                 // Default to "user"
  const r = String(value).toLowerCase().trim();                  // Clean up text
  if (r === ROLES.ADMIN) return ROLES.ADMIN;                     // Return admin if matched
  if (r === ROLES.RESEARCHER) return ROLES.RESEARCHER;           // Return researcher if matched
  return ROLES.USER;                                             // Otherwise default to user
}


// To attach the user's role to each request
export function attachRole(req, _res, next) {                    // Used globally in Express
  const fromHeader = req.headers["x-user-role"];                 // Read from header (preferred)
  const fromQuery  = req.query?.role;                            // Read from query string
  const fromBody   = req.body?.role;                             // Read from JSON body
  req.role = normalizeRole(fromHeader || fromQuery || fromBody); // Pick whichever exists
  next();                                                        // Continue
}


// Check if role has permission for a certain action
export function hasPermission(role, permission) {                // Simple true/false check
  const allowed = POLICY[permission] || [];                      // Get allowed list
  return allowed.includes(role);                                 // Return true if role allowed
}


// To require a specific permission in a route
export function requirePermission(permission) {                  // Example: requirePermission(PERMISSIONS.VIEW_ALERTS)
  return function (req, res, next) {                             // Express middleware
    if (!hasPermission(req.role, permission)) {                  // If role not allowed
      res.status(403).json({ message: "Forbidden: permission denied" }); // Block request
      return;                                                    // Stop here
    }
    next();                                                      // Allowed → move to next
  };
}


// Helper to require permission to view a table by scope ("public" or "full")
export function requireTableView(tableName, scope = "public") {  // Example: requireTableView("species", "full")
  let perm = null;                                               // Holds permission name
  const t = String(tableName).toLowerCase().trim();              // Clean table name
  const s = String(scope).toLowerCase().trim();                  // Clean scope name

  // Match table and scope to permission name
  if (t === "roles" && s === "full") perm = PERMISSIONS.VIEW_ROLES;
  if (t === "users" && s === "full") perm = PERMISSIONS.VIEW_USERS;
  if (t === "species" && s === "full") perm = PERMISSIONS.VIEW_SPECIES;
  if (t === "species" && s === "public") perm = PERMISSIONS.VIEW_SPECIES_PUBLIC;
  if (t === "sensor_devices" && s === "full") perm = PERMISSIONS.VIEW_SENSOR_DEVICES;
  if (t === "sensor_readings" && s === "full") perm = PERMISSIONS.VIEW_SENSOR_READINGS;
  if (t === "plant_observations" && s === "full") perm = PERMISSIONS.VIEW_PLANT_OBSERVATIONS;
  if (t === "plant_observations" && s === "public") perm = PERMISSIONS.VIEW_PLANT_OBSERVATIONS_PUBLIC;
  if (t === "ai_results" && s === "full") perm = PERMISSIONS.VIEW_AI_RESULTS;
  if (t === "alerts" && s === "full") perm = PERMISSIONS.VIEW_ALERTS;

  return requirePermission(perm);                               // Enforce permission on route
}


// Allow only admin to assign or change roles
export function requireRoleAssignment(req, res, next) {          // Middleware for role assignment
  if (!hasPermission(req.role, PERMISSIONS.ASSIGN_ROLES)) {      // Check if user can assign roles
    res.status(403).json({ message: "Only admin can assign or change roles." }); // Block
    return;                                                      // Stop
  }
  next();                                                        // Admin allowed → continue
}
