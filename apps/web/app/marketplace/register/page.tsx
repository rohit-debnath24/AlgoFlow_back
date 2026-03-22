"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function RegisterNodePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [formData, setFormData] = useState({
    endpointUrl: "http://your-ip:3001",
    cpuCoreCount: 4,
    ramGb: 16,
    bidRateMicroAlgos: 10,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (status === "unauthenticated") {
    return <p>You must be logged in to register a node.</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/marketplace/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to register node");
      }

      router.push("/marketplace");
      router.refresh(); // Force refresh to see new data
    } catch (err) {
      setError((err as Error).message);
      setIsSubmitting(false);
    }
  }

  function handleChange(field: string, value: string | number) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  return (
    <div style={{ maxWidth: 640, margin: "60px auto" }}>
      <div className="card" style={{ padding: "40px" }}>
        <h2 style={{ fontSize: '2rem', marginBottom: 8, background: 'linear-gradient(to right, #f8fafc, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Register Your Compute Node
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
          Offer your system's compute resources on the AlgoForge decentralized grid and earn rewards.
        </p>
        
        {error && <div style={{ padding: 12, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', marginBottom: 20 }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
          <div>
            <label>Endpoint URL (Where tasks are sent)</label>
            <input
              type="url"
              required
              value={formData.endpointUrl}
              onChange={(e) => handleChange("endpointUrl", e.target.value)}
              placeholder="e.g. http://your-ip:3001"
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label>CPU Core Count</label>
              <input
                type="number"
                min="1"
                required
                value={formData.cpuCoreCount}
                onChange={(e) => handleChange("cpuCoreCount", e.target.valueAsNumber)}
              />
            </div>
            
            <div>
              <label>RAM (GB)</label>
              <input
                type="number"
                min="1"
                required
                value={formData.ramGb}
                onChange={(e) => handleChange("ramGb", e.target.valueAsNumber)}
              />
            </div>
          </div>
          
          <div>
            <label>Bid Rate (µAlgos per computation unit)</label>
            <input
              type="number"
              min="0"
              required
              value={formData.bidRateMicroAlgos}
              onChange={(e) => handleChange("bidRateMicroAlgos", e.target.valueAsNumber)}
            />
          </div>

          <button type="submit" disabled={isSubmitting} style={{ marginTop: 12, padding: '14px', fontSize: '1.05rem' }}>
            {isSubmitting ? "Registering Node..." : "Launch Provider Node"}
          </button>
        </form>
      </div>
    </div>
  );
}
