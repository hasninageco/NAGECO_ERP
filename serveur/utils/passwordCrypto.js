const crypto = require("crypto");

const ENCRYPTION_KEY = "NAGECO2023";
const SALT = Buffer.from([
  0x49, 0x76, 0x61, 0x6e, 0x20, 0x4d,
  0x65, 0x64, 0x76, 0x65, 0x64, 0x65,
  0x76,
]);

// Match VB Rfc2898DeriveBytes default settings for compatibility.
const PBKDF2_ITERATIONS = 1000;
const PBKDF2_DIGEST = "sha1";

function deriveKeyAndIv() {
  const keyIv = crypto.pbkdf2Sync(
    ENCRYPTION_KEY,
    SALT,
    PBKDF2_ITERATIONS,
    48,
    PBKDF2_DIGEST
  );

  return {
    key: keyIv.subarray(0, 32),
    iv: keyIv.subarray(32, 48),
  };
}

function encrypt(clearText) {
  const { key, iv } = deriveKeyAndIv();
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const clearBytes = Buffer.from(String(clearText), "utf16le");
  const encrypted = Buffer.concat([cipher.update(clearBytes), cipher.final()]);
  return encrypted.toString("base64");
}

function decrypt(cipherText) {
  try {
    const { key, iv } = deriveKeyAndIv();
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    const cipherBytes = Buffer.from(String(cipherText), "base64");
    const decrypted = Buffer.concat([decipher.update(cipherBytes), decipher.final()]);
    return decrypted.toString("utf16le");
  } catch (_err) {
    // Mirror VB On Error Resume Next behavior for invalid data.
    return null;
  }
}

module.exports = {
  encrypt,
  decrypt,
};
