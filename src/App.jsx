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
  Sprout,
  Beef,
  Layers,
  ArrowRight,
  ArrowLeft,
  LogOut,
  Check,
  BookOpen,
  Wifi,
  Database,
  BookmarkCheck,
  XCircle,
  Sliders,
  Sparkles,
  Power,
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

const STORAGE_KEY = "savebarn_smart_ac_sim_v7";

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
    riskNoteEn:
      "Heat above 28°C or high THI lowers feed intake, slows growth, and increases heat stress; ammonia above 15 ppm irritates airways.",
    riskNoteHa:
      "Zafin da ya wuce 28°C ko THI mai yawa na rage cin abinci da girma; ammonia sama da 15 ppm na cutar da numfashi.",
    sourceEn: "Source: FAO & Poultry Extension Thermoneutral Benchmarks",
    sourceHa: "Tushe: Littattafan FAO & Ka'idojin Kiwon Kaji",
  },
  {
    id: "SWINE_PIG",
    label: "Pigs / Swine",
    category: "LIVESTOCK",
    minTemp: 16,
    maxTemp: 24,
    maxThi: 75,
    maxNh3: 12,
    riskNoteEn:
      "Pigs feel heat stress early above 24°C; ammonia above 12 ppm harms respiratory health.",
    riskNoteHa:
      "Aladu na shiga matsin zafi da wuri sama da 24°C; ammonia sama da 12 ppm na cutar da numfashi.",
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
    riskNoteEn:
      "High humidity with heat above 27°C raises THI stress; damp floors or cold drafts raise respiratory risk.",
    riskNoteHa:
      "Haduwar zafi sama da 27°C da danshi na kara matsin THI; iskar sanyi ko danshi na kawo matsala.",
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
    riskNoteEn:
      "THI at or above 72 marks heat-stress onset in cattle, reducing feed efficiency and milk/weight output.",
    riskNoteHa:
      "THI daga 72 zuwa sama na nuna farkon matsin zafi a shanu, wanda ke rage amfanin abinci da yawan madara.",
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
    riskNoteEn:
      "Warmth above 25°C plus high humidity speeds mold growth, pest activity, and storage spoilage.",
    riskNoteHa:
      "Zafi sama da 25°C tare da danshi na sa kyambo da kwari su yawaita a hatsi da aka ajiye.",
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
    riskNoteEn:
      "Temperatures above 20°C speed up softening, moisture loss, and post-harvest rot.",
    riskNoteHa:
      "Zafi sama da 20°C na hanzarta lalacewa da taushi a kayan lambu bayan girbi.",
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
    riskNoteEn:
      "High heat or dampness speeds sprouting, rot, and weight loss in stored tubers.",
    riskNoteHa:
      "Zafi ko danshi mai yawa na sa doya ko rogo su yi toho ko su ruɓe da wuri.",
    sourceEn: "Source: Root & Tuber Post-Harvest Storage Reference Manuals",
    sourceHa: "Tushe: Littattafan Ajiyar Doya Da Rogo",
  },
];

const INITIAL_AC_UNITS = [
  {
    id: "ac-1",
    code: "AC-UNIT-01",
    name: "East Wall Smart Split AC",
    zoneLabel: "Pen / Bay A",
    protocol: "Wi-Fi + IR Bridge",
    rssi: "-54 dBm",
    rangeMeters: 6.5,
    power: "ON",
    mode: "COOL",
    speed: "HIGH",
    targetTemp: 24,
    smartAuto: true,
    discovered: true,
  },
  {
    id: "ac-2",
    code: "AC-UNIT-02",
    name: "Center Bay Smart Inverter",
    zoneLabel: "Main Store / Pen B",
    protocol: "Wi-Fi Direct",
    rssi: "-63 dBm",
    rangeMeters: 11.2,
    power: "ON",
    mode: "COOL",
    speed: "MEDIUM",
    targetTemp: 23,
    smartAuto: false,
    discovered: true,
  },
  {
    id: "ac-3",
    code: "AC-UNIT-03",
    name: "North Corridor Smart AC",
    zoneLabel: "Produce / Cooling Bay",
    protocol: "BLE + IR Node",
    rssi: "-71 dBm",
    rangeMeters: 14.0,
    power: "OFF",
    mode: "FAN",
    speed: "LOW",
    targetTemp: 22,
    smartAuto: false,
    discovered: false,
  },
  {
    id: "ac-4",
    code: "AC-UNIT-04",
    name: "Far Annex Auxiliary AC",
    zoneLabel: "Outer Shed",
    protocol: "IR Bridge",
    rssi: "-89 dBm",
    rangeMeters: 22.5,
    power: "OFF",
    mode: "COOL",
    speed: "LOW",
    targetTemp: 25,
    smartAuto: false,
    discovered: true,
  },
];

const INITIAL_SPEED_DB = [
  {
    id: "db-1",
    conditionBand: "Cool (< 20°C)",
    minC: -10,
    maxC: 19.9,
    bestSpeed: "LOW",
    notes: "Gentle airflow so stock are not chilled and crops do not sweat.",
  },
  {
    id: "db-2",
    conditionBand: "Mild (20°C – 26°C)",
    minC: 20,
    maxC: 26,
    bestSpeed: "LOW",
    notes: "Steady light airflow with low power draw.",
  },
  {
    id: "db-3",
    conditionBand: "Warm (27°C – 31°C)",
    minC: 27,
    maxC: 31,
    bestSpeed: "MEDIUM",
    notes: "Moderate airflow for afternoon heat buildup.",
  },
  {
    id: "db-4",
    conditionBand: "Hot (> 31°C)",
    minC: 31.1,
    maxC: 60,
    bestSpeed: "TURBO",
    notes: "Stronger airflow during peak heat.",
  },
];

function computeTHI(tempC, rh) {
  return Number(
    (1.8 * tempC + 32 - (0.55 - 0.0055 * rh) * (1.8 * tempC - 26.8)).toFixed(1)
  );
}

