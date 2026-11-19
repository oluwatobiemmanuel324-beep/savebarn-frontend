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
  BookOpen,
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

const STORAGE_KEY = "savebarn_multi_product_v2";

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

const CATALOG = [
  {
    id: "POULTRY_BROILER",
    label: "Broiler Chickens",
    category: "LIVESTOCK",
    minTemp: 21,
    maxTemp: 28,
    maxThi: 77,
    maxNh3: 15,
    sourceEn: "Source: FAO & Poultry Extension Thermoneutral Benchmarks",
    sourceHa: "Tushe: Littattafan FAO & Ka'idojin Kiwon Kaji",
  },
  {
    id: "POULTRY_LAYER",
    label: "Layer Hens",
    category: "LIVESTOCK",
    minTemp: 19,
    maxTemp: 26,
    maxThi: 76,
    maxNh3: 15,
    sourceEn: "Source: FAO & Veterinary Layer Heat-Stress Guidelines",
    sourceHa: "Tushe: Littattafan FAO & Kwararrun Kiwon Kaji",
  },
  {
    id: "SWINE_PIG",
    label: "Pigs / Swine",
    category: "LIVESTOCK",
    minTemp: 16,
    maxTemp: 24,
    maxThi: 75,
    maxNh3: 12,
    sourceEn: "Source: Swine Production & Veterinary THI Reference Scales",
    sourceHa: "Tushe: Ka'idojin Kiwon Aladu & Ma'aunin THI",
  },
  {
    id: "GOAT_SHEEP",
    label: "Goats & Sheep",
    category: "LIVESTOCK",
    minTemp: 14,
    maxTemp: 27,
    maxThi: 78,
    maxNh3: 15,
    sourceEn: "Source: FAO Small Ruminant Housing & Climate Reference",
    sourceHa: "Tushe: Ka'idojin FAO Na Awaki Da Tumaki",
  },
  {
    id: "CATTLE",
    label: "Cattle (Dairy & Beef)",
    category: "LIVESTOCK",
    minTemp: 10,
    maxTemp: 25,
    maxThi: 72,
    maxNh3: 15,
    sourceEn: "Source: Dairy/Beef THI Heat-Load & Veterinary Extension Data",
    sourceHa: "Tushe: Bayanan Ma'aunin Zafi (THI) Na Shanu",
  },
  {
    id: "MAIZE_GRAIN",
    label: "Maize & Dry Grain Store",
    category: "CROPS",
    minTemp: 14,
    maxTemp: 25,
    maxThi: 75,
    maxNh3: 15,
    sourceEn: "Source: FAO Post-Harvest Grain Storage & Moisture Guidelines",
    sourceHa: "Tushe: Ka'idojin FAO Na Ajiyar Hatsi Bayan Girbi",
  },
  {
    id: "TOMATO_PRODUCE",
    label: "Tomatoes & Fresh Produce",
    category: "CROPS",
    minTemp: 12,
    maxTemp: 20,
    maxThi: 70,
    maxNh3: 15,
    sourceEn: "Source: Post-Harvest Horticultural Cold/Cool Storage Standards",
    sourceHa: "Tushe: Ka'idojin Ajiyar Kayan Lambu Bayan Girbi",
  },
  {
    id: "TUBERS_YAM",
    label: "Yam, Cassava & Tubers",
    category: "CROPS",
    minTemp: 15,
    maxTemp: 24,
    maxThi: 74,
    maxNh3: 15,
    sourceEn: "Source: Root & Tuber Post-Harvest Storage Reference Manuals",
    sourceHa: "Tushe: Littattafan Ajiyar Doya Da Rogo",
  },
];

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

function createHistory(tempC, rh, nh3) {
  const labels = ["-20m", "-16m", "-12m", "-8m", "-4m", "Now"];
  return labels.map((time, idx) => {
    const offset = (labels.length - 1 - idx) * 0.4;
    const t = Number((tempC - offset).toFixed(1));
    return {
      time,
      Temp: t,
      THI: computeTHI(t, rh),
      Ammonia: Number(Math.max(1, nh3 - offset * 0.4).toFixed(1)),
    };
  });
}

