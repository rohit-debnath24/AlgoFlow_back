"use client";

import { useEffect, useMemo, useState } from "react";
import { routeTask, jobRequestSchema, JobReceipt } from "@algoforge/shared";
import { addFileToIpfs } from "../lib/ipfs";
import { runBrowserTask } from "../lib/browserTask";
import GithubDeployWidget from "./components/GithubDeployWidget";

// Types

type ReceiptWithCid = JobReceipt & { cid_output?: string };
type ApiReceipt = ReceiptWithCid | { error: string; job_id?: string };
type BrowserResult = ReceiptWithCid & { wasm_sum?: number };

const defaultJob = {
  cid_code: "",
  cid_input: "",
  max_fee: 0.1,
  size_class: "small" as const,
  redundancy: "auto" as const,
};

type UiState = "idle" | "running" | "done" | "error";

async function cryptoSubtleHash(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function Page() {
  const [job, setJob] = useState(defaultJob);
  const [uiState, setUiState] = useState<UiState>("idle");
  const [message, setMessage] = useState<string>("");
  const [receipt, setReceipt] = useState<ReceiptWithCid | BrowserResult | null>(null);
  const [uploadingCode, setUploadingCode] = useState(false);
  const [uploadingInput, setUploadingInput] = useState(false);
  const [deployCommand, setDeployCommand] = useState<string>("./deploy-backend-auto.sh");
  const executorUrl = process.env.NEXT_PUBLIC_EXECUTOR_URL || "http://localhost:3001";

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const isWindows = navigator.userAgent.toLowerCase().includes("windows");
      setDeployCommand(isWindows ? ".\\deploy-backend-auto.ps1" : "./deploy-backend-auto.sh");
    }
  }, []);

  const parsedJob = useMemo(() => jobRequestSchema.safeParse(job), [job]);
  const destination = useMemo(
    () => (parsedJob.success ? routeTask(parsedJob.data) : "browser"),
    [parsedJob]
  );

  async function handleUpload(file: File, kind: "code" | "input") {
    try {
      kind === "code" ? setUploadingCode(true) : setUploadingInput(true);
      const cid = await addFileToIpfs(file);
      setJob((prev) => ({ ...prev, [kind === "code" ? "cid_code" : "cid_input"]: cid }));
      setMessage(`Pinned ${kind} file to IPFS: ${cid}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      kind === "code" ? setUploadingCode(false) : setUploadingInput(false);
    }
  }

  async function submitJob(e: React.FormEvent) {
    e.preventDefault();
    try {
      setUiState("running");
      setMessage("");
      setReceipt(null);

      if (!parsedJob.success) {
        setUiState("error");
        setMessage("Fix validation errors before submitting.");
        return;
      }

      if (destination === "browser") {
        const browserOutput = await runBrowserTask(parsedJob.data);
        const browserReceipt: BrowserResult = {
          job_id: `browser-${Date.now()}`,
          input_hash: await cryptoSubtleHash(parsedJob.data.cid_input || ""),
          output_hash: browserOutput.output_hash,
          status: "success",
          node_id: "browser",
          fee_paid: 0,
          wasm_sum: browserOutput.sum,
        };
        setReceipt(browserReceipt);
        setUiState("done");
        return;
      }

      const res = await fetch(`${executorUrl}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedJob.data),
      });
      const json: ApiReceipt = await res.json();
      if (!res.ok || "error" in json) {
        throw new Error("error" in json ? json.error : `Executor error ${res.status}`);
      }
      setReceipt(json);
      setUiState("done");
    } catch (err) {
      console.error(err);
      setUiState("error");
      setMessage(err instanceof Error ? err.message : "Unknown error");
    }
  }

  function handleChange(field: string, value: string | number) {
    setJob((prev) => ({
      ...prev,
      [field]: Number.isNaN(value) ? 0 : value,
    }));
  }

  return (
    <div className="card">
      <h1>AlgoForge Lite</h1>
      <p>Hierarchical execution that defaults to the browser and pays only for success.</p>

      <GithubDeployWidget />

      <form onSubmit={submitJob} style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <label>
          Code CID
          <input
            required
            value={job.cid_code}
            onChange={(e) => handleChange("cid_code", e.target.value)}
            placeholder="bafy..."
          />
        </label>
        <label>
          Upload code file (pins to IPFS)
          <input
            type="file"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "code")}
            disabled={uploadingCode}
          />
          {uploadingCode && <small>Uploading...</small>}
        </label>
        <label>
          Input CID (optional)
          <input
            value={job.cid_input}
            onChange={(e) => handleChange("cid_input", e.target.value)}
            placeholder="bafy..."
          />
        </label>
        <label>
          Upload input file (pins to IPFS)
          <input
            type="file"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "input")}
            disabled={uploadingInput}
          />
          {uploadingInput && <small>Uploading...</small>}
        </label>
        <label>
          Max Fee (Algos)
          <input
            type="number"
            min="0"
            step="0.01"
            value={job.max_fee}
            onChange={(e) => handleChange("max_fee", e.target.valueAsNumber)}
          />
        </label>
        <label>
          Size Class
          <select
            value={job.size_class}
            onChange={(e) => handleChange("size_class", e.target.value)}
          >
            <option value="small">small (browser)</option>
            <option value="medium">medium (single node)</option>
            <option value="large">large (multi-node)</option>
          </select>
        </label>
        <label>
          Redundancy
          <select
            value={job.redundancy}
            onChange={(e) => handleChange("redundancy", e.target.value)}
          >
            <option value="auto">auto</option>
            <option value="force">force</option>
          </select>
        </label>

        <div className="card" style={{ background: "#0b162d", borderColor: "#1e293b" }}>
          <strong>Routing Decision:</strong> {destination}
          <p style={{ margin: "6px 0 0" }}>
            browser &rarr; 0 cost; single &rarr; lowest-bid trusted node; multi &rarr; selective verification.
          </p>
        </div>

        {!parsedJob.success && (
          <div style={{ color: "salmon" }}>
            {parsedJob.error.issues.map((issue, idx) => (
              <div key={idx}>
                {(issue.path.join(".") || "field") + ": " + issue.message}
              </div>
            ))}
          </div>
        )}

        <button type="submit" disabled={uiState === "running"}>
          {uiState === "running" ? "Submitting..." : "Submit"}
        </button>
      </form>

      {uiState === "done" && receipt && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Receipt</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(receipt, null, 2)}</pre>
          {"cid_output" in receipt && receipt.cid_output && (
            <p style={{ marginTop: 8 }}>
              Output CID: {receipt.cid_output}{" "}
              {process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL && (
                <a
                  href={`${process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL}/${receipt.cid_output}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  view
                </a>
              )}
            </p>
          )}
          {"wasm_sum" in receipt && typeof (receipt as BrowserResult).wasm_sum === "number" && (
            <p>Browser WASM sum: {(receipt as BrowserResult).wasm_sum}</p>
          )}
        </div>
      )}

      {uiState === "error" && <p style={{ color: "tomato" }}>{message}</p>}
      {message && uiState !== "error" && <p style={{ color: "#9ae6b4" }}>{message}</p>}
    </div>
  );
}
