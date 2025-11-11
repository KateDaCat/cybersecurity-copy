// test_encryption_insert.js
import db from "./config/db.js";
import { encryptText, saveBundle } from "./modules/encryption_module.js";

// 1️⃣ Function to insert encrypted data
async function insertEncryptedSpecies() {
  try {
    // Sample endangered species
    const endangered = {
      scientific_name: "Rafflesia arnoldii",
      common_name: "Corpse Flower",
      is_endangered: 1,
      description: "A rare parasitic plant found in Southeast Asia.",
      image_url: "https://example.com/rafflesia.jpg"
    };

    // Sample non-endangered species
    const nonEndangered = {
      scientific_name: "Chamaedorea seifrizii",
      common_name: "Bamboo Palm",
      is_endangered: 0,
      description: "A common ornamental indoor palm species.",
      image_url: "https://example.com/bamboopalm.jpg"
    };

    // Encrypt both payloads
    const endangeredPayload = encryptText(JSON.stringify(endangered));
    const nonEndangeredPayload = encryptText(JSON.stringify(nonEndangered));

    // Convert to JSON string for DB
    const endangeredJson = saveBundle(endangeredPayload);
    const nonEndangeredJson = saveBundle(nonEndangeredPayload);

    // Insert into species table
    const sql = `INSERT INTO species (scientific_name, common_name, is_endangered, description, image_url, species_payload_json)
                 VALUES (?, ?, ?, ?, ?, ?)`;

    await db.query(sql, [
      endangered.scientific_name,
      endangered.common_name,
      endangered.is_endangered,
      endangered.description,
      endangered.image_url,
      endangeredJson
    ]);

    await db.query(sql, [
      nonEndangered.scientific_name,
      nonEndangered.common_name,
      nonEndangered.is_endangered,
      nonEndangered.description,
      nonEndangered.image_url,
      nonEndangeredJson
    ]);

    console.log("✅ Mock data inserted successfully with encryption!");
  } catch (err) {
    console.error("❌ Error inserting encrypted data:", err);
  } finally {
    db.end();
  }
}

// Run the test
insertEncryptedSpecies();
