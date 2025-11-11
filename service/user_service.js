import db from "../config/db.js";

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
      is_endangered,
      created_at
    FROM species
    WHERE COALESCE(is_endangered, 0) = 0
    ORDER BY common_name ASC
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
  const sql = `
    SELECT
      species_id,
      scientific_name,
      common_name,
      description,
      image_url,
      is_endangered,
      created_at
    FROM species
    WHERE species_id = ?
      AND COALESCE(is_endangered, 0) = 0
    LIMIT 1
  `;

  const [rows] = await db.query(sql, [speciesId]);
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
