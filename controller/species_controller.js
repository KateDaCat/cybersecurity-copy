import {
  listSpeciesFull,
  getSpeciesFullById,
} from "../service/species_service.js";

export async function getSpeciesList(_req, res) {
  try {
    const species = await listSpeciesFull();
    return res.json({ ok: true, species });
  } catch (err) {
    console.error("[species_controller] list failed:", err);
    return res.status(500).json({ ok: false, message: "Failed to load species" });
  }
}

export async function getSpeciesById(req, res) {
  try {
    const { id } = req.params;
    const species = await getSpeciesFullById(id);
    if (!species) {
      return res.status(404).json({ ok: false, message: "Species not found" });
    }
    return res.json({ ok: true, species });
  } catch (err) {
    console.error("[species_controller] get failed:", err);
    return res.status(500).json({ ok: false, message: "Failed to load species" });
  }
}
