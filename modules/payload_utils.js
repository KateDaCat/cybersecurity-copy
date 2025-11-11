import { decryptText, loadBundle } from "./encryption_module.js";

/**
 * Decrypts a JSON payload that was previously stored via saveBundle(encryptText(JSON.stringify(obj))).
 * Returns the parsed object or null if anything fails (missing bundle, decryption error, parse error).
 */
export function decryptPayloadJson(bundleJson) {
  if (!bundleJson) return null;

  const bundle = loadBundle(bundleJson);
  if (!bundle) return null;

  const decrypted = decryptText(bundle);
  if (!decrypted) return null;

  try {
    return JSON.parse(decrypted);
  } catch (err) {
    console.warn("[payload_utils] Failed to parse decrypted payload:", err.message);
    return null;
  }
}

/**
 * Helper to coalesce decrypted payload properties with the fallback record.
 * Takes an ordered list of field names and builds an object using decrypted values when available.
 */
export function pickFromPayload(payload, fallback, fields) {
  const out = {};
  fields.forEach((field) => {
    if (payload && Object.prototype.hasOwnProperty.call(payload, field)) {
      out[field] = payload[field];
    } else if (fallback && Object.prototype.hasOwnProperty.call(fallback, field)) {
      out[field] = fallback[field];
    } else {
      out[field] = null;
    }
  });
  return out;
}
