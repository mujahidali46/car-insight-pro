import React, { useState, useEffect, useRef, useCallback, FormEvent } from "react";
import { 
  Home, 
  Activity, 
  Cpu, 
  TrendingUp, 
  Settings as SettingsIcon, 
  Zap, 
  Play, 
  Square, 
  RefreshCw, 
  Plus, 
  Sliders, 
  FileText, 
  Bell, 
  Bluetooth, 
  Signal, 
  Clock, 
  Car, 
  Download, 
  Compass, 
  Gauge, 
  Database,
  Volume2,
  AlertOctagon,
  ChevronsUp,
  Flame,
  Battery
} from "lucide-react";

import { 
  Vehicle, 
  PIDData, 
  GaugeWidgetConfig, 
  DTCUnit, 
  AlertTrigger, 
  TripData, 
  BluetoothAdapter 
} from "./types";

import { 
  VEHICLE_DATABASE, 
  ADAPTERS_DATABASE, 
  STANDARD_PIDS, 
  HONDA_EXTENDED_PIDS, 
  TOYOTA_EXTENDED_PIDS, 
  SAMPLE_DTC_CODES 
} from "./utils/automotiveData";

import GaugeWidget from "./components/GaugeWidget";
import DiagnosticAIWidget from "./components/DiagnosticAIWidget";
import HealthReportModal from "./components/HealthReportModal";

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<"home" | "live" | "diagnostics" | "performance" | "trip">("home");
  
  // Connection & Adapter States
  const [selectedAdapter, setSelectedAdapter] = useState<BluetoothAdapter>({ ...ADAPTERS_DATABASE[0] });
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [adapterLogs, setAdapterLogs] = useState<string[]>([
    "ELM327 interface initiated.",
    "Awaiting physical Bluetooth secure pairing signal..."
  ]);

  // Vehicle Selection States
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle>({ ...VEHICLE_DATABASE[0] });
  const [garageList, setGarageList] = useState<Vehicle[]>([...VEHICLE_DATABASE]);
  
  // Dynamic Telemetry State (PIDs)
  const [telemetryPids, setTelemetryPids] = useState<PIDData[]>([
    ...STANDARD_PIDS,
    ...HONDA_EXTENDED_PIDS
  ]);

  // Gauge Widget Settings (Torque Pro dashboard config)
  const [garageWidgets, setGarageWidgets] = useState<GaugeWidgetConfig[]>([
    { id: "w-rpm", pidId: "engine_rpm", type: "analog", w: 4, h: 4 },
    { id: "w-voltage", pidId: "battery_voltage", type: "battery", w: 4, h: 4 },
    { id: "w-boost", pidId: "honda_turbo_boost", type: "turbo", w: 4, h: 4 },
    { id: "w-coolant", pidId: "coolant_temp", type: "thermometer", w: 4, h: 4 },
    { id: "w-speed", pidId: "vehicle_speed", type: "digital", w: 4, h: 4 },
    { id: "w-cvt", pidId: "honda_cvt_temp", type: "analog", w: 4, h: 4 },
    { id: "w-graph-rpm", pidId: "engine_rpm", type: "graph", w: 4, h: 4 }
  ]);
  const [isWidgetEditMode, setIsWidgetEditMode] = useState<boolean>(false);
  const [newWidgetPidId, setNewWidgetPidId] = useState<string>("engine_rpm");
  const [newWidgetType, setNewWidgetType] = useState<"analog" | "digital" | "graph" | "bar" | "circular" | "turbo" | "thermometer" | "battery">("analog");

  // Fault Scanner States (DTC)
  const [activeFaults, setActiveFaults] = useState<DTCUnit[]>([
    { ...SAMPLE_DTC_CODES["P0171"] },
    { ...SAMPLE_DTC_CODES["P2563"] }
  ]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scannedModules, setScannedModules] = useState<string>("");

  // Performance Timer States
  const [isPerfTimerRunning, setIsPerfTimerRunning] = useState<boolean>(false);
  const [perfSpeed, setPerfSpeed] = useState<number>(0);
  const [perfTimeSec, setPerfTimeSec] = useState<number>(0);
  const [perfLogs, setPerfLogs] = useState<{ speed: number; elapsed: number }[]>([]);
  const [zeroToSixtyMs, setZeroToSixtyMs] = useState<number | null>(null);
  const [zeroToHundredMs, setZeroToHundredMs] = useState<number | null>(null);
  const [quarterMileMs, setQuarterMileMs] = useState<number | null>(null);
  const [estimatedHp, setEstimatedHp] = useState<number>(182);
  const [estimatedTorque, setEstimatedTorque] = useState<number>(240);

  // Trip Computer Data
  const [tripStats, setTripStats] = useState<TripData>({
    distanceKm: 14.8,
    avgFuelEconomyL100: 6.8,
    instantFuelEconomyL100: 5.4,
    tripCostUsd: 1.85,
    drivingTimeSec: 1240,
    idleTimeSec: 180,
    co2Kg: 3.45
  });
  const [isTripLogging, setIsTripLogging] = useState<boolean>(true);
  const [advancedLogsHistory, setAdvancedLogsHistory] = useState<any[]>([]);

  // Alert Settings
  const [alerts, setAlerts] = useState<AlertTrigger[]>([
    { id: "alt-coolant", name: "High Coolant Temp Alert", pidId: "coolant_temp", thresholdType: "above", value: 102, enabled: true, isTriggered: false },
    { id: "alt-cvt", name: "High CVT Temp Alert", pidId: "honda_cvt_temp", thresholdType: "above", value: 110, enabled: true, isTriggered: false },
    { id: "alt-battery", name: "Low Battery Warning (Crank)", pidId: "battery_voltage", thresholdType: "below", value: 11.5, enabled: true, isTriggered: false },
    { id: "alt-boost", name: "Turbo Overboost Peak Trigger", pidId: "honda_turbo_boost", thresholdType: "above", value: 1.6, enabled: true, isTriggered: false }
  ]);
  const [alertDisplay, setAlertDisplay] = useState<string | null>(null);

  // Report modal handle
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // Audio Synth triggers (Vibration alerts simulated or using standard AudioContext beepers)
  const playSynthesizedBeep = useCallback((freq = 660, len = 0.25) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.frequency.value = freq;
      osc.type = "sine";
      
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + len);
      
      osc.start();
      osc.stop(audioCtx.currentTime + len);
    } catch (e) {
      // Audio context might be restricted before interaction, fail silently
    }
  }, []);

  // Sync PIDs list when Vehicle Brand changes (Honda vs Toyota parameters)
  useEffect(() => {
    if (selectedVehicle.brand === "Honda") {
      setTelemetryPids([
        ...STANDARD_PIDS,
        ...HONDA_EXTENDED_PIDS
      ]);
    } else if (selectedVehicle.brand === "Toyota") {
      setTelemetryPids([
        ...STANDARD_PIDS,
        ...TOYOTA_EXTENDED_PIDS
      ]);
    } else {
      setTelemetryPids([...STANDARD_PIDS]);
    }
    // Update matching widget IDs dynamically if changing brands
    setGarageWidgets((prev) => {
      return prev.map((w) => {
        if (selectedVehicle.brand === "Toyota") {
          if (w.pidId.startsWith("honda_")) {
            // map Honda specific pids to Toyota equivalents so widgets don't break
            const newPid = w.pidId === "honda_cvt_temp" ? "toyota_cvt_temp" : 
                           w.pidId === "honda_turbo_boost" ? "toyota_hv_voltage" : "engine_rpm";
            return { ...w, pidId: newPid, type: w.pidId === "honda_turbo_boost" ? "battery" : w.type };
          }
        } else {
          if (w.pidId.startsWith("toyota_")) {
            const newPid = w.pidId === "toyota_cvt_temp" ? "honda_cvt_temp" : 
                           w.pidId === "toyota_hv_voltage" ? "honda_turbo_boost" : "engine_rpm";
            return { ...w, pidId: newPid, type: w.pidId === "toyota_hv_voltage" ? "turbo" : w.type };
          }
        }
        return w;
      });
    });
  }, [selectedVehicle]);

  // Connection Handler Simulator
  const handleConnectAdapter = () => {
    if (isConnected) {
      setIsConnected(false);
      setAdapterLogs(prev => [...prev, "OBDII Adapter manually disconnected.", "ELM327 communications closed."]);
      return;
    }

    setIsConnecting(true);
    setAdapterLogs(prev => [...prev, "Inquiring ELM327 serial speed...", "Testing K-Line initialization protocol..."]);
    
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      playSynthesizedBeep(880, 0.45);
      
      // Auto-detect adapter protocols
      setAdapterLogs(prev => [
        ...prev,
        `Secure channel established with ${selectedAdapter.type}.`,
        `Protocol detected: ${selectedAdapter.supportedProtocols[0]}`,
        `Firmware: ${selectedAdapter.firmwareVersion}`,
        `Transmitting ECU handshake packets... Connection OK!`
      ]);
    }, 2200);
  };

  // High Refresh-Rate Simulation Loop (15 readings/second target)
  useEffect(() => {
    if (!isConnected) return;

    let rpmDir = 1;
    let boostDir = 1;
    const interval = setInterval(() => {
      setTelemetryPids((prevPids) => {
        return prevPids.map((pid) => {
          let updatedVal = pid.value;

          if (pid.id === "engine_rpm") {
            // Idle fluctuation with occasional simulated throttle rev
            const rev = Math.random() > 0.98;
            if (rev) {
              updatedVal = 4200 + Math.random() * 2000;
              playSynthesizedBeep(440, 0.05);
            } else {
              updatedVal += (Math.random() * 80 - 40);
              if (updatedVal < 680) updatedVal = 720;
              if (updatedVal > 1500 && !rev) updatedVal = 800; // Return to cool idle
            }
          } 
          else if (pid.id === "vehicle_speed") {
            const rpm = prevPids.find(p => p.id === "engine_rpm")?.value || 750;
            updatedVal = rpm > 3000 ? (rpm / 110) + Math.random() * 5 : (rpm / 140);
            if (updatedVal < 0) updatedVal = 0;
          }
          else if (pid.id === "battery_voltage") {
            updatedVal = 14.1 + Math.random() * 0.2;
          }
          else if (pid.id === "honda_turbo_boost") {
            const rpm = prevPids.find(p => p.id === "engine_rpm")?.value || 750;
            if (rpm > 4000) {
              updatedVal = 1.1 + Math.random() * 0.6; // High pressure rev boost
            } else {
              updatedVal = -0.4 + Math.random() * 0.5;
            }
          }
          else if (pid.id === "coolant_temp") {
            // Slow gradient heat-up simulation
            updatedVal += Math.random() > 0.9 ? 1 : 0;
            if (updatedVal > 115) updatedVal = 92; // Cycle cooling
          }
          else if (pid.id === "honda_cvt_temp" || pid.id === "toyota_cvt_temp") {
            updatedVal += Math.random() > 0.95 ? 1 : 0;
            if (updatedVal > 112) updatedVal = 85; 
          }
          else if (pid.id === "toyota_hybrid_soc") {
            updatedVal += Math.sin(Date.now() / 20000) * 0.5;
          }
          else if (pid.id === "toyota_hv_voltage") {
            updatedVal = 240 + Math.sin(Date.now() / 4000) * 3;
          }
          else if (pid.id === "engine_load") {
            const rpm = prevPids.find(p => p.id === "engine_rpm")?.value || 750;
            updatedVal = Math.min(100, Math.max(8, (rpm / 80) + (Math.random() * 10 - 5)));
          }

          // Trigger checking alert thresholds dynamically
          alerts.forEach((triggeredAlert) => {
            if (triggeredAlert.enabled && triggeredAlert.pidId === pid.id) {
              const isViolated = triggeredAlert.thresholdType === "above" 
                ? updatedVal > triggeredAlert.value 
                : updatedVal < triggeredAlert.value;
              
              if (isViolated && !triggeredAlert.isTriggered) {
                triggeredAlert.isTriggered = true;
                setAlertDisplay(triggeredAlert.name);
                playSynthesizedBeep(880, 0.6);
                if (navigator.vibrate) {
                  navigator.vibrate(200);
                }
                
                // Reset triggered alert status after 6 seconds
                setTimeout(() => {
                  triggeredAlert.isTriggered = false;
                  setAlertDisplay(null);
                }, 6000);
              }
            }
          });

          return { ...pid, value: updatedVal };
        });
      });

      // Fluctuate trip consumption if driving logged
      if (isTripLogging) {
        setTripStats((prev) => {
          const distanceAdd = 0.02 / 10; // small increments
          const nextDist = prev.distanceKm + distanceAdd;
          return {
            ...prev,
            distanceKm: nextDist,
            drivingTimeSec: prev.drivingTimeSec + 1,
            avgFuelEconomyL100: 6.6 + Math.sin(nextDist) * 0.2,
            co2Kg: prev.co2Kg + 0.003
          };
        });
      }
    }, 120); // Fluctuates ~8 readings per second natively

    return () => clearInterval(interval);
  }, [isConnected, alerts, isTripLogging, playSynthesizedBeep]);

  // Performance Speed & Time graph analyzer loop
  useEffect(() => {
    if (!isPerfTimerRunning) return;

    let start = Date.now();
    let speedAcc = 0;
    const perfInterval = setInterval(() => {
      const elapsedSec = (Date.now() - start) / 1000;
      setPerfTimeSec(elapsedSec);

      // Simulating rapid acceleration
      speedAcc += 2.4 + Math.random() * 1.5;
      if (speedAcc >= 100) speedAcc = 100 + Math.random() * 2; // Speed cutoff

      setPerfSpeed(Math.min(200, speedAcc));

      // Capture threshold logs
      if (speedAcc >= 60 && zeroToSixtyMs === null) {
        setZeroToSixtyMs(elapsedSec);
        playSynthesizedBeep(920, 0.45);
      }
      if (speedAcc >= 100 && zeroToHundredMs === null) {
        setZeroToHundredMs(elapsedSec);
        playSynthesizedBeep(1100, 0.5);
      }

      setPerfLogs(prev => [...prev, { speed: speedAcc, elapsed: elapsedSec }]);

      // End quarter-mile at 14.1 seconds (Civic Rs spec simulation)
      if (elapsedSec >= 14.2) {
        setIsPerfTimerRunning(false);
        setQuarterMileMs(elapsedSec);
      }
    }, 100);

    return () => clearInterval(perfInterval);
  }, [isPerfTimerRunning, zeroToSixtyMs, zeroToHundredMs, playSynthesizedBeep]);

  // Drag-and-drop / custom layout state handlers
  const handleAddWidget = (e: FormEvent) => {
    e.preventDefault();
    const widgetId = `w-custom-${Date.now()}`;
    const newWidget: GaugeWidgetConfig = {
      id: widgetId,
      pidId: newWidgetPidId,
      type: newWidgetType,
      w: 4,
      h: 4
    };
    setGarageWidgets([...garageWidgets, newWidget]);
    playSynthesizedBeep(600, 0.1);
  };

  const handleRemoveWidget = (id: string) => {
    setGarageWidgets(garageWidgets.filter(w => w.id !== id));
    playSynthesizedBeep(300, 0.15);
  };

  // DTC Scanner Simulator
  const handleScanEcu = () => {
    setIsScanning(true);
    setScanProgress(0);
    setActiveFaults([]);
    playSynthesizedBeep(520, 0.2);

    const modules = ["Engine Control Unit (ECU)", "Transmission Control Unit (TCU)", "Anti-lock Braking (ABS)", "Supplemental Restraint (SRS Airbag)", "Chassis Body Module (BCM)", "Steering Angle Hub System", "Tire Pressure Sensors (TPMS)"];
    let currModuleIdx = 0;

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          // Seed the active faults on completion
          setActiveFaults([
            { ...SAMPLE_DTC_CODES["P0171"] },
            { ...SAMPLE_DTC_CODES["P2563"] },
            { ...SAMPLE_DTC_CODES["C0040"] }
          ]);
          playSynthesizedBeep(880, 0.6);
          return 100;
        }
        
        // Advance current scanned modules
        currModuleIdx = Math.floor((prev / 100) * modules.length);
        if (modules[currModuleIdx]) {
          setScannedModules(modules[currModuleIdx]);
        }
        
        return prev + 4;
      });
    }, 120);
  };

  // Log exporter for CSV/JSON Advanced data recorder
  const handleExportAdvancedLogs = (format: "csv" | "json") => {
    // Generate real sensor data arrays
    const list = telemetryPids.map(p => ({
      sensor: p.name,
      value: p.value.toFixed(2),
      unit: p.unit,
      category: p.category
    }));

    if (format === "csv") {
      const csvContent = "data:text/csv;charset=utf-8," + 
        ["Sensor,Value,Unit,Category", ...list.map(l => `${l.sensor},${l.value},${l.unit},${l.category}`)].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Telemetry_AdvLog_${selectedVehicle.model}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const jsonStr = JSON.stringify(list, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Telemetry_AdvLog_${selectedVehicle.model}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    playSynthesizedBeep(580, 0.25);
  };

  return (
    <div className="bg-[#0A0A0B] text-[#E0E0E0] font-sans min-h-screen pb-36 font-body-md text-sm selection:bg-primary selection:text-white border-4 border-[#1A1A1C]">
      
      {/* Dynamic Audio-visual Alert Banner */}
      {alertDisplay && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce duration-300 w-11/12 max-w-md">
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-[0_4px_30px_rgba(239,68,68,0.5)] border border-red-400/30">
            <AlertOctagon className="w-6 h-6 text-white animate-spin" />
            <div className="text-left">
              <span className="font-label-caps text-[10px] text-red-100 font-bold tracking-widest block">CRITICAL OBD LEVEL BREACHED</span>
              <p className="font-headline-sm text-sm text-white font-bold leading-tight">{alertDisplay}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Header App Bar representing the Technical Dashboard / Data Grid styling */}
      <header className="fixed top-0 left-0 right-0 h-20 border-b border-[#2A2A2E] bg-[#111114]/95 backdrop-blur-2xl flex items-center justify-between px-6 py-4 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#2D5BFF] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(45,91,255,0.4)]">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div className="text-left flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <h1 className="text-xl font-bold tracking-tight text-white m-0">Car Insight <span className="text-[#2D5BFF]">Pro</span></h1>
            <div className="hidden sm:block h-6 w-[1px] bg-[#2A2A2E] mx-1"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono tracking-widest text-[#8E9299] uppercase font-bold leading-none">Diagnostic Link</span>
              <span className="text-xs font-semibold text-white/90 truncate max-w-[200px] mt-0.5">{selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.year})</span>
            </div>
          </div>
        </div>

        {/* Sync Indicator Connection State */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-[#1A1A1E] px-3 py-1.5 rounded-full border border-[#2A2A2E]">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-[#00E676] animate-pulse" : "bg-neutral-500"}`}></div>
            <span className={`text-xs font-mono uppercase tracking-widest ${isConnected ? "text-[#00E676]" : "text-[#8E9299]"}`}>
              {isConnected ? "OBDLink Active" : "OBD Disconnected"}
            </span>
          </div>
          
          <button 
            type="button"
            onClick={handleConnectAdapter}
            className={`px-4 py-2 text-xs font-semibold tracking-wider font-label-caps rounded-xl flex items-center gap-1.5 transition-all ${
              isConnected 
                ? "bg-red-500/10 border border-red-500/30 text-red-500" 
                : isConnecting 
                  ? "bg-amber-400/10 text-amber-500 border border-amber-400/30"
                  : "bg-primary text-white border border-primary/25 font-bold shadow-[0_4px_15px_rgba(45,91,255,0.35)] hover:bg-[#1a4eff]"
            }`}
          >
            {isConnecting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Bluetooth className="w-3.5 h-3.5" />
            )}
            {isConnected ? "DISCONNECT" : isConnecting ? "CONNECTING..." : "CONNECT OBD"}
          </button>
        </div>
      </header>

      {/* Main Container Frame */}
      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto space-y-6">
        
        {/* Quick Identity Section */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6 p-6 glass-card rounded-2xl bg-[#111114] border border-[#2A2A2E]">
          <div className="space-y-1.5 text-left">
            <span className="text-[10px] bg-[#2D5BFF]/10 text-[#2D5BFF] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-[#2D5BFF]/20">
              ACTIVE TELEMETRY PROTOCOL
            </span>
            <div className="flex items-center gap-3">
              <h2 className="font-sans text-2xl font-bold text-white tracking-tight">
                {selectedVehicle.year} {selectedVehicle.brand} {selectedVehicle.model}
              </h2>
              <Car className="w-5 h-5 text-[#8E9299]" />
            </div>
            <div className="flex items-center gap-2 text-[#8E9299] font-mono text-xs">
              <span className="opacity-50 uppercase tracking-widest font-sans font-bold text-[9px]">VIN:</span>
              <span className="text-[#2D5BFF]/90 tracking-widest">{selectedVehicle.vin}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1 bg-[#1A1A1E] border border-[#2A2A2E] rounded-xl p-2.5 text-left">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-[9px] text-[#8E9299] block leading-none font-bold uppercase">Health Rating</span>
                <span className="text-xs font-bold text-white leading-none">
                  {100 - (activeFaults.length * 9) - (telemetryPids.find(p => p.id === "coolant_temp")?.value || 0 > 110 ? 15 : 0)}/100
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsReportOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#2A2A2E] hover:border-[#2D5BFF] text-white bg-[#1A1A1E] active:scale-95 duration-100 text-xs font-bold font-label-caps transition-all"
            >
              <FileText className="w-4 h-4 text-[#2D5BFF]" />
              HEALTH SUMMARY
            </button>
          </div>
        </section>

        {/* Tab Selection Submenu Rails */}
        <section className="flex border-b border-[#2A2A2E] no-scrollbar overflow-x-auto gap-1">
          <button 
            onClick={() => setCurrentTab("home")}
            className={`py-3 px-5 text-xs font-bold font-label-caps tracking-widest uppercase transition-all duration-200 relative whitespace-nowrap flex items-center gap-2 ${
              currentTab === "home" ? "text-[#2D5BFF]" : "text-[#8E9299] hover:text-white"
            }`}
          >
            <Home className="w-4 h-4" /> Cockpit
            {currentTab === "home" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D5BFF] rounded" />}
          </button>

          <button 
            onClick={() => setCurrentTab("live")}
            className={`py-3 px-5 text-xs font-bold font-label-caps tracking-widest uppercase transition-all duration-200 relative whitespace-nowrap flex items-center gap-2 ${
              currentTab === "live" ? "text-[#2D5BFF]" : "text-[#8E9299] hover:text-white"
            }`}
          >
            <Activity className="w-4 h-4" /> Telemetry Dials
            {currentTab === "live" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D5BFF] rounded" />}
          </button>

          <button 
            onClick={() => setCurrentTab("diagnostics")}
            className={`py-3 px-5 text-xs font-bold font-label-caps tracking-widest uppercase transition-all duration-200 relative whitespace-nowrap flex items-center gap-2 ${
              currentTab === "diagnostics" ? "text-[#2D5BFF]" : "text-[#8E9299] hover:text-white"
            }`}
          >
            <Cpu className="w-4 h-4" /> DTC Scan & AI
            {currentTab === "diagnostics" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D5BFF] rounded" />}
          </button>

          <button 
            onClick={() => setCurrentTab("performance")}
            className={`py-3 px-5 text-xs font-bold font-label-caps tracking-widest uppercase transition-all duration-200 relative whitespace-nowrap flex items-center gap-2 ${
              currentTab === "performance" ? "text-[#2D5BFF]" : "text-[#8E9299] hover:text-white"
            }`}
          >
            <Compass className="w-4 h-4" /> Performance Timer
            {currentTab === "performance" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D5BFF] rounded" />}
          </button>

          <button 
            onClick={() => setCurrentTab("trip")}
            className={`py-3 px-5 text-xs font-bold font-label-caps tracking-widest uppercase transition-all duration-200 relative whitespace-nowrap flex items-center gap-2 ${
              currentTab === "trip" ? "text-[#2D5BFF]" : "text-[#8E9299] hover:text-white"
            }`}
          >
            <Sliders className="w-4 h-4" /> Logging & Trips
            {currentTab === "trip" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D5BFF] rounded" />}
          </button>
        </section>

        {/* Dynamic Display Router Layout */}
        <section className="min-h-[460px]">
          
          {/* TAB 1: COCKPIT / HOME DASHBOARD */}
          {currentTab === "home" && (
            <div id="home-dashboard-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in text-left">
              
              {/* Health Score Main Graphic Gauges */}
              <div className="lg:col-span-4 glass-card rounded-2xl p-6 flex flex-col items-center justify-between min-h-[380px] relative overflow-hidden bg-gradient-to-b from-white/3 to-transparent">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider block self-start">INTERACTIVE VEHICLE RECTITUDE</span>
                
                <div className="relative w-52 h-52 flex items-center justify-center my-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" fill="none" r="42" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="6"></circle>
                    <circle 
                      cx="50" 
                      cy="50" 
                      fill="none" 
                      r="42" 
                      stroke="#00daf3" 
                      strokeWidth="6" 
                      strokeDasharray="264"
                      strokeDashoffset={264 - (264 * (100 - activeFaults.length * 12)) / 100}
                      className="transition-all duration-1000 ease-out"
                      style={{ filter: "drop-shadow(0px 0px 8px rgba(0, 218, 243, 0.6))" }}
                    ></circle>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                    <span className="text-4xl font-extrabold text-white glow-text font-mono leading-none">
                      {100 - activeFaults.length * 12}
                    </span>
                    <span className="text-[10px] text-outline uppercase tracking-widest mt-1">RECON CHECK</span>
                  </div>
                </div>

                <div className="flex flex-col items-center space-y-2 w-full pt-2">
                  <div className="flex items-center gap-1.5 px-4 py-1.5 bg-primary/10 border border-primary/25 rounded-full">
                    <span className={`w-2.5 h-2.5 rounded-full ${activeFaults.length > 0 ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-ping"}`} />
                    <span className="text-xs font-semibold text-[#00daf3]">
                      {activeFaults.length > 0 ? "Faults Pending Repair" : "All Sensors Compliance"}
                    </span>
                  </div>
                  <p className="text-[11px] text-outline text-center">
                    {activeFaults.length > 0 
                      ? `${activeFaults.length} diagnostic DTC trouble codes triggered. Standard vehicle operation is restricted.` 
                      : "No warning thresholds breached. Emissions, catalytic, and thermal components are in standard ranges."}
                  </p>
                </div>
              </div>

              {/* Bento Quick-stats Telemetry Panel */}
              <div className="lg:col-span-8 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Battery */}
                  <div className="glass-card p-5 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <Battery className="w-5 h-5 text-[#00daf3]" />
                      <span className="text-[9px] font-mono bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase font-bold">Standard</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-outline font-bold uppercase tracking-wider font-label-caps">BATTERY VOLTAGE</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-bold font-mono text-white">
                          {(telemetryPids.find(p => p.id === "battery_voltage")?.value || 14.1).toFixed(1)}
                        </span>
                        <span className="text-xs text-outline font-bold">V</span>
                      </div>
                    </div>
                  </div>

                  {/* Temperature */}
                  <div className="glass-card p-5 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <Flame className="w-5 h-5 text-orange-400" />
                      <span className="text-[9px] font-mono bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase font-bold">Safe</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-outline font-bold uppercase tracking-wider font-label-caps">COOLANT HEAT</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-bold font-mono text-white">
                          {(telemetryPids.find(p => p.id === "coolant_temp")?.value || 92).toFixed(0)}
                        </span>
                        <span className="text-xs text-outline font-bold">°C</span>
                      </div>
                    </div>
                  </div>

                  {/* Turbo or EV status depending on vehicle */}
                  <div className="glass-card p-5 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <Zap className="w-5 h-5 text-[#00daf3]" />
                      <span className="text-[9px] font-mono bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase font-bold">Linked</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-outline font-bold uppercase tracking-wider font-label-caps">
                        {selectedVehicle.brand === "Toyota" ? "HYBRID SOC" : "TURBO BOOST"}
                      </span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-bold font-mono text-white">
                          {selectedVehicle.brand === "Toyota" 
                            ? (telemetryPids.find(p => p.id === "toyota_hybrid_soc")?.value || 58).toFixed(0)
                            : (telemetryPids.find(p => p.id === "honda_turbo_boost")?.value || 0.2).toFixed(2)
                          }
                        </span>
                        <span className="text-xs text-outline font-bold">
                          {selectedVehicle.brand === "Toyota" ? "%" : "bar"}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Comprehensive Connection and Device Profile panel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Bluetooth OBD-II Adapter Profile Settings */}
                  <div className="glass-card p-5 rounded-2xl text-left space-y-4">
                    <h4 className="text-xs font-bold font-label-caps text-white tracking-widest uppercase">OBD-II BRIDGING CONNECTOR</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] text-outline font-bold uppercase block mb-1">Select Physical Adapter Protocol</span>
                        <select 
                          value={selectedAdapter.id} 
                          onChange={(e) => {
                            const found = ADAPTERS_DATABASE.find(a => a.id === e.target.value);
                            if (found) setSelectedAdapter({ ...found });
                          }}
                          className="w-full bg-surface-container border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-fixed-dim transition-colors"
                        >
                          {ADAPTERS_DATABASE.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-outline leading-5">
                        <div>
                          <strong>Firmware:</strong> {selectedAdapter.firmwareVersion}<br />
                          <strong>CAN Baud:</strong> High speed 500kbps 11bit
                        </div>
                        <div>
                          <strong>Signal:</strong> {selectedAdapter.signalStrength}% (Strong)<br />
                          <strong>Protocols:</strong> {selectedAdapter.supportedProtocols.length} supported
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Multi-vehicle Garage Picker */}
                  <div className="glass-card p-5 rounded-2xl text-left space-y-4">
                    <h4 className="text-xs font-bold font-label-caps text-white tracking-widest uppercase">TARGET VEHICLE CONFIG</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] text-outline font-bold uppercase block mb-1">Pick Probed Vehicle Profile</span>
                        <select
                          value={selectedVehicle.id}
                          onChange={(e) => {
                            const found = garageList.find(c => c.id === e.target.value);
                            if (found) {
                              setSelectedVehicle({ ...found });
                              playSynthesizedBeep(440, 0.15);
                            }
                          }}
                          className="w-full bg-surface-container border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-fixed-dim transition-colors animate-pulse"
                        >
                          {garageList.map(c => (
                            <option key={c.id} value={c.id}>{c.year} - {c.brand} {c.model}</option>
                          ))}
                        </select>
                      </div>

                      <div className="text-[11px] text-outline leading-5">
                        <strong>Engine Block:</strong> {selectedVehicle.engine}<br />
                        <strong>Standard Chassis Mass:</strong> {selectedVehicle.weightKg} kg<br />
                        <strong>Active Database Tuning:</strong> {selectedVehicle.brand === "Honda" ? "Honda K-Series Valve Timing Maps" : selectedVehicle.brand === "Toyota" ? "Toyota Inverter Gate Health Diagnostics" : "Generic OBD-II Parameters"}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Adapter COM Log Console */}
                <div className="glass-card rounded-xl p-4 text-left">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider font-label-caps">SERIAL COMMUNICATON LAYER STATUS</span>
                    <span className="text-[9px] font-mono text-primary flex items-center gap-1">
                      <Clock className="w-3 h-3" /> LIVE OBD LINK
                    </span>
                  </div>
                  <div className="bg-black/30 text-xs font-mono p-3 rounded-lg border border-white/5 h-20 overflow-y-auto space-y-1">
                    {adapterLogs.map((log, index) => (
                      <div key={index} className="text-[10px] text-outline">
                        <span className="text-primary-fixed-dim mr-1">&gt;</span> {log}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: LIVE TELEMETRY DRAG-AND-DROP DIALS (Torque Pro styled customizable widgets) */}
          {currentTab === "live" && (
            <div id="live-data-dashboard" className="space-y-6 animate-fade-in text-left">
              
              {/* Layout controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 glass-card rounded-2xl border-white/5">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Gauge Customization Sandbox & Settings</h4>
                  <p className="text-xs text-outline leading-none font-body-md">
                    Toggle layout edit mode to append, configure, resize, or delete dynamic mechanical monitoring widgets in real-time.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      setIsWidgetEditMode(!isWidgetEditMode);
                      playSynthesizedBeep(700, 0.15);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-label-caps tracking-wider transition-all border ${
                      isWidgetEditMode 
                        ? "bg-amber-400 text-black border-amber-300 shadow-[0_4px_12px_rgba(251,191,36,0.3)]"
                        : "bg-slate-800 text-on-surface hover:bg-slate-700 border-white/10"
                    }`}
                  >
                    {isWidgetEditMode ? "LOCK STAGED LAYOUT" : "CUSTOMIZE GAUGES"}
                  </button>

                  {/* Add Widgets form */}
                  {isWidgetEditMode && (
                    <form onSubmit={handleAddWidget} className="flex flex-wrap gap-2 items-center">
                      <select
                        value={newWidgetPidId}
                        onChange={(e) => setNewWidgetPidId(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                      >
                        {telemetryPids.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>

                      <select
                        value={newWidgetType}
                        onChange={(e) => setNewWidgetType(e.target.value as any)}
                        className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                      >
                        <option value="analog">Analog Sweep Needle</option>
                        <option value="digital">Digital Luminous Grid</option>
                        <option value="circular">Circular Progress Arch</option>
                        <option value="graph">Rolling History Graph</option>
                        <option value="bar">Segmented Load Bar</option>
                        <option value="turbo">Force Induction Dial</option>
                        <option value="thermometer">Thermometer Column</option>
                        <option value="battery">Integrated Cell Pack</option>
                      </select>

                      <button
                        type="submit"
                        className="p-2 rounded-xl bg-primary text-on-primary hover:brightness-110 flex items-center justify-center transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Dynamic responsive grid of widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {garageWidgets.map((widget) => {
                  const pidObj = telemetryPids.find(p => p.id === widget.pidId) || telemetryPids[0];
                  return (
                    <GaugeWidget
                      key={widget.id}
                      pid={pidObj}
                      type={widget.type}
                      isEditMode={isWidgetEditMode}
                      onRemove={() => handleRemoveWidget(widget.id)}
                    />
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 3: DIAGNOSTIC READ DTC, CLEAR DTC & AI INSIGHTS */}
          {currentTab === "diagnostics" && (
            <div id="diagnostics-suite" className="space-y-6 animate-fade-in text-left">
              
              {/* Scanner hardware triggers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Sweep control trigger */}
                <div className="glass-card rounded-2xl p-6 text-left flex flex-col justify-between border-primary/10">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-[#00daf3] tracking-wider uppercase font-label-caps block">ECU FAULT SWEEPER ENGINE</span>
                    <h4 className="text-md font-bold text-white font-headline-sm">Run Core OBD Diagnostic Loop</h4>
                    <p className="text-xs text-outline leading-5">
                      Initiates complete controller scans including K-Line/CAN-Bus modules for Active, Pending, or Permanent vehicle diagnostics failures.
                    </p>
                  </div>

                  <div className="pt-6 space-y-3">
                    {isScanning ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-mono text-primary">
                          <span className="animate-pulse">SCANNING: {scannedModules}</span>
                          <span>{scanProgress}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all duration-150" style={{ width: `${scanProgress}%` }} />
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleScanEcu}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-[#00daf3] font-bold font-label-caps text-xs tracking-widest py-3.5 border border-primary/20 hover:border-primary rounded-xl flex items-center justify-center gap-2 transition-all"
                      >
                        <RefreshCw className="w-4 h-4" />
                        SWEEP SCAN SYSTEM CONTROLLERS
                      </button>
                    )}
                  </div>
                </div>

                {/* MIL Readiness Monitors checklist */}
                <div className="glass-card rounded-2xl p-6 text-left space-y-4 md:col-span-2">
                  <h4 className="text-xs font-bold font-label-caps text-white tracking-widest uppercase">OBD-II SYSTEM READINESS CODES</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/10 text-emerald-400">
                      <span>Misfire Chamber Mon</span>
                      <span className="font-bold">PASSED</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/10 text-emerald-400">
                      <span>Fuel System Trim</span>
                      <span className="font-bold">PASSED</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/10 text-emerald-400">
                      <span>Comprehensive Comp</span>
                      <span className="font-bold">PASSED</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/10 text-emerald-400">
                      <span>Catalyst Heat Chamber</span>
                      <span className="font-bold">PASSED</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-yellow-400/10 border border-yellow-400/10 text-yellow-400">
                      <span>Evaporative Purge Tank</span>
                      <span className="font-bold">UNSUPPORT</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/10 text-red-400">
                      <span>O2 Oxygen Sensor Monitor</span>
                      <span className="font-bold">DTC SET</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* AI Diagnostic interpretation interface widget container */}
              <DiagnosticAIWidget 
                currentVehicle={selectedVehicle} 
                onClearFaults={() => {
                  setActiveFaults([]);
                  playSynthesizedBeep(220, 0.4);
                }}
                activeFaults={activeFaults}
              />

              {/* Render found problems */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">POTENTIAL HARDWARE MALFUNCTIONS DETECTED</span>
                {activeFaults.length === 0 ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                    OBD controller sweeps clean. 0 Diagnostic troubles registered. Ready to trace dynamic performance metrics.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeFaults.map(d => (
                      <div key={d.code} className="p-4 bg-surface-container rounded-xl border border-white/5 space-y-2 relative overflow-hidden">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2 rounded border border-primary/20">{d.code}</span>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            d.severity === "High" ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-orange-500/20 text-orange-400"
                          }`}>{d.severity}</span>
                        </div>
                        <div>
                          <h6 className="text-xs font-bold text-white">{d.category} Controller Fault</h6>
                          <p className="text-[11px] text-outline leading-4 mt-1">{d.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: PERFORMANCE TIMER MONITORS */}
          {currentTab === "performance" && (
            <div id="performance-suite" className="space-y-6 animate-fade-in text-left">
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Start, Stop Speed Timer Sweep controls */}
                <div className="md:col-span-5 glass-card rounded-2xl p-6 flex flex-col justify-between min-h-[380px] bg-gradient-to-br from-white/3 to-transparent relative overflow-hidden">
                  <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary/5 rounded-full blur-[50px]" />
                  
                  <div className="space-y-2 text-left">
                    <span className="text-[10px] font-bold text-[#00daf3] tracking-wider uppercase font-label-caps block">COCKPIT GP CLOCK TIMER</span>
                    <h4 className="text-md font-bold text-white font-headline-sm">0-60mph & Speed Acceleration Gauge</h4>
                    <p className="text-xs text-outline leading-5">
                      Engage launch control simulation to test quarter-mile runs, instant visual RPM/Speed displacement ratios, and estimate horsepower levels in real time.
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center py-6 relative">
                    {/* Glowing circular speedometer metrics */}
                    <div className="text-5xl font-extrabold font-mono text-white tracking-widest glow-text">
                      {perfSpeed.toFixed(0)}<span className="text-sm text-outline ml-1 font-sans font-bold">km/h</span>
                    </div>
                    <div className="text-[10px] text-outline font-mono mt-2">
                      GAP TIME: {perfTimeSec.toFixed(2)}s
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {isPerfTimerRunning ? (
                      <button
                        onClick={() => {
                          setIsPerfTimerRunning(false);
                          playSynthesizedBeep(330, 0.4);
                        }}
                        className="flex-1 bg-red-600 text-white font-bold font-label-caps text-xs tracking-wider py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-[0_4px_15px_rgba(239,68,68,0.3)] transition-all"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        ABORT RUN
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setPerfSpeed(0);
                          setPerfTimeSec(0);
                          setZeroToSixtyMs(null);
                          setZeroToHundredMs(null);
                          setQuarterMileMs(null);
                          setPerfLogs([]);
                          setIsPerfTimerRunning(true);
                          playSynthesizedBeep(880, 0.15);
                        }}
                        className="flex-1 bg-primary text-on-primary font-bold font-label-caps text-xs tracking-wider py-3 rounded-xl flex items-center justify-center gap-1.5 hover:brightness-110 shadow-[0_4px_20px_rgba(0,218,243,0.35)] active:scale-95 transition-all"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        ENGAGE LAUNCH
                      </button>
                    )}
                  </div>
                </div>

                {/* Scoreboards readout */}
                <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Acceleration timers */}
                  <div className="glass-card p-5 rounded-2xl flex flex-col justify-between text-left space-y-4">
                    <span className="text-[10px] font-bold text-[#00daf3] tracking-widest uppercase block">LAUNCH SPLITS REPORT</span>
                    
                    <div className="space-y-3 font-mono">
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span className="text-xs text-outline font-sans">0-60 mph Sprint</span>
                        <span className="text-sm font-bold text-white">
                          {zeroToSixtyMs ? `${zeroToSixtyMs.toFixed(2)}s` : "---"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span className="text-xs text-outline font-sans">0-100 km/h Sprint</span>
                        <span className="text-sm font-bold text-white">
                          {zeroToHundredMs ? `${zeroToHundredMs.toFixed(2)}s` : "---"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-outline font-sans">Quarter-Mile (400m)</span>
                        <span className="text-sm font-bold text-[#00daf3]">
                          {quarterMileMs ? `${quarterMileMs.toFixed(2)}s` : "---"}
                        </span>
                      </div>
                    </div>

                    <p className="text-[10px] text-outline italic">
                      Results depend on simulated engine volumetric coefficients and targeted chassis aerodynamics.
                    </p>
                  </div>

                  {/* Calculated estimation scores */}
                  <div className="glass-card p-5 rounded-2xl flex flex-col justify-between text-left space-y-4">
                    <span className="text-[10px] font-bold text-orange-400 tracking-widest uppercase block">DYNAMIC PERFORMANCE TRIM</span>
                    
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-outline font-bold uppercase block tracking-wider font-label-caps">ESTIMATED ENGINE HORSEPOWER</span>
                        <div className="flex items-baseline gap-1 mt-1 font-mono">
                          <span className="text-3xl font-bold text-white">
                            {isPerfTimerRunning ? (120 + Math.random() * 80).toFixed(0) : estimatedHp}
                          </span>
                          <span className="text-xs text-outline font-bold font-sans">hp</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-outline font-bold uppercase block tracking-wider font-label-caps">DYNAMIC TORQUE INDEX</span>
                        <div className="flex items-baseline gap-1 mt-1 font-mono">
                          <span className="text-3xl font-bold text-white">
                            {isPerfTimerRunning ? (180 + Math.random() * 95).toFixed(0) : estimatedTorque}
                          </span>
                          <span className="text-xs text-outline font-bold font-sans">N·m</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-outline">
                      Calculated using continuous PID Mass Airflow values and dynamic mechanical powertrain drag factors.
                    </p>
                  </div>

                </div>

              </div>

              {/* Graphic element visual trace */}
              <div className="glass-card rounded-2xl p-5 text-left">
                <span className="text-[9px] font-bold text-outline tracking-wider uppercase block mb-3">ACCELERATION G-FORCE CURVE HISTORY</span>
                <div className="h-44 bg-black/40 rounded-xl relative flex items-end p-2 gap-1.5 overflow-hidden">
                  {perfLogs.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-outline">
                      Staged runway clear. Ready to plot telemetry curve.
                    </div>
                  ) : (
                    perfLogs.map((log, index) => (
                      <div 
                        key={index} 
                        className="flex-1 bg-gradient-to-t from-primary/60 to-[#00daf3] rounded"
                        style={{ height: `${(log.speed / 200) * 100}%` }}
                      />
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: INTEGRATED LOG LOGGERS & CO2 COMPUTERS */}
          {currentTab === "trip" && (
            <div id="trip-computer" className="space-y-6 animate-fade-in text-left">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Trip Computer Panel widgets */}
                <div className="glass-card rounded-2xl p-6 text-left space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold font-label-caps text-white tracking-widest uppercase">TRIP COMPUTER ACCRUALS</h4>
                    <button
                      onClick={() => {
                        setIsTripLogging(!isTripLogging);
                        playSynthesizedBeep(650, 0.1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        isTripLogging ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-outline border border-white/5"
                      }`}
                    >
                      {isTripLogging ? "LOGGING IN PROGRESS" : "RESUME LOGS"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 font-mono">
                    <div className="p-3 bg-black/20 rounded-xl">
                      <span className="text-[9px] text-outline font-sans font-bold uppercase">DISTANCE TRAVELLED</span>
                      <p className="text-xl font-bold text-white mt-0.5">{tripStats.distanceKm.toFixed(2)} km</p>
                    </div>
                    <div className="p-3 bg-black/20 rounded-xl">
                      <span className="text-[9px] text-outline font-sans font-bold uppercase">AVG ECONOMY</span>
                      <p className="text-xl font-bold text-white mt-0.5">{tripStats.avgFuelEconomyL100.toFixed(1)} L/100</p>
                    </div>
                    <div className="p-3 bg-black/20 rounded-xl">
                      <span className="text-[9px] text-outline font-sans font-bold uppercase">TRIP COST ESTIMATE</span>
                      <p className="text-xl font-bold text-[#00daf3] mt-0.5">${tripStats.tripCostUsd.toFixed(2)} USD</p>
                    </div>
                    <div className="p-3 bg-black/20 rounded-xl">
                      <span className="text-[9px] text-outline font-sans font-bold uppercase">CARBON FOOTPRINT CO2</span>
                      <p className="text-xl font-bold text-white mt-0.5">{tripStats.co2Kg.toFixed(3)} kg</p>
                    </div>
                  </div>

                  <div className="text-[11px] text-outline leading-5 block pt-2">
                    <strong>Driving Duration:</strong> {Math.floor(tripStats.drivingTimeSec / 60)}m {tripStats.drivingTimeSec % 60}s<br />
                    <strong>Idle Station Time:</strong> {Math.floor(tripStats.idleTimeSec / 60)}m {tripStats.idleTimeSec % 60}s
                  </div>
                </div>

                {/* Advanced Sensor Logger System */}
                <div className="glass-card rounded-2xl p-6 text-left space-y-4">
                  <h4 className="text-xs font-bold font-label-caps text-white tracking-widest uppercase">ADVANCED FILE LOGGER CONTROL</h4>
                  <p className="text-xs text-outline leading-5">
                    Records specified telemetry indexes coordinates continuously for export to compliant CSV, JSON, or Excel systems.
                  </p>

                  <div className="p-4 bg-black/20 rounded-xl space-y-3">
                    <span className="text-[9px] text-outline font-bold uppercase block">ACTIVE TARGET EXPORT MATRICES</span>
                    <div className="flex gap-2 flex-wrap">
                      <span className="px-2 py-1 bg-[#00daf3]/10 border border-[#00daf3]/20 rounded text-[9px] text-[#00daf3] font-mono uppercase">TIME STAMPS</span>
                      <span className="px-2 py-1 bg-[#00daf3]/10 border border-[#00daf3]/20 rounded text-[9px] text-[#00daf3] font-mono uppercase">GPS LAT/LONG</span>
                      <span className="px-2 py-1 bg-[#00daf3]/10 border border-[#00daf3]/20 rounded text-[9px] text-[#00daf3] font-mono uppercase">SENSOR TELEMETRY</span>
                      <span className="px-2 py-1 bg-[#00daf3]/10 border border-[#00daf3]/20 rounded text-[9px] text-[#00daf3] font-mono uppercase">VELOCITY DEVIANCES</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleExportAdvancedLogs("json")}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-on-surface text-center font-bold font-label-caps text-xs py-3.5 rounded-xl border border-white/5 transition-colors"
                    >
                      EXPORT TO JSON
                    </button>
                    <button
                      onClick={() => handleExportAdvancedLogs("csv")}
                      className="flex-1 bg-primary text-on-primary text-center font-bold font-label-caps text-xs py-3.5 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_4px_15px_rgba(0,195,255,0.25)]"
                    >
                      DOWNLOAD SPREADSHEET CSV
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

        </section>

        {/* Global Warnings thresholds setups pane (Material Design 3 config) */}
        <section id="system-alerts-assembly" className="glass-card rounded-2xl p-6 text-left space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Bell className="w-4.5 h-4.5 text-primary" />
              <h4 className="text-xs font-bold font-label-caps text-white tracking-widest uppercase">COCKPIT CRITICAL LEVEL THRESHOLDS</h4>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {alerts.map((alertItem) => (
              <div key={alertItem.id} className="p-4 bg-black/25 border border-white/5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-outline font-bold uppercase block">{alertItem.name.split(" ")[1]} BOUNDARY</span>
                  <span className="text-xs font-semibold text-white mt-1 block">
                    {alertItem.thresholdType === "above" ? ">" : "<"} {alertItem.value} {alertItem.pidId === "battery_voltage" ? "V" : alertItem.pidId === "honda_turbo_boost" ? "bar" : "°C"}
                  </span>
                </div>
                
                <button
                  onClick={() => {
                    setAlerts(prev => prev.map(a => a.id === alertItem.id ? { ...a, enabled: !a.enabled } : a));
                    playSynthesizedBeep(500, 0.1);
                  }}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold font-label-caps transition-all ${
                    alertItem.enabled 
                      ? "bg-primary/10 text-primary border border-primary/25" 
                      : "bg-slate-850 text-outline border border-white/5 opacity-50"
                  }`}
                >
                  {alertItem.enabled ? "ACTIVE" : "MUTED"}
                </button>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Floating Action Quick-Search Button */}
      <button 
        type="button"
        title="Generate System Report Modal"
        onClick={() => setIsReportOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-[0_8px_32px_rgba(0,229,255,0.4)] hover:scale-105 active:scale-95 transition-all z-30"
      >
        <FileText className="w-6 h-6 text-black" />
      </button>

      {/* Full printable health report modal overlay */}
      <HealthReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        vehicle={selectedVehicle}
        pids={telemetryPids}
        dtcs={activeFaults}
      />

    </div>
  );
}
