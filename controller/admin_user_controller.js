// controllers/admin_controller.js
import {
  listUsers,
  getUserById,
  setUserActiveStatus,
  setUserRole,
  listRoles,
} from "../services/admin_service.js";

// GET /api/admin/users
export async function getAllUsers(req, res) {
  try {
    const { q = "", page = 1, pageSize = 20 } = req.query || {};
    const users = await listUsers({ q, page, pageSize });
    res.json({ ok: true, items: users });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

// GET /api/admin/users/:id
export async function viewUser(req, res) {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }
    res.json({ ok: true, user });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

// PATCH /api/admin/users/:id/active  { isActive: boolean }
export async function updateActiveStatus(req, res) {
  try {
    const { isActive } = req.body || {};
    if (typeof isActive !== "boolean") {
      return res
        .status(400)
        .json({ ok: false, message: "isActive must be boolean" });
    }

    const result = await setUserActiveStatus(req.params.id, isActive);
    const code = result.ok
      ? 200
      : result.message === "User not found"
      ? 404
      : 400;

    res.status(code).json(result);
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

// PATCH /api/admin/users/:id/role  { role: "admin|researcher|public" }
export async function assignUserRole(req, res) {
  try {
    const { role } = req.body || {};
    if (!role) {
      return res
        .status(400)
        .json({ ok: false, message: "role is required" });
    }

    const result = await setUserRole(req.params.id, role);
    const code = result.ok
      ? 200
      : result.message === "User not found"
      ? 404
      : 400;

    res.status(code).json(result);
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

// GET /api/admin/roles
export async function getRoles(req, res) {
  try {
    const roles = await listRoles();
    res.json({ ok: true, items: roles });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}
