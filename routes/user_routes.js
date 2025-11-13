import { Router } from "express";
import {
  getPublicSpeciesList,
  getPublicSpecies,
  getPublicObservations,
  getPublicObservation,
} from "../controller/user_controller.js";
import { attachRole, requireTableView } from "../modules/rbac_module.js";

const router = Router();

router.use(attachRole);

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

router.get(
  "/observations",
  requireTableView("plant_observations", "public"),
  getPublicObservations
);

router.get(
  "/observations/:id",
  requireTableView("plant_observations", "public"),
  getPublicObservation
);

export default router;
