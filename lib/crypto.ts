import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getMasterKey(): Buffer {
  const masterKeyBase64 = process.env.ENCRYPTION_MASTER_KEY;
  if (!masterKeyBase64) {
    throw new Error("ENCRYPTION_MASTER_KEY environment variable is not set");
  }
  const key = Buffer.from(masterKeyBase64, "base64");
  if (key.length !== KEY_LENGTH) {
    throw new Error(`Master key must be ${KEY_LENGTH} bytes`);
  }
  return key;
}

export function generateDataKey(): Buffer {
  return randomBytes(KEY_LENGTH);
}

export function wrapDataKey(dataKey: Buffer): string {
  const masterKey = getMasterKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, masterKey, iv);

  const encrypted = Buffer.concat([cipher.update(dataKey), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Format: iv + authTag + encrypted
  const result = Buffer.concat([iv, authTag, encrypted]);
  return result.toString("base64");
}

export function unwrapDataKey(wrappedKey: string): Buffer {
  const masterKey = getMasterKey();
  const data = Buffer.from(wrappedKey, "base64");

  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, masterKey, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export function encrypt(plaintext: string, dataKey: Buffer): EncryptedData {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, dataKey, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function decrypt(
  encryptedData: EncryptedData,
  dataKey: Buffer
): string {
  const iv = Buffer.from(encryptedData.iv, "base64");
  const authTag = Buffer.from(encryptedData.authTag, "base64");
  const ciphertext = Buffer.from(encryptedData.ciphertext, "base64");

  const decipher = createDecipheriv(ALGORITHM, dataKey, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

export async function getOrCreateUserDataKey(
  userId: string,
  supabase: {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          single: () => Promise<{ data: { wrapped_data_key: string } | null; error: Error | null }>;
        };
      };
      insert: (data: object) => {
        select: (columns: string) => {
          single: () => Promise<{ data: { wrapped_data_key: string } | null; error: Error | null }>;
        };
      };
    };
  }
): Promise<Buffer> {
  // Try to get existing key
  const { data: existingKey, error: fetchError } = await supabase
    .from("user_keys")
    .select("wrapped_data_key")
    .eq("user_id", userId)
    .single();

  if (existingKey && !fetchError) {
    return unwrapDataKey(existingKey.wrapped_data_key);
  }

  // Create new data key for user
  const dataKey = generateDataKey();
  const wrappedKey = wrapDataKey(dataKey);

  const { error: insertError } = await supabase
    .from("user_keys")
    .insert({
      user_id: userId,
      wrapped_data_key: wrappedKey,
    })
    .select("wrapped_data_key")
    .single();

  if (insertError) {
    // Race condition - another request created the key
    const { data: retryKey } = await supabase
      .from("user_keys")
      .select("wrapped_data_key")
      .eq("user_id", userId)
      .single();

    if (retryKey) {
      return unwrapDataKey(retryKey.wrapped_data_key);
    }
    throw new Error("Failed to create or retrieve user data key");
  }

  return dataKey;
}

// For key rotation: re-wraps all data keys with a new master key
// This would be run as a migration script
export function reWrapDataKey(wrappedKey: string, newMasterKeyBase64: string): string {
  // First unwrap with current master key
  const dataKey = unwrapDataKey(wrappedKey);

  // Then wrap with new master key
  const newMasterKey = Buffer.from(newMasterKeyBase64, "base64");
  if (newMasterKey.length !== KEY_LENGTH) {
    throw new Error(`New master key must be ${KEY_LENGTH} bytes`);
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, newMasterKey, iv);
  const encrypted = Buffer.concat([cipher.update(dataKey), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const result = Buffer.concat([iv, authTag, encrypted]);
  return result.toString("base64");
}
