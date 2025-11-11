import {
  listObservationsWithAi,
  getObservationWithAiById,
} from "../service/observations_service.js";

export async function getObservations(_req, res) {
  try {
    const observations = await listObservationsWithAi();
    return res.json({ ok: true, observations });
  } catch (err) {
    console.error("[observations_controller] list failed:", err);
    return res.status(500).json({ ok: false, message: "Failed to load observations" });
  }
}

export async function getObservation(req, res) {
  try {
    const { id } = req.params;
    const observation = await getObservationWithAiById(id);
    if (!observation) {
      return res.status(404).json({ ok: false, message: "Observation not found" });
    }
    return res.json({ ok: true, observation });
  } catch (err) {
    console.error("[observations_controller] get failed:", err);
    return res.status(500).json({ ok: false, message: "Failed to load observation" });
  }
}
