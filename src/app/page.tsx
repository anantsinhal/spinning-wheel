"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { defaultPrizes, WheelPrize } from "@/lib/prize-store";

type SpinResponse = {
  success: boolean;
  result?: string;
  hasVoucher?: boolean;
  error?: string;
};

function getSlicePath(index: number, totalSegments: number, radius: number): string {
  const segmentAngle = 360 / totalSegments;
  const startAngle = index * segmentAngle;
  const endAngle = (index + 1) * segmentAngle;

  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  const x1 = 250 + radius * Math.sin(startRad);
  const y1 = 250 - radius * Math.cos(startRad);
  const x2 = 250 + radius * Math.sin(endRad);
  const y2 = 250 - radius * Math.cos(endRad);

  const largeArcFlag = segmentAngle > 180 ? 1 : 0;

  return `M 250,250 L ${x1.toFixed(2)},${y1.toFixed(2)} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
}

function renderPrizeIcon(type: string) {
  switch (type) {
    case "coins":
      return (
        <g transform="translate(-18, -24)">
          <ellipse cx="18" cy="24" rx="13" ry="4.5" fill="#D97706" />
          <ellipse cx="18" cy="22" rx="13" ry="4.5" fill="#F59E0B" />
          <rect x="5" y="16" width="26" height="6" fill="#F59E0B" />
          <ellipse cx="18" cy="16" rx="13" ry="4.5" fill="#FCD34D" />
          <ellipse cx="18" cy="14" rx="11" ry="4" fill="#D97706" />
          <rect x="7" y="9" width="22" height="5" fill="#F59E0B" />
          <ellipse cx="18" cy="9" rx="11" ry="4" fill="#FDE68A" />
          <circle cx="18" cy="6" r="9" fill="url(#grad-gold-coin)" stroke="#B45309" strokeWidth="1" />
          <text x="18" y="9.5" textAnchor="middle" fill="#78350F" fontSize="11" fontWeight="900" fontFamily="sans-serif">₹</text>
        </g>
      );
    case "rupee":
      return (
        <g transform="translate(-18, -24)">
          <rect x="3" y="10" width="30" height="17" rx="3" fill="#1D4ED8" transform="rotate(-6 18 18)" />
          <rect x="3" y="10" width="30" height="17" rx="3" fill="url(#grad-cash-note)" stroke="#93C5FD" strokeWidth="1.2" />
          <circle cx="18" cy="18.5" r="5.5" fill="#EFF6FF" opacity="0.95" />
          <text x="18" y="22" textAnchor="middle" fill="#1E40AF" fontSize="10" fontWeight="900" fontFamily="sans-serif">₹</text>
          <line x1="6" y1="12" x2="6" y2="25" stroke="#BFDBFE" strokeWidth="1.2" strokeDasharray="1.5 1.5" />
          <line x1="30" y1="12" x2="30" y2="25" stroke="#BFDBFE" strokeWidth="1.2" strokeDasharray="1.5 1.5" />
        </g>
      );
    case "food":
      return (
        <g transform="translate(-18, -24)">
          <path d="M 6 15 C 6 8, 30 8, 30 15 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="0.8" />
          <circle cx="12" cy="11" r="0.9" fill="#FEF3C7" />
          <circle cx="18" cy="10" r="0.9" fill="#FEF3C7" />
          <circle cx="24" cy="12" r="0.9" fill="#FEF3C7" />
          <path d="M 5 15 Q 9 18, 13 15 Q 17 18, 21 15 Q 25 18, 31 15" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />
          <polygon points="6,17 30,17 26,21" fill="#FCD34D" />
          <rect x="5" y="19" width="26" height="4" rx="2" fill="#78350F" />
          <rect x="7" y="24" width="22" height="3" rx="1.5" fill="#F59E0B" />
        </g>
      );
    case "tumbler":
      return (
        <g transform="translate(-18, -24)">
          <line x1="22" y1="2" x2="19" y2="9" stroke="#E0F2FE" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="10" y="8" width="16" height="4" rx="1.5" fill="#0F766E" stroke="#CCFBF1" strokeWidth="0.8" />
          <path d="M 11 12 L 13 30 Q 18 32, 23 30 L 25 12 Z" fill="url(#grad-tumbler-body)" stroke="#5EEAD4" strokeWidth="1" />
          <line x1="11.5" y1="17" x2="24.5" y2="17" stroke="#CCFBF1" strokeWidth="1.2" opacity="0.8" />
          <rect x="12" y="20" width="12" height="5" rx="1" fill="#047857" opacity="0.5" />
        </g>
      );
    case "star":
    default:
      return (
        <g transform="translate(-18, -24)">
          <polygon points="18,2 22,11 32,12 24,19 27,29 18,23 9,29 12,19 4,12 14,11" fill="url(#grad-star-fill)" stroke="#FFF" strokeWidth="1.2" />
          <polygon points="18,6 20,12 26,13 21,18 23,25 18,21 13,25 15,18 10,13 16,12" fill="#FEF08A" opacity="0.85" />
          <circle cx="5" cy="5" r="1.2" fill="#FFF" />
          <circle cx="31" cy="6" r="1" fill="#FFF" />
        </g>
      );
  }
}

export default function SpinPage() {
  const [mounted, setMounted] = useState(false);
  const [prizesList, setPrizesList] = useState<WheelPrize[]>(defaultPrizes);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<SpinResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function fetchPrizes() {
      fetch("/api/admin/prizes", { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.prizes) && data.prizes.length >= 2) {
            setPrizesList(data.prizes);
          }
        })
        .catch(() => {});
    }

    // Initial fetch
    fetchPrizes();

    // Listen to BroadcastChannel for instant cross-tab update
    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      channel = new BroadcastChannel("vp_wheel_channel");
      channel.onmessage = (event) => {
        if (event.data?.type === "WHEEL_UPDATED") {
          fetchPrizes();
        }
      };
    }

    // Refetch when window gains focus or tab becomes visible
    const handleFocus = () => fetchPrizes();
    window.addEventListener("focus", handleFocus);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchPrizes();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Fast polling fallback (every 2.5s)
    const interval = setInterval(fetchPrizes, 2500);

    return () => {
      if (channel) channel.close();
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, []);

  const totalSegments = prizesList.length;
  const segmentAngle = 360 / totalSegments;

  async function handleSpin() {
    if (isSpinning) return;
    setError(null);
    setResult(null);
    setIsSpinning(true);

    try {
      const response = await fetch("/api/spin", { method: "POST" });
      const data: SpinResponse = await response.json();

      if (!response.ok || !data.success || !data.result) {
        throw new Error(data.error ?? "We could not complete your spin.");
      }

      const winningIndex = prizesList.findIndex((prize) => prize.name === data.result);
      if (winningIndex === -1) {
        throw new Error("The spin returned an unknown prize.");
      }

      const currentPosition = ((rotation % 360) + 360) % 360;
      const targetPosition = (360 - (winningIndex * segmentAngle + segmentAngle / 2)) % 360;
      const extraTurn = (targetPosition - currentPosition + 360) % 360;

      setRotation(rotation + 5 * 360 + extraTurn);

      window.setTimeout(() => {
        setResult(data);
        setIsSpinning(false);
      }, 4600);
    } catch (spinError) {
      setError(spinError instanceof Error ? spinError.message : "Something went wrong.");
      setIsSpinning(false);
    }
  }

  const wonPrize = result?.result && result.result !== "Better Luck Next Time";

  return (
    <main className="campaign-shell">
      {wonPrize && <Confetti />}

      <header className="campaign-header">
        <div className="brand-mark">
          <span className="brand-symbol">+</span> VALUE PLUS
        </div>
        <div className="header-actions">
          <Link href="/admin" className="admin-link">⚙️ Admin</Link>
          <div className="header-note">Everyday value. Extra delight.</div>
        </div>
      </header>

      <section className="hero-grid" aria-label="Value Plus Spin and Win">
        <div className="hero-copy">
          <p className="eyebrow">A little extra for you</p>
          <h1 className="hero-title">
            SPIN <span>&amp; WIN</span>
          </h1>
          <p className="hero-subtitle">Spin the wheel and win exciting rewards!</p>

          <div className="feature-badges">
            <span className="badge">✦ Guaranteed Fun</span>
            <span className="badge">✦ Instant Store Coupons</span>
            <span className="badge">✦ Exclusive Rewards</span>
          </div>
        </div>

        <div className="wheel-stage">
          {!mounted ? (
            <div className="wheel-skeleton" aria-hidden="true" />
          ) : (
            <>
              <div className="wheel-wrap">
                {/* Outer Glow & Shadow Ring */}
                <div className="wheel-outer-glow" />

            {/* Fixed Pointer at Top */}
            <div className="pointer-container" aria-hidden="true">
              <svg viewBox="0 0 48 56" className="pointer-svg">
                <defs>
                  <linearGradient id="pointerRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF5A4E" />
                    <stop offset="100%" stopColor="#C91818" />
                  </linearGradient>
                  <linearGradient id="pointerGoldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFE066" />
                    <stop offset="50%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#AA7C11" />
                  </linearGradient>
                  <filter id="pointerShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.4" />
                  </filter>
                </defs>
                <g filter="url(#pointerShadow)">
                  <path
                    d="M 24 54 L 8 20 C 4 12, 10 2, 24 2 C 38 2, 44 12, 40 20 Z"
                    fill="url(#pointerRedGrad)"
                    stroke="url(#pointerGoldBorder)"
                    strokeWidth="3.2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 24 46 L 13 21 C 10 15, 14 7, 24 7 C 34 7, 38 15, 35 21 Z"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.35)"
                    strokeWidth="1.5"
                  />
                  <circle cx="24" cy="14" r="5" fill="url(#pointerGoldBorder)" stroke="#FFF" strokeWidth="1" />
                  <circle cx="23" cy="13" r="1.5" fill="#FFF" opacity="0.85" />
                </g>
              </svg>
            </div>

            {/* Rotating Wheel Container */}
            <div
              className="wheel-rotation-layer"
              style={{ transform: `rotate(${rotation}deg)` }}
              aria-label="Prize wheel"
            >
              <svg viewBox="0 0 500 500" className="wheel-svg">
                <defs>
                  {/* Wheel Outer Metallic Rim Gradient */}
                  <linearGradient id="rimGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFE885" />
                    <stop offset="25%" stopColor="#F5A623" />
                    <stop offset="50%" stopColor="#FFD700" />
                    <stop offset="75%" stopColor="#C48B18" />
                    <stop offset="100%" stopColor="#FFF2B2" />
                  </linearGradient>

                  <linearGradient id="rimInnerShadow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#4A3000" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#1A1000" stopOpacity="0.8" />
                  </linearGradient>

                  {/* Prize Slices Gradients */}
                  <linearGradient id="grad-coral" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF6B5B" />
                    <stop offset="100%" stopColor="#E0382B" />
                  </linearGradient>

                  <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4B7Bec" />
                    <stop offset="100%" stopColor="#2551B8" />
                  </linearGradient>

                  <linearGradient id="grad-yellow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFD452" />
                    <stop offset="100%" stopColor="#E5A100" />
                  </linearGradient>

                  <linearGradient id="grad-teal" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#36BCA9" />
                    <stop offset="100%" stopColor="#1B7A6E" />
                  </linearGradient>

                  <linearGradient id="grad-orange" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF9F43" />
                    <stop offset="100%" stopColor="#D96B00" />
                  </linearGradient>

                  {/* Icon Specific Gradients */}
                  <linearGradient id="grad-gold-coin" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF099" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>

                  <linearGradient id="grad-cash-note" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60A5FA" />
                    <stop offset="100%" stopColor="#1E40AF" />
                  </linearGradient>

                  <linearGradient id="grad-tumbler-body" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2DD4BF" />
                    <stop offset="100%" stopColor="#0F766E" />
                  </linearGradient>

                  <linearGradient id="grad-star-fill" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FDE047" />
                    <stop offset="100%" stopColor="#CA8A04" />
                  </linearGradient>
                </defs>

                {/* Outer Rim Ring */}
                <circle cx="250" cy="250" r="242" fill="url(#rimGoldGrad)" stroke="#B45309" strokeWidth="2" />
                <circle cx="250" cy="250" r="226" fill="url(#rimInnerShadow)" />

                {/* Rim Studs / Rivets */}
                {Array.from({ length: 20 }, (_, i) => {
                  const studAngle = (i * 18 * Math.PI) / 180;
                  const sx = 250 + 234 * Math.sin(studAngle);
                  const sy = 250 - 234 * Math.cos(studAngle);
                  return (
                    <g key={i}>
                      <circle cx={sx} cy={sy} r="4.5" fill="#FFF8DC" stroke="#78350F" strokeWidth="0.8" />
                      <circle cx={sx - 1} cy={sy - 1} r="1.8" fill="#FFFFFF" opacity="0.8" />
                    </g>
                  );
                })}

                {/* Inner Wheel Face Clip */}
                <g>
                  {/* Slices */}
                  {prizesList.map((prize, index) => {
                    const midAngle = index * segmentAngle + segmentAngle / 2;
                    const pathD = getSlicePath(index, totalSegments, 222);

                    return (
                      <g key={prize.id || prize.name}>
                        {/* Wedge slice */}
                        <path
                          d={pathD}
                          fill={prize.color || "#EF4D3F"}
                          stroke="#FFFFFF"
                          strokeWidth="2.5"
                          strokeLinejoin="round"
                        />

                        {/* Content Group (Icon + Centered Text) */}
                        <g transform={`rotate(${midAngle} 250 250) translate(250 ${250 - 138})`}>
                          {/* Prize Icon */}
                          {renderPrizeIcon(prize.icon)}

                          {/* Prize Label */}
                          <text
                            x="0"
                            y="14"
                            textAnchor="middle"
                            fill="#FFFFFF"
                            style={{
                              fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
                              filter: "drop-shadow(0px 1.5px 2px rgba(0, 0, 0, 0.6))",
                            }}
                          >
                            {prize.labelLine1 && (
                              <tspan
                                x="0"
                                dy="0"
                                fontSize={prize.labelLine2 ? "12.5" : "13.5"}
                                fontWeight="900"
                                letterSpacing="0.04em"
                              >
                                {prize.labelLine1}
                              </tspan>
                            )}
                            {prize.labelLine2 && (
                              <tspan
                                x="0"
                                dy="13.5"
                                fontSize="10.5"
                                fontWeight="800"
                                letterSpacing="0.05em"
                                opacity="0.95"
                              >
                                {prize.labelLine2}
                              </tspan>
                            )}
                          </text>
                        </g>
                      </g>
                    );
                  })}

                  {/* Clean Separator Lines */}
                  {Array.from({ length: totalSegments }, (_, i) => {
                    const sepAngle = (i * segmentAngle * Math.PI) / 180;
                    const bx = 250 + 222 * Math.sin(sepAngle);
                    const by = 250 - 222 * Math.cos(sepAngle);
                    return (
                      <line
                        key={i}
                        x1="250"
                        y1="250"
                        x2={bx}
                        y2={by}
                        stroke="#FFFFFF"
                        strokeWidth="3"
                        strokeLinecap="round"
                        opacity="0.95"
                      />
                    );
                  })}
                </g>

                {/* Outer Slice Boundary Ring */}
                <circle cx="250" cy="250" r="222" fill="none" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="2" />

                {/* Solid Metallic Center Hub Disc */}
                <circle cx="250" cy="250" r="66" fill="#19233B" stroke="url(#rimGoldGrad)" strokeWidth="4.5" />
                <circle cx="250" cy="250" r="62" fill="#0F172A" stroke="rgba(255, 215, 0, 0.4)" strokeWidth="1.5" />
              </svg>
            </div>

            {/* Center Spin Button */}
            <button
              className={`center-spin-button ${isSpinning ? "is-spinning" : ""}`}
              type="button"
              onClick={handleSpin}
              disabled={isSpinning}
              aria-label={isSpinning ? "Wheel is spinning" : "Spin the prize wheel"}
            >
              {isSpinning ? (
                <span className="spin-label">SPINNING...</span>
              ) : (
                <span className="spin-label">SPIN</span>
              )}
            </button>
          </div>

          <div className="wheel-legend">100% Verified Prize • Instant Reward</div>
          {error && <p className="error-note" role="alert">{error}</p>}
          </>
          )}
        </div>
      </section>

      <p className="fine-print">
        Rewards are subject to availability. Please present your voucher at the Value Plus store.
      </p>

      {/* Result State Modal */}
      {result && (
        <div className="result-backdrop" role="dialog" aria-modal="true" aria-label="Spin result">
          <div className={`result-card ${wonPrize ? "win-card" : "try-again-card"}`}>
            {wonPrize ? (
              <>
                <div className="result-emoji" aria-hidden="true">🎉</div>
                <h2 className="result-heading win-heading">CONGRATULATIONS!</h2>
                <p className="result-label">You won</p>
                <div className="result-prize-box">
                  <span className="result-prize-name">{result.result}</span>
                </div>
                <button
                  className="result-action win-btn"
                  type="button"
                  onClick={() => setResult(null)}
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                <div className="result-emoji" aria-hidden="true">✨</div>
                <h2 className="result-heading try-again-heading">BETTER LUCK NEXT TIME!</h2>
                <p className="result-message">
                  Don&apos;t worry — more exciting rewards are waiting for you.
                </p>
                <button
                  className="result-action try-again-btn"
                  type="button"
                  onClick={() => setResult(null)}
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function Confetti() {
  return (
    <div aria-hidden="true">
      {Array.from({ length: 32 }, (_, index) => (
        <span
          className="confetti"
          key={index}
          style={{
            left: `${(index * 31) % 100}%`,
            background: ["#EF4D3F", "#F8C84B", "#3767D6", "#2A9D8F", "#F58A3B"][index % 5],
            animationDelay: `${(index % 8) * 90}ms`,
            animationDuration: `${2.2 + (index % 5) * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
}
