"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Repo = {
  id: number;
  name: string;
  full_name: string;
  clone_url: string;
};

type ContentNode = {
  name: string;
  path: string;
  type: "file" | "dir";
};

type ProviderNode = {
  id: string;
  provider: { name: string };
  endpointUrl: string;
};

export default function GithubDeployWidget() {
  const { data: session } = useSession();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [directories, setDirectories] = useState<ContentNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [nodes, setNodes] = useState<ProviderNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");
  const [uiState, setUiState] = useState<"idle" | "loading" | "deploying" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // @ts-ignore
    const token = session?.accessToken;
    if (token) {
      fetchRepos(token);
    }
    fetchMarketplaceNodes();
  }, [session]);

  async function fetchMarketplaceNodes() {
    try {
      const res = await fetch("/api/marketplace/nodes");
      const data = await res.json();
      if (data.nodes) setNodes(data.nodes);
    } catch (e) {
      console.error("Failed to fetch nodes");
    }
  }

  async function fetchRepos(token: string) {
    setUiState("loading");
    try {
      const res = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch GitHub repos");
      const data = await res.json();
      setRepos(data);
      setUiState("idle");
    } catch (err) {
      setMessage((err as Error).message);
      setUiState("error");
    }
  }

  async function fetchDirectoryContents(repoFullName: string, path: string = "") {
    // @ts-ignore
    const token = session?.accessToken;
    if (!token) return;
    
    try {
      setUiState("loading");
      const res = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not fetch directory contents");
      const data: ContentNode[] = await res.json();
      const dirs = data.filter(d => d.type === "dir");
      setDirectories(dirs);
      setUiState("idle");
    } catch (err) {
      setMessage((err as Error).message);
      setUiState("error");
    }
  }

  function handleRepoChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const r = repos.find(x => x.full_name === e.target.value);
    setSelectedRepo(r || null);
    setSelectedPath("");
    if (r) {
      fetchDirectoryContents(r.full_name, "");
    }
  }

  async function deploy() {
    if (!selectedRepo || !selectedNodeId) return;
    setUiState("deploying");
    setMessage("");

    try {
      // @ts-ignore
      const token = session?.accessToken;
      
      const res = await fetch("/api/deploy/remote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: selectedRepo.clone_url,
          directory: selectedPath || ".",
          nodeId: selectedNodeId,
          token: token
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deployment failed");
      
      setUiState("success");
      setMessage("Deployment payload securely transmitted to the Provider Node!");
    } catch (err) {
      setUiState("error");
      setMessage((err as Error).message);
    }
  }

  if (!session) {
    return (
      <div className="card" style={{ background: "#0b162d", borderColor: "#1e293b", padding: 24, marginBottom: 20 }}>
        <h2 style={{ background: 'linear-gradient(to right, #22d3ee, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Cloud Deployment
        </h2>
        <p style={{ color: "var(--text-secondary)" }}>Log in with GitHub to auto-deploy your repositories to decentralized nodes.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ background: "#0b162d", borderColor: "#1e293b", padding: 24, marginBottom: 20 }}>
      <h2 style={{ background: 'linear-gradient(to right, #22d3ee, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 16 }}>
        Deploy Repository to Network Node
      </h2>
      
      <div style={{ display: "grid", gap: 16 }}>
        <label>
          Select GitHub Repository
          <select value={selectedRepo?.full_name || ""} onChange={handleRepoChange} disabled={uiState === "loading"}>
            <option value="">-- Choose Repository --</option>
            {repos.map(r => (
              <option key={r.id} value={r.full_name}>{r.full_name}</option>
            ))}
          </select>
        </label>

        {selectedRepo && directories.length > 0 && (
          <label>
            Select Sub-directory (Optional)
            <select value={selectedPath} onChange={e => setSelectedPath(e.target.value)}>
              <option value="">Root (./)</option>
              {directories.map(d => (
                <option key={d.path} value={d.path}>{d.path}</option>
              ))}
            </select>
          </label>
        )}

        <label>
          Select Target Provider Node
          <select value={selectedNodeId} onChange={e => setSelectedNodeId(e.target.value)}>
            <option value="">-- Choose a Node from Marketplace --</option>
            {nodes.map(n => (
              <option key={n.id} value={n.id}>{n.provider.name} - {n.endpointUrl}</option>
            ))}
          </select>
        </label>

        {uiState === "error" && <p style={{ color: "tomato", margin: 0 }}>{message}</p>}
        {uiState === "success" && <p style={{ color: "var(--success)", margin: 0 }}>{message}</p>}

        <button 
          onClick={deploy} 
          disabled={!selectedRepo || !selectedNodeId || uiState === "deploying"}
          style={{ width: "fit-content" }}
        >
          {uiState === "deploying" ? "Transmitting..." : "Deploy Workspace"}
        </button>
      </div>
    </div>
  );
}
