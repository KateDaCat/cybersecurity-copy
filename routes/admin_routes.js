// routes/admin_routes.js
import { Router } from "express";
import {
  getAllUsers,
  viewUser,
  updateActiveStatus,
  assignUserRole,
  getRoles,
} from "../controllers/admin_controller.js";
import {
  attachRole,
  requirePermission,
  requireAdminActive,
  PERMISSIONS,
} from "../modules/rbac_module.js";

const router = Router();

// Attach role for all admin routes
router.use(attachRole);

// GET /api/admin/roles  (admin only)
router.get(
  "/roles",
  requireAdminActive,
  requirePermission(PERMISSIONS.VIEW_ROLES),
  getRoles
);

// GET /api/admin/users  (admin only)
router.get(
  "/users",
  requireAdminActive,
  requirePermission(PERMISSIONS.VIEW_USERS),
  getAllUsers
);

// GET /api/admin/users/:id  (admin only)
router.get(
  "/users/:id",
  requireAdminActive,
  requirePermission(PERMISSIONS.VIEW_USERS),
  viewUser
);

// PATCH /api/admin/users/:id/active  (admin only, account activation)
router.patch(
  "/users/:id/active",
  requireAdminActive,
  requirePermission(PERMISSIONS.ACCOUNT_ACTIVATION),
  updateActiveStatus
);

// PATCH /api/admin/users/:id/role  (admin only, assign roles)
router.patch(
  "/users/:id/role",
  requireAdminActive,
  requirePermission(PERMISSIONS.ASSIGN_ROLES),
  assignUserRole
);

export default router;