function getWeatherBand(tempC) {
  if (tempC < 20) return "Cool (< 20°C)";
  if (tempC <= 26) return "Mild (20°C – 26°C)";
  if (tempC <= 31) return "Warm (27°C – 31°C)";
  return "Hot (> 31°C)";
}

function evaluateProduct(prod) {
  const rule = prod.rule || CATALOG[0];
  const thi = computeTHI(prod.temperatureC, prod.humidityPct);
  const tempOut =
    prod.temperatureC > rule.maxTemp || prod.temperatureC < rule.minTemp;
  const thiHigh = thi >= rule.maxThi;
  const nh3High = prod.ammoniaPpm >= rule.maxNh3;
  const isHot = prod.temperatureC > rule.maxTemp;
  const isCold = prod.temperatureC < rule.minTemp;

  let level = "NORMAL";
  if (prod.temperatureC > rule.maxTemp + 4 || thi >= rule.maxThi + 5) {
    level = "EMERGENCY";
  } else if (tempOut || thiHigh || nh3High) {
    level = "DANGER";
  }

  return { thi, level, isHot, isCold, thiHigh, nh3High };
}

function createHistory(tempC, rh, nh3) {
  const labels = ["-20m", "-16m", "-12m", "-8m", "-4m", "Now"];
  return labels.map((time, idx) => {
    const offset = (labels.length - 1 - idx) * 0.35;
    const t = Number((tempC - offset).toFixed(1));
    return {
      time,
      Temp: t,
      THI: computeTHI(t, rh),
      Ammonia: Number(Math.max(1, nh3 - offset * 0.3).toFixed(1)),
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
      id: `custom-${lower.replace(/[^a-z0-9]+/g, "-")}`,
      label,
      category: "CROPS",
      minTemp: 14,
      maxTemp: 24,
      maxThi: 74,
      maxNh3: 15,
      riskNoteEn:
        "Keep storage cool, dry, and ventilated to slow spoilage, mold, and weight loss.",
      riskNoteHa:
        "A kiyaye dakin ajiya da sanyi, bushewa, da iska mai kyau don rage lalacewa.",
      sourceEn: "Source: FAO Post-Harvest Storage & Microclimate Guidelines",
      sourceHa: "Tushe: Ka'idojin FAO Na Ajiyar Amfanin Gona",
    };
  }

  return {
    id: `custom-${lower.replace(/[^a-z0-9]+/g, "-")}`,
    label,
    category: "LIVESTOCK",
    minTemp: 18,
    maxTemp: 27,
    maxThi: 76,
    maxNh3: 15,
    riskNoteEn:
      "Keep pens within safe temperature and low ammonia to protect feed intake and stock health.",
    riskNoteHa:
      "A kiyaye zafin gida da ammonia a matakin da ya dace don kare lafiya da cin abinci.",
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
      ["POULTRY_BROILER", "TOMATO_PRODUCE"],
      "",
      "BOTH",
      "init"
    );
    return {
      stage: "SIGNUP",
      lang: "en",
      user: null,
      purpose: "BOTH",
      farmName: "",
      selectedProductIds: ["POULTRY_BROILER", "TOMATO_PRODUCE"],
      customProductsInput: "",
      hardwareId: generateAutoHardwareId("BOTH"),
      products: initialProducts,
      activeProductUid: initialProducts[0].uid,
      environmentRadiusMeters: 15,
      acUnits: INITIAL_AC_UNITS,
      speedDb: INITIAL_SPEED_DB,
      controlFailureNotice: null,
      scanningAcs: false,
      scanStepMessage: "",
      acControlLogs: [
        {
          id: "log-init-1",
          time: "Now",
          text: "AC-UNIT-01 synced in Smart Auto mode (HIGH fan, 24°C target).",
        },
      ],
      fieldNote: "",
      savedFieldNotes: [],
    };
  });

  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());
  const [syncLabel, setSyncLabel] = useState("Sensor Ready");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }, [state]);

  useEffect(() => {
    if (state.stage !== "DASHBOARD") return;
    let active = true;
    const syncTelemetry = async () => {
      try {
        const res = await fetch(`${API_URL}/api/dashboard`);
        if (!res.ok) return;
        const data = await res.json();
        const r = data?.zones?.[0]?.readings?.[0];
        if (!active || !r) return;
        setSyncLabel("Cloud Synced");
        setLastUpdated(new Date().toLocaleTimeString());
        setState((prev) => ({
          ...prev,
          products: prev.products.map((prod, idx) => {
            if (idx !== 0) return prod;
            const nextTemp = Number(r.temperatureC ?? prod.temperatureC);
            const nextRh = Number(r.humidityPct ?? prod.humidityPct);
            const nextNh3 = Number(r.ammoniaPpm ?? prod.ammoniaPpm);
            const point = {
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              Temp: nextTemp,
              THI: computeTHI(nextTemp, nextRh),
              Ammonia: nextNh3,
            };
            return {
              ...prod,
              temperatureC: nextTemp,
              humidityPct: nextRh,
              ammoniaPpm: nextNh3,
              history: [...prod.history.slice(-11), point],
            };
          }),
        }));
      } catch (_) {
        if (active) setSyncLabel("Field Mode");
      }
    };
    syncTelemetry();
    const t = setInterval(syncTelemetry, 10000);
    return () => {
      active = false;
      clearInterval(t);
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
  const statusInfo = useMemo(() => evaluateProduct(activeProduct), [activeProduct]);
  const currentBand = getWeatherBand(activeProduct.temperatureC);

  const farmAlertsCount = useMemo(() => {
    return state.products.filter((p) => evaluateProduct(p).level !== "NORMAL")
      .length;
  }, [state.products]);

  const discoveredAcs = useMemo(() => {
    return state.acUnits.filter((a) => a.discovered);
  }, [state.acUnits]);

  const reachableAcCount = useMemo(() => {
    return discoveredAcs.filter(
      (a) => a.rangeMeters <= state.environmentRadiusMeters
    ).length;
  }, [discoveredAcs, state.environmentRadiusMeters]);

  const matchedDbRecord = useMemo(() => {
    return (
      state.speedDb.find(
        (rec) =>
          activeProduct.temperatureC >= rec.minC &&
          activeProduct.temperatureC <= rec.maxC
      ) || state.speedDb[1]
    );
  }, [state.speedDb, activeProduct.temperatureC]);

  const specificFallbackRecommendation = useMemo(() => {
    if (activeRule.category === "CROPS") {
      return statusInfo.isHot
        ? `Open shaded storage vents, improve airflow around ${activeProduct.name} stacks, clean AC dust filters, and move heat-sensitive produce to a cooler shaded spot.`
        : `Close cold draft openings around ${activeProduct.name} storage, keep bags or crates off damp floors on pallets, and watch for moisture buildup.`;
    }
    return statusInfo.isHot
      ? `Open side curtains or vents, shade sun-facing roofing above ${activeProduct.name}, make sure cool drinking water is available, and check AC power or signal path.`
      : `Lower draft curtains around ${activeProduct.name}, keep bedding dry, and check for cold air leaks or AC/heater faults.`;
  }, [activeRule.category, activeProduct.name, statusInfo.isHot]);

  const pushControlLog = (prevLogs, text) => {
    const stamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    return [{ id: `${Date.now()}-${Math.random()}`, time: stamp, text }, ...prevLogs].slice(
      0,
      6
    );
  };

  const handleApplyTestReading = (deltaTemp, deltaNh3 = 0) => {
    setState((prev) => {
      const updatedProducts = prev.products.map((p) => {
        if (p.uid !== activeProduct.uid) return p;
        const nextTemp = Number(
          Math.max(8, Math.min(44, p.temperatureC + deltaTemp)).toFixed(1)
        );
        const nextNh3 = Number(
          Math.max(1, Math.min(35, p.ammoniaPpm + deltaNh3)).toFixed(1)
        );
        const point = {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          Temp: nextTemp,
          THI: computeTHI(nextTemp, p.humidityPct),
          Ammonia: nextNh3,
        };
        return {
          ...p,
          temperatureC: nextTemp,
          ammoniaPpm: nextNh3,
          history: [...p.history.slice(-11), point],
        };
      });

      const nextActive =
        updatedProducts.find((p) => p.uid === activeProduct.uid) ||
        updatedProducts[0];
      const nextBandRec =
        prev.speedDb.find(
          (rec) =>
            nextActive.temperatureC >= rec.minC &&
            nextActive.temperatureC <= rec.maxC
        ) || prev.speedDb[1];
      const idealTarget = Math.round(
        (nextActive.rule.minTemp + nextActive.rule.maxTemp) / 2
      );

      let autoAdjustedCount = 0;
      const updatedAcs = prev.acUnits.map((ac) => {
        const inRange = ac.rangeMeters <= prev.environmentRadiusMeters;
        if (ac.discovered && inRange && ac.smartAuto && ac.power === "ON") {
          autoAdjustedCount += 1;
          return {
            ...ac,
            speed: nextBandRec.bestSpeed,
            targetTemp: idealTarget,
          };
        }
        return ac;
      });

      const nextLogs =
        autoAdjustedCount > 0
          ? pushControlLog(
              prev.acControlLogs,
              `Smart Auto adjusted ${autoAdjustedCount} in-range AC(s) to ${nextBandRec.bestSpeed} fan / ${idealTarget}°C target for ${nextActive.name} (${nextActive.temperatureC}°C).`
            )
          : prev.acControlLogs;

      return {
        ...prev,
        products: updatedProducts,
        acUnits: updatedAcs,
        acControlLogs: nextLogs,
      };
    });
    setLastUpdated(new Date().toLocaleTimeString());
  };

  const handleDiscoverAirConditioners = () => {
    setState((prev) => ({
      ...prev,
      scanningAcs: true,
      scanStepMessage: `Probing Wi-Fi / BLE / IR beacons within ${prev.environmentRadiusMeters}m of ${state.farmName}...`,
    }));

    setTimeout(() => {
      setState((prev) => {
        const nextUnits = prev.acUnits.map((ac) => ({
          ...ac,
          discovered: true,
        }));
        const insideCount = nextUnits.filter(
          (ac) => ac.rangeMeters <= prev.environmentRadiusMeters
        ).length;
        const outsideCount = nextUnits.length - insideCount;

        return {
          ...prev,
          scanningAcs: false,
          scanStepMessage: `Scan complete: ${nextUnits.length} smart AC(s) detected — ${insideCount} inside ${prev.environmentRadiusMeters}m range, ${outsideCount} outside range.`,
          controlFailureNotice: null,
          acUnits: nextUnits,
          acControlLogs: pushControlLog(
            prev.acControlLogs,
            `Environment scan found ${insideCount} controllable AC(s) inside ${prev.environmentRadiusMeters}m radius.`
          ),
        };
      });
      setLastUpdated(new Date().toLocaleTimeString());
    }, 550);
  };

  const handleAdjustAc = (acId, patch) => {
    setState((prev) => {
      const target = prev.acUnits.find((a) => a.id === acId);
      if (!target) return prev;

      const inRange = target.rangeMeters <= prev.environmentRadiusMeters;
      const willFail =
        !inRange || (target.power === "OFF" && patch.power !== "ON" && !patch.smartAuto);

      if (willFail) {
        const reason = !inRange
          ? `${target.code} (${target.name}) is at ${target.rangeMeters}m — outside your ${prev.environmentRadiusMeters}m environment range (signal drop / no reply).`
          : `${target.code} (${target.name}) is currently OFF — power it ON first before changing mode, target temperature, or fan speed.`;

        return {
          ...prev,
          controlFailureNotice: {
            unitCode: target.code,
            unitName: target.name,
            reason,
          },
          acControlLogs: pushControlLog(
            prev.acControlLogs,
            `Command blocked on ${target.code}: ${
              !inRange ? "out of range" : "unit is OFF"
            }.`
          ),
        };
      }

      const nextUnits = prev.acUnits.map((a) => {
        if (a.id !== acId) return a;
        const merged = { ...a, ...patch };
        if (patch.smartAuto) {
          const idealTarget = Math.round(
            (activeRule.minTemp + activeRule.maxTemp) / 2
          );
          merged.power = "ON";
          merged.mode = "COOL";
          merged.speed = matchedDbRecord?.bestSpeed || "MEDIUM";
          merged.targetTemp = idealTarget;
        }
        return merged;
      });

      const updated = nextUnits.find((a) => a.id === acId);
      const summary = patch.smartAuto
        ? `${updated.code} set to Smart Auto (${updated.speed}, ${updated.targetTemp}°C for ${activeProduct.name}).`
        : `${updated.code} updated -> Power: ${updated.power}, Mode: ${updated.mode}, Fan: ${updated.speed}, Target: ${updated.targetTemp}°C.`;

      return {
        ...prev,
        controlFailureNotice: null,
        acUnits: nextUnits,
        acControlLogs: pushControlLog(prev.acControlLogs, summary),
      };
    });
    setLastUpdated(new Date().toLocaleTimeString());
  };

  const handleSaveBestSpeedToDb = (speedToSave) => {
    const temp = activeProduct.temperatureC;
    setState((prev) => {
      const exists = prev.speedDb.some(
        (rec) => temp >= rec.minC && temp <= rec.maxC
      );
      const nextDb = exists
        ? prev.speedDb.map((rec) =>
            temp >= rec.minC && temp <= rec.maxC
              ? {
                  ...rec,
                  bestSpeed: speedToSave,
                  notes: `Updated for ${activeProduct.name} around ${temp}°C.`,
                }
              : rec
          )
        : [
            ...prev.speedDb,
            {
              id: `db-${Date.now()}`,
              conditionBand: `${temp}°C Recorded`,
              minC: temp - 1.5,
              maxC: temp + 1.5,
              bestSpeed: speedToSave,
              notes: `Recorded for ${activeProduct.name} at ${temp}°C.`,
            },
          ];

      return {
        ...prev,
        speedDb: nextDb,
        acControlLogs: pushControlLog(
          prev.acControlLogs,
          `Saved ${speedToSave} speed to weather DB for ${currentBand}.`
        ),
      };
    });
  };

  const handleApplyBestSpeedFromDb = (rec) => {
    const firstInRange =
      discoveredAcs.find(
        (a) => a.rangeMeters <= state.environmentRadiusMeters
      ) || discoveredAcs[0];
    if (!firstInRange) return;
    handleAdjustAc(firstInRange.id, {
      power: "ON",
      speed: rec.bestSpeed,
      smartAuto: false,
    });
  };

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

  const handleAddFieldNote = (e) => {
    e.preventDefault();
    const text = state.fieldNote.trim();
    if (!text) return;
    const entry = {
      id: Date.now(),
      productName: activeProduct.name,
      tempC: activeProduct.temperatureC,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      text,
    };
    setState((prev) => ({
      ...prev,
      fieldNote: "",
      savedFieldNotes: [entry, ...prev.savedFieldNotes].slice(0, 6),
    }));
  };

  const handleSignOut = () => {
    localStorage.removeItem(STORAGE_KEY);
    const fresh = buildProductsFromSelection(
      ["POULTRY_BROILER", "TOMATO_PRODUCE"],
      "",
      "BOTH",
      "reset"
    );
    setState({
      stage: "SIGNUP",
      lang: state.lang,
      user: null,
      purpose: "BOTH",
      farmName: "",
      selectedProductIds: ["POULTRY_BROILER", "TOMATO_PRODUCE"],
      customProductsInput: "",
      hardwareId: generateAutoHardwareId("BOTH"),
      products: fresh,
      activeProductUid: fresh[0].uid,
      environmentRadiusMeters: 15,
      acUnits: INITIAL_AC_UNITS,
      speedDb: INITIAL_SPEED_DB,
      controlFailureNotice: null,
      scanningAcs: false,
      scanStepMessage: "",
      acControlLogs: [],
      fieldNote: "",
      savedFieldNotes: [],
    });
  };

  if (state.stage === "SIGNUP") {
    return (
      <div className="min-h-screen bg-black text-neutral-100 flex flex-col justify-between px-5 py-6 sm:px-10">
        <div className="max-w-4xl w-full mx-auto flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-emerald-400 font-bold text-lg">SaveBarn</span>
            <span className="text-neutral-600">/</span>
            <span className="text-xs text-neutral-400">
              {lang === "en"
                ? "Livestock & Crop Storage Microclimate Assistant"
                : "Kula Da Yanayin Gona Da Ajiyar Amfanin Gona"}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setState((prev) => ({
                ...prev,
                lang: prev.lang === "en" ? "ha" : "en",
              }))
            }
            className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-800 hover:border-neutral-600 text-xs text-neutral-200 cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-400" />
            {lang === "en" ? "Hausa" : "English"}
          </button>
        </div>

        <div className="max-w-xl w-full mx-auto py-12 space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-emerald-400">
              {lang === "en"
                ? "Prevent Heat & Storage Loss"
                : "Hana Asarar Zafi Da Lalacewa"}
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
              {lang === "en"
                ? "Catch heat stress and spoilage risk before losses happen."
                : "Gano matsalar zafi da lalacewa kafin asara ta faru."}
            </h1>
            <p className="text-sm text-neutral-400 leading-relaxed">
              {lang === "en"
                ? "Different animals and stored crops spoil at different temperatures and THI levels. SaveBarn checks each item separately, discovers smart ACs within your environment radius, simulates smart climate control, and provides honest manual fallback steps when control is unverified."
                : "Kowane dabba ko amfanin gona na da nasa matakin zafi da THI. SaveBarn na duba su daban-daban, yana nemo smart AC da ke cikin zango, yana sarrafa su, kuma yana ba da mafita idan na'ura ba ta amsa ba."}
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
            className="w-full py-3.5 px-5 bg-white hover:bg-neutral-200 text-black font-semibold text-sm flex items-center justify-center gap-3 transition cursor-pointer"
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
              {lang === "en" ? "Continue with Google" : "Ci gaba da Google"}
            </span>
          </button>
        </div>

        <div className="max-w-4xl w-full mx-auto border-t border-neutral-900 pt-4 text-xs text-neutral-500 flex justify-between">
          <span>SaveBarn</span>
          <span>FAO, THI & Post-Harvest Benchmarks</span>
        </div>
      </div>
    );
  }

  if (state.stage === "ONBOARD_PURPOSE") {
    const options = [
      {
        id: "LIVESTOCK",
        icon: Beef,
        titleEn: "Livestock",
        titleHa: "Kiwon Dabbobi",
        descEn: "Track pens for heat, THI, and ammonia.",
        descHa: "Kula da zafi, THI, da ammonia a gidajen dabbobi.",
      },
      {
        id: "CROPS",
        icon: Sprout,
        titleEn: "Crop Storage",
        titleHa: "Ajiyar Amfanin Gona",
        descEn: "Watch grain, tuber, or produce rooms.",
        descHa: "Kula da dakin ajiyar hatsi, doya, ko kayan lambu.",
      },
      {
        id: "BOTH",
        icon: Layers,
        titleEn: "Both",
        titleHa: "Duk Biyu",
        descEn: "Keep livestock and crops as separate items.",
        descHa: "Ajiye dabbobi da amfanin gona daban-daban.",
      },
    ];

    return (
      <div className="min-h-screen bg-black text-neutral-100 px-5 py-8 sm:px-10">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div>
              <span className="text-xs text-emerald-400 uppercase tracking-wider">
                {lang === "en" ? "Step 1 of 2" : "Mataki 1 na 2"}
              </span>
              <h1 className="text-2xl font-semibold text-white mt-1">
                {lang === "en"
                  ? "What are you using SaveBarn for?"
                  : "Me kake amfani da SaveBarn a kai?"}
              </h1>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{lang === "en" ? "Sign out" : "Fita"}</span>
            </button>
          </div>

          <div className="divide-y divide-neutral-800 border-y border-neutral-800">
            {options.map((opt) => {
              const Icon = opt.icon;
              const selected = state.purpose === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectPurpose(opt.id)}
                  className={`w-full py-5 px-3 flex items-center justify-between text-left transition cursor-pointer ${
                    selected
                      ? "bg-neutral-950 text-white"
                      : "text-neutral-300 hover:bg-neutral-950/60"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <Icon
                      className={`w-5 h-5 mt-0.5 ${
                        selected ? "text-emerald-400" : "text-neutral-500"
                      }`}
                    />
                    <div>
                      <div className="font-semibold text-base">
                        {lang === "en" ? opt.titleEn : opt.titleHa}
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {lang === "en" ? opt.descEn : opt.descHa}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`w-5 h-5 flex items-center justify-center border ${
                      selected
                        ? "bg-emerald-400 border-emerald-400 text-black"
                        : "border-neutral-700"
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() =>
                setState((prev) => ({ ...prev, stage: "ONBOARD_DETAILS" }))
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm cursor-pointer"
            >
              <span>{lang === "en" ? "Next" : "Na Gaba"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.stage === "ONBOARD_DETAILS") {
    return (
      <div className="min-h-screen bg-black text-neutral-100 px-5 py-8 sm:px-10">
        <form
          onSubmit={handleFinishOnboarding}
          className="max-w-2xl mx-auto space-y-6"
        >
          <div className="border-b border-neutral-800 pb-4">
            <span className="text-xs text-emerald-400 uppercase tracking-wider">
              {lang === "en" ? "Step 2 of 2" : "Mataki 2 na 2"}
            </span>
            <h1 className="text-2xl font-semibold text-white mt-1">
              {lang === "en"
                ? "Farm details & separate products"
                : "Bayanan gona & kayayyaki daban-daban"}
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              {lang === "en"
                ? "Each item you pick becomes its own tab with its own safe temperature range."
                : "Kowane abu da ka zaɓa zai zama shafi daban da nasa matakin zafi."}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-neutral-800">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                {lang === "en" ? "Hardware ID" : "Lambar Na'ura"}
              </div>
              <div className="font-mono text-base font-semibold text-white mt-0.5">
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
              className="px-3 py-1.5 border border-neutral-700 hover:border-neutral-500 text-xs text-neutral-200 cursor-pointer"
            >
              {lang === "en" ? "New ID" : "Sabo ID"}
            </button>
          </div>

          <div>
            <label className="block text-xs text-neutral-300 mb-1.5">
              {lang === "en" ? "Farm name *" : "Sunan gona *"}
            </label>
            <input
              type="text"
              required
              value={state.farmName}
              onChange={(e) =>
                setState((prev) => ({ ...prev, farmName: e.target.value }))
              }
              placeholder="e.g., Keffi Valley Farm"
              className="w-full bg-black border border-neutral-700 focus:border-emerald-400 outline-none px-3.5 py-2.5 text-sm text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs text-neutral-300">
              {lang === "en"
                ? "Select one or more items"
                : "Zaɓi abu ɗaya ko fiye"}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredCatalog.map((item) => {
                const checked = state.selectedProductIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleProductSelection(item.id)}
                    className={`flex items-center justify-between px-3.5 py-2.5 border text-left text-xs sm:text-sm cursor-pointer ${
                      checked
                        ? "border-emerald-400 bg-neutral-950 text-white"
                        : "border-neutral-800 text-neutral-300 hover:border-neutral-700"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`w-4 h-4 flex items-center justify-center border ${
                        checked
                          ? "bg-emerald-400 border-emerald-400 text-black"
                          : "border-neutral-700"
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs text-neutral-300 mb-1.5">
              {lang === "en"
                ? "Other items (comma-separated)"
                : "Wasu kayayyaki (raba da comma)"}
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
              placeholder="e.g., Turkeys, Maize Bag Store"
              className="w-full bg-black border border-neutral-700 focus:border-emerald-400 outline-none px-3.5 py-2.5 text-sm text-white"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() =>
                setState((prev) => ({ ...prev, stage: "ONBOARD_PURPOSE" }))
              }
              className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-neutral-700 text-neutral-200 text-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === "en" ? "Back" : "Baya"}</span>
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm cursor-pointer"
            >
              <span>{lang === "en" ? "Go to farm view" : "Je zuwa gona"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    );
  }

  const statusText = {
    NORMAL: {
      label: lang === "en" ? "Comfortable range" : "Yanayi ya dace",
      cls: "text-emerald-400",
    },
    DANGER: {
      label: lang === "en" ? "Needs attention" : "Yana bukatar kulawa",
      cls: "text-amber-400",
    },
    EMERGENCY: {
      label: lang === "en" ? "High heat / stress alert" : "Gargadin zafi mai yawa",
      cls: "text-rose-400",
    },
  }[statusInfo.level];

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <header className="border-b border-neutral-800 bg-black/95 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg text-emerald-400">SaveBarn</span>
            <span className="text-neutral-700">|</span>
            <span className="text-sm font-medium text-white">
              {state.farmName}
            </span>
            <span className="text-xs text-neutral-500 hidden sm:inline">
              • {syncLabel} • {lastUpdated}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setState((prev) => ({ ...prev, stage: "ONBOARD_DETAILS" }))
              }
              className="px-3 py-1.5 border border-neutral-800 hover:border-neutral-600 text-xs text-neutral-200 cursor-pointer"
            >
              {lang === "en" ? "Edit items" : "Gyara kayayyaki"}
            </button>
            <button
              type="button"
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  lang: prev.lang === "en" ? "ha" : "en",
                }))
              }
              className="flex items-center gap-1 px-3 py-1.5 border border-neutral-800 hover:border-neutral-600 text-xs text-neutral-200 cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-400" />
              {lang === "en" ? "Hausa" : "English"}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1 px-3 py-1.5 border border-neutral-800 hover:border-rose-500/60 text-xs text-neutral-300 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{lang === "en" ? "Out" : "Fita"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-7 space-y-9">
        <section className="border-b border-neutral-800 pb-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <div className="text-neutral-400">
              {lang === "en"
                ? `Tracking ${state.products.length} separate farm item(s) • ${farmAlertsCount} outside safe/comfort limits • ${reachableAcCount}/${discoveredAcs.length} discovered smart ACs inside ${state.environmentRadiusMeters}m radius`
                : `Ana kula da kayayyaki ${state.products.length} daban • ${farmAlertsCount} na bukatar kulawa • ${reachableAcCount}/${discoveredAcs.length} smart AC na cikin zango`}
            </div>
            <p className="text-neutral-300">
              {lang === "en" ? activeRule.riskNoteEn : activeRule.riskNoteHa}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="text-neutral-500 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              {lang === "en" ? "Demo drill:" : "Gwaji:"}
            </span>
            <button
              type="button"
              onClick={() => handleApplyTestReading(2.5, 1.5)}
              className="px-2.5 py-1 border border-neutral-800 hover:border-amber-400 text-neutral-200 cursor-pointer"
            >
              +2.5°C Heat
            </button>
            <button
              type="button"
              onClick={() => handleApplyTestReading(-2.5, -1.5)}
              className="px-2.5 py-1 border border-neutral-800 hover:border-sky-400 text-neutral-200 cursor-pointer"
            >
              -2.5°C Cool
            </button>
          </div>
        </section>

        <section className="space-y-4 border-b border-neutral-800 pb-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-xs text-neutral-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>{activeProduct.deviceId}</span>
                <span>•</span>
                <span>{currentBand}</span>
              </p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1">
                {activeProduct.name}
              </h1>
            </div>
            <span className={`text-sm font-semibold ${statusText.cls}`}>
              {statusText.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {state.products.map((prod) => {
              const isSelected = prod.uid === activeProduct.uid;
              const pEval = evaluateProduct(prod);
              return (
                <button
                  key={prod.uid}
                  type="button"
                  onClick={() =>
                    setState((prev) => ({ ...prev, activeProductUid: prod.uid }))
                  }
                  className={`px-3.5 py-2 text-xs sm:text-sm border transition cursor-pointer ${
                    isSelected
                      ? "bg-white text-black border-white font-semibold"
                      : "bg-black text-neutral-300 border-neutral-800 hover:border-neutral-600"
                  }`}
                >
                  {prod.name} ({prod.temperatureC}°C)
                  {pEval.level !== "NORMAL" && (
                    <span
                      className={`ml-1.5 ${
                        isSelected ? "text-rose-700" : "text-amber-400"
                      }`}
                    >
                      • !
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 border-b border-neutral-800 pb-7">
          <FlatReading
            icon={<Thermometer className="w-4 h-4 text-amber-400" />}
            label={lang === "en" ? "Temperature" : "Zafi"}
            value={`${activeProduct.temperatureC}°C`}
            hint={`Safe: ${activeRule.minTemp}°C – ${activeRule.maxTemp}°C`}
          />
          <FlatReading
            icon={<Droplets className="w-4 h-4 text-sky-400" />}
            label={lang === "en" ? "Humidity" : "Danshi"}
            value={`${activeProduct.humidityPct}%`}
            hint="Guide: 50% – 70%"
          />
          <FlatReading
            icon={<Activity className="w-4 h-4 text-rose-400" />}
            label="THI"
            value={`${statusInfo.thi}`}
            hint={`Alert from: ${activeRule.maxThi}`}
          />
          <FlatReading
            icon={<Wind className="w-4 h-4 text-emerald-400" />}
            label="Ammonia (NH₃)"
            value={`${activeProduct.ammoniaPpm} ppm`}
            hint={`Keep below: ${activeRule.maxNh3} ppm`}
          />
        </section>

        {/* Smart AC Discovery & Smart Control Simulation */}
        <section className="space-y-4 border-b border-neutral-800 pb-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span>
                  {lang === "en"
                    ? "Smart AC discovery & control simulation"
                    : "Nemo Smart AC & sarrafa su a gwaji"}
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                {lang === "en"
                  ? "Scan the stated environment radius for smart conditioners, toggle Smart Auto regulation, or send manual mode/speed/setpoint commands."
                  : "Bincika zangon da aka ayyana don nemo smart AC, kunna Smart Auto, ko aika umarni kai tsaye."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 border border-neutral-800 px-2.5 py-1.5 text-xs">
                <span className="text-neutral-400">Env Radius:</span>
                {[10, 15, 25].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        environmentRadiusMeters: r,
                      }))
                    }
                    className={`px-2 py-0.5 cursor-pointer ${
                      state.environmentRadiusMeters === r
                        ? "bg-white text-black font-semibold"
                        : "text-neutral-300 hover:text-white"
                    }`}
                  >
                    {r}m
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleDiscoverAirConditioners}
                className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-700 hover:border-emerald-400 text-xs sm:text-sm text-white cursor-pointer"
              >
                <RefreshCw
                  className={`w-4 h-4 text-emerald-400 ${
                    state.scanningAcs ? "animate-spin" : ""
                  }`}
                />
                <span>
                  {state.scanningAcs
                    ? lang === "en"
                      ? "Scanning environment..."
                      : "Ana bincike..."
                    : lang === "en"
                    ? "Scan environment for Smart ACs"
                    : "Bincika Smart AC a kusa"}
                </span>
              </button>
            </div>
          </div>

          {state.scanStepMessage && (
            <p className="text-xs text-emerald-300 border-l-2 border-emerald-500 pl-3 py-1">
              {state.scanStepMessage}
            </p>
          )}

          {state.controlFailureNotice && (
            <div className="border-l-2 border-rose-500 pl-4 py-2 space-y-2 text-xs sm:text-sm">
              <div className="text-rose-300 font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{state.controlFailureNotice.reason}</span>
              </div>
              <p className="text-amber-200/90 text-xs flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  {lang === "en"
                    ? "Possibility of inaccuracy: System control or response is unverified here, so readings and expected cooling may not be accurate."
                    : "Gargadin rashin daidaito: Ba a tabbatar da aikin tsarin ba a nan, don haka karatu ko sanyaya na iya zama ba daidai ba."}
                </span>
              </p>
              <p className="text-neutral-300 text-xs">
                <strong className="text-emerald-400">
                  {lang === "en"
                    ? "What to adjust now: "
                    : "Abinda ya kamata a gyara: "}
                </strong>
                {specificFallbackRecommendation}
              </p>
            </div>
          )}

          <div className="divide-y divide-neutral-800 border-y border-neutral-800">
            {discoveredAcs.map((ac) => {
              const inRange = ac.rangeMeters <= state.environmentRadiusMeters;
              return (
                <div
                  key={ac.id}
                  className="py-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-white flex flex-wrap items-center gap-2">
                      <span>{ac.name}</span>
                      <span className="font-mono text-xs text-neutral-400">
                        ({ac.code} • {ac.zoneLabel})
                      </span>
                      <span className="text-[11px] px-2 py-0.5 border border-neutral-800 text-neutral-300">
                        {ac.protocol} • {ac.rssi}
                      </span>
                    </div>
                    <div className="text-xs flex flex-wrap items-center gap-2">
                      {inRange ? (
                        <span className="text-emerald-400">
                          Inside {state.environmentRadiusMeters}m range ({ac.rangeMeters}m)
                        </span>
                      ) : (
                        <span className="text-rose-400">
                          Outside {state.environmentRadiusMeters}m range ({ac.rangeMeters}m — no reply)
                        </span>
                      )}
                      <span className="text-neutral-600">•</span>
                      <span className="text-neutral-400">
                        Mode: <strong className="text-neutral-200">{ac.mode}</strong> • Setpoint:{" "}
                        <strong className="text-neutral-200">{ac.targetTemp}°C</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleAdjustAc(ac.id, {
                          power: ac.power === "ON" ? "OFF" : "ON",
                          smartAuto: ac.power === "ON" ? false : ac.smartAuto,
                        })
                      }
                      className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border cursor-pointer ${
                        ac.power === "ON"
                          ? "border-emerald-500 text-emerald-300"
                          : "border-neutral-700 text-neutral-400"
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{ac.power}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleAdjustAc(ac.id, { smartAuto: !ac.smartAuto })
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border cursor-pointer ${
                        ac.smartAuto
                          ? "bg-white text-black border-white font-semibold"
                          : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Smart Auto</span>
                    </button>

                    <div className="flex items-center border border-neutral-800 text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          handleAdjustAc(ac.id, {
                            targetTemp: Math.max(16, ac.targetTemp - 1),
                            smartAuto: false,
                          })
                        }
                        className="px-2 py-1.5 text-neutral-300 hover:text-white cursor-pointer"
                      >
                        -1°
                      </button>
                      <span className="px-2 font-mono text-white">
                        {ac.targetTemp}°C
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleAdjustAc(ac.id, {
                            targetTemp: Math.min(30, ac.targetTemp + 1),
                            smartAuto: false,
                          })
                        }
                        className="px-2 py-1.5 text-neutral-300 hover:text-white cursor-pointer"
                      >
                        +1°
                      </button>
                    </div>

                    {["COOL", "FAN", "DRY"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() =>
                          handleAdjustAc(ac.id, { mode: m, smartAuto: false })
                        }
                        className={`px-2 py-1.5 text-xs border cursor-pointer ${
                          ac.mode === m
                            ? "border-sky-400 text-sky-300"
                            : "border-neutral-800 text-neutral-400 hover:border-neutral-600"
                        }`}
                      >
                        {m}
                      </button>
                    ))}

                    {["LOW", "MEDIUM", "HIGH", "TURBO"].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() =>
                          handleAdjustAc(ac.id, { speed: spd, smartAuto: false })
                        }
                        className={`px-2.5 py-1.5 text-xs border cursor-pointer ${
                          ac.speed === spd
                            ? "bg-emerald-500 text-black border-emerald-500 font-semibold"
                            : "border-neutral-800 text-neutral-300 hover:border-neutral-600"
                        }`}
                      >
                        {spd}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleSaveBestSpeedToDb(ac.speed)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-neutral-700 hover:border-emerald-400 text-xs text-emerald-300 cursor-pointer"
                    >
                      <BookmarkCheck className="w-3.5 h-3.5" />
                      <span>Save {ac.speed}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {state.acControlLogs.length > 0 && (
            <div className="space-y-1 text-xs text-neutral-400">
              <div className="uppercase tracking-wider text-[11px] text-neutral-500">
                Smart Control Activity Feed
              </div>
              {state.acControlLogs.map((item) => (
                <div key={item.id}>
                  <span className="text-neutral-500 font-mono">[{item.time}]</span>{" "}
                  <span className="text-neutral-300">{item.text}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-b border-neutral-800 pb-8">
          <div className="lg:col-span-6 space-y-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>
                {lang === "en"
                  ? "Saved best AC speeds by weather"
                  : "Gudun AC da aka adana bisa yanayi"}
              </span>
            </h2>

            <div className="divide-y divide-neutral-800 border-t border-neutral-800">
              {state.speedDb.map((rec) => {
                const isNow = matchedDbRecord?.id === rec.id;
                return (
                  <div
                    key={rec.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-white">
                        {rec.conditionBand}{" "}
                        {isNow && (
                          <span className="text-xs text-emerald-400 ml-1">
                            (now)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-400">{rec.notes}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-xs font-bold text-emerald-300">
                        {rec.bestSpeed}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApplyBestSpeedFromDb(rec)}
                        className="px-2.5 py-1 border border-neutral-700 hover:border-white text-xs text-neutral-200 cursor-pointer"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>
                {lang === "en"
                  ? "Practical advice & source"
                  : "Shawara mai amfani & tushe"}
              </span>
            </h2>

            <p className="text-sm text-neutral-200 leading-relaxed">
              {specificFallbackRecommendation}
            </p>

            <p className="text-xs text-amber-200/90 leading-relaxed border-l-2 border-amber-500 pl-3">
              {lang === "en"
                ? "Accuracy note: Unverified hardware control or sensor behavior can make readings or expected changes inaccurate—always double-check physically."
                : "Lura kan daidaito: Inda ba a tabbatar da aikin na'ura ba, bayani na iya zama ba daidai ba—a duba da ido."}
            </p>

            <div className="text-xs text-neutral-300 space-y-1 pt-1">
              <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{lang === "en" ? "Reference" : "Tushe"}</span>
              </div>
              <p>{lang === "en" ? activeRule.sourceEn : activeRule.sourceHa}</p>
              <p className="text-neutral-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {lang === "en"
                    ? `Recommended DB speed for ${currentBand}: ${matchedDbRecord?.bestSpeed || "MEDIUM"}`
                    : `Gudun AC na ${currentBand}: ${matchedDbRecord?.bestSpeed || "MEDIUM"}`}
                </span>
              </p>
            </div>

            <form onSubmit={handleAddFieldNote} className="pt-2 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={state.fieldNote}
                  onChange={(e) =>
                    setState((prev) => ({ ...prev, fieldNote: e.target.value }))
                  }
                  placeholder={
                    lang === "en"
                      ? `Quick note on ${activeProduct.name}...`
                      : `Rubuta bayani game da ${activeProduct.name}...`
                  }
                  className="flex-1 bg-black border border-neutral-700 focus:border-emerald-400 outline-none px-3 py-1.5 text-xs text-white"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-white text-black font-semibold text-xs cursor-pointer"
                >
                  {lang === "en" ? "Log" : "Ajiye"}
                </button>
              </div>
              {state.savedFieldNotes.length > 0 && (
                <ul className="space-y-1 text-xs text-neutral-400">
                  {state.savedFieldNotes.map((n) => (
                    <li key={n.id}>
                      <span className="text-neutral-500">[{n.time}]</span>{" "}
                      <strong className="text-neutral-200">{n.productName}:</strong>{" "}
                      {n.text}
                    </li>
                  ))}
                </ul>
              )}
            </form>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
            {activeProduct.name} — Temperature & THI History
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeProduct.history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="time" stroke="#737373" fontSize={11} />
                <YAxis stroke="#737373" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000000",
                    borderColor: "#404040",
                    color: "#ffffff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Temp"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="#34d399"
                  fillOpacity={0.12}
                />
                <Area
                  type="monotone"
                  dataKey="THI"
                  stroke="#fb7185"
                  strokeWidth={2}
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </main>
    </div>
  );
}

function FlatReading({ icon, label, value, hint }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-neutral-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl sm:text-3xl font-semibold text-white">
        {value}
      </div>
      <div className="text-xs text-neutral-500">{hint}</div>
    </div>
  );
}
