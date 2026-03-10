import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FireData {
  Temperature: number;
  RH: number;
  Ws: number;
  Rain: number;
  FFMC: number;
  DMC: number;
  ISI: number;
  Classes: number;
  Region: number;
}

interface PredictResponse {
  status: string;
  predicted_FWI: number;
}

interface FieldConfig {
  key: keyof FireData;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  default: number;
  description: string;
}

// ─── Field Config ─────────────────────────────────────────────────────────────
const FIELDS: FieldConfig[] = [
  { key: "Temperature", label: "Temperature", unit: "°C",  min: 0,   max: 60,  step: 0.1, default: 29.0, description: "Ambient air temperature" },
  { key: "RH",          label: "Humidity",    unit: "%",   min: 0,   max: 100, step: 1,   default: 57.0, description: "Relative humidity" },
  { key: "Ws",          label: "Wind Speed",  unit: "km/h",min: 0,   max: 60,  step: 0.1, default: 18.0, description: "Wind speed" },
  { key: "Rain",        label: "Rain",        unit: "mm",  min: 0,   max: 20,  step: 0.1, default: 0.0,  description: "Total rain in mm" },
  { key: "FFMC",        label: "FFMC",        unit: "",    min: 0,   max: 100, step: 0.1, default: 65.7, description: "Fine Fuel Moisture Code" },
  { key: "DMC",         label: "DMC",         unit: "",    min: 0,   max: 200, step: 0.1, default: 3.4,  description: "Duff Moisture Code" },
  { key: "ISI",         label: "ISI",         unit: "",    min: 0,   max: 50,  step: 0.1, default: 1.3,  description: "Initial Spread Index" },
  { key: "Classes",     label: "Class",       unit: "",    min: 0,   max: 1,   step: 1,   default: 0.0,  description: "0 = Not Fire, 1 = Fire" },
  { key: "Region",      label: "Region",      unit: "",    min: 0,   max: 1,   step: 1,   default: 1.0,  description: "0 = Bejaia, 1 = Sidi-Bel" },
];

