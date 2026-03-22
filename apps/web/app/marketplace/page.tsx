"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

type ProviderNode = {
  id: string;
  endpointUrl: string;
  status: string;
  cpuCoreCount: number;
  ramGb: number;
  bidRateMicroAlgos: number;
  provider: {
    name: string;
    reputation: number;
  };
};

export default function MarketplacePage() {
  const { data: session } = useSession();
  const [nodes, setNodes] = useState<ProviderNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchNodes() {
      try {
        const res = await fetch("/api/marketplace/nodes");
        if (!res.ok) throw new Error("Failed to load nodes");
        const data = await res.json();
        setNodes(data.nodes || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchNodes();
  }, []);

  return (
    <div style={{ maxWidth: 1080, margin: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h1 style={{ fontSize: '2.5rem', background: 'linear-gradient(to right, #f8fafc, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Compute Network
        </h1>
        {session ? (
          <Link href="/marketplace/register">
            <button>Register Node +</button>
          </Link>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>Log in to register a node</p>
        )}
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: 40 }}>
        Access the decentralized compute grid. Browse high-performance nodes ready to process your workloads securely.
      </p>

      {error && <div className="card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>{error}</div>}
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
          <div style={{ margin: '0 auto', width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 16 }}>Scanning Network...</p>
        </div>
      ) : nodes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h3>No nodes online</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Be the first to provide compute power to the network.</p>
        </div>
      ) : (
        <div className="marketplace-grid">
          {nodes.map((node) => (
            <div key={node.id} className="node-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>{node.provider.name}</h3>
                <span className={node.status === 'active' ? 'badge-active' : ''}>
                  {node.status}
                </span>
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 8, marginBottom: 20 }}>
                <code style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>{node.endpointUrl}</code>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <div className="node-stat">
                  <div className="label">CPU</div>
                  <div className="value">{node.cpuCoreCount}</div>
                </div>
                <div className="node-stat">
                  <div className="label">RAM</div>
                  <div className="value">{node.ramGb}GB</div>
                </div>
                <div className="node-stat">
                  <div className="label">Rate</div>
                  <div className="value">{node.bidRateMicroAlgos}µ</div>
                </div>
              </div>
              
              <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: node.provider.reputation >= 90 ? 'var(--success)' : '#eab308' }} />
                <span style={{ fontSize: "0.85em", color: "var(--text-muted)" }}>
                  Provider Trust Score: <strong style={{ color: '#fff' }}>{node.provider.reputation}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
