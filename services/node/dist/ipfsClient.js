const defaultGateway = process.env.IPFS_GATEWAY_URL || "http://ipfs:8080/ipfs";
const defaultApi = process.env.IPFS_API_URL || "http://ipfs:5001/api/v0";
export async function fetchCid(cid, signal) {
    const url = `${defaultGateway}/${cid}`;
    const res = await fetch(url, { signal });
    if (!res.ok)
        throw new Error(`Failed to fetch CID ${cid}: ${res.status}`);
    const buf = new Uint8Array(await res.arrayBuffer());
    return buf;
}
export async function addFile(content, filename = "output.bin") {
    const form = new FormData();
    form.append("file", new Blob([content]), filename);
    const res = await fetch(`${defaultApi}/add`, {
        method: "POST",
        body: form,
    });
    if (!res.ok)
        throw new Error(`Failed to add to IPFS: ${res.status}`);
    const text = await res.text();
    const match = text.match(/"Hash"\s*:\s*"([^"]+)"/);
    if (!match)
        throw new Error(`Unexpected IPFS add response: ${text}`);
    return match[1];
}
