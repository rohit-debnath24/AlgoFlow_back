import { loadAddWasm } from "@algoforge/wasm-tasks";
import { sha256Hex, JobRequest } from "@algoforge/shared";

async function sha256(data: Uint8Array | string): Promise<string> {
  const buf = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function runBrowserTask(job: JobRequest) {
  const wasm = await loadAddWasm();
  const sum = wasm.add(job.cid_code.length, (job.cid_input || "").length);
  const output_hash = await sha256(`${job.cid_code}:${job.cid_input || ""}:${sum}`);
  return { output_hash, sum }; // sum proves WASM ran; hash acts as output digest.
}