function resolveRuleForProduct(label, purpose) {
  const lower = label.toLowerCase();
  const matched = CATALOG.find(
    (c) =>
      lower.includes(c.label.toLowerCase().split(" ")[0]) ||
      c.label.toLowerCase().includes(lower)
  );
  if (matched) return matched;

  const isCrop =
    purpose === "CROPS" ||
    /grain|maize|tomato|yam|cassava|tuber|crop|seed|produce|store/.test(lower);

  if (isCrop) {
    return {
      id: `custom-${lower.replace(/\s+/g, "-")}`,
      label,
      category: "CROPS",
      minTemp: 14,
      maxTemp: 24,
      maxThi: 74,
      maxNh3: 15,
      sourceEn: "Source: FAO Post-Harvest Storage & Microclimate Guidelines",
      sourceHa: "Tushe: Ka'idojin FAO Na Ajiyar Amfanin Gona",
    };
  }

  return {
    id: `custom-${lower.replace(/\s+/g, "-")}`,
    label,
    category: "LIVESTOCK",
    minTemp: 18,
    maxTemp: 27,
    maxThi: 76,
    maxNh3: 15,
    sourceEn: "Source: FAO & Veterinary Livestock Thermal Comfort Guidelines",
    sourceHa: "Tushe: Ka'idojin FAO & Kwararrun Lafiyar Dabbobi",
  };
}

function buildProductsFromSelection(selectedIds, customInput, purpose, suffixCode) {
  const chosenCatalog = CATALOG.filter((c) => selectedIds.includes(c.id));
  const customNames = customInput
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const items = [];

  chosenCatalog.forEach((rule, index) => {
    const startTemp =
      rule.id === "SWINE_PIG" ? 26.5 : rule.id === "TOMATO_PRODUCE" ? 23.0 : 28.5;
    const startRh = 66;
    const startNh3 = rule.id === "SWINE_PIG" ? 13.5 : 11.0;
    items.push({
      uid: `${rule.id}-${index}`,
      name: rule.label,
      deviceId: `${generateAutoHardwareId(rule.category).slice(0, 11)}-${index + 1}`,
      rule,
      temperatureC: startTemp,
      humidityPct: startRh,
      ammoniaPpm: startNh3,
      history: createHistory(startTemp, startRh, startNh3),
    });
  });

  customNames.forEach((customName, idx) => {
    const rule = resolveRuleForProduct(customName, purpose);
    const startTemp = 26.0;
    const startRh = 64;
    const startNh3 = 10.0;
    items.push({
      uid: `custom-${idx}-${suffixCode}`,
      name: customName,
      deviceId: `${generateAutoHardwareId(rule.category).slice(0, 11)}-C${idx + 1}`,
      rule,
      temperatureC: startTemp,
      humidityPct: startRh,
      ammoniaPpm: startNh3,
      history: createHistory(startTemp, startRh, startNh3),
    });
  });

  if (items.length === 0) {
    const fallback = CATALOG[0];
    items.push({
      uid: `${fallback.id}-default`,
      name: fallback.label,
      deviceId: generateAutoHardwareId(purpose),
      rule: fallback,
      temperatureC: 27.5,
      humidityPct: 66,
      ammoniaPpm: 11.5,
      history: createHistory(27.5, 66, 11.5),
    });
  }

  return items;
}

