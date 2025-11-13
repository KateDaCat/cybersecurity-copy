import { Router } from "express";
import { createObservation } from "../controller/plant_observation_controller.js";

const router = Router();

router.post("/", createObservation);

export default router;