// ─── FWI Risk Helper ──────────────────────────────────────────────────────────
function getRisk(fwi: number) {
  if (fwi < 0)  return { label: "Invalid",   color: "#94a3b8", bg: "rgba(148,163,184,0.1)", bar: "#94a3b8", pct: 0   };
  if (fwi < 5)  return { label: "Very Low",  color: "#4ade80", bg: "rgba(74,222,128,0.08)", bar: "#4ade80", pct: 10  };
  if (fwi < 10) return { label: "Low",       color: "#a3e635", bg: "rgba(163,230,53,0.08)", bar: "#a3e635", pct: 25  };
  if (fwi < 20) return { label: "Moderate",  color: "#fbbf24", bg: "rgba(251,191,36,0.08)", bar: "#fbbf24", pct: 50  };
  if (fwi < 30) return { label: "High",      color: "#f97316", bg: "rgba(249,115,22,0.08)", bar: "#f97316", pct: 75  };
  return              { label: "Extreme 🔥", color: "#ef4444", bg: "rgba(239,68,68,0.08)",  bar: "#ef4444", pct: 100 };
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: "100vh",
    background: "#0a0c0f",
    backgroundImage: `
      radial-gradient(ellipse 70% 40% at 15% 0%, rgba(234,88,12,0.08) 0%, transparent 60%),
      radial-gradient(ellipse 50% 30% at 85% 100%, rgba(239,68,68,0.06) 0%, transparent 60%)
    `,
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    color: "#e2e8f0",
    padding: "0 0 60px",
  } as React.CSSProperties,

  header: {
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    padding: "28px 40px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    backdropFilter: "blur(10px)",
    position: "sticky" as const,
    top: 0,
    background: "rgba(10,12,15,0.85)",
    zIndex: 10,
  } as React.CSSProperties,

  flameBadge: {
    width: 40, height: 40, borderRadius: 10,
    background: "linear-gradient(135deg, #ea580c, #dc2626)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "1.2rem",
    boxShadow: "0 0 20px rgba(234,88,12,0.4)",
  } as React.CSSProperties,

  headerTitle: {
    fontSize: "1.05rem", fontWeight: 700,
    color: "#f8fafc", letterSpacing: "-0.01em",
  } as React.CSSProperties,

  headerSub: {
    fontSize: "0.68rem", color: "#64748b", marginTop: 2,
  } as React.CSSProperties,

  statusDot: {
    marginLeft: "auto", display: "flex", alignItems: "center", gap: 8,
    fontSize: "0.72rem", color: "#4ade80",
    background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)",
    padding: "5px 12px", borderRadius: 999,
  } as React.CSSProperties,

  dot: {
    width: 6, height: 6, borderRadius: "50%",
    background: "#4ade80", boxShadow: "0 0 6px #4ade80",
    animation: "pulse 2s infinite",
  } as React.CSSProperties,

  main: {
    maxWidth: 960, margin: "0 auto", padding: "40px 24px 0",
  } as React.CSSProperties,

  hero: {
    marginBottom: 40,
    animation: "fadeUp 0.6s ease both",
  } as React.CSSProperties,

  heroTag: {
    display: "inline-block",
    fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.22em",
    textTransform: "uppercase" as const, color: "#ea580c",
    marginBottom: 12,
  } as React.CSSProperties,

  heroH1: {
    fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
    fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.04em",
    color: "#f8fafc", margin: "0 0 12px",
  } as React.CSSProperties,

  heroDesc: {
    fontSize: "0.9rem", color: "#64748b",
    lineHeight: 1.7, maxWidth: 500,
  } as React.CSSProperties,

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: 24,
    alignItems: "start",
  } as React.CSSProperties,

  card: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: 28,
    backdropFilter: "blur(10px)",
    animation: "fadeUp 0.6s ease 0.1s both",
  } as React.CSSProperties,

  cardTitle: {
    fontSize: "0.72rem", fontWeight: 700,
    letterSpacing: "0.14em", textTransform: "uppercase" as const,
    color: "#475569", marginBottom: 24,
    display: "flex", alignItems: "center", gap: 8,
  } as React.CSSProperties,

  fieldsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 16,
  } as React.CSSProperties,

  field: {
    display: "flex", flexDirection: "column" as const, gap: 6,
  } as React.CSSProperties,

  label: {
    fontSize: "0.7rem", fontWeight: 600,
    color: "#94a3b8", letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
    display: "flex", justifyContent: "space-between",
  } as React.CSSProperties,

  unit: {
    color: "#475569", fontWeight: 400,
  } as React.CSSProperties,

  input: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 9, color: "#e2e8f0",
    fontSize: "0.88rem", padding: "9px 12px",
    width: "100%", outline: "none",
    transition: "border-color 0.15s",
    fontFamily: "'JetBrains Mono', monospace",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,

  description: {
    fontSize: "0.63rem", color: "#475569",
    marginTop: 2,
  } as React.CSSProperties,

  btn: {
    marginTop: 24, width: "100%",
    background: "linear-gradient(135deg, #ea580c, #dc2626)",
    border: "none", borderRadius: 12, color: "#fff",
    fontFamily: "inherit", fontWeight: 700, fontSize: "0.9rem",
    padding: "14px",
    cursor: "pointer", letterSpacing: "0.02em",
    transition: "all 0.2s",
    boxShadow: "0 4px 20px rgba(234,88,12,0.3)",
  } as React.CSSProperties,

  btnLoading: {
    opacity: 0.7, cursor: "not-allowed",
  } as React.CSSProperties,

  sideCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 20, padding: 28,
    backdropFilter: "blur(10px)",
    animation: "fadeUp 0.6s ease 0.2s both",
    position: "sticky" as const, top: 100,
  } as React.CSSProperties,

  resultBox: (color: string, bg: string) => ({
    background: bg,
    border: `1px solid ${color}30`,
    borderRadius: 16, padding: 28,
    textAlign: "center" as const,
    marginBottom: 20,
    position: "relative" as const, overflow: "hidden",
  } as React.CSSProperties),

  resultNum: (color: string) => ({
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "4rem", fontWeight: 600, lineHeight: 1,
    color, filter: `drop-shadow(0 0 20px ${color}60)`,
  } as React.CSSProperties),

  resultLabel: {
    fontSize: "0.68rem", fontWeight: 700,
    letterSpacing: "0.2em", textTransform: "uppercase" as const,
    color: "#475569", marginTop: 6,
  } as React.CSSProperties,

  riskBadge: (color: string, bg: string) => ({
    display: "inline-flex", alignItems: "center", gap: 6,
    marginTop: 12, padding: "5px 16px", borderRadius: 999,
    fontSize: "0.8rem", fontWeight: 700,
    color, background: bg, border: `1px solid ${color}40`,
  } as React.CSSProperties),

  progressWrap: {
    background: "rgba(255,255,255,0.05)",
    borderRadius: 999, height: 5, marginTop: 16, overflow: "hidden",
  } as React.CSSProperties,

  scaleRow: {
    display: "flex", gap: 8, flexDirection: "column" as const,
  } as React.CSSProperties,

  scaleItem: (active: boolean, color: string) => ({
    display: "flex", alignItems: "center", gap: 10,
    padding: "9px 12px", borderRadius: 9,
    background: active ? `${color}12` : "rgba(255,255,255,0.02)",
    border: `1px solid ${active ? color + "30" : "rgba(255,255,255,0.05)"}`,
    transition: "all 0.2s",
  } as React.CSSProperties),

  scaleColor: (color: string) => ({
    width: 8, height: 8, borderRadius: "50%",
    background: color, flexShrink: 0,
    boxShadow: `0 0 6px ${color}`,
  } as React.CSSProperties),

  scaleName: {
    fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8",
  } as React.CSSProperties,

  scaleRange: {
    marginLeft: "auto", fontSize: "0.65rem",
    fontFamily: "'JetBrains Mono', monospace", color: "#475569",
  } as React.CSSProperties,

  emptyBox: {
    textAlign: "center" as const, padding: "40px 20px",
    border: "1px dashed rgba(255,255,255,0.06)", borderRadius: 16,
    marginBottom: 20,
  } as React.CSSProperties,

  errorBox: {
    background: "rgba(239,68,68,0.06)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 10, padding: "12px 16px",
    fontSize: "0.8rem", color: "#fca5a5", marginTop: 16,
  } as React.CSSProperties,
};

