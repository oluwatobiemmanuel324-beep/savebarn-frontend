import { useEffect, useMemo, useState } from "react";
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
  Cpu,
  Sliders,
  Fan,
  Flame,
  CloudRain,
  Columns,
  Sparkles,
  Minus,
  Plus,
  Sprout,
  Beef,
  Layers,
  ArrowRight,
  ArrowLeft,
  LogOut,
  Check,
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

const API_URL =
  import.meta.env.VITE_API_URL || "https://savebarn-backend.onrender.com";

const STORAGE_KEY = "savebarn_signup_onboarding_v1";

function generateAutoHardwareId(purpose = "BOTH") {
  const prefix =
    purpose === "LIVESTOCK"
      ? "SB-LVK"
      : purpose === "CROPS"
      ? "SB-CRP"
      : "SB-HYB";
  const code = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${code}-VIRT`;
}

const PRODUCT_PRESETS = {
  LIVESTOCK: [
    { id: "POULTRY_BROILER", label: "Broiler Chickens (Poultry)", minTemp: 21, maxTemp: 28, maxThi: 77, maxNh3: 15 },
    { id: "POULTRY_LAYER", label: "Layer Hens (Egg Production)", minTemp: 19, maxTemp: 26, maxThi: 76, maxNh3: 15 },
    { id: "SWINE_PIG", label: "Pigs / Swine", minTemp: 16, maxTemp: 24, maxThi: 75, maxNh3: 12 },
    { id: "GOAT_SHEEP", label: "Goats & Sheep", minTemp: 14, maxTemp: 27, maxThi: 78, maxNh3: 15 },
    { id: "CATTLE", label: "Cattle (Dairy / Beef)", minTemp: 10, maxTemp: 25, maxThi: 72, maxNh3: 15 },
  ],
  CROPS: [
    { id: "MAIZE_GRAIN", label: "Maize & Dry Grain Silo/Store", minTemp: 14, maxTemp: 25, maxThi: 75, maxNh3: 15 },
    { id: "TOMATO_PRODUCE", label: "Tomatoes & Fresh Vegetables", minTemp: 12, maxTemp: 20, maxThi: 70, maxNh3: 15 },
    { id: "TUBERS_YAM", label: "Yam, Cassava & Tubers", minTemp: 15, maxTemp: 24, maxThi: 74, maxNh3: 15 },
  ],
  BOTH: [
    { id: "POULTRY_BROILER", label: "Broilers + Stored Feed/Produce", minTemp: 21, maxTemp: 28, maxThi: 77, maxNh3: 15 },
    { id: "SWINE_PIG", label: "Swine Pen + Crop/Feed Storage", minTemp: 16, maxTemp: 24, maxThi: 75, maxNh3: 12 },
    { id: "GOAT_SHEEP", label: "Goats/Sheep + Grain/Produce Shed", minTemp: 14, maxTemp: 27, maxThi: 78, maxNh3: 15 },
  ],
};

const INITIAL_CONTROLS = [
  {
    id: "ctrl-fan",
    key: "fan",
    nameEn: "Exhaust & Cooling Fan",
    nameHa: "Fankar Cire Zafi & Iska",
    type: "COOLING",
    mode: "IN_FAVOR",
    active: true,
  },
  {
    id: "ctrl-mist",
    key: "mist",
    nameEn: "Mist / Humidity & Cooling Unit",
    nameHa: "Na'urar Sanyaya & Danshi",
    type: "COOLING",
    mode: "IN_FAVOR",
    active: false,
  },
  {
    id: "ctrl-heater",
    key: "heater",
    nameEn: "Thermal Heater / Warmer",
    nameHa: "Na'urar Dumama",
    type: "HEATING",
    mode: "IN_FAVOR",
    active: false,
  },
  {
    id: "ctrl-curtain",
    key: "curtain",
    nameEn: "Airflow Vent / Louver",
    nameHa: "Mashigar Iska",
    type: "AIRFLOW",
    mode: "IN_FAVOR",
    active: true,
  },
];

function computeTHI(tempC, rh) {
  return Number(
    (1.8 * tempC + 32 - (0.55 - 0.0055 * rh) * (1.8 * tempC - 26.8)).toFixed(1)
  );
}

function createInitialHistory(tempC, rh, nh3) {
  const thi = computeTHI(tempC, rh);
  const labels = ["-20m", "-16m", "-12m", "-8m", "-4m", "Now"];
  return labels.map((time, idx) => {
    const offset = (labels.length - 1 - idx) * 0.4;
    const t = Number((tempC - offset).toFixed(1));
    return {
      time,
      Temp: t,
      THI: computeTHI(t, rh),
      Ammonia: Number(Math.max(1, nh3 - offset * 0.5).toFixed(1)),
    };
  });
}

export default function App() {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      stage: "SIGNUP", // "SIGNUP" | "ONBOARD_PURPOSE" | "ONBOARD_DETAILS" | "DASHBOARD"
      lang: "en",
      user: null, // { name, email }
      purpose: "LIVESTOCK", // "LIVESTOCK" | "CROPS" | "BOTH"
      farmName: "",
      productId: "POULTRY_BROILER",
      productLabel: "Broiler Chickens (Poultry)",
      customProduct: "",
      hardwareId: generateAutoHardwareId("LIVESTOCK"),
      temperatureC: 27.5,
      humidityPct: 66,
      ammoniaPpm: 11.5,
      history: createInitialHistory(27.5, 66, 11.5),
      controls: INITIAL_CONTROLS,
    };
  });

  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());
  const [syncMode, setSyncMode] = useState("Interactive Ready");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }, [state]);

  // Optional background telemetry sync once on dashboard
  useEffect(() => {
    if (state.stage !== "DASHBOARD") return;
    let mounted = true;
    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/api/dashboard`);
        if (!res.ok) return;
        const data = await res.json();
        const r = data?.zones?.[0]?.readings?.[0];
        if (!mounted || !r) return;
        setSyncMode("Cloud Connected");
      } catch (_) {
        if (mounted) setSyncMode("Interactive Sim");
      }
    };
    poll();
    const t = setInterval(poll, 10000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [state.stage]);

  const activePreset = useMemo(() => {
    const all = [
      ...PRODUCT_PRESETS.LIVESTOCK,
      ...PRODUCT_PRESETS.CROPS,
      ...PRODUCT_PRESETS.BOTH,
    ];
    return (
      all.find((item) => item.id === state.productId) ||
      PRODUCT_PRESETS[state.purpose]?.[0] ||
      PRODUCT_PRESETS.LIVESTOCK[0]
    );
  }, [state.productId, state.purpose]);

  const displayProductName =
    state.customProduct.trim() || state.productLabel || activePreset.label;

  const thi = computeTHI(state.temperatureC, state.humidityPct);

  const conditionStatus = useMemo(() => {
    const tempOutOfRange =
      state.temperatureC > activePreset.maxTemp ||
      state.temperatureC < activePreset.minTemp;
    const highThi = thi >= activePreset.maxThi;
    const highNh3 = state.ammoniaPpm >= activePreset.maxNh3;

    if (state.temperatureC > activePreset.maxTemp + 4 || thi >= activePreset.maxThi + 5) {
      return { level: "EMERGENCY", isHot: state.temperatureC > activePreset.maxTemp, isCold: state.temperatureC < activePreset.minTemp };
    }
    if (tempOutOfRange || highThi || highNh3) {
      return { level: "DANGER", isHot: state.temperatureC > activePreset.maxTemp, isCold: state.temperatureC < activePreset.minTemp };
    }
    return { level: "NORMAL", isHot: false, isCold: false };
  }, [state.temperatureC, state.ammoniaPpm, thi, activePreset]);

  const handleGoogleSignIn = (demoAccount) => {
    const chosen = demoAccount || {
      name: "Elijah Emmanuel",
      email: "farmer.google@savebarn.ag",
    };
    setState((prev) => ({
      ...prev,
      user: chosen,
      stage: "ONBOARD_PURPOSE",
    }));
  };

  const handleSelectPurpose = (purpose) => {
    const firstProduct =
      PRODUCT_PRESETS[purpose]?.[0] || PRODUCT_PRESETS.LIVESTOCK[0];
    setState((prev) => ({
      ...prev,
      purpose,
      productId: firstProduct.id,
      productLabel: firstProduct.label,
      customProduct: "",
      hardwareId: generateAutoHardwareId(purpose),
    }));
  };

  const handleProceedToDetails = () => {
    setState((prev) => ({
      ...prev,
      stage: "ONBOARD_DETAILS",
    }));
  };

  const handleFinishOnboarding = (e) => {
    e.preventDefault();
    const cleanFarm = (state.farmName || "").trim() || "SaveBarn Agro Farm";
    setState((prev) => ({
      ...prev,
      farmName: cleanFarm,
      stage: "DASHBOARD",
      history: createInitialHistory(
        prev.temperatureC,
        prev.humidityPct,
        prev.ammoniaPpm
      ),
    }));
    setLastUpdated(new Date().toLocaleTimeString());
  };

  const setTemperatureValue = (nextTemp) => {
    const clamped = Number(Math.max(4, Math.min(45, nextTemp)).toFixed(1));
    setState((prev) => {
      const nextPoint = {
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        Temp: clamped,
        THI: computeTHI(clamped, prev.humidityPct),
        Ammonia: prev.ammoniaPpm,
      };
      return {
        ...prev,
        temperatureC: clamped,
        history: [...prev.history.slice(-11), nextPoint],
      };
    });
    setLastUpdated(new Date().toLocaleTimeString());
  };

  const stepTemperature = (delta) => {
    setTemperatureValue(Number(state.temperatureC) + delta);
  };

  const toggleControlMode = (id) => {
    setState((prev) => ({
      ...prev,
      controls: prev.controls.map((c) =>
        c.id === id
          ? { ...c, mode: c.mode === "IN_FAVOR" ? "AGAINST" : "IN_FAVOR", active: true }
          : c
      ),
    }));
  };

  const toggleControlPower = (id) => {
    setState((prev) => ({
      ...prev,
      controls: prev.controls.map((c) =>
        c.id === id ? { ...c, active: !c.active } : c
      ),
    }));
  };

  const simulateRegulatorEffect = () => {
    let deltaTemp = 0;
    let deltaNh3 = 0;

    state.controls.forEach((ctrl) => {
      if (!ctrl.active) return;
      const sign = ctrl.mode === "IN_FAVOR" ? 1 : -1;
      if (ctrl.type === "COOLING") {
        deltaTemp += conditionStatus.isHot ? -1.5 * sign : -0.8 * sign;
      } else if (ctrl.type === "HEATING") {
        deltaTemp += conditionStatus.isCold ? 1.5 * sign : 1.0 * sign;
      } else if (ctrl.type === "AIRFLOW") {
        deltaNh3 += -1.5 * sign;
        deltaTemp += conditionStatus.isHot ? -0.6 * sign : -0.3 * sign;
      }
    });

    const nextTemp = Number(
      Math.max(4, Math.min(45, state.temperatureC + deltaTemp)).toFixed(1)
    );
    const nextNh3 = Number(
      Math.max(1, Math.min(45, state.ammoniaPpm + deltaNh3)).toFixed(1)
    );

    setState((prev) => {
      const point = {
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        Temp: nextTemp,
        THI: computeTHI(nextTemp, prev.humidityPct),
        Ammonia: nextNh3,
      };
      return {
        ...prev,
        temperatureC: nextTemp,
        ammoniaPpm: nextNh3,
        history: [...prev.history.slice(-11), point],
      };
    });
    setLastUpdated(new Date().toLocaleTimeString());
  };

  const handleResetToSignup = () => {
    localStorage.removeItem(STORAGE_KEY);
    const freshPurpose = "LIVESTOCK";
    setState({
      stage: "SIGNUP",
      lang: state.lang,
      user: null,
      purpose: freshPurpose,
      farmName: "",
      productId: "POULTRY_BROILER",
      productLabel: "Broiler Chickens (Poultry)",
      customProduct: "",
      hardwareId: generateAutoHardwareId(freshPurpose),
      temperatureC: 27.5,
      humidityPct: 66,
      ammoniaPpm: 11.5,
      history: createInitialHistory(27.5, 66, 11.5),
      controls: INITIAL_CONTROLS,
    });
  };

  const lang = state.lang;

  // 1. SIGNUP PAGE (FIRST SCREEN)
  if (state.stage === "SIGNUP") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
        <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              SB
            </div>
            <div>
              <span className="font-bold text-lg text-white">SaveBarn</span>
              <p className="text-xs text-slate-400">
                Smart Livestock & Crop Microclimate System
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setState((prev) => ({ ...prev, lang: prev.lang === "en" ? "ha" : "en" }))
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:border-slate-700 cursor-pointer"
          >
            <Languages className="w-4 h-4 text-emerald-400" />
            {lang === "en" ? "Hausa" : "English"}
          </button>
        </div>

        <div className="max-w-md w-full mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 my-8 shadow-2xl">
          <div className="space-y-2 text-center">
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {lang === "en" ? "Farmer Account Sign Up" : "Bude Asusun Manomi"}
            </span>
            <h1 className="text-2xl font-bold text-white">
              {lang === "en"
                ? "Create Your SaveBarn Account"
                : "Shiga SaveBarn Da Google"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {lang === "en"
                ? "Sign up with Google first, then set up your farming focus, farm name, and product."
                : "Yi rajista da Google tukuna, sannan ka saita nau'in noma, sunan gona, da amfanin gona."}
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() =>
                handleGoogleSignIn({
                  name: "Elijah Emmanuel",
                  email: "elijah.agro@gmail.com",
                })
              }
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm flex items-center justify-center gap-3 transition cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.78-.07-1.54-.2-2.27H12v4.51h6.47c-.28 1.5-1.12 2.77-2.38 3.62v3.01h3.85c2.25-2.07 3.55-5.13 3.55-8.77z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.85-3.01c-1.07.72-2.44 1.15-4.09 1.15-3.14 0-5.8-2.12-6.75-4.97H1.27v3.11C3.25 21.31 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.25 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.62H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.38l3.98-3.11z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.27 6.62l3.98 3.11c.95-2.85 3.61-4.98 6.75-4.98z"
                />
              </svg>
              <span>
                {lang === "en"
                  ? "Continue with Google"
                  : "Ci Gaba Da Asusun Google"}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                handleGoogleSignIn({
                  name: "Amina Usman",
                  email: "amina.farms@gmail.com",
                })
              }
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
            >
              {lang === "en"
                ? "Quick Demo Google Sign-In (Amina Usman)"
                : "Gwajin Shiga Da Google (Amina Usman)"}
            </button>
          </div>

          <p className="text-[11px] text-slate-500 text-center">
            {lang === "en"
              ? "Step 1 of 3: Google Sign-Up → Step 2: Farming Type → Step 3: Farm & Product Setup"
              : "Mataki 1 na 3: Rajistar Google → Mataki 2: Nau'in Noma → Mataki 3: Gona & Amfani"}
          </p>
        </div>

        <div className="max-w-5xl w-full mx-auto text-center text-xs text-slate-500">
          SaveBarn • Microclimate & Storage Decision Platform
        </div>
      </div>
    );
  }

  // 2. ONBOARDING STAGE 1: LIVESTOCK / CROP PRESERVATION / BOTH
  if (state.stage === "ONBOARD_PURPOSE") {
    const purposeOptions = [
      {
        id: "LIVESTOCK",
        icon: Beef,
        titleEn: "Livestock Farming",
        titleHa: "Kiwo / Noman Dabbobi",
        descEn: "Monitor heat stress (THI), temperature, and ammonia for poultry, pigs, goats, sheep, or cattle.",
        descHa: "Kula da zafi (THI) da ammonia na kaji, aladu, awaki, tumaki, ko shanu.",
      },
      {
        id: "CROPS",
        icon: Sprout,
        titleEn: "Crop Preservation",
        titleHa: "Ajiyar Amfanin Gona",
        descEn: "Protect harvested grains, tubers, and fresh produce from heat and humidity spoilage.",
        descHa: "Kare hatsi, doya, rogo, da kayan lambu daga lalacewa saboda zafi da danshi.",
      },
      {
        id: "BOTH",
        icon: Layers,
        titleEn: "Both (Livestock & Crops)",
        titleHa: "Duk Biyu (Kiwo & Amfanin Gona)",
        descEn: "Run climate monitoring and alerts across both livestock pens and crop storage spaces.",
        descHa: "Kula da dukkan gidajen kiwo da wuraren ajiyar amfanin gona tare.",
      },
    ];

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                {lang === "en" ? "Onboarding • Step 1 of 2" : "Saitawa • Mataki 1 na 2"}
              </span>
              <h1 className="text-2xl font-bold text-white mt-1">
                {lang === "en"
                  ? `Welcome, ${state.user?.name || "Farmer"} — What farming will you use SaveBarn for?`
                  : `Barka da zuwa, ${state.user?.name || "Manomi"} — Wane irin noma zaka yi da SaveBarn?`}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {lang === "en"
                  ? "Choose one option below so we tailor alerts and product options to your farm."
                  : "Zaɓi ɗaya daga cikin waɗannan domin mu daidaita bayanai da zaɓuɓɓukan gonarka."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetToSignup}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              {lang === "en" ? "Sign Out" : "Fita"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {purposeOptions.map((opt) => {
              const Icon = opt.icon;
              const selected = state.purpose === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectPurpose(opt.id)}
                  className={`text-left rounded-2xl border p-5 space-y-3 transition cursor-pointer ${
                    selected
                      ? "bg-emerald-500/15 border-emerald-500 text-white"
                      : "bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-slate-800 text-emerald-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    {selected && (
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-base">
                    {lang === "en" ? opt.titleEn : opt.titleHa}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {lang === "en" ? opt.descEn : opt.descHa}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleProceedToDetails}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition cursor-pointer"
            >
              <span>{lang === "en" ? "Next: Farm Name & Product" : "Na Gaba: Sunan Gona & Amfani"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. ONBOARDING STAGE 2: FARM PRODUCT, FARM NAME & AUTO DEVICE ID
  if (state.stage === "ONBOARD_DETAILS") {
    const availableProducts =
      PRODUCT_PRESETS[state.purpose] || PRODUCT_PRESETS.LIVESTOCK;

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-8">
        <form
          onSubmit={handleFinishOnboarding}
          className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5"
        >
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {lang === "en" ? "Onboarding • Step 2 of 2" : "Saitawa • Mataki 2 na 2"}
            </span>
            <h1 className="text-2xl font-bold text-white mt-1">
              {lang === "en"
                ? "Farm Name, Product & Auto Device ID"
                : "Sunan Gona, Amfani & Lambar Na'ura"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {lang === "en"
                ? "Your unique Hardware ID is generated automatically since physical hardware isn't attached yet."
                : "An samar da lambar na'ura (Hardware ID) kai tsaye tunda ba a haɗa na'urar zahiri ba tukuna."}
            </p>
          </div>

          {/* Auto-displayed Unique Device ID */}
          <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                {lang === "en"
                  ? "Auto-Assigned Unique Hardware ID"
                  : "Lambar Na'ura Ta Kai Tsaye (Auto ID)"}
              </div>
              <div className="text-lg font-mono font-bold text-white mt-1">
                {state.hardwareId}
              </div>
              <div className="text-[11px] text-slate-400">
                {lang === "en"
                  ? "Virtual node active for simulation & pitch demo"
                  : "Na'urar gwaji a shirye take don amfani"}
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  hardwareId: generateAutoHardwareId(prev.purpose),
                }))
              }
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 cursor-pointer"
            >
              {lang === "en" ? "New Auto ID" : "Sabo ID"}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {lang === "en" ? "Farm Name *" : "Sunan Gona *"}
              </label>
              <input
                type="text"
                required
                value={state.farmName}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, farmName: e.target.value }))
                }
                placeholder="e.g., Nasarawa Green Acres Farm"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {lang === "en" ? "Kind of Farm Product *" : "Nau'in Amfanin Gona / Dabba *"}
              </label>
              <select
                value={state.productId}
                onChange={(e) => {
                  const chosen = availableProducts.find(
                    (item) => item.id === e.target.value
                  );
                  setState((prev) => ({
                    ...prev,
                    productId: e.target.value,
                    productLabel: chosen ? chosen.label : prev.productLabel,
                  }));
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {lang === "en"
                  ? "Or Specify Custom Product / Crop / Animal (Optional)"
                  : "Ko Rubuta Wani Nau'i Na Musamman (Idan Ana Bukata)"}
              </label>
              <input
                type="text"
                value={state.customProduct}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, customProduct: e.target.value }))
                }
                placeholder="e.g., Turkeys, Ginger Storage, Fingerlings..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() =>
                setState((prev) => ({ ...prev, stage: "ONBOARD_PURPOSE" }))
              }
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === "en" ? "Back" : "Baya"}</span>
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition cursor-pointer"
            >
              <span>{lang === "en" ? "Enter Dashboard" : "Shiga Dashboard"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 4. MAIN DASHBOARD
  const againstControls = state.controls.filter((c) => c.mode === "AGAINST");
  const statusBadge = {
    NORMAL: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    DANGER: "bg-orange-500/15 text-orange-300 border-orange-500/40",
    EMERGENCY: "bg-rose-500/15 text-rose-300 border-rose-500/40 animate-pulse",
  }[conditionStatus.level];

  const statusText = {
    NORMAL: lang === "en" ? "Optimal & Healthy" : "Lafiya & Daidai",
    DANGER: lang === "en" ? "Out of Safe Range" : "Ya Wuce Matsayin Tsaro",
    EMERGENCY: lang === "en" ? "Critical Stress Alert" : "Gaggawar Zafi / Hadari",
  }[conditionStatus.level];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              SB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white">SaveBarn</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {syncMode}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {lang === "en"
                  ? `Welcome, ${state.farmName} • ${displayProductName}`
                  : `Barka da zuwa, ${state.farmName} • ${displayProductName}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setState((prev) => ({ ...prev, stage: "ONBOARD_PURPOSE" }))
              }
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
            >
              {lang === "en" ? "Edit Farm Setup" : "Gyara Saitin Gona"}
            </button>
            <button
              type="button"
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  lang: prev.lang === "en" ? "ha" : "en",
                }))
              }
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium cursor-pointer"
            >
              <Languages className="w-4 h-4 text-emerald-400" />
              {lang === "en" ? "Hausa" : "English"}
            </button>
            <button
              type="button"
              onClick={handleResetToSignup}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-xs text-rose-200 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{lang === "en" ? "Sign Out" : "Fita"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Welcome Banner */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {lang === "en"
                ? `Welcome to ${state.farmName}`
                : `Barka da Zuwa Gonar ${state.farmName}`}
            </p>
            <h1 className="text-2xl font-bold text-white">{displayProductName}</h1>
            <p className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-emerald-300 font-mono font-semibold">
                <Cpu className="w-3.5 h-3.5" />
                Auto ID: {state.hardwareId}
              </span>
              <span>•</span>
              <span>
                {lang === "en" ? "Mode:" : "Yanayi:"}{" "}
                <strong className="text-slate-200">{state.purpose}</strong>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400" />
                {lastUpdated}
              </span>
            </p>
          </div>

          <div
            className={`px-4 py-2 rounded-full border text-sm font-semibold ${statusBadge}`}
          >
            {statusText}
          </div>
        </section>

        {/* Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<Thermometer className="w-5 h-5 text-orange-400" />}
            label={lang === "en" ? "Temperature" : "Zafin Wuri"}
            value={`${state.temperatureC}°C`}
            sub={`Safe: ${activePreset.minTemp}°C – ${activePreset.maxTemp}°C`}
            highlight={
              state.temperatureC > activePreset.maxTemp ||
              state.temperatureC < activePreset.minTemp
            }
          />
          <MetricCard
            icon={<Droplets className="w-5 h-5 text-sky-400" />}
            label={lang === "en" ? "Humidity" : "Danshin Iska"}
            value={`${state.humidityPct}%`}
            sub="Target: 50% – 70%"
          />
          <MetricCard
            icon={<Activity className="w-5 h-5 text-rose-400" />}
            label="Heat Stress (THI)"
            value={`${thi}`}
            sub={`Alert: ≥ ${activePreset.maxThi}`}
            highlight={thi >= activePreset.maxThi}
          />
          <MetricCard
            icon={<Wind className="w-5 h-5 text-amber-400" />}
            label="Ammonia (NH₃)"
            value={`${state.ammoniaPpm} ppm`}
            sub={`Safe: < ${activePreset.maxNh3} ppm`}
            highlight={state.ammoniaPpm >= activePreset.maxNh3}
          />
        </section>

        {/* Climate Controls with - and + Temperature Buttons */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                {lang === "en"
                  ? "Climate Regulator Controls — In Favor vs. Against Asset"
                  : "Kula da Na'urorin Yanayi — Don Amfani vs. Sabanin Haka"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === "en"
                  ? "Step temperature down (-) or up (+), or simulate regulator behavior."
                  : "Rage zafi (-) ko kara shi (+), ko gwada tasirin na'urorin yanayi."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => stepTemperature(-1)}
                className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                <Minus className="w-4 h-4" />
                <span>1°C</span>
              </button>

              <button
                type="button"
                onClick={() => stepTemperature(1)}
                className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>1°C</span>
              </button>

              <button
                type="button"
                onClick={simulateRegulatorEffect}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>
                  {lang === "en"
                    ? "Simulate Regulator Effect Now"
                    : "Gwada Tasirin Na'urorin"}
                </span>
              </button>
            </div>
          </div>

          {againstControls.length > 0 && (
            <div className="bg-rose-950/30 border border-rose-500/40 rounded-xl px-4 py-2.5 text-xs text-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                {againstControls.length} regulator(s) set to work AGAINST asset:{" "}
                {againstControls.map((c) => c.nameEn).join(", ")}.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {state.controls.map((ctrl) => {
              const isInFavor = ctrl.mode === "IN_FAVOR";
              const IconComp =
                ctrl.key === "fan"
                  ? Fan
                  : ctrl.key === "mist"
                  ? CloudRain
                  : ctrl.key === "heater"
                  ? Flame
                  : Columns;

              return (
                <div
                  key={ctrl.id}
                  className={`rounded-xl border p-4 flex flex-col justify-between gap-3 ${
                    isInFavor
                      ? "bg-slate-950/70 border-slate-800"
                      : "bg-rose-950/20 border-rose-500/40"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="p-2 rounded-lg bg-slate-800 text-emerald-400">
                        <IconComp className="w-4 h-4" />
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleControlPower(ctrl.id)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold border cursor-pointer ${
                          ctrl.active
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {ctrl.active ? "ON" : "OFF"}
                      </button>
                    </div>
                    <div className="font-semibold text-sm text-white">
                      {lang === "en" ? ctrl.nameEn : ctrl.nameHa}
                    </div>
                    <div className="text-xs text-slate-400">
                      {lang === "en" ? "Stance: " : "Matsayi: "}
                      <span
                        className={`font-semibold ${
                          isInFavor ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isInFavor
                          ? lang === "en"
                            ? "In Favor of Asset"
                            : "Don Amfanin Gona"
                          : lang === "en"
                          ? "Against Asset"
                          : "Akan Gona"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleControlMode(ctrl.id)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      isInFavor
                        ? "bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/40 text-emerald-200"
                        : "bg-rose-600/25 hover:bg-rose-600/35 border-rose-500/50 text-rose-200"
                    }`}
                  >
                    {isInFavor
                      ? lang === "en"
                        ? "Switch to: Against Asset"
                        : "Canza zuwa: Akan Gona"
                      : lang === "en"
                      ? "Switch to: In Favor of Asset"
                      : "Canza zuwa: Don Amfanin Gona"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Diagnosis + Trend Chart */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              {lang === "en" ? "Product Health & Guidance" : "Binciken Lafiya & Shawara"}
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed">
              {conditionStatus.level === "NORMAL"
                ? lang === "en"
                  ? `${state.temperatureC}°C is healthy for ${displayProductName} (safe band: ${activePreset.minTemp}°C–${activePreset.maxTemp}°C).`
                  : `${state.temperatureC}°C yana da kyau ga ${displayProductName} (${activePreset.minTemp}°C–${activePreset.maxTemp}°C).`
                : conditionStatus.isHot
                ? lang === "en"
                  ? `${state.temperatureC}°C is above the healthy range (${activePreset.minTemp}°C–${activePreset.maxTemp}°C) for ${displayProductName}. Activate cooling/airflow In Favor of Asset.`
                  : `${state.temperatureC}°C ya wuce matakin lafiya (${activePreset.minTemp}°C–${activePreset.maxTemp}°C) ga ${displayProductName}. Kunna sanyaya/iska.`
                : lang === "en"
                ? `${state.temperatureC}°C is below the healthy range (${activePreset.minTemp}°C–${activePreset.maxTemp}°C) for ${displayProductName}. Activate warmth/shelter In Favor of Asset.`
                : `${state.temperatureC}°C ya yi kasa da matakin lafiya (${activePreset.minTemp}°C–${activePreset.maxTemp}°C) ga ${displayProductName}. Kunna dumama.`}
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {lang === "en"
                  ? `Signed in as ${state.user?.name || "Farmer"}`
                  : `An shiga da ${state.user?.name || "Manomi"}`}
              </span>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-lg font-bold text-white mb-4">
              {lang === "en" ? "Temperature & THI Trend" : "Jadawalin Zafi da THI"}
            </h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={state.history}>
                  <defs>
                    <linearGradient id="sbTempGrad" x1="0" y1="0" x2="0" y2="1">
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
                    dataKey="Temp"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#sbTempGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="THI"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={0}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
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
