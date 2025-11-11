import { Router } from "express";
import { getAllUsers, assignUserRole } from "../controller/admin_controller.js";
import {
  requireTableView,
  requireRoleAssignment,
} from "../modules/rbac_module.js";

const router = Router();

router.get("/users", requireTableView("users", "full"), getAllUsers);
router.post("/users/:id/role", requireRoleAssignment, assignUserRole);

export default router;
