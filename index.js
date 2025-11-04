import express from "express";                       // Import web framework
import dotenv from "dotenv";                         // Import dotenv for .env variables
import mysql from "mysql2/promise";                  // Import MySQL (promise version)
import session from "express-session";               // Import session for MFA tracking

// Import encryption functions
import {
  encryptText,                                       // Encrypt any plain text
  decryptText,                                       // Decrypt encrypted bundle
  bundleToDB,                                        // Convert object to JSON string
  bundleFromDB                                       // Convert JSON string to object
} from "./encryption_module.js";

// Import RBAC functions
import {
  attachRole,                                       // Attach user role to each request
  requireRoleAssignment                             // Middleware for admin-only role changes
} from "./rbac_module.js";

// Import MFA functions
import {
  startMfaForPrivileged,                            // Send MFA code to admin/researcher
  verifyMfaForPrivileged,                           // Verify MFA code
  requirePrivilegedMfa                              // Protect routes for admin/researcher
} from "./mfa_module.js";

dotenv.config();                                    // Load environment variables

// Setup basic configuration
const PORT = process.env.PORT || 3000;              // Set server port
const DB_HOST = process.env.DB_HOST || "localhost"; // Set database host
const DB_USER = process.env.DB_USER || "root";      // Set database username
const DB_PASS = process.env.DB_PASS || "";          // Set database password
const DB_NAME = process.env.DB_NAME || "smartplant"; // Set database name

// Create a connection pool for MySQL
const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// Create Express app
const app = express();                              // Initialize web app
app.use(express.json());                            // Parse JSON data in requests

// Function to run SQL queries easily
function runQuery(sql, params = []) {
  return pool.query(sql, params)                    // Execute SQL query
    .then(([rows]) => rows)                         // Return only rows
    .catch((err) => {                               // If any error occurs
      console.log("Database error:", err.message);  // Print error
      throw err;                                    // Stop execution
    });
}

// Setup session and role system
app.use(session({
  secret: process.env.SESSION_SECRET || "default-secret", // Secret for session cookies
  resave: false,                                          // Don’t resave session if not changed
  saveUninitialized: false                                // Don’t create empty sessions
}));

app.use(attachRole);                                     // Attach user role for all routes

// Species routes (encrypt endangered description)

// Add a new species into the database
app.post("/species", (req, res) => {
  const name = req.body.scientific_name;                 // Get scientific name
  const common = req.body.common_name;                   // Get common name
  const endangered = req.body.is_endangered ? 1 : 0;     // 1 or 0
  const description = req.body.description || null;      // Description text
  const image = req.body.image_url || null;              // Image URL

  if (!name || !common) {                                // Check required inputs
    res.status(400).json({ message: "scientific_name and common_name are required" });
    return;
  }

  // Insert species record first
  runQuery(
    "INSERT INTO Species (scientific_name, common_name, is_endangered, description, image_url) VALUES (?, ?, ?, ?, ?)",
    [name, common, endangered, description, image]
  ).then((result) => {
    const id = result.insertId;                          // Get new species_id

    // If endangered, encrypt description
    if (endangered === 1 && description) {
      const enc = encryptText(description);               // Encrypt text
      if (enc) {
        const encText = bundleToDB(enc);                  // Convert object to JSON
        return runQuery(
          "UPDATE Species SET description = NULL, description_enc = ? WHERE species_id = ?",
          [encText, id]
        ).then(() => {
          res.json({ message: "Endangered species added with encryption", species_id: id });
        });
      }
    }

    // Otherwise, normal species
    res.json({ message: "Species added successfully", species_id: id });
  }).catch(() => {
    res.status(500).json({ message: "Error creating species" });
  });
});

// View one species and decrypt if encrypted
app.get("/species/:id", (req, res) => {
  const id = req.params.id;                              // Get species ID

  runQuery("SELECT * FROM Species WHERE species_id = ?", [id])
  .then((rows) => {
    if (rows.length === 0) {
      res.status(404).json({ message: "Species not found" });
      return;
    }

    const row = rows[0];                                 // Get data row
    let desc = row.description;                          // Use plain text first

    if (!desc && row.description_enc) {                  // If encrypted version exists
      const encBundle = bundleFromDB(row.description_enc);// Convert JSON → object
      desc = decryptText(encBundle);                     // Decrypt text
    }

    res.json({
      species_id: row.species_id,
      scientific_name: row.scientific_name,
      common_name: row.common_name,
      description: desc,
      image_url: row.image_url,
      is_endangered: !!row.is_endangered
    });
  }).catch(() => {
    res.status(500).json({ message: "Error fetching species" });
  });
});

