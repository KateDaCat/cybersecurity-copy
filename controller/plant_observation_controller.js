import { submitObservation } from "../service/plant_observation_service.js";

export async function createObservation(req, res) {
  try {
    const payload = {
      user_id: req.body?.user_id,
      species_id: req.body?.species_id,
      photo_url: req.body?.photo_url,
      location_name: req.body?.location_name,
      latitude: req.body?.latitude,
      longitude: req.body?.longitude,
      notes: req.body?.notes,
      source: req.body?.source,
    };

    const result = await submitObservation(payload);
    return res.status(201).json(result);
  } catch (err) {
    console.error("[plant_observation_controller] create failed:", err);
    const message = err?.message || "Failed to submit observation";
    const status = message.includes("required") ? 400 : 500;
    return res.status(status).json({ ok: false, message });
  }
}
