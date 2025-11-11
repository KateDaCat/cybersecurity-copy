import {
  listPublicSpecies,
  getPublicSpeciesById,
} from "../service/user_service.js";

export async function getPublicSpeciesList(_req, res) {
  try {
    const species = await listPublicSpecies();
    return res.json({ ok: true, species });
  } catch (err) {
    console.error("[user_controller] list public species failed:", err);
    return res.status(500).json({ ok: false, message: "Failed to load species" });
  }
}

export async function getPublicSpecies(req, res) {
  try {
    const { id } = req.params;
    const species = await getPublicSpeciesById(id);
    if (!species) {
      return res.status(404).json({ ok: false, message: "Species not found or not public" });
    }
    return res.json({ ok: true, species });
  } catch (err) {
    console.error("[user_controller] get public species failed:", err);
    return res.status(500).json({ ok: false, message: "Failed to load species" });
  }
}
