import db from "../config/db.js";
import {
  makeLookupKey,     // HMAC index for fast search (email)
  encryptText,       // AES-GCM encrypt
  decryptText,       // AES-GCM decrypt
  saveBundle,        // object -> JSON
  loadBundle,        // JSON -> object
  hashPassword,      // bcrypt hash
  checkPassword,     // bcrypt compare
} from "../modules/encryption_module.js";
import { startMfa, verifyMfa, maskEmail } from "../modules/mfa_module.js";

const DEFAULT_ROLE_KEY = process.env.DEFAULT_ROLE_KEY || "public";

function assertBundle(obj, label) {
  if (!obj) {
    throw new Error(`${label} encryption failed. Check DATA_KEY_B64 environment variable.`);
  }
  return obj;
}

function assertLookup(value, label) {
  if (!value) {
    throw new Error(`${label} lookup key could not be generated. Check INDEX_KEY_B64 environment variable.`);
  }
  return value;
}

async function roleIdFromKey(roleKey) {
  const key = String(roleKey || "").trim().toLowerCase();
  if (!key) return null;

  const [rows] = await db.execute(
    `SELECT role_id
       FROM roles
      WHERE role_name = ?
      LIMIT 1`,
    [key]
  );

  const row = rows[0];
  return row?.role_id ?? null;
}

async function ensureRoleId({ role_id, role, role_key }) {
  if (role_id) return role_id;

  const explicitKey = role ?? role_key;
  if (explicitKey) {
    const found = await roleIdFromKey(explicitKey);
    if (found) return found;
  }

  const fallback = await roleIdFromKey(DEFAULT_ROLE_KEY);
  if (!fallback) {
    throw new Error("Default role is not configured in roles table.");
  }
  return fallback;
}

export async function roleKeyFromId(roleId) {
  if (!roleId) return DEFAULT_ROLE_KEY;
  const [rows] = await db.execute(
    `SELECT role_name
       FROM roles
      WHERE role_id = ?
      LIMIT 1`,
    [roleId]
  );
  return rows[0]?.role_name ?? DEFAULT_ROLE_KEY;
}

// Create Account
export async function createAccount({ email, username, password, role_id, role, role_key }) {
  if (!email || !password) throw new Error("email and password are required");

  const resolvedRoleId = await ensureRoleId({ role_id, role, role_key });

  const password_hash = await hashPassword(password);

  const email_index = assertLookup(makeLookupKey(email), "Email");
  const username_index = username ? assertLookup(makeLookupKey(username), "Username") : null;

  const email_bundle_json = saveBundle(assertBundle(encryptText(email), "Email"));
  const username_bundle_json = username
    ? saveBundle(assertBundle(encryptText(username), "Username"))
    : null;

  const [r] = await db.execute(
    `INSERT INTO users
        (role_id, email, username, email_index, email_bundle_json, username_index, username_bundle_json, password_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      resolvedRoleId,
      email,
      username ?? null,
      email_index,
      email_bundle_json,
      username_index,
      username_bundle_json,
      password_hash,
    ]
  );

  return { ok: true, user_id: r.insertId, role_id: resolvedRoleId };
}

// Start Login
export async function startLogin({ email, password }) {
  if (!email || !password) throw new Error("email and password are required");

  const idx = assertLookup(makeLookupKey(email), "Email");
  const [rows] = await db.execute(
    `SELECT
        u.user_id,
        u.role_id,
        u.email_bundle_json,
        u.password_hash,
        u.is_active,
        r.role_name
       FROM users u
       LEFT JOIN roles r ON r.role_id = u.role_id
      WHERE u.email_index = ?
      LIMIT 1`,
    [idx]
  );
  const user = rows[0];
  if (!user) return { ok: false, message: "Invalid email or password" };

  const passOK = await checkPassword(password, user.password_hash);
  if (!passOK) return { ok: false, message: "Invalid email or password" };

  if (user.is_active === 0 || user.is_active === false) {
    return { ok: false, message: "Account is deactivated. Contact support." };
  }

  const decryptedEmail = user.email_bundle_json
    ? decryptText(loadBundle(user.email_bundle_json))
    : null;
  if (!decryptedEmail) return { ok: false, message: "Could not resolve email for MFA" };

  const sent = await startMfa(user.user_id, decryptedEmail);
  if (!sent.ok) return { ok: false, message: sent.message || "Failed to send MFA code" };

  return {
    ok: true,
    require_mfa: true,
    sent_to: sent.to ?? maskEmail(decryptedEmail), // masked email for UI
    user: { id: user.user_id, role_id: user.role_id, is_active: !!user.is_active }, // for session.mfaPendingUser
    role_key: user.role_name ?? (await roleKeyFromId(user.role_id)),
  };
}

// Verify Login Code
export async function verifyLoginCode({ user_id, code }) {
  if (!user_id || !code) throw new Error("user_id and code are required");
  const out = verifyMfa(user_id, code);
  if (!out.ok) return { ok: false, message: out.message || "MFA failed" };
  return { ok: true };
}

// Get Profile
export async function getMyProfile(user_id) {
  const [rows] = await db.execute(
    `SELECT
        u.user_id,
        u.role_id,
        u.email_bundle_json,
        u.username_bundle_json,
        u.is_active,
        r.role_name
       FROM users u
       LEFT JOIN roles r ON r.role_id = u.role_id
      WHERE u.user_id = ?
      LIMIT 1`,
    [user_id]
  );
  const u = rows[0];
  if (!u) return null;

  const email = u.email_bundle_json ? decryptText(loadBundle(u.email_bundle_json)) : null;
  const username = u.username_bundle_json ? decryptText(loadBundle(u.username_bundle_json)) : null;

  return {
    id: u.user_id,
    role_id: u.role_id,
    role: u.role_name ?? (await roleKeyFromId(u.role_id)),
    email,
    username,
    is_active: !!u.is_active,
  };
}

// SignOut
export function signOut() {
  return { ok: true };
}
