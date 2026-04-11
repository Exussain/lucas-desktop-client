import fs from "node:fs/promises";
import path from "node:path";
import { decryptJson, encryptJson } from "./crypto.js";

export class EncryptedCache {
  constructor(private readonly filePath: string, private readonly key: Buffer) {}

  async read<T>(): Promise<T | null> {
    try {
      const raw = await fs.readFile(this.filePath);
      return decryptJson<T>(raw, this.key);
    } catch {
      return null;
    }
  }

  async write(value: unknown): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const encrypted = encryptJson(value, this.key);
    await fs.writeFile(this.filePath, encrypted);
  }
}
