import React, { useState, useEffect } from "react";
import { PIDData, GaugeType } from "../types";
import { Zap } from "lucide-react";

interface GaugeWidgetProps {
  key?: React.Key;
  pid: PIDData;
  type: GaugeType;
  onRemove?: () => void;
  isEditMode?: boolean;
}

export default function GaugeWidget({ pid, type, onRemove, isEditMode = false }: GaugeWidgetProps) {
  const [history, setHistory] = useState<number[]>(Array(40).fill(pid.value));
  const maxHistoryLength = 50;

  // Track values for the rolling graph
  useEffect(() => {
    setHistory((prev) => {
      const next = [...prev, pid.value];
      if (next.length > maxHistoryLength) {
        next.shift();
      }
      return next;
    });
  }, [pid.value]);

  // Calculations for SVGs
  const percentage = Math.min(100, Math.max(0, ((pid.value - pid.min) / (pid.max - pid.min)) * 100));
  
  // Render subcomponents based on selected gauge view
  return (
    <div id={`gauge-id-${pid.id}`} className="relative bg-[#111114] border border-[#2A2A2E] rounded-xl p-4 flex flex-col justify-between h-48 group hover:border-[#2D5BFF] transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
      
      {/* Widget Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="text-left">
          <span className="text-[10px] font-bold text-[#8E9299] uppercase tracking-wider block">
            {pid.category} OBD-II
          </span>
          <h5 className="text-xs font-semibold text-[#E0E0E0] truncate max-w-[130px]" title={pid.name}>
            {pid.name}
          </h5>
        </div>
        
        {isEditMode ? (
          <button 
            type="button"
            onClick={onRemove}
            className="text-red-500 hover:bg-red-500/10 p-1 rounded-md transition-colors duration-150 active:scale-95 text-xs font-bold font-label-caps"
            title="Remove widget"
          >
            REMOVE
          </button>
        ) : (
          <span className="text-[10px] bg-[#2D5BFF]/10 text-[#2D5BFF] px-1.5 py-0.5 rounded font-mono border border-[#2D5BFF]/20">
            {pid.unit}
          </span>
        )}
      </div>

      {/* Widget Core Graphic Body */}
      <div className="flex-1 flex items-center justify-center relative w-full h-[150px] overflow-hidden">
        {type === "analog" && (
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Curved Gauge with needle */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background Arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                 fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="6"
                strokeDasharray="188 283"
                strokeLinecap="round"
              />
              {/* Active Valued Arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="url(#blueGlowGrad)"
                strokeWidth="6"
                strokeDasharray={`${(188 * percentage) / 100} 283`}
                strokeLinecap="round"
                className="transition-all duration-200"
              />
              <defs>
                <linearGradient id="blueGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2D5BFF" />
                  <stop offset="100%" stopColor="#00E676" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
              <span className="text-lg font-bold font-mono text-[#E0E0E0] leading-none">
                {typeof pid.value === "number" ? pid.value.toFixed(pid.id.includes("voltage") || pid.id.includes("knock") ? 1 : 0) : pid.value}
              </span>
              <span className="text-[9px] text-[#8E9299] uppercase font-bold tracking-widest leading-none mt-1">{pid.unit}</span>
            </div>
            {/* Center hub */}
            <div className="absolute bottom-[38px] left-[52px] w-2 h-2 rounded-full bg-[#2D5BFF]"></div>
            {/* Visual needle line */}
            <div 
              className="absolute bottom-12 w-1 h-10 bg-gradient-to-t from-[#2D5BFF] to-[#00E676] origin-bottom rounded-full transition-all duration-150 ease-out"
              style={{
                transform: `rotate(${(percentage * 2.4) - 120}deg)`,
                boxShadow: "0 0 8px rgba(45, 91, 255, 0.8)",
                left: "calc(50% - 2px)",
                bottom: "calc(50% - 4px)",
              }}
            ></div>
          </div>
        )}

        {type === "digital" && (
          <div className="flex flex-col items-center justify-center space-y-1">
            <div className="relative pt-1 px-4 py-2 bg-black/40 border border-[#2A2A2E] rounded-xl">
              <span className="text-2xl font-bold font-mono text-[#2D5BFF] tracking-widest">
                {typeof pid.value === "number" ? pid.value.toFixed(pid.id.includes("voltage") || pid.id.includes("knock") ? 2 : 1) : pid.value}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-[#8E9299]">RANGE: {pid.min} - {pid.max}</span>
            </div>
          </div>
        )}

        {type === "circular" && (
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="-rotate-90 w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="5"
              />
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="url(#blueGlowGrad)"
                strokeWidth="5"
                strokeDasharray="239"
                strokeDashoffset={239 - (239 * percentage) / 100}
                className="transition-all duration-200"
                strokeLinecap="round"
                style={{ filter: "drop-shadow(0px 0px 4px rgba(45, 91, 255, 0.3))" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold font-mono text-[#E0E0E0]">
                {pid.value.toFixed(0)}
              </span>
              <span className="text-[9px] text-[#8E9299] font-bold uppercase">{pid.unit}</span>
            </div>
          </div>
        )}

        {type === "graph" && (
          <div className="w-full h-24 flex flex-col justify-end">
            <div className="flex justify-between text-[9px] text-[#8E9299] mb-1 w-full px-1">
              <span>MAX: {pid.max}</span>
              <span>MIN: {pid.min}</span>
            </div>
            {/* Visual SVG line trace */}
            <svg className="w-full h-16 bg-black/20 rounded-lg overflow-hidden flex" viewBox="0 0 100 40" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradCell" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2D5BFF" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#2D5BFF" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d={`M ${history.map((val, idx) => {
                  const x = (idx / (maxHistoryLength - 1)) * 100;
                  const valPercent = ((val - pid.min) / (pid.max - pid.min)) * 100;
                  const y = Math.max(2, 38 - (valPercent * 36) / 100);
                  return `${x} ${y}`;
                }).join(" L ")}`}
                fill="none"
                stroke="#2D5BFF"
                strokeWidth="1.5"
                className="transition-all duration-150"
              />
              {/* Colored fill boundary */}
              <path
                d={`M 0 40 L ${history.map((val, idx) => {
                  const x = (idx / (maxHistoryLength - 1)) * 100;
                  const valPercent = ((val - pid.min) / (pid.max - pid.min)) * 100;
                  const y = Math.max(2, 38 - (valPercent * 36) / 100);
                  return `${x} ${y}`;
                }).join(" L ")} L 100 40 Z`}
                fill="url(#chartGradCell)"
                className="transition-all duration-150"
              />
            </svg>
          </div>
        )}

        {type === "bar" && (
          <div className="w-full px-2 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] text-[#8E9299]">0%</span>
              <span className="text-lg font-bold font-mono text-[#2D5BFF]">{pid.value.toFixed(0)}{pid.unit}</span>
              <span className="text-[10px] text-[#8E9299]">100%</span>
            </div>
            <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden border border-[#2A2A2E] p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-[#2D5BFF] to-[#00E676] rounded-full transition-all duration-200 relative"
                style={{ width: `${percentage}%` }}
              >
                {/* Visual ripple pulse inside */}
                <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/60 rounded-full animate-ping"></div>
              </div>
            </div>
            <div className="flex justify-between text-[9px] text-[#8E9299]">
              <span>LIMIT: {pid.min}</span>
              <span>LIMIT: {pid.max}</span>
            </div>
          </div>
        )}

        {type === "turbo" && (
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Boost Pressure circular track */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8"/>
              <circle 
                cx="50" 
                cy="50" 
                r="38" 
                fill="none" 
                stroke={pid.value > 1.2 ? "#D50000" : "#2D5BFF"} 
                strokeWidth="8"
                strokeDasharray="239"
                strokeDashoffset={239 - (239 * percentage) / 100}
                className="transition-all duration-150"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Zap className={`w-4 h-4 mb-0.5 ${pid.value > 1.2 ? "text-red-500 animate-pulse" : "text-[#2D5BFF]"}`}/>
              <span className="text-lg font-bold font-mono text-[#E0E0E0] leading-none">
                {pid.value.toFixed(2)}
              </span>
              <span className="text-[8px] text-[#8E9299] uppercase font-mono tracking-widest leading-none mt-1">BAR BOOST</span>
            </div>
          </div>
        )}

        {type === "thermometer" && (
          <div className="w-full flex items-center justify-center gap-4 px-2">
            {/* Visual Glass Thermometer Column */}
            <div className="h-20 w-4 bg-black/40 border border-[#2A2A2E] rounded-full p-0.5 flex flex-col justify-end relative">
              <div 
                className={`w-full rounded-full transition-all duration-300 ${
                  pid.value > 105 ? "bg-[#D50000]" : pid.value > 95 ? "bg-[#FF9100]" : "bg-[#2D5BFF]"
                }`}
                style={{ height: `${percentage}%` }}
              ></div>
              {/* Bottom Thermometer Bulb */}
              <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border border-[#2A2A2E] ${
                pid.value > 105 ? "bg-[#D50000]" : pid.value > 95 ? "bg-[#FF9100]" : "bg-[#2D5BFF]"
              }`}></div>
            </div>
            
            <div className="space-y-1 text-left pt-2">
              <div className="text-2xl font-bold font-mono text-[#E0E0E0]">
                {pid.value.toFixed(0)}<span className="text-[#8E9299] text-sm">°C</span>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                pid.value > 105 ? "bg-[#D50000]/20 text-red-400" : pid.value > 95 ? "bg-[#FF9100]/20 text-[#FF9100]" : "bg-[#2D5BFF]/20 text-[#2D5BFF]"
              }`}>
                {pid.value > 105 ? "CRITICAL" : pid.value > 95 ? "HIGH" : "NORMAL"}
              </span>
            </div>
          </div>
        )}

        {type === "battery" && (
          <div className="w-full flex flex-col items-center space-y-2">
            <div className="flex items-center gap-2">
              {/* Battery cell silhouette */}
              <div className="w-16 h-8 border-2 border-[#2A2A2E] rounded-lg relative p-0.5 flex overflow-hidden">
                <div 
                  className={`h-full rounded-sm transition-all duration-300 ${
                    pid.value < 11.8 ? "bg-[#D50000]" : pid.value < 12.5 ? "bg-[#FF9100]" : "bg-[#00E676]"
                  }`}
                  style={{ width: `${percentage}%` }}
                ></div>
                {/* positive terminal cap */}
                <div className="absolute top-1/2 -translate-y-1/2 right-0 w-1.5 h-3 bg-[#2A2A2E] rounded-r-xs"></div>
              </div>
              <div className="text-xl font-bold font-mono text-[#E0E0E0]">
                {pid.value.toFixed(1)}<span className="text-xs text-[#8E9299] font-normal">V</span>
              </div>
            </div>
            <div className="text-[10px] text-[#8E9299] text-center">
              {pid.value < 12.0 ? "Discharged (Engine Off)" : pid.value < 13.5 ? "Good Capacity" : "Charging (Alternator)"}
            </div>
          </div>
        )}
      </div>

      {/* Widget Description Footer */}
      <p className="text-[9px] text-[#8E9299] italic text-left pb-0.5 line-clamp-1 group-hover:line-clamp-none select-none bg-black/10 rounded pointer-events-none transition-all">
        {pid.description}
      </p>
    </div>
  );
}