export default function App() {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    const initialProducts = buildProductsFromSelection(
      ["POULTRY_BROILER"],
      "",
      "LIVESTOCK",
      "init"
    );
    return {
      stage: "SIGNUP",
      lang: "en",
      user: null,
      purpose: "LIVESTOCK",
      farmName: "",
      selectedProductIds: ["POULTRY_BROILER"],
      customProductsInput: "",
      hardwareId: generateAutoHardwareId("LIVESTOCK"),
      products: initialProducts,
      activeProductUid: initialProducts[0].uid,
      controls: INITIAL_CONTROLS,
    };
  });

  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());
  const [syncLabel, setSyncLabel] = useState("Interactive Ready");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }, [state]);

  useEffect(() => {
    if (state.stage !== "DASHBOARD") return;
    let active = true;
    const checkCloud = async () => {
      try {
        const res = await fetch(`${API_URL}/api/dashboard`);
        if (res.ok && active) setSyncLabel("Cloud Connected");
      } catch (_) {
        if (active) setSyncLabel("Interactive Sim");
      }
    };
    checkCloud();
    const timer = setInterval(checkCloud, 12000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [state.stage]);

  const lang = state.lang;

  const filteredCatalog = useMemo(() => {
    if (state.purpose === "LIVESTOCK") {
      return CATALOG.filter((c) => c.category === "LIVESTOCK");
    }
    if (state.purpose === "CROPS") {
      return CATALOG.filter((c) => c.category === "CROPS");
    }
    return CATALOG;
  }, [state.purpose]);

  const activeProduct =
    state.products.find((p) => p.uid === state.activeProductUid) ||
    state.products[0];

  const activeRule = activeProduct?.rule || CATALOG[0];
  const thi = computeTHI(activeProduct.temperatureC, activeProduct.humidityPct);

  const statusInfo = useMemo(() => {
    const tempOut =
      activeProduct.temperatureC > activeRule.maxTemp ||
      activeProduct.temperatureC < activeRule.minTemp;
    const thiHigh = thi >= activeRule.maxThi;
    const nh3High = activeProduct.ammoniaPpm >= activeRule.maxNh3;
    const isHot = activeProduct.temperatureC > activeRule.maxTemp;
    const isCold = activeProduct.temperatureC < activeRule.minTemp;

    if (activeProduct.temperatureC > activeRule.maxTemp + 4 || thi >= activeRule.maxThi + 5) {
      return { level: "EMERGENCY", isHot, isCold };
    }
    if (tempOut || thiHigh || nh3High) {
      return { level: "DANGER", isHot, isCold };
    }
    return { level: "NORMAL", isHot: false, isCold: false };
  }, [activeProduct.temperatureC, activeProduct.ammoniaPpm, thi, activeRule]);

  const handleGoogleSignIn = (account) => {
    setState((prev) => ({
      ...prev,
      user: account,
      stage: "ONBOARD_PURPOSE",
    }));
  };

  const handleSelectPurpose = (purpose) => {
    const defaultForPurpose = CATALOG.filter((c) =>
      purpose === "BOTH" ? true : c.category === purpose
    )
      .slice(0, purpose === "BOTH" ? 2 : 1)
      .map((c) => c.id);

    setState((prev) => ({
      ...prev,
      purpose,
      selectedProductIds: defaultForPurpose,
      hardwareId: generateAutoHardwareId(purpose),
    }));
  };

  const toggleProductSelection = (id) => {
    setState((prev) => {
      const exists = prev.selectedProductIds.includes(id);
      const nextIds = exists
        ? prev.selectedProductIds.filter((x) => x !== id)
        : [...prev.selectedProductIds, id];
      return { ...prev, selectedProductIds: nextIds };
    });
  };

  const handleFinishOnboarding = (e) => {
    e.preventDefault();
    const cleanFarm = (state.farmName || "").trim() || "SaveBarn Agro Farm";
    const built = buildProductsFromSelection(
      state.selectedProductIds,
      state.customProductsInput,
      state.purpose,
      Date.now()
    );
    setState((prev) => ({
      ...prev,
      farmName: cleanFarm,
      products: built,
      activeProductUid: built[0].uid,
      stage: "DASHBOARD",
    }));
    setLastUpdated(new Date().toLocaleTimeString());
  };

  const updateActiveProductTemp = (nextTemp) => {
    const clamped = Number(Math.max(4, Math.min(45, nextTemp)).toFixed(1));
    setState((prev) => ({
      ...prev,
      products: prev.products.map((prod) => {
        if (prod.uid !== activeProduct.uid) return prod;
        const point = {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          Temp: clamped,
          THI: computeTHI(clamped, prod.humidityPct),
          Ammonia: prod.ammoniaPpm,
        };
        return {
          ...prod,
          temperatureC: clamped,
          history: [...prod.history.slice(-11), point],
        };
      }),
    }));
    setLastUpdated(new Date().toLocaleTimeString());
  };

  const stepTemperature = (delta) => {
    updateActiveProductTemp(Number(activeProduct.temperatureC) + delta);
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
        deltaTemp += statusInfo.isHot ? -1.5 * sign : -0.8 * sign;
      } else if (ctrl.type === "HEATING") {
        deltaTemp += statusInfo.isCold ? 1.5 * sign : 1.0 * sign;
      } else if (ctrl.type === "AIRFLOW") {
        deltaNh3 += -1.5 * sign;
        deltaTemp += statusInfo.isHot ? -0.6 * sign : -0.3 * sign;
      }
    });

    const nextTemp = Number(
      Math.max(4, Math.min(45, activeProduct.temperatureC + deltaTemp)).toFixed(1)
    );
    const nextNh3 = Number(
      Math.max(1, Math.min(45, activeProduct.ammoniaPpm + deltaNh3)).toFixed(1)
    );

    setState((prev) => ({
      ...prev,
      products: prev.products.map((prod) => {
        if (prod.uid !== activeProduct.uid) return prod;
        const point = {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          Temp: nextTemp,
          THI: computeTHI(nextTemp, prod.humidityPct),
          Ammonia: nextNh3,
        };
        return {
          ...prod,
          temperatureC: nextTemp,
          ammoniaPpm: nextNh3,
          history: [...prod.history.slice(-11), point],
        };
      }),
    }));
    setLastUpdated(new Date().toLocaleTimeString());
  };

  const handleSignOut = () => {
    localStorage.removeItem(STORAGE_KEY);
    const fresh = buildProductsFromSelection(
      ["POULTRY_BROILER"],
      "",
      "LIVESTOCK",
      "reset"
    );
    setState({
      stage: "SIGNUP",
      lang: state.lang,
      user: null,
      purpose: "LIVESTOCK",
      farmName: "",
      selectedProductIds: ["POULTRY_BROILER"],
      customProductsInput: "",
      hardwareId: generateAutoHardwareId("LIVESTOCK"),
      products: fresh,
      activeProductUid: fresh[0].uid,
      controls: INITIAL_CONTROLS,
    });
  };

  // 1. GOOGLE SIGNUP SCREEN FIRST
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
                Livestock & Crop Storage Climate Intelligence
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setState((prev) => ({ ...prev, lang: prev.lang === "en" ? "ha" : "en" }))
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 cursor-pointer"
          >
            <Languages className="w-4 h-4 text-emerald-400" />
            {lang === "en" ? "Hausa" : "English"}
          </button>
        </div>

        <div className="max-w-md w-full mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 my-8">
          <div className="text-center space-y-2">
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {lang === "en" ? "Sign Up With Google" : "Yi Rajista Da Google"}
            </span>
            <h1 className="text-2xl font-bold text-white">
              {lang === "en" ? "Welcome to SaveBarn" : "Barka Da Zuwa SaveBarn"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {lang === "en"
                ? "Sign up with Google first to select your farming type, products, and farm name."
                : "Yi rajista da Google tukuna don zaɓar nau'in noma, amfani, da sunan gona."}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              handleGoogleSignIn({
                name: "Farm Operator",
                email: "operator.farm@gmail.com",
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
              {lang === "en" ? "Sign Up with Google" : "Yi Rajista Da Google"}
            </span>
          </button>
        </div>

        <div className="max-w-5xl w-full mx-auto text-center text-xs text-slate-500">
          SaveBarn • Verified Agricultural & Veterinary Climate Reference
        </div>
      </div>
    );
  }

  // 2. ONBOARDING STEP 1: FARMING PURPOSE
  if (state.stage === "ONBOARD_PURPOSE") {
    const options = [
      {
        id: "LIVESTOCK",
        icon: Beef,
        titleEn: "Livestock Farming",
        titleHa: "Kiwon Dabbobi",
        descEn: "Monitor temperature, THI heat stress, and ammonia for livestock pens.",
        descHa: "Kula da zafi, THI, da ammonia na gidajen dabbobi.",
      },
      {
        id: "CROPS",
        icon: Sprout,
        titleEn: "Crop Preservation",
        titleHa: "Ajiyar Amfanin Gona",
        descEn: "Monitor storage temperature and humidity to preserve grains, tubers, or produce.",
        descHa: "Kula da zafi da danshi don adana hatsi, doya, ko kayan lambu.",
      },
      {
        id: "BOTH",
        icon: Layers,
        titleEn: "Both (Livestock & Crops)",
        titleHa: "Duk Biyu (Dabbobi & Amfanin Gona)",
        descEn: "Track livestock and crop storage as separate products with their own rules.",
        descHa: "Kula da dabbobi da amfanin gona a matsayin kayayyaki daban-daban.",
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
                  ? "Which farming will you use SaveBarn for?"
                  : "Wane irin noma zaka yi amfani da SaveBarn a kai?"}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {lang === "en"
                  ? "Select Livestock Farming, Crop Preservation, or Both."
                  : "Zaɓi Kiwon Dabbobi, Ajiyar Amfanin Gona, ko Duk Biyu."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{lang === "en" ? "Sign Out" : "Fita"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {options.map((opt) => {
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
                    <span className="p-2.5 rounded-xl bg-slate-800 text-emerald-400">
                      <Icon className="w-5 h-5" />
                    </span>
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
              onClick={() =>
                setState((prev) => ({ ...prev, stage: "ONBOARD_DETAILS" }))
              }
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition cursor-pointer"
            >
              <span>{lang === "en" ? "Next: Farm & Products" : "Na Gaba: Gona & Amfani"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. ONBOARDING STEP 2: FARM NAME, PRODUCTS (MULTI-SELECT) & AUTO HARDWARE ID
  if (state.stage === "ONBOARD_DETAILS") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-8">
        <form
          onSubmit={handleFinishOnboarding}
          className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5"
        >
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {lang === "en" ? "Onboarding • Step 2 of 2" : "Saitawa • Mataki 2 na 2"}
            </span>
            <h1 className="text-2xl font-bold text-white mt-1">
              {lang === "en"
                ? "Farm Name, Products & Auto Hardware ID"
                : "Sunan Gona, Kayayyaki & Lambar Na'ura"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {lang === "en"
                ? "Select one or more products—each one appears as a separate product on your dashboard with its own climate range."
                : "Zaɓi abu ɗaya ko fiye—kowane zai bayyana a matsayin samfur daban a dashboard tare da nasa ka'idojin yanayi."}
            </p>
          </div>

          <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                {lang === "en"
                  ? "Auto-Generated Unique Hardware ID"
                  : "Lambar Na'ura Ta Kai Tsaye (Auto ID)"}
              </div>
              <div className="text-lg font-mono font-bold text-white mt-1">
                {state.hardwareId}
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
              {lang === "en" ? "Regenerate ID" : "Sabo ID"}
            </button>
          </div>

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
              placeholder="e.g., GreenValley Agro Farm"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              {lang === "en"
                ? "Kind of Farm Product(s) — Select all that apply"
                : "Nau'in Amfanin Gona / Dabba (Zaɓi duk waɗanda kake da su)"}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredCatalog.map((item) => {
                const checked = state.selectedProductIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleProductSelection(item.id)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left text-xs sm:text-sm transition cursor-pointer ${
                      checked
                        ? "bg-emerald-500/15 border-emerald-500 text-white font-medium"
                        : "bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center border ${
                        checked
                          ? "bg-emerald-500 border-emerald-500 text-slate-950"
                          : "border-slate-700"
                      }`}
                    >
                      {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {lang === "en"
                ? "Additional Custom Products (Separate multiple with commas)"
                : "Ƙarin Kayayyaki Na Musamman (Raba su da waƙafi / comma)"}
            </label>
            <input
              type="text"
              value={state.customProductsInput}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  customProductsInput: e.target.value,
                }))
              }
              placeholder="e.g., Turkeys, Ginger Warehouse, Rice Silo"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
            />
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
              <span>{lang === "en" ? "Open Dashboard" : "Buɗe Dashboard"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 4. DASHBOARD — EACH PRODUCT TREATED SEPARATELY
  const againstControls = state.controls.filter((c) => c.mode === "AGAINST");
  const badgeStyle = {
    NORMAL: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    DANGER: "bg-orange-500/15 text-orange-300 border-orange-500/40",
    EMERGENCY: "bg-rose-500/15 text-rose-300 border-rose-500/40 animate-pulse",
  }[statusInfo.level];

  const badgeLabel = {
    NORMAL: lang === "en" ? "Favorable Weather" : "Yanayi Mai Kyau",
    DANGER: lang === "en" ? "Unfavorable Weather" : "Yanayi Mara Kyau",
    EMERGENCY: lang === "en" ? "High Stress Risk" : "Hatari Mai Girma",
  }[statusInfo.level];

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
                  {syncLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {lang === "en"
                  ? `Welcome, ${state.farmName} • ${state.products.length} Separate Product(s)`
                  : `Barka da zuwa, ${state.farmName} • Kayayyaki ${state.products.length}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setState((prev) => ({ ...prev, stage: "ONBOARD_DETAILS" }))
              }
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
            >
              {lang === "en" ? "Manage Products" : "Gyara Kayayyaki"}
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
              onClick={handleSignOut}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-xs text-rose-200 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{lang === "en" ? "Sign Out" : "Fita"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Separate Product Switcher Strip */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {lang === "en"
                  ? `Welcome to ${state.farmName}`
                  : `Barka da Zuwa Gonar ${state.farmName}`}
              </p>
              <h1 className="text-2xl font-bold text-white mt-0.5">
                {activeProduct.name}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-emerald-300 font-mono">
                  <Cpu className="w-3.5 h-3.5" />
                  {activeProduct.deviceId}
                </span>
                <span>•</span>
                <span>{activeRule.category}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-400" />
                  {lastUpdated}
                </span>
              </p>
            </div>

            <div className={`px-4 py-2 rounded-full border text-sm font-semibold ${badgeStyle}`}>
              {badgeLabel}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-400">
              {lang === "en"
                ? "Separate Products (Each has its own temperature reading & comfort range):"
                : "Kayayyaki Daban-Daban (Kowane yana da nasa yanayi da matakin lafiya):"}
            </div>
            <div className="flex flex-wrap gap-2">
              {state.products.map((prod) => {
                const selected = prod.uid === activeProduct.uid;
                const prodThi = computeTHI(prod.temperatureC, prod.humidityPct);
                const prodGood =
                  prod.temperatureC >= prod.rule.minTemp &&
                  prod.temperatureC <= prod.rule.maxTemp &&
                  prodThi < prod.rule.maxThi;

                return (
                  <button
                    key={prod.uid}
                    type="button"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        activeProductUid: prod.uid,
                      }))
                    }
                    className={`px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-medium flex items-center gap-2 transition cursor-pointer ${
                      selected
                        ? "bg-emerald-500/20 border-emerald-500 text-white"
                        : "bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <span>{prod.name}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                      {prod.temperatureC}°C
                    </span>
                    <span
                      className={`text-[11px] font-semibold ${
                        prodGood ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {prodGood ? "OK" : "ALERT"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Active Product Climate Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<Thermometer className="w-5 h-5 text-orange-400" />}
            label={lang === "en" ? "Product Temperature" : "Zafin Wannan Samfur"}
            value={`${activeProduct.temperatureC}°C`}
            sub={`Favorable: ${activeRule.minTemp}°C – ${activeRule.maxTemp}°C`}
            highlight={
              activeProduct.temperatureC > activeRule.maxTemp ||
              activeProduct.temperatureC < activeRule.minTemp
            }
          />
          <MetricCard
            icon={<Droplets className="w-5 h-5 text-sky-400" />}
            label={lang === "en" ? "Humidity" : "Danshin Iska"}
            value={`${activeProduct.humidityPct}%`}
            sub="Target Band: 50% – 70%"
          />
          <MetricCard
            icon={<Activity className="w-5 h-5 text-rose-400" />}
            label="Heat Stress (THI)"
            value={`${thi}`}
            sub={`Threshold: ≥ ${activeRule.maxThi}`}
            highlight={thi >= activeRule.maxThi}
          />
          <MetricCard
            icon={<Wind className="w-5 h-5 text-amber-400" />}
            label="Ammonia (NH₃)"
            value={`${activeProduct.ammoniaPpm} ppm`}
            sub={`Limit: < ${activeRule.maxNh3} ppm`}
            highlight={activeProduct.ammoniaPpm >= activeRule.maxNh3}
          />
        </section>

        {/* Climate Controls with - and + Temperature Buttons */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                {lang === "en"
                  ? `Climate Controls for ${activeProduct.name}`
                  : `Kula da Yanayin ${activeProduct.name}`}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === "en"
                  ? "Use - or + to lower or raise temperature for this product, or run regulator simulation."
                  : "Yi amfani da - ko + don rage ko ƙara zafi, ko gwada tasirin na'urorin yanayi."}
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

        {/* Reference-Attributed Guidance (No Personal Name) + Trend Chart */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              {lang === "en"
                ? "Climate Guidance & Reference Source"
                : "Bayanan Yanayi & Tushen Ka'ida"}
            </h2>

            <p className="text-sm text-slate-200 leading-relaxed">
              {statusInfo.level === "NORMAL"
                ? lang === "en"
                  ? `At ${activeProduct.temperatureC}°C, conditions are within the favorable ${activeRule.minTemp}°C–${activeRule.maxTemp}°C band for ${activeProduct.name}.`
                  : `A kan ${activeProduct.temperatureC}°C, yanayin yana cikin matakin ${activeRule.minTemp}°C–${activeRule.maxTemp}°C wanda ya dace da ${activeProduct.name}.`
                : statusInfo.isHot
                ? lang === "en"
                  ? `At ${activeProduct.temperatureC}°C, temperature is above the favorable ${activeRule.minTemp}°C–${activeRule.maxTemp}°C range for ${activeProduct.name}. Cooling and airflow regulators are recommended In Favor of Asset.`
                  : `A kan ${activeProduct.temperatureC}°C, zafin ya wuce matakin ${activeRule.minTemp}°C–${activeRule.maxTemp}°C ga ${activeProduct.name}. A kunna sanyaya da iska don kare shi.`
                : lang === "en"
                ? `At ${activeProduct.temperatureC}°C, temperature is below the favorable ${activeRule.minTemp}°C–${activeRule.maxTemp}°C range for ${activeProduct.name}. Heating and draft protection are recommended In Favor of Asset.`
                : `A kan ${activeProduct.temperatureC}°C, zafin ya yi kasa da matakin ${activeRule.minTemp}°C–${activeRule.maxTemp}°C ga ${activeProduct.name}. A kunna dumama don kare shi.`}
            </p>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{lang === "en" ? "Reference Attribution" : "Tushen Bayani"}</span>
              </div>
              <p className="text-xs text-slate-300">
                {lang === "en" ? activeRule.sourceEn : activeRule.sourceHa}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  {lang === "en"
                    ? "Evaluated using established agricultural/veterinary reference bands."
                    : "An tantance shi bisa ka'idojin noma da kiwo na kwararru."}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-lg font-bold text-white mb-4">
              {lang === "en"
                ? `${activeProduct.name} — Temperature & THI Trend`
                : `${activeProduct.name} — Jadawalin Zafi da THI`}
            </h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeProduct.history}>
                  <defs>
                    <linearGradient id="prodTempGrad" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#prodTempGrad)"
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
