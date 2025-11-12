import * as adminService from "../service/admin_service.js";

function parsePositiveInt(value, fallback) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return fallback;
  return n;
}

export async function getAllUsers(req, res) {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const pageSize = parsePositiveInt(req.query.pageSize, 20);

    if (pageSize < 1 || pageSize > 100) {
      return res
        .status(400)
        .json({ ok: false, message: "pageSize must be between 1 and 100" });
    }

    const search = typeof req.query.search === "string" ? req.query.search : "";
    const role = typeof req.query.role === "string" ? req.query.role : "";
    const status = typeof req.query.status === "string" ? req.query.status : "";

    const result = await adminService.listUsers({
      page,
      pageSize,
      search,
      role,
      status,
    });

    return res.json(result);
  } catch (err) {
    console.error("[admin_controller] list users failed:", err);
    return res
      .status(500)
      .json({ ok: false, message: "Failed to load users" });
  }
}

export async function assignUserRole(req, res) {
  try {
    const targetIdRaw = req.params.id ?? req.body?.userId;
    const targetUserId = parsePositiveInt(targetIdRaw, null);
    if (!targetUserId) {
      return res
        .status(400)
        .json({ ok: false, message: "Valid user id is required" });
    }

    const newRoleName = typeof req.body?.role === "string" ? req.body.role : "";
    if (!newRoleName.trim()) {
      return res
        .status(400)
        .json({ ok: false, message: "New role is required" });
    }

    const actorUserId =
      req.session?.user?.id ??
      req.session?.user?.user_id ??
      req.user?.id ??
      null;

    const result = await adminService.assignUserRole({
      targetUserId,
      newRoleName,
      actorUserId,
    });

    if (!result.ok) {
      const statusCode =
        result.message === "User not found" ? 404 : 400;
      return res.status(statusCode).json(result);
    }

    return res.json(result);
  } catch (err) {
    console.error("[admin_controller] assign role failed:", err);
    return res
      .status(500)
      .json({ ok: false, message: "Failed to change role" });
  }
}