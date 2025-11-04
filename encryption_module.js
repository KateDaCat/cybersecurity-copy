import crypto from "crypto";        // Node built-in library for encryption
import dotenv from "dotenv";        // To read values from .env file
dotenv.config();                    // Load environment variables into process.env

// Encryption settings
const ALGO = "aes-256-gcm";         // AES encryption with GCM mode
const KEY_LEN = 32;                 // 32 bytes = 256-bit key
const IV_LEN = 12;                  // 12 bytes IV

// Load secret key from .env file
function loadKey() {
  const b64 = process.env.DATA_KEY_B64;      // Read base64-encoded key from .env
  if (!b64) {
    console.log("Missing DATA_KEY_B64 in .env file."); // Print warning if missing
    return null;                           // Stop if no key
  }

  const key = Buffer.from(b64, "base64");   // Convert base64 string to bytes
  if (key.length !== KEY_LEN) {
    console.log("DATA_KEY_B64 must decode to 32 bytes."); // Warn if wrong key size
    return null;
  }

  return key;                               // Return valid key for use
}

// Encrypt text data (used for species details or observation location)
export function encryptText(text) {
  if (!text) {                              // Make sure text is not empty
    console.log("No text provided to encrypt.");
    return null;
  }

  const key = loadKey();                    // Load the secret key
  if (!key) return null;                    // Stop if key missing

  const iv = crypto.randomBytes(IV_LEN);    // Create a new random IV each time
  const cipher = crypto.createCipheriv(ALGO, key, iv); // Create encryption object

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),            // Encrypt text (part 1)
    cipher.final()                          // Finalize encryption (part 2)
  ]);

  const tag = cipher.getAuthTag();          // Get tag for data integrity check

  // Return encrypted data bundle
  return {
    iv: iv.toString("base64"),              // IV (Base64 format)
    ct: encrypted.toString("base64"),       // Ciphertext (Base64)
    tag: tag.toString("base64")             // Authentication tag (Base64)
  };
}

// Decrypt text data (used when reading from database)
export function decryptText(bundle) {
  if (!bundle || !bundle.iv || !bundle.ct || !bundle.tag) {
    console.log("Invalid encrypted bundle.");
    return null;
  }

  const key = loadKey();                    // Load secret key again
  if (!key) return null;                    // Stop if key missing

  const iv = Buffer.from(bundle.iv, "base64");  // Convert Base64 to bytes
  const ct = Buffer.from(bundle.ct, "base64");
  const tag = Buffer.from(bundle.tag, "base64");

  const decipher = crypto.createDecipheriv(ALGO, key, iv); // Create decryption object
  decipher.setAuthTag(tag);                  // Set tag for integrity check

  const decrypted = Buffer.concat([
    decipher.update(ct),                     // Decrypt part 1
    decipher.final()                         // Decrypt part 2
  ]);

  return decrypted.toString("utf8");         // Return readable text
}

// Storing/retrieving JSON in database
export function bundleToDB(obj) {            // Object → JSON string
  return JSON.stringify(obj);
}

export function bundleFromDB(str) {          // JSON string → Object
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

// Test
if (process.argv[1].endsWith("encryption_module.js")) {
  const sampleDetails = "Endangered: Found only in protected forest.";
  const sampleCoords = JSON.stringify({ lat: 1.234, lng: 110.678 });

  console.log("Original details:", sampleDetails);
  console.log("Original location:", sampleCoords);

  const encDetails = encryptText(sampleDetails);
  const encCoords = encryptText(sampleCoords);

  console.log("Encrypted details:", encDetails);
  console.log("Encrypted location:", encCoords);

  const decDetails = decryptText(encDetails);
  const decCoords = decryptText(encCoords);

  console.log("Decrypted details:", decDetails);
  console.log("Decrypted location:", decCoords);
}
