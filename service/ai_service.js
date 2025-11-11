import db from "../config/db.js";
import { decryptPayloadJson, pickFromPayload } from "../modules/payload_utils.js";

function mapAiRow(row) {
  const payload = decryptPayloadJson(row.ai_payload_json);
  const fields = pickFromPayload(payload, row, [
    "confidence_score",
    "rank",
    "species_id",
  ]);

  return {
    ai_result_id: row.ai_result_id,
    observation_id: row.observation_id,
    species_id: fields.species_id,
    confidence_score: fields.confidence_score,
    rank: fields.rank,
    created_at: row.created_at,
    payload_decrypted: payload,
    observation: row.observation_id
      ? {
          observation_id: row.observation_id,
          user_id: row.observation_user_id,
          status: row.observation_status,
          photo_url: row.observation_photo_url,
        }
      : null,
  };
}

export async function listAiResults() {
  const sql = `
    SELECT
      ar.ai_result_id,
      ar.observation_id,
      ar.species_id,
      ar.confidence_score,
      ar.rank,
      ar.created_at,
      ar.ai_payload_json,
      po.user_id AS observation_user_id,
      po.status AS observation_status,
      po.photo_url AS observation_photo_url
    FROM ai_results ar
    LEFT JOIN plant_observations po ON po.observation_id = ar.observation_id
    ORDER BY ar.created_at DESC, ar.rank ASC
  `;

  const [rows] = await db.query(sql);
  return rows.map(mapAiRow);
}

export async function listAiResultsForObservation(observationId) {
  const sql = `
    SELECT
      ar.ai_result_id,
      ar.observation_id,
      ar.species_id,
      ar.confidence_score,
      ar.rank,
      ar.created_at,
      ar.ai_payload_json,
      po.user_id AS observation_user_id,
      po.status AS observation_status,
      po.photo_url AS observation_photo_url
    FROM ai_results ar
    LEFT JOIN plant_observations po ON po.observation_id = ar.observation_id
    WHERE ar.observation_id = ?
    ORDER BY ar.rank ASC
  `;

  const [rows] = await db.query(sql, [observationId]);
  return rows.map(mapAiRow);
}

export async function getAiResultById(aiResultId) {
  const sql = `
    SELECT
      ar.ai_result_id,
      ar.observation_id,
      ar.species_id,
      ar.confidence_score,
      ar.rank,
      ar.created_at,
      ar.ai_payload_json,
      po.user_id AS observation_user_id,
      po.status AS observation_status,
      po.photo_url AS observation_photo_url
    FROM ai_results ar
    LEFT JOIN plant_observations po ON po.observation_id = ar.observation_id
    WHERE ar.ai_result_id = ?
    LIMIT 1
  `;

  const [rows] = await db.query(sql, [aiResultId]);
  if (!rows.length) return null;
  return mapAiRow(rows[0]);
}
