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
  PlusCircle,
  Cpu,
  Sliders,
  Fan,
  Flame,
  CloudRain,
  Columns,
  Sparkles,
  Minus,
  Plus,
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

const STORAGE_KEY = "savebarn_farm_workspace_v1";

const ANIMAL_PROFILES = {
  POULTRY_BROILER: {
    id: "POULTRY_BROILER",
    nameEn: "Broiler Chickens (Grower/Finisher)",
    nameHa: "Kajunan Broiler (Masu Girma)",
    minTemp: 21,
    maxTemp: 28,
    dangerTemp: 32,
    maxAmmonia: 15,
    dangerAmmonia: 25,
    maxThi: 77,
    summaryEn:
      "Healthy between 21°C–28°C. Above 28°C–32°C causes heat panting, lower feed intake, and mortality risk.",
    summaryHa:
      "Lafiya tsakanin 21°C–28°C. Idan ya wuce 28°C–32°C zai haifar da matsanancin zafi da rage cin abinci.",
    hotEn: [
      "Switch cooling fans & misting In Favor of Asset to drop pen temperature below 28°C.",
      "Provide cool electrolytes/water and open side curtains for cross-ventilation.",
      "Avoid moving or crowding birds during peak afternoon heat.",
    ],
    hotHa: [
      "Kunna fankunan sanyaya da feshin ruwa don rage zafi a kasa da 28°C.",
      "Bada ruwan sanyi mai bitamin/electrolyte sannan a bude iska.",
      "Kada a matsa ko jigilar kajuna a lokacin tsananin zafin rana.",
    ],
    coldEn: [
      "Switch heat lamps/brooders In Favor of Asset and close draft curtains.",
      "Check litter dryness so chicks do not huddle under heat sources.",
    ],
    coldHa: [
      "Kunna fitilun dumama (heat lamps) sannan a rufe iskar sanyi.",
      "Duba bushewar takardar/shinfidar daki domin kajuna su watse lafiya.",
    ],
  },
  POULTRY_LAYER: {
    id: "POULTRY_LAYER",
    nameEn: "Layer Hens (Egg Production)",
    nameHa: "Kajunan Kwai (Layers)",
    minTemp: 19,
    maxTemp: 26,
    dangerTemp: 30,
    maxAmmonia: 15,
    dangerAmmonia: 25,
    maxThi: 76,
    summaryEn:
      "Optimal around 19°C–26°C. Heat above 26°C reduces egg size, shell strength, and feed conversion.",
    summaryHa:
      "Mafi kyau tsakanin 19°C–26°C. Zafin sama da 26°C na rage yawan kwai da karfin bawonsa.",
    hotEn: [
      "Engage ventilation and misting In Favor of Asset to keep layers under 26°C.",
      "Serve feed during cooler morning/evening hours and refresh cool water.",
    ],
    hotHa: [
      "Kunna iska da sanyaya domin kiyaye zafi kasa da 26°C.",
      "Bada abinci da safe ko maraice lokacin da iska ta dan yi sanyi.",
    ],
    coldEn: [
      "Activate warmth regulators In Favor of Asset and block cold drafts.",
      "Monitor feed intake as cold stress increases energy demand.",
    ],
    coldHa: [
      "Kunna na'urorin dumama sannan a toshe iskar sanyi.",
      "Kula da cin abinci domin sanyi na kara bukatar makamashi.",
    ],
  },
  SWINE_PIG: {
    id: "SWINE_PIG",
    nameEn: "Pigs / Swine (Grower & Pen)",
    nameHa: "Aladu (Pen / Masu Girma)",
    minTemp: 16,
    maxTemp: 24,
    dangerTemp: 29,
    maxAmmonia: 12,
    dangerAmmonia: 20,
    maxThi: 75,
    summaryEn:
      "Thrives around 16°C–24°C. Temperatures above 25°C–29°C rapidly slow weight gain and trigger heat stress.",
    summaryHa:
      "Yana lafiya tsakanin 16°C–24°C. Zafin sama da 25°C–29°C na rage kiba da haifar da damuwar zafi.",
    hotEn: [
      "Run cooling/misting In Favor of Asset and increase airflow across pens.",
      "Wash pen floor drainage to cut ammonia buildup and provide ample drinking water.",
    ],
    hotHa: [
      "Kunna na'urorin sanyaya da kara gudun iska a cikin dakin.",
      "Tsaftace magudanar ruwa don rage warin ammonia tare da bada ruwa isasshe.",
    ],
    coldEn: [
      "Turn heating In Favor of Asset and seal cold floor drafts.",
      "Ensure dry bedding area so piglets/pigs stay warm without piling.",
    ],
    coldHa: [
      "Kunna dumama sannan a toshe iskar sanyi a kasa.",
      "Tabbatar da busasshen wajen kwanciya domin gujewa sanyi.",
    ],
  },
  GOAT_SHEEP: {
    id: "GOAT_SHEEP",
    nameEn: "Goats & Sheep (Small Ruminants)",
    nameHa: "Awaki da Tumaki",
    minTemp: 14,
    maxTemp: 27,
    dangerTemp: 33,
    maxAmmonia: 15,
    dangerAmmonia: 25,
    maxThi: 78,
    summaryEn:
      "Comfortable around 14°C–27°C with shade and airflow. Extreme heat above 33°C or high humidity stresses ruminants.",
    summaryHa:
      "Yana da kyau tsakanin 14°C–27°C tare da inuwa da iska. Zafi sama da 33°C na damun dabbobi.",
    hotEn: [
      "Maximize airflow/shade In Favor of Asset and avoid direct sun exposure.",
      "Provide clean cool water and mineral salt licks.",
    ],
    hotHa: [
      "Kara iska da inuwa sannan a gujewa rana kai tsaye.",
      "Ajiye ruwan sha mai sanyi da gishirin ma'adanai.",
    ],
    coldEn: [
      "Engage warmth/windbreak In Favor of Asset, especially for kids/lambs.",
      "Keep shelter dry and protected from night chill.",
    ],
    coldHa: [
      "Kunna dumama ko katangar kare iska, musamman ga kanana.",
      "Kiyaye dakin ya kasance a bushe daga sanyin dare.",
    ],
  },
  CATTLE: {
    id: "CATTLE",
    nameEn: "Cattle (Dairy & Beef)",
    nameHa: "Shanu (Madara da Nama)",
    minTemp: 10,
    maxTemp: 25,
    dangerTemp: 30,
    maxAmmonia: 15,
    dangerAmmonia: 25,
    maxThi: 72,
    summaryEn:
      "Cattle experience heat stress early (THI ≥ 72 / >25°C with humidity). Cool airflow and shade protect milk & gain.",
    summaryHa:
      "Shanu na shiga damuwar zafi da wuri idan zafi ya wuce 25°C da danshi. Iska da inuwa na kare su.",
    hotEn: [
      "Activate fans & cooling In Favor of Asset to keep THI below 72.",
      "Ensure shaded resting space and continuous fresh water supply.",
    ],
    hotHa: [
      "Kunna fankuna da sanyaya domin rage zafi da danshi.",
      "Tabbatar da inuwa mai kyau da ruwan sha a kowane lokaci.",
    ],
    coldEn: [
      "Provide wind shelter and dry bedding; adult cattle tolerate cool weather well unless wet/drafty.",
      "Use supplemental warmth for calves if needed.",
    ],
    coldHa: [
      "Bada mafaka daga iska mai sanyi da busasshen wajen kwanciya.",
      "A yi amfani da dumama ga maruka idan akwai bukata.",
    ],
  },
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
    nameEn: "Mist / Evaporative Cooler",
    nameHa: "Feshin Sanyaya (Misting)",
    type: "COOLING",
    mode: "IN_FAVOR",
    active: false,
  },
  {
    id: "ctrl-heater",
    key: "heater",
    nameEn: "Heat Lamp / Brooder",
    nameHa: "Fitilar Dumama (Heater)",
    type: "HEATING",
    mode: "IN_FAVOR",
    active: false,
  },
  {
    id: "ctrl-curtain",
    key: "curtain",
    nameEn: "Ventilation Curtain / Louver",
    nameHa: "Labulen Shigar Iska",
    type: "AIRFLOW",
    mode: "IN_FAVOR",
    active: true,
  },
];

