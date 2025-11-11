import db from "../config/db.js";
import { decryptPayloadJson, pickFromPayload } from "../modules/payload_utils.js";

function mapDevice(row) {
  const payload = decryptPayloadJson(row.device_payload_json);
  const fields = pickFromPayload(payload, row, [
    "node_id",
    "device_name",
    "species_id",
    "location_latitude",
    "location_longitude",
    "is_active",
  ]);

  return {
    device_id: row.device_id,
    node_id: fields.node_id,
    device_name: fields.device_name,
    species_id: fields.species_id,
    location_latitude: fields.location_latitude,
    location_longitude: fields.location_longitude,
    is_active: Boolean(fields.is_active),
    created_at: row.device_created_at,
    payload_decrypted: payload,
    readings: [],
  };
}

function mapReading(row) {
  const payload = decryptPayloadJson(row.reading_payload_json);
  const fields = pickFromPayload(payload, row, [
    "temperature",
    "humidity",
    "soil_moisture",
    "motion_detected",
    "reading_status",
    "alert_generated",
    "location_latitude",
    "location_longitude",
    "reading_timestamp",
  ]);

  return {
    reading_id: row.reading_id,
    device_id: row.device_id,
    temperature: fields.temperature,
    humidity: fields.humidity,
    soil_moisture: fields.soil_moisture,
    motion_detected: fields.motion_detected,
    reading_status: fields.reading_status,
    alert_generated: fields.alert_generated,
    location_latitude: fields.location_latitude,
    location_longitude: fields.location_longitude,
    reading_timestamp: fields.reading_timestamp,
    payload_decrypted: payload,
  };
}

export async function listDevicesWithReadings() {
  const sql = `
    SELECT
      sd.device_id,
      sd.node_id,
      sd.device_name,
      sd.species_id,
      sd.location_latitude,
      sd.location_longitude,
      sd.is_active,
      sd.created_at AS device_created_at,
      sd.device_payload_json,
      sr.reading_id,
      sr.temperature,
      sr.humidity,
      sr.soil_moisture,
      sr.motion_detected,
      sr.reading_status,
      sr.alert_generated,
      sr.location_latitude AS reading_location_latitude,
      sr.location_longitude AS reading_location_longitude,
      sr.reading_timestamp,
      sr.reading_payload_json
    FROM sensor_devices sd
    LEFT JOIN sensor_readings sr ON sr.device_id = sd.device_id
    ORDER BY sd.device_id ASC, sr.reading_timestamp DESC
  `;

  const [rows] = await db.query(sql);
  const map = new Map();

  rows.forEach((row) => {
    let device = map.get(row.device_id);
    if (!device) {
      device = mapDevice(row);
      map.set(row.device_id, device);
    }

    if (row.reading_id) {
      const readingRow = {
        ...row,
        location_latitude: row.reading_location_latitude,
        location_longitude: row.reading_location_longitude,
      };
      device.readings.push(mapReading(readingRow));
    }
  });

  return Array.from(map.values());
}

export async function getDeviceWithReadings(deviceId) {
  const sql = `
    SELECT
      sd.device_id,
      sd.node_id,
      sd.device_name,
      sd.species_id,
      sd.location_latitude,
      sd.location_longitude,
      sd.is_active,
      sd.created_at AS device_created_at,
      sd.device_payload_json,
      sr.reading_id,
      sr.temperature,
      sr.humidity,
      sr.soil_moisture,
      sr.motion_detected,
      sr.reading_status,
      sr.alert_generated,
      sr.location_latitude AS reading_location_latitude,
      sr.location_longitude AS reading_location_longitude,
      sr.reading_timestamp,
      sr.reading_payload_json
    FROM sensor_devices sd
    LEFT JOIN sensor_readings sr ON sr.device_id = sd.device_id
    WHERE sd.device_id = ?
    ORDER BY sr.reading_timestamp DESC
  `;

  const [rows] = await db.query(sql, [deviceId]);
  if (!rows.length) return null;

  const base = mapDevice(rows[0]);
  rows.forEach((row) => {
    if (row.reading_id) {
      const readingRow = {
        ...row,
        location_latitude: row.reading_location_latitude,
        location_longitude: row.reading_location_longitude,
      };
      base.readings.push(mapReading(readingRow));
    }
  });

  return base;
}
