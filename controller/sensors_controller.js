import {
  listDevicesWithReadings,
  getDeviceWithReadings,
} from "../service/sensors_service.js";

export async function getSensors(_req, res) {
  try {
    const devices = await listDevicesWithReadings();
    return res.json({ ok: true, devices });
  } catch (err) {
    console.error("[sensors_controller] list failed:", err);
    return res.status(500).json({ ok: false, message: "Failed to load sensors" });
  }
}

export async function getSensor(req, res) {
  try {
    const { id } = req.params;
    const device = await getDeviceWithReadings(id);
    if (!device) {
      return res.status(404).json({ ok: false, message: "Sensor device not found" });
    }
    return res.json({ ok: true, device });
  } catch (err) {
    console.error("[sensors_controller] get failed:", err);
    return res.status(500).json({ ok: false, message: "Failed to load sensor device" });
  }
}