function computeTHI(tempC, rh) {
  const value = 1.8 * tempC + 32 - (0.55 - 0.0055 * rh) * (1.8 * tempC - 26.8);
  return Number(value.toFixed(1));
}

function evaluateAnimalHealth(profile, tempC, rh, ammoniaPpm, thi) {
  const reasonsEn = [];
  const reasonsHa = [];
  let level = "NORMAL";

  if (tempC > profile.dangerTemp || thi >= profile.maxThi + 5 || ammoniaPpm >= profile.dangerAmmonia) {
    level = "EMERGENCY";
  } else if (tempC > profile.maxTemp || thi >= profile.maxThi || ammoniaPpm >= profile.maxAmmonia) {
    level = "DANGER";
  } else if (tempC < profile.minTemp - 3) {
    level = "DANGER";
  } else if (tempC < profile.minTemp) {
    level = "ALERT";
  }

  if (tempC > profile.maxTemp) {
    reasonsEn.push(
      `Temperature (${tempC}°C) is above the healthy ${profile.minTemp}°C–${profile.maxTemp}°C range for ${profile.nameEn}.`
    );
    reasonsHa.push(
      `Zafi (${tempC}°C) ya wuce matakin lafiya na ${profile.minTemp}°C–${profile.maxTemp}°C.`
    );
  } else if (tempC < profile.minTemp) {
    reasonsEn.push(
      `Temperature (${tempC}°C) is below the healthy ${profile.minTemp}°C–${profile.maxTemp}°C range.`
    );
    reasonsHa.push(
      `Zafi (${tempC}°C) ya yi kasa da matakin lafiya na ${profile.minTemp}°C–${profile.maxTemp}°C.`
    );
  } else {
    reasonsEn.push(
      `Temperature (${tempC}°C) is inside the healthy ${profile.minTemp}°C–${profile.maxTemp}°C comfort zone.`
    );
    reasonsHa.push(
      `Zafi (${tempC}°C) yana cikin yanayin lafiya na ${profile.minTemp}°C–${profile.maxTemp}°C.`
    );
  }

  if (ammoniaPpm >= profile.maxAmmonia) {
    reasonsEn.push(
      `Ammonia (${ammoniaPpm} ppm) exceeds the safe ceiling of ${profile.maxAmmonia} ppm.`
    );
    reasonsHa.push(
      `Ammonia (${ammoniaPpm} ppm) ya wuce iyakar tsaro ta ${profile.maxAmmonia} ppm.`
    );
  }

  if (thi >= profile.maxThi) {
    reasonsEn.push(`Heat stress index (THI ${thi}) has crossed the ${profile.maxThi} alert threshold.`);
    reasonsHa.push(`Ma'aunin zafi (THI ${thi}) ya wuce matakin gargadi na ${profile.maxThi}.`);
  }

  const isTooHot = tempC > profile.maxTemp || thi >= profile.maxThi;
  const isTooCold = tempC < profile.minTemp;

  const actionsEn = isTooHot
    ? [...profile.hotEn, ...(ammoniaPpm >= profile.maxAmmonia ? ["Ventilate and replace wet bedding to lower ammonia."] : [])]
    : isTooCold
    ? profile.coldEn
    : ["Maintain current climate balance and log routine checks."];

  const actionsHa = isTooHot
    ? [...profile.hotHa, ...(ammoniaPpm >= profile.maxAmmonia ? ["Bude iska a sauya shinfida mai danshi don rage ammonia."] : [])]
    : isTooCold
    ? profile.coldHa
    : ["Ci gaba da kiyaye yanayin daidai kuma a rubuta duba na yau da kullum."];

  return { level, reasonsEn, reasonsHa, actionsEn, actionsHa, isTooHot, isTooCold };
}

