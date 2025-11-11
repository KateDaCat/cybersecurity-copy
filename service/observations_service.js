import db from "../config/db.js";
import { decryptPayloadJson, pickFromPayload } from "../modules/payload_utils.js";

function baseObservation(row) {
  const payload = decryptPayloadJson(row.observation_payload_json);
  const fields = pickFromPayload(payload, row, [
    "location_name",
    "location_latitude",
    "location_longitude",
    "notes",
    "status",
  ]);

  return {
    observation_id: row.observation_id,
    user_id: row.user_id,
    species_id: row.species_id,
    photo_url: row.photo_url,
    location_name: fields.location_name,
    location_latitude: fields.location_latitude,
    location_longitude: fields.location_longitude,
    notes: fields.notes,
    status: fields.status,
    created_at: row.created_at,
    payload_decrypted: payload,
    ai_results: [],
  };
}

function mapAiResult(row) {
  const aiPayload = decryptPayloadJson(row.ai_payload_json);
  return {
    ai_result_id: row.ai_result_id,
    observation_id: row.observation_id,
    species_id: row.ai_species_id ?? row.species_id,
    confidence_score: row.confidence_score,
    rank: row.rank,
    created_at: row.ai_created_at,
    payload_decrypted: aiPayload,
  };
}

export async function listObservationsWithAi() {
  const sql = `
    SELECT
      po.observation_id,
      po.user_id,
      po.species_id,
      po.photo_url,
      po.location_latitude,
      po.location_longitude,
      po.location_name,
      po.notes,
      po.status,
      po.created_at,
      po.observation_payload_json,
      ar.ai_result_id,
      ar.species_id AS ai_species_id,
      ar.confidence_score,
      ar.rank,
      ar.created_at AS ai_created_at,
      ar.ai_payload_json
    FROM plant_observations po
    LEFT JOIN ai_results ar ON ar.observation_id = po.observation_id
    ORDER BY po.created_at DESC, ar.rank ASC
  `;

  const [rows] = await db.query(sql);
  const map = new Map();

  rows.forEach((row) => {
    let entry = map.get(row.observation_id);
    if (!entry) {
      entry = baseObservation(row);
      map.set(row.observation_id, entry);
    }

    if (row.ai_result_id) {
      entry.ai_results.push(mapAiResult(row));
    }
  });

  return Array.from(map.values());
}

export async function getObservationWithAiById(observationId) {
  const sql = `
    SELECT
      po.observation_id,
      po.user_id,
      po.species_id,
      po.photo_url,
      po.location_latitude,
      po.location_longitude,
      po.location_name,
      po.notes,
      po.status,
      po.created_at,
      po.observation_payload_json,
      ar.ai_result_id,
      ar.species_id AS ai_species_id,
      ar.confidence_score,
      ar.rank,
      ar.created_at AS ai_created_at,
      ar.ai_payload_json
    FROM plant_observations po
    LEFT JOIN ai_results ar ON ar.observation_id = po.observation_id
    WHERE po.observation_id = ?
    ORDER BY ar.rank ASC
  `;

  const [rows] = await db.query(sql, [observationId]);
  if (!rows.length) return null;

  const first = rows[0];
  const observation = baseObservation(first);
  rows.forEach((row) => {
    if (row.ai_result_id) observation.ai_results.push(mapAiResult(row));
  });

  return observation;
}
