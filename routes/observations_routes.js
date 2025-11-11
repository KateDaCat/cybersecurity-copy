import { Router } from "express";
import { getObservations, getObservation } from "../controller/observations_controller.js";
import { requireTableView } from "../modules/rbac_module.js";

const router = Router();

router.get(
  "/",
  requireTableView("plant_observations", "full"),
  getObservations
);

router.get(
  "/:id",
  requireTableView("plant_observations", "full"),
  getObservation
);

export default router;
