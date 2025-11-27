import { describe, it, expect, beforeAll, vi } from "vitest";

// Mock environment variable
beforeAll(() => {
  // Generate a test master key (32 bytes base64)
  const testKey = Buffer.from("test-master-key-32-bytes-long!!").toString("base64");
  vi.stubEnv("ENCRYPTION_MASTER_KEY", testKey);
});

describe("Crypto utilities", () => {
  it("should generate a 32-byte data key", async () => {
    const { generateDataKey } = await import("./crypto");
    const key = generateDataKey();
    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32);
  });

  it("should wrap and unwrap data key correctly", async () => {
    const { generateDataKey, wrapDataKey, unwrapDataKey } = await import("./crypto");

    const originalKey = generateDataKey();
    const wrapped = wrapDataKey(originalKey);

    expect(typeof wrapped).toBe("string");
    expect(wrapped.length).toBeGreaterThan(0);

    const unwrapped = unwrapDataKey(wrapped);
    expect(unwrapped).toEqual(originalKey);
  });

  it("should encrypt and decrypt text correctly", async () => {
    const { generateDataKey, encrypt, decrypt } = await import("./crypto");

    const dataKey = generateDataKey();
    const plaintext = "Hello, this is a test journal entry with special chars: 日本語 🎉";

    const encrypted = encrypt(plaintext, dataKey);

    expect(encrypted.ciphertext).toBeTruthy();
    expect(encrypted.iv).toBeTruthy();
    expect(encrypted.authTag).toBeTruthy();
    expect(encrypted.ciphertext).not.toBe(plaintext);

    const decrypted = decrypt(encrypted, dataKey);
    expect(decrypted).toBe(plaintext);
  });

  it("should produce different ciphertexts for same plaintext (random IV)", async () => {
    const { generateDataKey, encrypt } = await import("./crypto");

    const dataKey = generateDataKey();
    const plaintext = "Same text";

    const encrypted1 = encrypt(plaintext, dataKey);
    const encrypted2 = encrypt(plaintext, dataKey);

    expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
    expect(encrypted1.iv).not.toBe(encrypted2.iv);
  });

  it("should fail to decrypt with wrong key", async () => {
    const { generateDataKey, encrypt, decrypt } = await import("./crypto");

    const key1 = generateDataKey();
    const key2 = generateDataKey();
    const plaintext = "Secret message";

    const encrypted = encrypt(plaintext, key1);

    expect(() => decrypt(encrypted, key2)).toThrow();
  });

  it("should fail to decrypt with tampered data", async () => {
    const { generateDataKey, encrypt, decrypt } = await import("./crypto");

    const dataKey = generateDataKey();
    const plaintext = "Secret message";

    const encrypted = encrypt(plaintext, dataKey);

    // Tamper with ciphertext
    const tamperedCiphertext = Buffer.from(encrypted.ciphertext, "base64");
    tamperedCiphertext[0] ^= 0xff;

    expect(() =>
      decrypt(
        {
          ...encrypted,
          ciphertext: tamperedCiphertext.toString("base64"),
        },
        dataKey
      )
    ).toThrow();
  });
});