// Plant Observation routes (encrypt location)
// Add plant observation data
app.post("/plant-observations", (req, res) => {
  const user = req.body.user_id;                        // User ID
  const species = req.body.species_id;                  // Species ID
  const photo = req.body.photo_url || null;             // Photo URL
  const location = req.body.location_name || null;      // Location name
  const lat = req.body.lat;                             // Latitude
  const lng = req.body.lng;                             // Longitude
  const notes = req.body.endangered_details || null;    // Sensitive notes

  if (!user || !species) {                              // Check required fields
    res.status(400).json({ message: "user_id and species_id are required" });
    return;
  }

  let coordsEnc = null;                                 // Default empty
  if (lat !== undefined && lng !== undefined) {         // If coordinates provided
    const jsonLoc = JSON.stringify({ lat, lng });       // Convert to JSON
    const enc = encryptText(jsonLoc);                   // Encrypt location
    if (enc) coordsEnc = bundleToDB(enc);               // Convert to JSON string
  }

  let detailsEnc = null;                                // Default empty
  if (notes) {                                          // If details exist
    const enc2 = encryptText(notes);                    // Encrypt details
    if (enc2) detailsEnc = bundleToDB(enc2);            // Convert to JSON string
  }

  // Insert record into database
  runQuery(
    `INSERT INTO Plant_Observations
    (user_id, species_id, photo_url, location_name, coordinates_enc, details_enc, status)
    VALUES (?, ?, ?, ?, ?, ?, 'submitted')`,
    [user, species, photo, location, coordsEnc, detailsEnc]
  ).then((result) => {
    res.json({ message: "Observation added successfully", observation_id: result.insertId });
  }).catch(() => {
    res.status(500).json({ message: "Error creating observation" });
  });
});

// View encrypted data for admin/researcher only
app.get("/plant-observations/:id/privileged", requirePrivilegedMfa, (req, res) => {
  const id = req.params.id;                              // Observation ID

  runQuery("SELECT * FROM Plant_Observations WHERE observation_id = ?", [id])
  .then((rows) => {
    if (rows.length === 0) {
      res.status(404).json({ message: "Observation not found" });
      return;
    }

    const row = rows[0];
    let coords = null;
    let notes = null;

    if (row.coordinates_enc) {                           // If coordinates encrypted
      const encCoords = bundleFromDB(row.coordinates_enc);
      const decCoords = decryptText(encCoords);
      if (decCoords) coords = JSON.parse(decCoords);
    }

    if (row.details_enc) {                               // If details encrypted
      const encDetails = bundleFromDB(row.details_enc);
      const decDetails = decryptText(encDetails);
      if (decDetails) notes = decDetails;
    }

    res.json({
      observation_id: row.observation_id,
      species_id: row.species_id,
      user_id: row.user_id,
      location_name: row.location_name,
      coordinates: coords,
      endangered_details: notes,
      photo_url: row.photo_url,
      status: row.status
    });
  }).catch(() => {
    res.status(500).json({ message: "Error fetching observation" });
  });
});

// RBAC (admin can assign roles)
app.post("/assign-role", requireRoleAssignment, (req, res) => {
  const id = req.body.user_id;                          // Get user ID
  const newRole = (req.body.new_role || "").toLowerCase(); // New role

  if (!id || !newRole) {                                // Validate input
    res.status(400).json({ message: "user_id and new_role are required" });
    return;
  }

  runQuery("UPDATE Users SET role = ? WHERE user_id = ?", [newRole, id])
  .then(() => {
    res.json({ message: `User ${id} role changed to ${newRole}` });
  })
  .catch(() => {
    res.status(500).json({ message: "Error updating role" });
  });
});

// MFA routes (email code verification)
app.post("/auth/login", (req, res) => {
  const user = req.body.user_id;                        // User ID
  const role = (req.body.role || "").toLowerCase();     // Role (admin/researcher)
  const email = req.body.email;                         // Email for MFA

  if (!user || !role || !email) {
    res.status(400).json({ message: "user_id, role, and email are required" });
    return;
  }

  req.session.userId = user;                            // Store session data
  req.session.role = role;
  req.session.mfaVerified = false;

  startMfaForPrivileged(user, role, email)              // Send code
  .then((result) => {
    if (!result.ok) {
      const code = result.status || 500;
      res.status(code).json({ message: result.message });
      return;
    }
    res.json({ message: "MFA code sent successfully" });
  }).catch(() => {
    res.status(500).json({ message: "Error sending MFA code" });
  });
});

// Verify MFA code
app.post("/auth/mfa/verify", (req, res) => {
  const user = req.session.userId;
  const role = req.session.role;
  const code = req.body.code;

  if (!user || !role) {
    res.status(400).json({ message: "No active session" });
    return;
  }
  if (!code) {
    res.status(400).json({ message: "Verification code required" });
    return;
  }

  const result = verifyMfaForPrivileged(user, role, code);
  if (!result.ok) {
    const status = result.status || 401;
    res.status(status).json({ message: result.message });
    return;
  }

  req.session.mfaVerified = true;
  res.json({ message: "MFA verified successfully" });
});

// Protected route (example dashboard)
app.get("/dashboard", requirePrivilegedMfa, (req, res) => {
  res.json({ message: "Welcome Admin/Researcher! MFA verification successful." });
});

// Server start
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