const SCALE = [
  { label: "Very Low",  range: "< 5",   color: "#4ade80" },
  { label: "Low",       range: "5–10",  color: "#a3e635" },
  { label: "Moderate",  range: "10–20", color: "#fbbf24" },
  { label: "High",      range: "20–30", color: "#f97316" },
  { label: "Extreme",   range: "30+",   color: "#ef4444" },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ForestFireApp() {
  const defaultValues = FIELDS.reduce((acc, f) => {
    acc[f.key] = f.default;
    return acc;
  }, {} as FireData);

  const [form, setForm]         = useState<FireData>(defaultValues);
  const [result, setResult]     = useState<PredictResponse | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleChange = useCallback((key: keyof FireData, val: string) => {
    setForm(prev => ({ ...prev, [key]: parseFloat(val) || 0 }));
  }, []);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/predict", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data: PredictResponse = await res.json();
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(defaultValues);
    setResult(null);
    setError(null);
  };

  const risk = result ? getRisk(result.predicted_FWI) : null;

  return (
    <>
      {/* ── Global Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0c0f; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        input:focus { border-color: rgba(234,88,12,0.5) !important; box-shadow: 0 0 0 3px rgba(234,88,12,0.08) !important; }
        button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(234,88,12,0.4) !important; }
        button:active:not(:disabled) { transform: none !important; }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0c0f; }
        ::-webkit-scrollbar-thumb { background: rgba(234,88,12,0.2); border-radius: 4px; }
      `}</style>

      <div style={S.page}>

        {/* ── Header ── */}
        <header style={S.header}>
          <div style={S.flameBadge}>🔥</div>
          <div>
            <div style={S.headerTitle}>Algerian Forest Fire Predictor</div>
            <div style={S.headerSub}>Ridge Regression · FastAPI Backend</div>
          </div>
          <div style={S.statusDot}>
            <span style={S.dot} />
            API Connected
          </div>
        </header>

        <main style={S.main}>

          {/* ── Hero ── */}
          <div style={S.hero}>
            <div style={S.heroTag}>🌲 FWI Prediction System</div>
            <h1 style={S.heroH1}>Fire Weather<br />Index Predictor</h1>
            <p style={S.heroDesc}>
              Enter weather & environmental conditions to predict
              the Fire Weather Index using a trained Ridge Regression model.
            </p>
          </div>

          {/* ── Main Grid ── */}
          <div style={S.grid}>

            {/* ── Input Card ── */}
            <div style={S.card}>
              <div style={S.cardTitle}>
                <span>⚙️</span> Input Parameters
              </div>

              <div style={S.fieldsGrid}>
                {FIELDS.map(f => (
                  <div key={f.key} style={S.field}>
                    <label style={S.label}>
                      {f.label}
                      {f.unit && <span style={S.unit}>{f.unit}</span>}
                    </label>
                    <input
                      type="number"
                      style={S.input}
                      value={form[f.key]}
                      min={f.min}
                      max={f.max}
                      step={f.step}
                      onChange={e => handleChange(f.key, e.target.value)}
                    />
                    <span style={S.description}>{f.description}</span>
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <button
                  style={{
                    ...S.btn,
                    ...(loading ? S.btnLoading : {}),
                    flex: 3,
                  }}
                  onClick={handlePredict}
                  disabled={loading}
                >
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <span style={{
                        width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff", borderRadius: "50%",
                        display: "inline-block", animation: "spin 0.7s linear infinite"
                      }} />
                      Predicting...
                    </span>
                  ) : "🔥 Predict FWI"}
                </button>

                <button
                  style={{
                    ...S.btn, flex: 1,
                    background: "rgba(255,255,255,0.04)",
                    boxShadow: "none",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#94a3b8",
                  }}
                  onClick={handleReset}
                  disabled={loading}
                >
                  Reset
                </button>
              </div>

              {error && (
                <div style={S.errorBox}>
                  ❌ {error} — Make sure FastAPI is running on port 8000
                </div>
              )}
            </div>

            {/* ── Side Panel ── */}
            <div style={S.sideCard}>

              {/* Result */}
              {result && risk ? (
                <div style={S.resultBox(risk.color, risk.bg)}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#475569", marginBottom: 8 }}>
                    Predicted FWI
                  </div>
                  <div style={S.resultNum(risk.color)}>
                    {result.predicted_FWI}
                  </div>
                  <div style={S.resultLabel}>Fire Weather Index</div>
                  <div style={S.riskBadge(risk.color, risk.bg)}>
                    {risk.label}
                  </div>
                  <div style={S.progressWrap}>
                    <div style={{
                      height: "100%", borderRadius: 999,
                      background: `linear-gradient(90deg, ${risk.bar}, ${risk.bar}cc)`,
                      width: `${risk.pct}%`,
                      boxShadow: `0 0 10px ${risk.bar}80`,
                      transition: "width 0.8s ease",
                    }} />
                  </div>
                </div>
              ) : (
                <div style={S.emptyBox}>
                  <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>🌲</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                    No Prediction Yet
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#334155" }}>
                    Fill in the parameters and hit Predict
                  </div>
                </div>
              )}

              {/* FWI Scale */}
              <div style={S.cardTitle}>
                <span>📊</span> FWI Risk Scale
              </div>
              <div style={S.scaleRow}>
                {SCALE.map(s => (
                  <div
                    key={s.label}
                    style={S.scaleItem(
                      result ? getRisk(result.predicted_FWI).label.replace(" 🔥","") === s.label : false,
                      s.color
                    )}
                  >
                    <span style={S.scaleColor(s.color)} />
                    <span style={S.scaleName}>{s.label}</span>
                    <span style={S.scaleRange}>{s.range}</span>
                  </div>
                ))}
              </div>

              {/* Input summary */}
              {result && (
                <div style={{
                  marginTop: 20, padding: "12px 14px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 10,
                }}>
                  <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#475569", marginBottom: 10 }}>
                    Input Summary
                  </div>
                  {FIELDS.map(f => (
                    <div key={f.key} style={{
                      display: "flex", justifyContent: "space-between",
                      fontSize: "0.73rem", padding: "4px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                    }}>
                      <span style={{ color: "#475569" }}>{f.label}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8" }}>
                        {form[f.key]}{f.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}