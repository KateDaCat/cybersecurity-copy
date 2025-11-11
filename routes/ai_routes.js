import { Router } from "express";
import {
  getAiResults,
  getAiResult,
  getAiResultsByObservation,
} from "../controller/ai_controller.js";
import { requireTableView } from "../modules/rbac_module.js";

const router = Router();

router.get("/", requireTableView("ai_results", "full"), getAiResults);
router.get("/:id", requireTableView("ai_results", "full"), getAiResult);
router.get(
  "/observation/:observationId",
  requireTableView("ai_results", "full"),
  getAiResultsByObservation
);

export default router;
