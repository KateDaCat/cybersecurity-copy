import db from "../config/db.js";
import {
  encryptText,
  saveBundle,
} from "../modules/encryption_module.js";

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeText(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function buildLocationPayload({ location_name, latitude, longitude }) {
  const payload = {};
  const cleanName = normalizeText(location_name);
  const lat = toNumber(latitude);
  const lng = toNumber(longitude);

  if (cleanName) payload.location_name = cleanName;
  if (lat !== null && lng !== null) {
    payload.coordinates = { latitude: lat, longitude: lng };
  }

  return Object.keys(payload).length ? payload : null;
}

export async function submitObservation({
  user_id,
  species_id,
  photo_url,
  location_name,
  latitude,
  longitude,
  notes,
  source,
}) {
  const userId = toNumber(user_id);
  if (!userId) {
    throw new Error("Valid user_id is required");
  }

  const speciesId = toNumber(species_id);
  if (!speciesId) {
    throw new Error("Valid species_id is required");
  }

  const photoUrl = normalizeText(photo_url);
  if (!photoUrl) {
    throw new Error("photo_url is required");
  }

  const locationPayload = buildLocationPayload({
    location_name,
    latitude,
    longitude,
  });

  let encryptedPayloadJson = null;
  if (locationPayload) {
    const json = JSON.stringify(locationPayload);
    const encrypted = encryptText(json);
    if (!encrypted) {
      throw new Error("Failed to encrypt location payload");
    }
    encryptedPayloadJson = saveBundle(encrypted);
  }

  const latValue = locationPayload?.coordinates?.latitude ?? null;
  const lngValue = locationPayload?.coordinates?.longitude ?? null;
  const locationNameValue = locationPayload?.location_name ?? null;

  const notesText = normalizeText(notes) || null;
  const sourceText = normalizeText(source) || null;

  const [result] = await db.execute(
    `
      INSERT INTO plant_observations
        (user_id,
         species_id,
         photo_url,
         location_name,
         location_latitude,
         location_longitude,
         notes,
         source,
         status,
         observation_payload_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?)
    `,
    [
      userId,
      speciesId,
      photoUrl,
      locationNameValue,
      latValue,
      lngValue,
      notesText,
      sourceText,
      encryptedPayloadJson,
    ]
  );

  return { ok: true, observation_id: result.insertId };
}
