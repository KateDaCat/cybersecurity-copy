import { Router } from "express";
import {
  getAllUsers,
  assignUserRole,
  viewUser,
  updateActiveStatus
} from "../controller/admin_controller.js";
import { requirePermission, PERMISSIONS } from "../modules/rbac_module.js";

const router = Router();

// List
router.get(
  "/users",
  requirePermission(PERMISSIONS.VIEW_USERS),
  getAllUsers
);

// View single user
router.get(
  "/users/:id",
  requirePermission(PERMISSIONS.VIEW_USERS),
  viewUser
);

// Toggle active (use same admin-only permission as role changes)
router.patch(
  "/users/:id/active",
  requirePermission(PERMISSIONS.ASSIGN_ROLES),
  updateActiveStatus
);

// Assign role
router.patch(
  "/users/:id/role",
  requirePermission(PERMISSIONS.ASSIGN_ROLES),
  assignUserRole
);

export default router;
