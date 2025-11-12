import {
  listAiResults,
  listAiResultsForObservation,
  getAiResultById,
} from "../service/ai_service.js";

export async function getAiResults(_req, res) {
  try {
    const results = await listAiResults();
    return res.json({ ok: true, results });
  } catch (err) {
    console.error("[ai_controller] list failed:", err);
    return res.status(500).json({ ok: false, message: "Failed to load AI results" });
  }
}

export async function getAiResult(req, res) {
  try {
    const { id } = req.params;
    const result = await getAiResultById(id);
    if (!result) {
      return res.status(404).json({ ok: false, message: "AI result not found" });
    }
    return res.json({ ok: true, result });
  } catch (err) {
    console.error("[ai_controller] get failed:", err);
    return res.status(500).json({ ok: false, message: "Failed to load AI result" });
  }
}

export async function getAiResultsByObservation(req, res) {
  try {
    const { observationId } = req.params;
    const results = await listAiResultsForObservation(observationId);
    return res.json({ ok: true, results });
  } catch (err) {
    console.error("[ai_controller] list by observation failed:", err);
    return res
      .status(500)
      .json({ ok: false, message: "Failed to load AI results for observation" });
  }
}
