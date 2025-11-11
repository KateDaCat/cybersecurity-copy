import { Router } from "express";
import { getSpeciesList, getSpeciesById } from "../controller/species_controller.js";
import { requireTableView } from "../modules/rbac_module.js";

const router = Router();

router.get("/", requireTableView("species", "full"), getSpeciesList);
router.get("/:id", requireTableView("species", "full"), getSpeciesById);

export default router;
