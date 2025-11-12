import {
  listPublicSpecies,
  getPublicSpeciesById,
  listPublicObservations,
  getPublicObservationById,
} from "../service/user_service.js";

export async function getPublicSpeciesList(_req, res) {
  try {
    const species = await listPublicSpecies();
    return res.json({ ok: true, species });
  } catch (err) {
    console.error("[user_controller] list public species failed:", err);
    return res
      .status(500)
      .json({ ok: false, message: "Failed to load species" });
  }
}

export async function getPublicSpecies(req, res) {
  try {
    const { id } = req.params;
    const species = await getPublicSpeciesById(id);
    if (!species) {
      return res
        .status(404)
        .json({ ok: false, message: "Species not found or not public" });
    }
    return res.json({ ok: true, species });
  } catch (err) {
    console.error("[user_controller] get public species failed:", err);
    return res
      .status(500)
      .json({ ok: false, message: "Failed to load species" });
  }
}

export async function getPublicObservations(_req, res) {
  try {
    const observations = await listPublicObservations();
    return res.json({ ok: true, observations });
  } catch (err) {
    console.error("[user_controller] list public observations failed:", err);
    return res
      .status(500)
      .json({ ok: false, message: "Failed to load observations" });
  }
}

export async function getPublicObservation(req, res) {
  try {
    const { id } = req.params;
    const observation = await getPublicObservationById(id);
    if (!observation) {
      return res
        .status(404)
        .json({ ok: false, message: "Observation not found or not public" });
    }
    return res.json({ ok: true, observation });
  } catch (err) {
    console.error("[user_controller] get public observation failed:", err);
    return res
      .status(500)
      .json({ ok: false, message: "Failed to load observation" });
  }
}
