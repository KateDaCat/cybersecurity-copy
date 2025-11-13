// services/admin_service.js
import db from "../config/db.js";
import { decryptText, loadBundle } from "../modules/encryption_module.js";

function toInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function pageBits(page = 1, size = 20) {
  const p = Math.max(1, Number(page) || 1);
  const s = Math.min(100, Math.max(1, Number(size) || 20));
  return { limit: s, offset: (p - 1) * s };
}

// Get all roles for dropdown
export async function listRoles() {
  const [rows] = await db.query(`
    SELECT role_id, role_name, description
    FROM roles
    ORDER BY role_id ASC
  `);
  return rows;
}

// Convert role_name → role_id
async function roleIdFromName(roleName) {
  const rn = String(roleName || "").toLowerCase().trim();
  const [rows] = await db.query(
    `SELECT role_id FROM roles WHERE role_name = ? LIMIT 1`,
    [rn]
  );
  if (!rows[0]) {
    throw new Error("Unknown role");
  }
  return rows[0].role_id;
}

// List users with search and paging
export async function listUsers({ q = "", page = 1, pageSize = 20 } = {}) {
  const { limit, offset } = pageBits(page, pageSize);
  const search = q.trim();
  const like = `%${search}%`;

  let sql;
  let params;

  if (search) {
    sql = `
      SELECT
        u.user_id,
        u.username,
        u.email,
        u.is_active,
        u.created_at,
        r.role_name
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      WHERE u.username LIKE ? OR u.email LIKE ?
      ORDER BY u.user_id DESC
      LIMIT ? OFFSET ?
    `;
    params = [like, like, limit, offset];
  } else {
    sql = `
      SELECT
        u.user_id,
        u.username,
        u.email,
        u.is_active,
        u.created_at,
        r.role_name
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      ORDER BY u.user_id DESC
      LIMIT ? OFFSET ?
    `;
    params = [limit, offset];
  }

  const [rows] = await db.query(sql, params);
  return rows.map((row) => ({
    user_id: row.user_id,
    username: row.username,
    email: row.email,
    role: row.role_name,
    is_active: !!row.is_active,
    created_at: row.created_at,
  }));
}

// Get one user by id, decrypt email/username if bundles exist
export async function getUserById(userId) {
  const id = toInt(userId);
  if (!id) return null;

  const [rows] = await db.query(
    `
    SELECT
      u.user_id,
      u.username,
      u.email,
      u.avatar_url,
      u.created_at,
      u.is_active,
      u.role_id,
      r.role_name,
      u.email_bundle_json,
      u.username_bundle_json
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
    WHERE u.user_id = ?
    LIMIT 1
  `,
    [id]
  );

  const row = rows[0];
  if (!row) return null;

  let email = row.email;
  if (row.email_bundle_json) {
    const bundle = loadBundle(row.email_bundle_json);
    const dec = bundle ? decryptText(bundle) : null;
    if (dec) email = dec;
  }

  let username = row.username;
  if (row.username_bundle_json) {
    const bundle = loadBundle(row.username_bundle_json);
    const dec = bundle ? decryptText(bundle) : null;
    if (dec) username = dec;
  }

  return {
    user_id: row.user_id,
    username,
    email,
    role_id: row.role_id,
    role: row.role_name,
    is_active: !!row.is_active,
    avatar_url: row.avatar_url,
    created_at: row.created_at,
  };
}

// Activate or deactivate a user
export async function setUserActiveStatus(userId, isActive) {
  const id = toInt(userId);
  if (!id) {
    return { ok: false, message: "Valid user id is required" };
  }

  const activeBit = isActive ? 1 : 0;

  const [res] = await db.query(
    `UPDATE users SET is_active = ? WHERE user_id = ?`,
    [activeBit, id]
  );
  if (!res.affectedRows) {
    return { ok: false, message: "User not found" };
  }

  const user = await getUserById(id);
  if (!user) {
    return { ok: false, message: "Failed to load updated user" };
  }
  return { ok: true, user };
}

// Change user role using role name
export async function setUserRole(userId, roleName) {
  const id = toInt(userId);
  if (!id) {
    return { ok: false, message: "Valid user id is required" };
  }

  const roleId = await roleIdFromName(roleName);

  const [res] = await db.query(
    `UPDATE users SET role_id = ? WHERE user_id = ?`,
    [roleId, id]
  );
  if (!res.affectedRows) {
    return { ok: false, message: "User not found" };
  }

  const user = await getUserById(id);
  if (!user) {
    return { ok: false, message: "Failed to load updated user" };
  }
  return { ok: true, user };
}
