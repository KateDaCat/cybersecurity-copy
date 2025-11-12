import db from "../config/db.js";
import { loadBundle, decryptText } from "../modules/encryption_module.js";

const STATUS_EXPR = `CASE WHEN COALESCE(u.role_id, 0) > 0 THEN 'active' ELSE 'pending_role' END`;

function normalizeString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeLower(value) {
  const trimmed = normalizeString(value);
  return trimmed ? trimmed.toLowerCase() : "";
}

export async function listUsers({
  page = 1,
  pageSize = 20,
  search = "",
  role,
  status,
} = {}) {
  const pageNumber = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const limit = Math.max(1, Math.min(100, Number(pageSize) || 20));
  const offset = (pageNumber - 1) * limit;

  const filters = [];
  const params = [];

  const searchValue = normalizeLower(search);
  if (searchValue) {
    filters.push(`(LOWER(u.username) LIKE ? OR LOWER(u.email) LIKE ?)`);
    const pattern = `%${searchValue}%`;
    params.push(pattern, pattern);
  }

  const roleValue = normalizeLower(role);
  if (roleValue) {
    filters.push(`LOWER(r.role_name) = ?`);
    params.push(roleValue);
  }

  const statusValue = normalizeLower(status);
  if (statusValue) {
    filters.push(`${STATUS_EXPR} = ?`);
    params.push(statusValue);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const sql = `
    SELECT
      u.user_id,
      u.role_id,
      u.username,
      u.email,
      u.avatar_url,
      u.created_at,
      u.email_bundle_json,
      u.username_bundle_json,
      r.role_name,
      ${STATUS_EXPR} AS status_label
    FROM users u
    LEFT JOIN roles r ON r.role_id = u.role_id
    ${whereClause}
    ORDER BY u.user_id DESC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await db.query(sql, [...params, limit, offset]);

  const countSql = `
    SELECT COUNT(*) AS total
    FROM users u
    LEFT JOIN roles r ON r.role_id = u.role_id
    ${whereClause}
  `;
  const [[{ total }]] = await db.query(countSql, params);

  const users = rows.map((row) => {
    const email = row.email_bundle_json
      ? decryptText(loadBundle(row.email_bundle_json)) ?? row.email
      : row.email;
    const username = row.username_bundle_json
      ? decryptText(loadBundle(row.username_bundle_json)) ?? row.username
      : row.username;

    return {
      user_id: row.user_id,
      role_id: row.role_id,
      role_name: row.role_name,
      username,
      email,
      avatar_url: row.avatar_url,
      created_at: row.created_at,
      status: row.status_label,
    };
  });

  return {
    ok: true,
    total,
    page: pageNumber,
    pageSize: limit,
    users,
  };
}

async function resolveRoleIdByName(roleName) {
  const normalized = normalizeLower(roleName);
  if (!normalized) return null;
  const [rows] = await db.query(
    `SELECT role_id, role_name FROM roles WHERE LOWER(role_name) = ? LIMIT 1`,
    [normalized]
  );
  return rows.length ? rows[0] : null;
}

export async function assignUserRole({ targetUserId, newRoleName, actorUserId }) {
  const userId = Number(targetUserId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return { ok: false, message: "Valid target user id is required" };
  }

  const roleRecord = await resolveRoleIdByName(newRoleName);
  if (!roleRecord) {
    return { ok: false, message: "Invalid role" };
  }

  if (actorUserId && Number(actorUserId) === userId) {
    return { ok: false, message: "You cannot change your own role" };
  }

  const [[existing]] = await db.query(
    `SELECT user_id FROM users WHERE user_id = ? LIMIT 1`,
    [userId]
  );
  if (!existing) {
    return { ok: false, message: "User not found" };
  }

  await db.query(`UPDATE users SET role_id = ? WHERE user_id = ?`, [roleRecord.role_id, userId]);

  const [[updated]] = await db.query(
    `
      SELECT
        u.user_id,
        u.role_id,
        u.username,
        u.email,
        u.avatar_url,
        u.created_at,
        u.email_bundle_json,
        u.username_bundle_json,
        r.role_name,
        ${STATUS_EXPR} AS status_label
      FROM users u
      LEFT JOIN roles r ON r.role_id = u.role_id
      WHERE u.user_id = ?
      LIMIT 1
    `,
    [userId]
  );

  if (!updated) {
    return { ok: false, message: "Failed to load updated user" };
  }

  const email = updated.email_bundle_json
    ? decryptText(loadBundle(updated.email_bundle_json)) ?? updated.email
    : updated.email;
  const username = updated.username_bundle_json
    ? decryptText(loadBundle(updated.username_bundle_json)) ?? updated.username
    : updated.username;

  return {
    ok: true,
    user: {
      user_id: updated.user_id,
      role_id: updated.role_id,
      role_name: updated.role_name,
      username,
      email,
      avatar_url: updated.avatar_url,
      created_at: updated.created_at,
      status: updated.status_label,
    },
  };
}
