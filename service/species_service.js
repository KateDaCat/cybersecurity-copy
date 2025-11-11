import db from "../config/db.js";
import { decryptPayloadJson, pickFromPayload } from "../modules/payload_utils.js";

function mapSpeciesRow(row) {
  const payload = decryptPayloadJson(row.species_payload_json);

  const fields = pickFromPayload(payload, row, [
    "scientific_name",
    "common_name",
    "description",
    "image_url",
    "is_endangered",
  ]);

  return {
    species_id: row.species_id,
    scientific_name: fields.scientific_name,
    common_name: fields.common_name,
    description: fields.description,
    image_url: fields.image_url,
    is_endangered: Boolean(fields.is_endangered),
    created_at: row.created_at,
    payload_decrypted: payload,
    has_encrypted_payload: Boolean(row.species_payload_json),
  };
}

export async function listSpeciesFull() {
  const sql = `
    SELECT
      species_id,
      scientific_name,
      common_name,
      is_endangered,
      description,
      image_url,
      species_payload_json,
      created_at
    FROM species
    ORDER BY created_at DESC, species_id DESC
  `;

  const [rows] = await db.query(sql);
  return rows.map(mapSpeciesRow);
}

export async function getSpeciesFullById(speciesId) {
  const sql = `
    SELECT
      species_id,
      scientific_name,
      common_name,
      is_endangered,
      description,
      image_url,
      species_payload_json,
      created_at
    FROM species
    WHERE species_id = ?
    LIMIT 1
  `;

  const [rows] = await db.query(sql, [speciesId]);
  if (!rows.length) return null;
  return mapSpeciesRow(rows[0]);
}
