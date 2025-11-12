import { Router } from "express";
import { getAllUsers, assignUserRole } from "../controller/admin_controller.js";
import { requirePermission, PERMISSIONS } from "../modules/rbac_module.js";

const router = Router();

router.get(
  "/users",
  requirePermission(PERMISSIONS.VIEW_USERS),
  getAllUsers
);

router.patch(
  "/users/:id/role",
  requirePermission(PERMISSIONS.ASSIGN_ROLES),
  assignUserRole
);

export default router;