function buildFallbackZones() {
  const baseTimes = ["-20m", "-16m", "-12m", "-8m", "-4m", "Now"];
  return [
    {
      id: "zone-1",
      name: "Pen A — Broiler House",
      deviceId: "SB-NODE-001",
      animalType: "POULTRY_BROILER",
      temperatureC: 29.4,
      humidityPct: 74,
      ammoniaPpm: 16.2,
      history: baseTimes.map((t, i) => ({
        time: t,
        Temp: Number((26.5 + i * 0.55).toFixed(1)),
        THI: Number((74.2 + i * 0.9).toFixed(1)),
        Ammonia: Number((11 + i * 1.0).toFixed(1)),
      })),
    },
    {
      id: "zone-2",
      name: "Pen B — Swine Farrowing & Grower",
      deviceId: "SB-PIG-002",
      animalType: "SWINE_PIG",
      temperatureC: 21.5,
      humidityPct: 62,
      ammoniaPpm: 9.0,
      history: baseTimes.map((t, i) => ({
        time: t,
        Temp: Number((20.2 + i * 0.25).toFixed(1)),
        THI: Number((67.5 + i * 0.4).toFixed(1)),
        Ammonia: Number((8.2 + i * 0.15).toFixed(1)),
      })),
    },
  ];
}

