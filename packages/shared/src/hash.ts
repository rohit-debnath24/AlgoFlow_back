import { createHash } from "crypto";

export function sha256Hex(data: Uint8Array | string): string {
  const hash = createHash("sha256");
  hash.update(data);
  return hash.digest("hex");
}
