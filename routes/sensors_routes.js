import { Router } from "express";
import { getSensors, getSensor } from "../controller/sensors_controller.js";
import { requireTableView } from "../modules/rbac_module.js";

const router = Router();

router.get("/", requireTableView("sensor_devices", "full"), getSensors);
router.get("/:id", requireTableView("sensor_devices", "full"), getSensor);

export default router;
