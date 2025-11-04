import crypto from "crypto";                  // Used to generate random 6-digit code
import dotenv from "dotenv";                  // Loads environment variables from .env
import nodemailer from "nodemailer";          // Used to send email codes via Gmail
dotenv.config();                              // Initialize dotenv so process.env works

// Configuration values
const MFA_CODE_TTL_MS = 5 * 60 * 1000;        // Code expires after 5 minutes
const MFA_CODE_LENGTH = 6;                    // Length of the numeric code
const FROM_EMAIL = process.env.FROM_EMAIL;    // Sender email (system email)
const EMAIL_APP_PASS = process.env.EMAIL_APP_PASS; // App password for Gmail/SMTP

// In-memory storage for active MFA challenges
// Format: Map<userId, { code, expiresAt, address }>
const challenges = new Map();                 // Keeps track of who has active MFA codes

// Generate random 6-digit code
function makeCode() {                         // Function to make numeric code
  let code = "";                              // Start with an empty string
  for (let i = 0; i < MFA_CODE_LENGTH; i++) { // Repeat 6 times
    code += Math.floor(Math.random() * 10);   // Add a random number 0–9 each time
  }
  return code;                                // Return the final 6-digit code
}

// Deliver the MFA code by email only
async function deliverCode(address, code) {   // Send code to user's email
  try {
    // Create a Nodemailer email transporter using Gmail service
    const transporter = nodemailer.createTransport({
      service: "gmail",                       // Use Gmail service
      auth: {                                 // Gmail login credentials
        user: FROM_EMAIL,                     // Sender email
        pass: EMAIL_APP_PASS                  // Gmail App Password (not normal password)
      }
    });

    // Prepare email content
    const mailOptions = {
      from: FROM_EMAIL,                       // From address
      to: address,                            // Recipient email
      subject: "Smart Plant Admin/Researcher Verification Code", // Subject line
      text: `Your 6-digit code is: ${code}\nThis code will expire in 5 minutes.` // Message body
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(`[MFA] Email sent to ${address}`); // Log success
    return true;                              // Return success
  } catch (err) {
    console.error("[MFA] Email sending failed:", err.message); // Log any error
    return false;                             // Return failure
  }
}

// Start an MFA challenge for privileged roles (admin or researcher only)
export async function startMfaForPrivileged(userId, role, address = "admin@local") {
  if (!userId) return { ok: false, message: "userId is required" };  // Check input
  const r = String(role || "").toLowerCase();                    // Normalize role text
  if (r !== "admin" && r !== "researcher") {                     // Allow only admin or researcher
    return { ok: false, status: 403, message: "Only admin or researcher can use MFA" };
  }

  const code = makeCode();                                       // Generate 6-digit code
  const expiresAt = Date.now() + MFA_CODE_TTL_MS;                // Calculate expiration time

  const delivered = await deliverCode(address, code);             // Send code via email
  if (!delivered) return { ok: false, message: "Could not send MFA code" }; // Stop if email failed

  challenges.set(String(userId), { code, expiresAt, address });   // Save challenge details
  return { ok: true, message: "MFA code sent to your email" };    // Return success
}

// Verify MFA code for privileged roles
export function verifyMfaForPrivileged(userId, role, code) {
  if (!userId || !code) return { ok: false, message: "userId and code are required" }; // Validate input
  const r = String(role || "").toLowerCase();                     // Normalize role name
  if (r !== "admin" && r !== "researcher") {                      // Block normal users
    return { ok: false, status: 403, message: "Only admin or researcher can verify MFA" };
  }

  const entry = challenges.get(String(userId));                   // Get stored challenge
  if (!entry) return { ok: false, message: "No MFA code was requested" }; // No code found

  if (Date.now() > entry.expiresAt) {                             // If code expired
    challenges.delete(String(userId));                            // Remove expired record
    return { ok: false, message: "MFA code has expired" };        // Inform user
  }

  if (String(code).trim() !== entry.code) {                       // Compare code
    return { ok: false, message: "MFA code is incorrect" };       // Wrong code
  }

  challenges.delete(String(userId));                              // Delete after success
  return { ok: true, message: "MFA check passed" };               // Return success message
}

// Require MFA for privileged routes (admin/researcher only)
// If user is public = block. If not verified = ask to verify MFA.
export function requirePrivilegedMfa(req, res, next) {
  const role = (req.role || "").toLowerCase();                    // Read user role
  if (role !== "admin" && role !== "researcher") {                // Public user check
    res.status(403).json({ message: "Privileged users only (admin or researcher)" }); // Block access
    return;                                                       // Stop request
  }

  // For admin/researcher → check MFA session flag
  if (!req.session || !req.session.mfaVerified) {                 // Verify session
    res.status(401).json({ message: "Please complete MFA first" }); // Ask to verify
    return;                                                       // Stop request
  }

  next();                                                         // Allow access
}
