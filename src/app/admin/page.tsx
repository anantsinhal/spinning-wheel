"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WheelPrize } from "@/lib/prize-store";

const COLOR_PRESETS = [
  "#EF4D3F", // Coral Red
  "#3767D6", // Royal Blue
  "#F8C84B", // Warm Yellow
  "#2A9D8F", // Teal
  "#F58A3B", // Warm Orange
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#10B981", // Emerald Green
];

const ICON_OPTIONS = [
  { value: "coins", label: "🪙 Gold Coins (Cashback)" },
  { value: "rupee", label: "💵 Rupee Banknote" },
  { value: "food", label: "🍔 Food Burger" },
  { value: "tumbler", label: "🥤 Tumbler Cup" },
  { value: "star", label: "⭐ Sparkle Star / Try Again" },
];

export default function AdminPage() {
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [activeAdminKey, setActiveAdminKey] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [authError, setAuthError] = useState("");

  const [prizes, setPrizes] = useState<WheelPrize[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  // Check saved admin key in session storage
  useEffect(() => {
    const savedKey = sessionStorage.getItem("vp_admin_key");
    if (savedKey) {
      setActiveAdminKey(savedKey);
      setIsUnlocked(true);
    }
  }, []);

  // Fetch current prizes on load
  useEffect(() => {
    fetch("/api/admin/prizes", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.prizes)) {
          setPrizes(data.prizes);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (adminKeyInput.trim() === "admin") {
      setActiveAdminKey(adminKeyInput.trim());
      sessionStorage.setItem("vp_admin_key", adminKeyInput.trim());
      setIsUnlocked(true);
      setAuthError("");
    } else {
      setAuthError("Incorrect admin key. Please try again.");
    }
  }

  function handleLock() {
    sessionStorage.removeItem("vp_admin_key");
    setIsUnlocked(false);
    setActiveAdminKey("");
    setAdminKeyInput("");
  }

  function handleUpdateField(index: number, field: keyof WheelPrize, value: string | number) {
    setPrizes((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function handleAddSegment() {
    const newId = String(Date.now());
    const existingTotal = prizes.reduce((sum, prize) => sum + (Number(prize.probability) || 0), 0);
    const newSegment: WheelPrize = {
      id: newId,
      name: "New Offer",
      probability: Number(Math.max(0, 100 - existingTotal).toFixed(2)),
      color: COLOR_PRESETS[prizes.length % COLOR_PRESETS.length],
      gradientId: `grad-custom-${newId}`,
      icon: "coins",
      labelLine1: "NEW",
      labelLine2: "OFFER",
    };
    setPrizes((prev) => [...prev, newSegment]);
  }

  function handleRemoveSegment(index: number) {
    if (prizes.length <= 2) {
      alert("Wheel must have at least 2 prize segments.");
      return;
    }
    setPrizes((prev) => prev.filter((_, i) => i !== index));
  }

  function handleMove(index: number, direction: "up" | "down") {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === prizes.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    setPrizes((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  }

  async function handleSavePrizes() {
    setSaveStatus(null);

    const totalProb = prizes.reduce((sum, p) => sum + (Number(p.probability) || 0), 0);
    if (Math.abs(totalProb - 100) > 0.01) {
      setSaveStatus({
        type: "error",
        message: `Total probability must equal 100%. Currently total is ${totalProb.toFixed(1)}%.`,
      });
      return;
    }

    setShowSaveConfirmation(true);
  }

  async function handleConfirmSave() {
    setShowSaveConfirmation(false);
    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/prizes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prizes, adminKey: activeAdminKey }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save wheel configuration.");
      }

      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const channel = new BroadcastChannel("vp_wheel_channel");
        channel.postMessage({ type: "WHEEL_UPDATED" });
        channel.close();
      }

      setSaveStatus({
        type: "success",
        message: "🎉 Wheel offers updated successfully! Changes are now live.",
      });
    } catch (err) {
      setSaveStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const totalProbability = prizes.reduce((sum, p) => sum + (Number(p.probability) || 0), 0);
  const isValidTotal = Math.abs(totalProbability - 100) <= 0.01;

  if (!isUnlocked) {
    return (
      <main className="admin-auth-shell">
        <div className="auth-card">
          <div className="auth-logo">
            <span className="brand-symbol">+</span> VALUE PLUS ADMIN
          </div>
          <h2>Admin Access Required</h2>
          <p className="auth-subtitle">Enter your admin security passkey to edit the spin wheel components &amp; offers.</p>

          <form onSubmit={handleUnlock} className="auth-form">
            <div className="input-group">
              <label htmlFor="adminKey">Admin Passkey</label>
              <input
                id="adminKey"
                type="password"
                placeholder="Enter passkey (e.g. admin)"
                value={adminKeyInput}
                onChange={(e) => setAdminKeyInput(e.target.value)}
                required
              />
            </div>
            {authError && <p className="auth-error-msg">{authError}</p>}
            <button type="submit" className="auth-btn">Unlock Admin Panel</button>
          </form>

          <Link href="/" className="back-link">← Return to Live Spin Wheel</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-dashboard-shell">
      {/* Admin Top Header */}
      <header className="admin-header">
        <div className="brand-mark">
          <span className="brand-symbol">+</span> VALUE PLUS ADMIN
        </div>
        <div className="admin-header-actions">
          <Link href="/" target="_blank" rel="noreferrer" className="btn-secondary">
            👁 View Live Wheel
          </Link>
          <button type="button" onClick={handleLock} className="btn-outline">
            🔒 Lock Admin
          </button>
        </div>
      </header>

      <div className="admin-container">
        <div className="admin-intro">
          <div>
            <h1>Wheel Component &amp; Offer Manager</h1>
            <p>Customize segments, change prize probabilities, icons, labels, and colors in real time.</p>
          </div>

          <div className={`probability-meter ${isValidTotal ? "valid" : "invalid"}`}>
            <span className="meter-label">Total Probability:</span>
            <span className="meter-value">{totalProbability.toFixed(1)}%</span>
            <span className="meter-status">
              {isValidTotal ? "✓ Balanced (100%)" : "⚠️ Must equal 100%"}
            </span>
          </div>
        </div>

        {saveStatus && (
          <div className={`status-banner ${saveStatus.type}`}>
            {saveStatus.message}
          </div>
        )}

        {loading ? (
          <div className="admin-loading">Loading current wheel components...</div>
        ) : (
          <div className="admin-editor-grid">
            {/* Left Column: Offers & Segments List */}
            <div className="segments-list">
              <div className="section-title-row">
                <h2>Wheel Segments ({prizes.length})</h2>
                <button type="button" onClick={handleAddSegment} className="btn-add">
                  + Add New Offer
                </button>
              </div>

              {prizes.map((prize, index) => (
                <div key={prize.id || index} className="segment-card">
                  <div className="card-header">
                    <div className="card-title-group">
                      <span className="segment-index">#{index + 1}</span>
                      <span
                        className="color-indicator"
                        style={{ background: prize.color }}
                      />
                      <strong className="segment-name-display">{prize.name}</strong>
                    </div>

                    <div className="card-controls">
                      <button
                        type="button"
                        onClick={() => handleMove(index, "up")}
                        disabled={index === 0}
                        className="btn-icon"
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, "down")}
                        disabled={index === prizes.length - 1}
                        className="btn-icon"
                        title="Move Down"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSegment(index)}
                        className="btn-icon delete"
                        title="Delete Segment"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="card-body-grid">
                    {/* Prize Name */}
                    <div className="form-field">
                      <label>Prize Name</label>
                      <input
                        type="text"
                        value={prize.name}
                        onChange={(e) => handleUpdateField(index, "name", e.target.value)}
                        placeholder="e.g. ₹500 Cashback"
                      />
                    </div>

                    {/* Probability Weight */}
                    <div className="form-field">
                      <label>Probability (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={prize.probability}
                        onChange={(e) =>
                          handleUpdateField(index, "probability", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>

                    {/* Segment Color */}
                    <div className="form-field">
                      <label>Segment Color</label>
                      <div className="color-picker-group">
                        <input
                          type="color"
                          value={prize.color}
                          onChange={(e) => handleUpdateField(index, "color", e.target.value)}
                        />
                        <input
                          type="text"
                          value={prize.color}
                          onChange={(e) => handleUpdateField(index, "color", e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Icon Selection */}
                    <div className="form-field">
                      <label>Icon Type</label>
                      <select
                        value={prize.icon}
                        onChange={(e) => handleUpdateField(index, "icon", e.target.value)}
                      >
                        {ICON_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Text Line 1 */}
                    <div className="form-field">
                      <label>Label Line 1</label>
                      <input
                        type="text"
                        value={prize.labelLine1}
                        onChange={(e) => handleUpdateField(index, "labelLine1", e.target.value)}
                        placeholder="e.g. ₹500"
                      />
                    </div>

                    {/* Text Line 2 */}
                    <div className="form-field">
                      <label>Label Line 2</label>
                      <input
                        type="text"
                        value={prize.labelLine2}
                        onChange={(e) => handleUpdateField(index, "labelLine2", e.target.value)}
                        placeholder="e.g. CASHBACK"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="save-bar">
                <button
                  type="button"
                  onClick={handleSavePrizes}
                  disabled={isSaving || !isValidTotal}
                  className="btn-save-main"
                >
                  {isSaving ? "Saving Changes..." : "💾 Save & Publish Wheel Offers"}
                </button>
                {showSaveConfirmation && (
                  <div className="save-confirmation" role="alertdialog" aria-label="Confirm wheel changes">
                    <span>Do you want to save these changes to the live wheel?</span>
                    <button type="button" onClick={handleConfirmSave} disabled={isSaving}>
                      Yes, publish
                    </button>
                    <button type="button" onClick={() => setShowSaveConfirmation(false)} disabled={isSaving}>
                      No, keep editing
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Live Wheel Preview */}
            <div className="preview-column">
              <div className="preview-card">
                <h3>Live Wheel Component Preview</h3>
                <p className="preview-sub">Equal {prizes.length} slices. Updated in real-time as you edit.</p>

                <div className="mini-wheel-container">
                  <svg viewBox="0 0 500 500" className="mini-wheel-svg">
                    <circle cx="250" cy="250" r="242" fill="#FFD700" stroke="#B45309" strokeWidth="2" />
                    <circle cx="250" cy="250" r="226" fill="#1A1000" />

                    <g>
                      {prizes.map((prize, idx) => {
                        const totalSegs = prizes.length;
                        const segAngle = 360 / totalSegs;
                        const startAngle = idx * segAngle;
                        const endAngle = (idx + 1) * segAngle;
                        const startRad = (startAngle * Math.PI) / 180;
                        const endRad = (endAngle * Math.PI) / 180;

                        const x1 = 250 + 222 * Math.sin(startRad);
                        const y1 = 250 - 222 * Math.cos(startRad);
                        const x2 = 250 + 222 * Math.sin(endRad);
                        const y2 = 250 - 222 * Math.cos(endRad);

                        const largeArc = segAngle > 180 ? 1 : 0;
                        const pathD = `M 250,250 L ${x1.toFixed(2)},${y1.toFixed(2)} A 222 222 0 ${largeArc} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;

                        const midAngle = idx * segAngle + segAngle / 2;

                        return (
                          <g key={prize.id || idx}>
                            <path d={pathD} fill={prize.color} stroke="#FFFFFF" strokeWidth="2.5" />
                            <g transform={`rotate(${midAngle} 250 250) translate(250 115)`}>
                              <text x="0" y="0" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="900">
                                {prize.labelLine1}
                              </text>
                            </g>
                          </g>
                        );
                      })}
                    </g>
                    <circle cx="250" cy="250" r="60" fill="#19233B" stroke="#FFD700" strokeWidth="4" />
                  </svg>
                </div>

                <div className="preview-legend">
                  {prizes.map((p) => (
                    <div key={p.id || p.name} className="legend-chip">
                      <span className="chip-dot" style={{ background: p.color }} />
                      <span className="chip-name">{p.name}</span>
                      <span className="chip-prob">({p.probability}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
