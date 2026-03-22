import Fastify from "fastify";
import { jobRequestSchema, sha256Hex } from "@algoforge/shared";
import { randomUUID } from "crypto";
import { fetchCid, addFile } from "./ipfsClient.js";
const fastify = Fastify({ logger: true });
const MAX_BYTES = Number(process.env.MAX_JOB_BYTES || 2000000); // 2 MB
const JOB_TIMEOUT_MS = Number(process.env.JOB_TIMEOUT_MS || 8000);
async function fetchWithLimit(cid) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), JOB_TIMEOUT_MS);
    try {
        const data = await fetchCid(cid, controller.signal);
        if (data.byteLength > MAX_BYTES) {
            throw new Error(`CID ${cid} exceeds max bytes ${MAX_BYTES}`);
        }
        return data;
    }
    finally {
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
        const outputContent = new TextEncoder().encode(`job:${job_id}\ncode:${sha256Hex(codeBytes)}\ninput:${sha256Hex(inputBytes)}`);
        const output_hash = sha256Hex(outputContent);
        const cid_output = await addFile(outputContent, `job-${job_id}.txt`);
        const receipt = {
            job_id,
            input_hash: sha256Hex(inputBytes),
            output_hash,
            status: "success",
            node_id: "trusted-node-1",
            fee_paid: job.max_fee,
        };
        return { ...receipt, cid_output };
    }
    catch (err) {
        request.log.error(err);
        reply.code(500);
        return { error: err.message, job_id };
    }
});
fastify.listen({ port: Number(process.env.PORT || 3001), host: "0.0.0.0" }, (err, address) => {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    fastify.log.info(`executor listening on ${address}`);
});