export default function App() {
  const [workspace, setWorkspace] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      onboarded: false,
      farmName: "Al-Baraka Smart Agro Farms",
      ownerName: "Farm Manager",
      location: "Keffi, Nasarawa",
      lang: "en",
      activeZoneId: "zone-1",
      zones: buildFallbackZones(),
      controls: INITIAL_CONTROLS,
    };
  });

  const [showOnboardingModal, setShowOnboardingModal] = useState(!workspace.onboarded);
  const [liveSyncStatus, setLiveSyncStatus] = useState("Interactive Demo");
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());
  const [manualOverrideLock, setManualOverrideLock] = useState(false);

  const [formFarmName, setFormFarmName] = useState(workspace.farmName);
  const [formOwnerName, setFormOwnerName] = useState(workspace.ownerName);
  const [formLocation, setFormLocation] = useState(workspace.location);
  const [formDeviceId, setFormDeviceId] = useState("SB-GOAT-003");
  const [formZoneName, setFormZoneName] = useState("Pen C — Goat & Sheep Shed");
  const [formAnimalType, setFormAnimalType] = useState("GOAT_SHEEP");
  const [formTemp, setFormTemp] = useState(26.0);
  const [formHumidity, setFormHumidity] = useState(65);
  const [formAmmonia, setFormAmmonia] = useState(11.0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    } catch (_) {}
  }, [workspace]);

  useEffect(() => {
    if (manualOverrideLock) return;
    let mounted = true;
    const syncBackend = async () => {
      try {
        const res = await fetch(`${API_URL}/api/dashboard`);
        if (!res.ok) return;
        const data = await res.json();
        const remoteReading = data?.zones?.[0]?.readings?.[0];
        if (!mounted || !remoteReading) return;

        setLiveSyncStatus("Live Cloud");
        setLastUpdated(new Date().toLocaleTimeString());

        setWorkspace((prev) => {
          const updatedZones = prev.zones.map((z, idx) => {
            if (idx !== 0) return z;
            const tempC = Number(remoteReading.temperatureC ?? z.temperatureC);
            const humidityPct = Number(remoteReading.humidityPct ?? z.humidityPct);
            const ammoniaPpm = Number(remoteReading.ammoniaPpm ?? z.ammoniaPpm);
            const thi = computeTHI(tempC, humidityPct);
            const nextPoint = {
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
              Temp: tempC,
              THI: thi,
              Ammonia: ammoniaPpm,
            };
            return {
              ...z,
              temperatureC: tempC,
              humidityPct,
              ammoniaPpm,
              history: [...z.history.slice(-11), nextPoint],
            };
          });
          return { ...prev, zones: updatedZones };
        });
      } catch (_) {
        if (mounted) setLiveSyncStatus("Simulated / Local");
      }
    };

    syncBackend();
    const timer = setInterval(syncBackend, 8000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [manualOverrideLock]);

  const lang = workspace.lang;
  const activeZone =
    workspace.zones.find((z) => z.id === workspace.activeZoneId) || workspace.zones[0];
  const profile = ANIMAL_PROFILES[activeZone.animalType] || ANIMAL_PROFILES.POULTRY_BROILER;
  const thi = computeTHI(activeZone.temperatureC, activeZone.humidityPct);
  const assessment = useMemo(
    () =>
      evaluateAnimalHealth(
        profile,
        activeZone.temperatureC,
        activeZone.humidityPct,
        activeZone.ammoniaPpm,
        thi
      ),
    [profile, activeZone.temperatureC, activeZone.humidityPct, activeZone.ammoniaPpm, thi]
  );

  const againstAssetControls = workspace.controls.filter((c) => c.mode === "AGAINST");

  const handleCompleteOnboarding = (e) => {
    e.preventDefault();
    const cleanId = (formDeviceId || "SB-NODE-NEW").trim().toUpperCase();
    const cleanZoneName = (formZoneName || `${cleanId} Pen`).trim();
    const cleanFarmName = (formFarmName || "SaveBarn Partner Farm").trim();

    const tempVal = Number(formTemp);
    const rhVal = Number(formHumidity);
    const nh3Val = Number(formAmmonia);
    const initialThi = computeTHI(tempVal, rhVal);

    const newZone = {
      id: `zone-${Date.now()}`,
      name: cleanZoneName,
      deviceId: cleanId,
      animalType: formAnimalType,
      temperatureC: tempVal,
      humidityPct: rhVal,
      ammoniaPpm: nh3Val,
      history: [
        { time: "-12m", Temp: Number((tempVal - 1.2).toFixed(1)), THI: Number((initialThi - 1.5).toFixed(1)), Ammonia: Number(Math.max(1, nh3Val - 1.5).toFixed(1)) },
        { time: "-8m", Temp: Number((tempVal - 0.7).toFixed(1)), THI: Number((initialThi - 0.8).toFixed(1)), Ammonia: Number(Math.max(1, nh3Val - 0.8).toFixed(1)) },
        { time: "-4m", Temp: Number((tempVal - 0.3).toFixed(1)), THI: Number((initialThi - 0.4).toFixed(1)), Ammonia: Number(Math.max(1, nh3Val - 0.3).toFixed(1)) },
        { time: "Now", Temp: tempVal, THI: initialThi, Ammonia: nh3Val },
      ],
    };

    setManualOverrideLock(true);
    setLiveSyncStatus("Manual / Demo Active");
    setWorkspace((prev) => ({
      ...prev,
      onboarded: true,
      farmName: cleanFarmName,
      ownerName: (formOwnerName || "Farm Manager").trim(),
      location: (formLocation || "Nigeria").trim(),
      activeZoneId: newZone.id,
      zones: [newZone, ...prev.zones],
    }));
    setShowOnboardingModal(false);
    setLastUpdated(new Date().toLocaleTimeString());
  };

  const updateActiveZoneTelemetry = (patch) => {
    setManualOverrideLock(true);
    setLiveSyncStatus("Manual / Demo Active");
    setWorkspace((prev) => {
      const updatedZones = prev.zones.map((z) => {
        if (z.id !== activeZone.id) return z;
        const nextTemp = patch.temperatureC ?? z.temperatureC;
        const nextRh = patch.humidityPct ?? z.humidityPct;
        const nextNh3 = patch.ammoniaPpm ?? z.ammoniaPpm;
        const nextAnimal = patch.animalType ?? z.animalType;
        const nextThi = computeTHI(nextTemp, nextRh);
        const point = {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          Temp: Number(nextTemp),
          THI: nextThi,
          Ammonia: Number(nextNh3),
        };
        return {
          ...z,
          ...patch,
          animalType: nextAnimal,
          history: [...z.history.slice(-11), point],
        };
      });
      return { ...prev, zones: updatedZones };
    });
    setLastUpdated(new Date().toLocaleTimeString());
  };

  const stepTemperature = (delta) => {
    const nextTemp = Number(
      Math.max(5, Math.min(45, Number(activeZone.temperatureC) + delta)).toFixed(1)
    );
    updateActiveZoneTelemetry({ temperatureC: nextTemp });
  };

  const toggleControlMode = (controlId) => {
    setWorkspace((prev) => ({
      ...prev,
      controls: prev.controls.map((ctrl) => {
        if (ctrl.id !== controlId) return ctrl;
        const nextMode = ctrl.mode === "IN_FAVOR" ? "AGAINST" : "IN_FAVOR";
        return { ...ctrl, mode: nextMode, active: true };
      }),
    }));
  };

  const toggleControlPower = (controlId) => {
    setWorkspace((prev) => ({
      ...prev,
      controls: prev.controls.map((ctrl) =>
        ctrl.id === controlId ? { ...ctrl, active: !ctrl.active } : ctrl
      ),
    }));
  };

  const applyRegulatorsToEnvironment = () => {
    let deltaTemp = 0;
    let deltaNh3 = 0;

    workspace.controls.forEach((ctrl) => {
      if (!ctrl.active) return;
      const sign = ctrl.mode === "IN_FAVOR" ? 1 : -1;

      if (ctrl.type === "COOLING") {
        deltaTemp += assessment.isTooHot ? -1.4 * sign : -0.8 * sign;
      } else if (ctrl.type === "HEATING") {
        deltaTemp += assessment.isTooCold ? 1.5 * sign : 1.0 * sign;
      } else if (ctrl.type === "AIRFLOW") {
        deltaNh3 += -1.6 * sign;
        deltaTemp += assessment.isTooHot ? -0.6 * sign : -0.3 * sign;
      }
    });

    const nextTemp = Number(Math.max(5, Math.min(45, activeZone.temperatureC + deltaTemp)).toFixed(1));
    const nextNh3 = Number(Math.max(1, Math.min(45, activeZone.ammoniaPpm + deltaNh3)).toFixed(1));
    updateActiveZoneTelemetry({ temperatureC: nextTemp, ammoniaPpm: nextNh3 });
  };

  const badgeStyle = {
    NORMAL: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    ALERT: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    DANGER: "bg-orange-500/15 text-orange-300 border-orange-500/40",
    EMERGENCY: "bg-rose-500/15 text-rose-300 border-rose-500/40 animate-pulse",
  }[assessment.level];

  const verdictText = {
    NORMAL: lang === "en" ? "Healthy for Livestock" : "Lafiya Ga Dabbobi",
    ALERT: lang === "en" ? "Mild Thermal Shift" : "Canjin Yanayi Kadara",
    DANGER: lang === "en" ? "Unhealthy — Action Needed" : "Bai Dace Ba — A Dauki Mataki",
    EMERGENCY: lang === "en" ? "Critical Stress Risk" : "Hatari Mai Tsanani",
  }[assessment.level];

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
                  {liveSyncStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {lang === "en"
                  ? `Welcome, ${workspace.farmName} • ${workspace.location}`
                  : `Barka da zuwa, ${workspace.farmName} • ${workspace.location}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowOnboardingModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              {lang === "en" ? "Activate Device / Onboard" : "Kunna Sabuwar Na'ura"}
            </button>

            <button
              onClick={() =>
                setWorkspace((prev) => ({ ...prev, lang: prev.lang === "en" ? "ha" : "en" }))
              }
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs sm:text-sm font-medium transition cursor-pointer"
            >
              <Languages className="w-4 h-4 text-emerald-400" />
              {lang === "en" ? "Hausa" : "English"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {lang === "en"
                  ? `Farm Command Center — ${workspace.farmName}`
                  : `Cibiyar Kula da Gona — ${workspace.farmName}`}
              </p>
              <h1 className="text-2xl font-bold text-white mt-0.5">{activeZone.name}</h1>
              <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-slate-300 font-medium">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  Hardware ID: {activeZone.deviceId}
                </span>
                <span>•</span>
                <span>{lang === "en" ? profile.nameEn : profile.nameHa}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-400" />
                  {lastUpdated}
                </span>
              </p>
            </div>

            <div className={`px-4 py-2 rounded-full border text-sm font-semibold ${badgeStyle}`}>
              {verdictText}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <div className="flex flex-wrap gap-2">
              {workspace.zones.map((z) => {
                const isSelected = z.id === activeZone.id;
                return (
                  <button
                    key={z.id}
                    onClick={() =>
                      setWorkspace((prev) => ({ ...prev, activeZoneId: z.id }))
                    }
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border transition cursor-pointer ${
                      isSelected
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                        : "bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {z.name} ({z.deviceId})
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">
                {lang === "en" ? "Animal Profile:" : "Nau'in Dabba:"}
              </label>
              <select
                value={activeZone.animalType}
                onChange={(e) => updateActiveZoneTelemetry({ animalType: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-white"
              >
                {Object.values(ANIMAL_PROFILES).map((p) => (
                  <option key={p.id} value={p.id}>
                    {lang === "en" ? p.nameEn : p.nameHa}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-xs sm:text-sm text-slate-300">
            <span className="font-semibold text-emerald-400">
              {lang === "en" ? "Species Comfort Rule: " : "Ka'idar Lafiyar Wannan Dabba: "}
            </span>
            {lang === "en" ? profile.summaryEn : profile.summaryHa}
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<Thermometer className="w-5 h-5 text-orange-400" />}
            label={lang === "en" ? "Barn Temperature" : "Zafin Gidan Dabba"}
            value={`${activeZone.temperatureC}°C`}
            sub={
              lang === "en"
                ? `Healthy: ${profile.minTemp}°C – ${profile.maxTemp}°C`
                : `Lafiya: ${profile.minTemp}°C – ${profile.maxTemp}°C`
            }
            highlight={
              activeZone.temperatureC > profile.maxTemp ||
              activeZone.temperatureC < profile.minTemp
            }
          />
          <MetricCard
            icon={<Droplets className="w-5 h-5 text-sky-400" />}
            label={lang === "en" ? "Relative Humidity" : "Danshin Iska"}
            value={`${activeZone.humidityPct}%`}
            sub={lang === "en" ? "Target: 50% – 70%" : "Matsakaici: 50% – 70%"}
          />
          <MetricCard
            icon={<Activity className="w-5 h-5 text-rose-400" />}
            label={lang === "en" ? "Heat Stress (THI)" : "Ma'aunin Zafi (THI)"}
            value={`${thi}`}
            sub={
              lang === "en"
                ? `Alert Threshold: ≥ ${profile.maxThi}`
                : `Gargaɗi: ≥ ${profile.maxThi}`
            }
            highlight={thi >= profile.maxThi}
          />
          <MetricCard
            icon={<Wind className="w-5 h-5 text-amber-400" />}
            label={lang === "en" ? "Ammonia (NH₃)" : "Gas ɗin Ammonia"}
            value={`${activeZone.ammoniaPpm} ppm`}
            sub={
              lang === "en"
                ? `Safe Limit: < ${profile.maxAmmonia} ppm`
                : `Tsaro: < ${profile.maxAmmonia} ppm`
            }
            highlight={activeZone.ammoniaPpm >= profile.maxAmmonia}
          />
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                {lang === "en"
                  ? "Climate Regulator Controls — In Favor vs. Against Asset"
                  : "Kula da Na'urorin Yanayi — Don Amfanin Dabba vs. Sabanin Haka"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === "en"
                  ? "Use - / + to step temperature up or down directly, or click Simulate Regulator Effect Now."
                  : "Yi amfani da - / + don rage ko kara zafi kai tsaye, ko danna Simulate Regulator Effect Now."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => stepTemperature(-1)}
                aria-label="Decrease temperature by 1 degree Celsius"
                className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                <Minus className="w-4 h-4" />
                <span>1°C</span>
              </button>

              <button
                type="button"
                onClick={() => stepTemperature(1)}
                aria-label="Increase temperature by 1 degree Celsius"
                className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>1°C</span>
              </button>

              <button
                type="button"
                onClick={applyRegulatorsToEnvironment}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                {lang === "en"
                  ? "Simulate Regulator Effect Now"
                  : "Gwada Tasirin Na'urorin Yanzu"}
              </button>
            </div>
          </div>

          {againstAssetControls.length > 0 && (
            <div className="bg-rose-950/30 border border-rose-500/40 rounded-xl px-4 py-2.5 text-xs text-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                {lang === "en"
                  ? `${againstAssetControls.length} regulator(s) set to work AGAINST the asset (${againstAssetControls
                      .map((c) => c.nameEn)
                      .join(", ")}).`
                  : `Na'urori ${againstAssetControls.length} suna aiki AKASIN lafiyar dabbobi.`}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {workspace.controls.map((ctrl) => {
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
                            : "Don Lafiyar Dabba"
                          : lang === "en"
                          ? "Against Asset"
                          : "Akan Dabba"}
                      </span>
                    </div>
                  </div>

                  <button
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
                        : "Canza zuwa: Akan Dabba"
                      : lang === "en"
                      ? "Switch to: In Favor of Asset"
                      : "Canza zuwa: Don Lafiyar Dabba"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              {lang === "en"
                ? "Health Diagnosis & Action Plan"
                : "Binciken Lafiya da Matakai"}
            </h2>

            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {lang === "en" ? "Why This Reading Matters" : "Dalilin Wannan Karatu"}
              </div>
              <ul className="space-y-1.5 text-sm text-slate-200">
                {(lang === "en" ? assessment.reasonsEn : assessment.reasonsHa).map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {lang === "en" ? "Recommended Farmer Actions" : "Matakan Da Ake Shawarta"}
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-200 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                {(lang === "en" ? assessment.actionsEn : assessment.actionsHa).map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                {lang === "en"
                  ? "Live Pitch Test Sliders (Instant Simulation)"
                  : "Gwajin Yanayi Kai Tsaye (Pitch Demo)"}
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{lang === "en" ? "Temperature" : "Zafi"}</span>
                  <span>{activeZone.temperatureC}°C</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="45"
                  step="0.5"
                  value={activeZone.temperatureC}
                  onChange={(e) =>
                    updateActiveZoneTelemetry({ temperatureC: Number(e.target.value) })
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Ammonia (NH₃)</span>
                  <span>{activeZone.ammoniaPpm} ppm</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="35"
                  step="0.5"
                  value={activeZone.ammoniaPpm}
                  onChange={(e) =>
                    updateActiveZoneTelemetry({ ammoniaPpm: Number(e.target.value) })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white">
                {lang === "en"
                  ? "Microclimate & Heat-Stress Trend"
                  : "Jadawalin Sauyin Zafi da Ammonia"}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === "en"
                  ? "Tracks temperature (°C), THI, and ammonia (ppm) for the active pen"
                  : "Yana bin diddigin zafi (°C), THI, da ammonia (ppm) na wannan gida"}
              </p>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeZone.history}>
                  <defs>
                    <linearGradient id="thiFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#thiFill)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Temp"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#tempFill)"
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
        </section>
      </main>

      {showOnboardingModal && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCompleteOnboarding}
            className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Activate SaveBarn Hardware & Farm Profile
                </h2>
                <p className="text-xs text-slate-400">
                  Copy the unique Hardware ID printed on your device casing to link it to your farm.
                </p>
              </div>
              {workspace.onboarded && (
                <button
                  type="button"
                  onClick={() => setShowOnboardingModal(false)}
                  className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800 cursor-pointer"
                >
                  Close
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Farm Name *</label>
                <input
                  required
                  value={formFarmName}
                  onChange={(e) => setFormFarmName(e.target.value)}
                  placeholder="e.g., GreenValley Agro Farm"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Owner / Manager</label>
                <input
                  value={formOwnerName}
                  onChange={(e) => setFormOwnerName(e.target.value)}
                  placeholder="e.g., Musa Ibrahim"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Unique Hardware ID (From Device Casing) *
                </label>
                <input
                  required
                  value={formDeviceId}
                  onChange={(e) => setFormDeviceId(e.target.value)}
                  placeholder="e.g., SB-GOAT-003"
                  className="w-full bg-slate-950 border border-emerald-500/40 rounded-lg px-3 py-2 text-sm text-emerald-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Pen / Barn Zone Name *</label>
                <input
                  required
                  value={formZoneName}
                  onChange={(e) => setFormZoneName(e.target.value)}
                  placeholder="e.g., Pen C — Goat Shed"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Livestock / Animal Type *</label>
                <select
                  value={formAnimalType}
                  onChange={(e) => setFormAnimalType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  {Object.values(ANIMAL_PROFILES).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Farm Location</label>
                <input
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="e.g., Keffi, Nasarawa"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="text-xs font-semibold text-slate-300">
                Initial Reading Snapshot (Optional for Demo)
              </div>
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div>
                  <span className="text-slate-400">Temp (°C)</span>
                  <input
                    type="number"
                    step="0.5"
                    value={formTemp}
                    onChange={(e) => setFormTemp(e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <span className="text-slate-400">Humidity (%)</span>
                  <input
                    type="number"
                    step="1"
                    value={formHumidity}
                    onChange={(e) => setFormHumidity(e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <span className="text-slate-400">NH₃ (ppm)</span>
                  <input
                    type="number"
                    step="0.5"
                    value={formAmmonia}
                    onChange={(e) => setFormAmmonia(e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition cursor-pointer"
              >
                Activate Hardware & Open Farm Dashboard
              </button>
            </div>
          </form>
        </div>
      )}
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
