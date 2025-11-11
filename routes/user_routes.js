import { Router } from "express";
import {
  getPublicSpeciesList,
  getPublicSpecies,
} from "../controller/user_controller.js";
import { requireTableView } from "../modules/rbac_module.js";

const router = Router();

router.get(
  "/species",
  requireTableView("species", "public"),
  getPublicSpeciesList
);

router.get(
  "/species/:id",
  requireTableView("species", "public"),
  getPublicSpecies
);

export default router;
