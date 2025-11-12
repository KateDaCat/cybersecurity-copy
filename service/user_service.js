import db from "../config/db.js";

function normalizeId(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) return null;
  return num;
}

/**
 * Returns all species that are safe for public consumption (non-endangered).
 * These rows should not contain encrypted payloads, but we defensively exclude them.
 */
export async function listPublicSpecies() {
  const sql = `
    SELECT
      species_id,
      scientific_name,
      common_name,
      description,
      image_url,
      created_at
    FROM species
    WHERE COALESCE(is_endangered, 0) = 0
    ORDER BY common_name ASC, scientific_name ASC
  `;

  const [rows] = await db.query(sql);
  return rows.map((row) => ({
    species_id: row.species_id,
    scientific_name: row.scientific_name,
    common_name: row.common_name,
    description: row.description,
    image_url: row.image_url,
    created_at: row.created_at,
  }));
}

/**
 * Load a single non-endangered species. Returns null if endangered/unknown.
 */
export async function getPublicSpeciesById(speciesId) {
  const id = normalizeId(speciesId);
  if (!id) return null;

  const sql = `
    SELECT
      species_id,
      scientific_name,
      common_name,
      description,
      image_url,
      created_at
    FROM species
    WHERE species_id = ?
      AND COALESCE(is_endangered, 0) = 0
    LIMIT 1
  `;

  const [rows] = await db.query(sql, [id]);
  const row = rows[0];
  if (!row) return null;

  return {
    species_id: row.species_id,
    scientific_name: row.scientific_name,
    common_name: row.common_name,
    description: row.description,
    image_url: row.image_url,
    created_at: row.created_at,
  };
}

export async function listPublicObservations() {
  const sql = `
    SELECT
      po.observation_id,
      po.species_id,
      s.scientific_name,
      s.common_name,
      s.image_url,
      po.photo_url,
      po.location_name,
      po.location_latitude,
      po.location_longitude,
      po.notes,
      po.status,
      po.created_at
    FROM plant_observations po
    INNER JOIN species s ON s.species_id = po.species_id
    WHERE COALESCE(s.is_endangered, 0) = 0
      AND po.status = 'verified'
    ORDER BY po.created_at DESC, po.observation_id DESC
  `;

  const [rows] = await db.query(sql);
  return rows.map((row) => ({
    observation_id: row.observation_id,
    species: {
      species_id: row.species_id,
      scientific_name: row.scientific_name,
      common_name: row.common_name,
      image_url: row.image_url,
    },
    photo_url: row.photo_url,
    location: {
      name: row.location_name,
      latitude: row.location_latitude,
      longitude: row.location_longitude,
    },
    notes: row.notes,
    status: row.status,
    observed_at: row.created_at,
  }));
}
