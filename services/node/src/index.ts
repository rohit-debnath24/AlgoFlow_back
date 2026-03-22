import Fastify from "fastify";
import cors from "@fastify/cors";
import { jobRequestSchema, JobReceipt, sha256Hex } from "@algoforge/shared";
import { randomUUID } from "crypto";
import { fetchCid, addFile } from "./ipfsClient";

const fastify = Fastify({ logger: true });
fastify.register(cors, { origin: "*" });
const MAX_BYTES = Number(process.env.MAX_JOB_BYTES || 2_000_000); // 2 MB
const JOB_TIMEOUT_MS = Number(process.env.JOB_TIMEOUT_MS || 8000);

async function fetchWithLimit(cid: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), JOB_TIMEOUT_MS);
  try {
    const data = await fetchCid(cid, controller.signal);
    if (data.byteLength > MAX_BYTES) {
      throw new Error(`CID ${cid} exceeds max bytes ${MAX_BYTES}`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

fastify.get("/health", async () => {
  return {
    status: "ok",
    node_id: "trusted-node-1",
    reputation: 100,
    bid_rate_microalgos: 10,
  };
});

fastify.post("/jobs", async (request, reply) => {
  const parsed = jobRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    reply.code(400);
    return { error: "invalid payload", issues: parsed.error.issues };
  }

  const job = parsed.data;
  const job_id = randomUUID();

  try {
    const codeBytes = await fetchWithLimit(job.cid_code);
    const inputBytes = job.cid_input ? await fetchWithLimit(job.cid_input) : new Uint8Array();

    // Placeholder execution: echo code+input hashes; real implementation would WASM/Docker exec with network disabled.
    const outputContent = new TextEncoder().encode(
      `job:${job_id}\ncode:${sha256Hex(codeBytes)}\ninput:${sha256Hex(inputBytes)}`
    );
    const output_hash = sha256Hex(outputContent);
    const cid_output = await addFile(outputContent, `job-${job_id}.txt`);

    const receipt: JobReceipt = {
      job_id,
      input_hash: sha256Hex(inputBytes),
      output_hash,
      status: "success",
      node_id: "trusted-node-1",
      fee_paid: job.max_fee,
    };

    return { ...receipt, cid_output };
  } catch (err) {
    request.log.error(err);
    reply.code(500);
    return { error: (err as Error).message, job_id };
  }
});

import { exec, spawn } from "child_process";
import { promisify } from "util";
import fs from "fs";
import os from "os";
import path from "path";
import net from "net";

const execAsync = promisify(exec);

async function getFreePort(): Promise<number> {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const port = (srv.address() as net.AddressInfo).port;
      srv.close(() => resolve(port));
    });
  });
}

fastify.post("/deploy-repo", async (request, reply) => {
  const { repoUrl, directory, token } = request.body as any;
  if (!repoUrl) {
    reply.code(400);
    return { error: "Missing repoUrl" };
  }

  const job_id = randomUUID();
  request.log.info(`Node received deployment request for ${repoUrl} (dir: ${directory})`);

  try {
    // Real Execution: Clone and Run
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "algoflow-node-deploy-"));
    request.log.info(`Cloning into ${tmpDir}`);
    
    // Inject GitHub Token to support private repositories seamlessly
    const authRepoUrl = token ? repoUrl.replace("https://", `https://${token}@`) : repoUrl;
    await execAsync(`git clone ${authRepoUrl} .`, { cwd: tmpDir });
    
    const targetDir = directory && directory !== "." ? path.join(tmpDir, directory) : tmpDir;
    
    // Check if package.json exists to install dependencies
    let command = "npm";
    let args = ["start"];

    if (fs.existsSync(path.join(targetDir, "package.json"))) {
      request.log.info("Installing dependencies from package.json...");
      await execAsync(`npm install`, { cwd: targetDir });
    } else {
      request.log.info("No package.json found. Identifying fallback entrypoint...");
      command = "node";
      await execAsync(`npm install express`, { cwd: targetDir }).catch(() => {}); // Safety net for simple apps

      if (fs.existsSync(path.join(targetDir, "index.js"))) {
        args = ["index.js"];
      } else if (fs.existsSync(path.join(targetDir, "app.js"))) {
        args = ["app.js"];
      } else if (fs.existsSync(path.join(targetDir, "server.js"))) {
        args = ["server.js"];
      } else {
         throw new Error("Deployment failed: Could not find package.json, index.js, app.js, or server.js to boot the application.");
      }
    }

    // Assign a dynamic port to prevent collisions
    const assignedPort = await getFreePort();

    // Spawn the app detached so it runs in background
    request.log.info(`Starting application on port ${assignedPort}...`);
    const logFilePath = path.join(os.tmpdir(), "algoflow-app.log");
    const out = fs.openSync(logFilePath, "a");
    const err = fs.openSync(logFilePath, "a");
    
    fs.appendFileSync(logFilePath, `\n\n--- NEW DEPLOYMENT (${assignedPort}) ---\n`);
    
    const child = spawn(command, args, { 
      cwd: targetDir, 
      detached: true, 
      stdio: ['ignore', out, err], 
      shell: true,
      env: { ...process.env, PORT: assignedPort.toString() }
    });
    
    child.unref();

    request.log.info("Opening public HTTP tunnel...");
    // Open a localtunnel so it's accessible globally
    const tunnel = spawn("npx", ["-y", "localtunnel", "--port", assignedPort.toString()], {
      shell: true,
      detached: true
    });
    
    tunnel.unref();

    return new Promise((resolve) => {
      tunnel.stdout.on("data", (data) => {
        const text = data.toString();
        const urlMatch = text.match(/your url is:\s*(https:\/\/[^\s]+)/);
        if (urlMatch) {
          const publicUrl = urlMatch[1];
          request.log.info(`Tunnel active: ${publicUrl}`);
          resolve({
            success: true,
            job_id,
            url: publicUrl,
            message: `Deployment successful! Your app is globally accessible at: ${publicUrl}`
          });
        }
      });
      
      tunnel.stderr.on("data", (data) => {
         request.log.error(`Tunnel Error: ${data.toString()}`);
      });
      
      // Fallback if localtunnel fails to connect within 6 seconds
      setTimeout(() => {
        const fallbackUrl = `http://localhost:${assignedPort}`;
        resolve({
          success: true,
          job_id,
          url: fallbackUrl,
          message: `Deployment successful! (Tunnel verification timed out. Internal access: ${fallbackUrl})`
        });
      }, 6000);
    });
  } catch (err) {
    request.log.error(err);
    reply.code(500);
    return { error: (err as Error).message };
  }
});

fastify.listen({ port: Number(process.env.PORT || 3001), host: "0.0.0.0" }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`executor listening on ${address}`);
});
