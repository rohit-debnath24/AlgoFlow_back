const apiUrl = process.env.NEXT_PUBLIC_IPFS_API_URL || "http://localhost:5001/api/v0";

export async function addFileToIpfs(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file, file.name || "upload.bin");
  const res = await fetch(`${apiUrl}/add`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`IPFS add failed: ${res.status}`);
  const text = await res.text();
  const match = text.match(/"Hash"\s*:\s*"([^"]+)"/);
  if (!match) throw new Error(`Unexpected IPFS response: ${text}`);
  return match[1];
}
