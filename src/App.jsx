import { useEffect, useState } from "react";
import {
  Thermometer,
  Droplets,
  Wind,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Radio,
  Languages,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL || "https://savebarn-backend.onrender.com";

const STATUS_STYLES = {
  NORMAL: {
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-400",
    labelEn: "Optimal Conditions",
    labelHa: "Yanayi Yana Da Kyau",
  },
  ALERT: {
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    dot: "bg-amber-400",
    labelEn: "Early Warning",
    labelHa: "Fara Gargaɗi",
  },
  DANGER: {
    badge: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    dot: "bg-orange-400",
    labelEn: "Action Required",
    labelHa: "Ana Buƙatar Mataki",
  },
  EMERGENCY: {
    badge: "bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse",
    dot: "bg-rose-500",
    labelEn: "Critical Emergency",
    labelHa: "Gaggawar Gaske",
  },
};

export default function App() {
  const [zones, setZones] = useState([]);
  const [lang, setLang] = useState("en");
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_URL}/api/dashboard`);
      const data = await res.json();
      if (data.zones) {
        setZones(data.zones);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (advisoryId) => {
    setResolvingId(advisoryId);
    try {
      await fetch(`${API_URL}/api/advisories/${advisoryId}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolvedBy: lang === "en" ? "Farm Attendant" : "Ma'aikacin Gona",
        }),
      });
      await fetchDashboard();
    } catch (err) {
      console.error("Resolve failed:", err);
    } finally {
      setResolvingId(null);
    }
  };

  const activeZone = zones[0];
  const latest = activeZone?.readings?.[0];
  const chartData = [...(activeZone?.readings || [])]
    .reverse()
    .map((r) => ({
      time: new Date(r.recordedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      Temp: r.temperatureC,
      THI: r.thi,
      Ammonia: r.ammoniaPpm,
    }));

  const statusMeta =
    STATUS_STYLES[latest?.status || "NORMAL"] || STATUS_STYLES.NORMAL;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg">
              SB
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                SaveBarn
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Microclimate Intelligence
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                {lang === "en"
                  ? "Real-Time Livestock Weather & Air-Quality Decision Engine"
                  : "Na'urar Kula da Yanayi da Lafiyar Dabbobi Kai Tsaye"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/70 px-3 py-1.5 rounded-lg border border-slate-700">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-ping" />
              <span>
                {lang === "en" ? "Node Live" : "Na'ura Na Aiki"} •{" "}
                {lastUpdated || "Syncing..."}
              </span>
            </div>

            <button
              onClick={() => setLang(lang === "en" ? "ha" : "en")}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium transition cursor-pointer"
            >
              <Languages className="w-4 h-4 text-emerald-400" />
              {lang === "en" ? "Hausa" : "English"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
            <span>Connecting to SaveBarn telemetry stream...</span>
          </div>
        ) : !activeZone ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
            No barn zones found. Start your Wokwi simulator or seed demo data.
          </div>
        ) : (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Device ID: {activeZone.deviceId} • {activeZone.species}
                </div>
                <h2 className="text-2xl font-bold text-white mt-0.5">
                  {activeZone.name}
                </h2>
              </div>

              <div
                className={`px-4 py-2 rounded-full border text-sm font-semibold flex items-center gap-2 ${statusMeta.badge}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${statusMeta.dot}`} />
                {lang === "en" ? statusMeta.labelEn : statusMeta.labelHa}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                icon={<Thermometer className="w-5 h-5 text-orange-400" />}
                label={lang === "en" ? "Temperature" : "Zafin Ɗaki"}
                value={latest ? `${latest.temperatureC}°C` : "--"}
                sub={lang === "en" ? "Optimal: 21°C – 28°C" : "Matsakaici: 21°C – 28°C"}
              />
              <MetricCard
                icon={<Droplets className="w-5 h-5 text-sky-400" />}
                label={lang === "en" ? "Relative Humidity" : "Danshin Iska"}
                value={latest ? `${latest.humidityPct}%` : "--"}
                sub={lang === "en" ? "Optimal: 50% – 70%" : "Matsakaici: 50% – 70%"}
              />
              <MetricCard
                icon={<Activity className="w-5 h-5 text-rose-400" />}
                label={lang === "en" ? "Heat Stress (THI)" : "Ma'aunin Zafi (THI)"}
                value={latest ? `${latest.thi}` : "--"}
                sub={lang === "en" ? "Alert Threshold: ≥ 77.0" : "Gargaɗi: ≥ 77.0"}
                highlight={latest?.thi >= 77}
              />
              <MetricCard
                icon={<Wind className="w-5 h-5 text-amber-400" />}
                label={lang === "en" ? "Ammonia (NH₃)" : "Gas ɗin Ammonia"}
                value={latest ? `${latest.ammoniaPpm} ppm` : "--"}
                sub={lang === "en" ? "Safe Limit: < 15 ppm" : "Tsaro: < 15 ppm"}
                highlight={latest?.ammoniaPpm >= 15}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-emerald-400" />
                  {lang === "en"
                    ? "Farmer Next-Move Prescriptions"
                    : "Matakan Da Manomi Zai Ɗauka"}
                </h3>

                {activeZone.advisories.length === 0 ? (
                  <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <p className="font-semibold text-white">
                      {lang === "en"
                        ? "All Barn Parameters Safe"
                        : "Dukkan Yanayin Gidan Dabbobi Yana Lafiya"}
                    </p>
                    <p className="text-sm text-slate-400">
                      {lang === "en"
                        ? "No corrective action needed. Continuous monitoring active."
                        : "Ba a buƙatar wani matakin gaggawa a yanzu."}
                    </p>
                  </div>
                ) : (
                  activeZone.advisories.map((adv) => {
                    const isEmergency = adv.severity === "EMERGENCY";
                    const actions =
                      lang === "en" ? adv.actionsEn : adv.actionsHa;
                    return (
                      <div
                        key={adv.id}
                        className={`rounded-2xl border p-5 space-y-4 ${
                          isEmergency
                            ? "bg-rose-950/30 border-rose-500/50"
                            : "bg-amber-950/25 border-amber-500/40"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle
                            className={`w-6 h-6 shrink-0 mt-0.5 ${
                              isEmergency ? "text-rose-400" : "text-amber-400"
                            }`}
                          />
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/30 text-white">
                              {adv.severity}
                            </span>
                            <h4 className="font-bold text-base text-white mt-1">
                              {lang === "en" ? adv.titleEn : adv.titleHa}
                            </h4>
                          </div>
                        </div>

                        <ol className="space-y-2 text-sm text-slate-200 list-decimal list-inside bg-slate-950/50 p-3.5 rounded-xl border border-white/5">
                          {actions.map((step, idx) => (
                            <li key={idx} className="leading-relaxed">
                              {step}
                            </li>
                          ))}
                        </ol>

                        <button
                          onClick={() => handleResolve(adv.id)}
                          disabled={resolvingId === adv.id}
                          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm transition cursor-pointer"
                        >
                          {resolvingId === adv.id
                            ? "Logging..."
                            : lang === "en"
                            ? "✓ Mark Action Taken"
                            : "✓ Na Ɗauki Mataki"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white">
                    {lang === "en"
                      ? "Microclimate & Heat-Stress Trend"
                      : "Jadawalin Sauyin Zafi da Ammonia"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === "en"
                      ? "Live sensor stream + 24-hour historical baseline"
                      : "Bayanan na'ura kai tsaye da na awanni 24 da suka gabata"}
                  </p>
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="thiGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "0.75rem",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="THI"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        fill="url(#thiGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="Temp"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#tempGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="Ammonia"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        fillOpacity={0}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function MetricCard({ icon, label, value, sub, highlight }) {
  return (
    <div
      className={`rounded-2xl border p-5 transition ${
        highlight
          ? "bg-rose-950/20 border-rose-500/40"
          : "bg-slate-900 border-slate-800"
      }`}
    >
      <div className="flex items-center justify-between text-slate-400 text-sm font-medium">
        <span>{label}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold text-white mt-2">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{sub}</div>
    </div>
  );
}
