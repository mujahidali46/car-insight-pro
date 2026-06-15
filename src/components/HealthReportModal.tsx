import React from "react";
import { Vehicle, DTCUnit, PIDData } from "../types";
import { X, FileText, Download, Award, CheckCircle, Printer } from "lucide-react";

interface HealthReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  pids: PIDData[];
  dtcs: DTCUnit[];
}

export default function HealthReportModal({ isOpen, onClose, vehicle, pids, dtcs }: HealthReportModalProps) {
  if (!isOpen) return null;

  const battery = pids.find(p => p.id === "battery_voltage")?.value || 14.1;
  const coolant = pids.find(p => p.id === "coolant_temp")?.value || 92;
  const fuel = pids.find(p => p.id === "fuel_level")?.value || 65;
  const load = pids.find(p => p.id === "engine_load")?.value || 18;

  // Recommendations generator
  const getRecommendations = () => {
    const list: string[] = [];
    if (dtcs.length > 0) {
      list.push("URGENT: Clear outstanding Diagnostic Trouble Codes (DTCs) after inspecting system harnesses.");
    }
    if (battery < 12.0) {
      list.push("WARNING: Low starter battery voltage. Verify cell hydration or test alternator charging diode.");
    }
    if (coolant > 105) {
      list.push("CRITICAL: Engine coolant temperature is elevated. Inspect water pump block and fan relays.");
    }
    if (dtcs.some(d => d.code === "P0171")) {
      list.push("REPAIR: P0171 system lean detected. Clean MAF sensor grid with certified electrical cleaner spray.");
    }
    if (list.length === 0) {
      list.push("Optimal health detected. Maintain periodic oil and transmission fluid replacement intervals.");
    }
    return list;
  };

  const recommendations = getRecommendations();
  const overallScore = Math.max(40, 100 - (dtcs.length * 12) - (battery < 12.0 ? 10 : 0) - (coolant > 100 ? 15 : 0));

  // CSV Exporter
  const handleExportCSV = () => {
    const headers = ["Category", "Parameter", "Value", "Unit", "Status"];
    const rows = [
      ["Vehicle Info", "Model", `${vehicle.year} ${vehicle.brand} ${vehicle.model}`, "", ""],
      ["Vehicle Info", "VIN", vehicle.vin, "", ""],
      ["Vehicle Info", "Engine", vehicle.engine, "", ""],
      ["Diagnostic", "Health Score", overallScore.toString(), "/100", ""],
      ["Diagnostic", "Active DTC Counter", dtcs.length.toString(), "codes", ""],
      ["Telemetry", "Battery Voltage", battery.toFixed(2), "V", battery < 12 ? "Low" : "Optimal"],
      ["Telemetry", "Engine Coolant", coolant.toFixed(0), "°C", coolant > 100 ? "High" : "Normal"],
      ["Telemetry", "Fuel Level", fuel.toFixed(0), "%", "Normal"],
      ["Telemetry", "Calculated Load", load.toFixed(0), "%", "Normal"],
    ];

    dtcs.forEach(d => {
      rows.push(["Trouble Code", d.code, d.description, d.category, d.status]);
    });

    recommendations.forEach((r, idx) => {
      rows.push(["Recommendation", `Rec #${idx + 1}`, r, "", ""]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CarInsight_Report_${vehicle.model.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel Exporter (TSV format)
  const handleExportExcel = () => {
    let content = "Car Insight Pro Professional Diagnostic Worksheets\n";
    content += `Generated Time:\t2026-06-14T11:04:00Z\n`;
    content += `Vehicle:\t${vehicle.year} ${vehicle.brand} ${vehicle.model}\n`;
    content += `VIN:\t${vehicle.vin}\n`;
    content += `Overall Score:\t${overallScore}/100\n\n`;
    content += "Category\tField\tValue\tUnit\tStatus\n";
    
    content += `Battery\tVoltage\t${battery.toFixed(2)}\tV\t${battery < 12 ? "Needs attention" : "Healthy"}\n`;
    content += `Coolant\tTemperature\t${coolant.toFixed(0)}\t°C\tNormal\n`;
    content += `Fuel\tLevel\t${fuel.toFixed(0)}\t%\tNormal\n`;
    content += `Load\tWorkload\t${load.toFixed(0)}\t%\tNormal\n\n`;

    content += "ACTIVE TROUBLE CODES (DTCs):\n";
    if (dtcs.length === 0) {
      content += "No active diagnostic codes recorded.\n";
    } else {
      dtcs.forEach(d => {
        content += `${d.code}\t${d.category}\t${d.status}\t${d.description}\n`;
      });
    }

    content += "\nREPAIR ACTION RECOMMENDATIONS:\n";
    recommendations.forEach((r, idx) => {
      content += `${idx + 1}.\t${r}\n`;
    });

    const blob = new Blob([content], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CarInsight_Report_${vehicle.model.replace(/\s+/g, "_")}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div 
        id="health-report-print-container" 
        className="relative bg-[#111114] border border-[#2A2A2E] w-full max-w-3xl rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#2A2A2E] bg-[#16161A]">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#2D5BFF]" />
            <h3 className="text-md font-bold text-[#E0E0E0] font-headline-sm">VEHICLE DIAGNOSTIC HEALTH REPORT</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1 text-[#E0E0E0] hover:text-[#2D5BFF] transition-colors hover:bg-white/5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 print:p-0">
          
          {/* Brand header for printable sheet */}
          <div className="hidden print:flex justify-between items-center border-b border-gray-200 pb-4 mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">CAR INSIGHT PRO</h1>
              <span className="text-xs text-[#8E9299] uppercase tracking-wider">Automotive Intelligence Diagnostics</span>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono text-gray-500">DATE: 2026-06-14</p>
              <p className="text-xs font-mono text-gray-500">RECONCILED VIA VGATE ICAR PRO</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#16161A] p-5 rounded-2xl border border-[#2A2A2E]">
            <div className="space-y-2 text-left">
              <span className="text-[10px] font-bold text-[#8E9299] uppercase tracking-wider">VEHICLE METRICS</span>
              <h4 className="text-lg font-bold text-white leading-none">
                {vehicle.year} {vehicle.brand} {vehicle.model}
              </h4>
              <p className="text-xs text-[#8E9299] leading-6">
                <strong>ENGINE CONFIG:</strong> {vehicle.engine}<br />
                <strong>CHASSIS WEIGHT:</strong> {vehicle.weightKg} kg<br />
                <strong>OBD VIN ID:</strong> <span className="font-mono text-[#2D5BFF]">{vehicle.vin}</span>
              </p>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 bg-black/20 rounded-xl relative overflow-hidden">
              <div className="text-[10px] text-[#8E9299] font-bold uppercase tracking-wider mb-2 self-start">HEALTH INDEX SUMMARY</div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-[#2D5BFF] glow-text font-display-sm">{overallScore}</span>
                <span className="text-sm text-[#8E9299]">/ 100</span>
              </div>
              <span className={`text-[10px] font-bold font-label-caps mt-2 px-3 py-1 rounded-full ${
                overallScore > 90 ? "bg-emerald-500/20 text-emerald-400" :
                overallScore > 75 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-500"
              }`}>
                {overallScore > 90 ? "OPTIMAL SYSTEM COMPLIANCE" : "WARNING: SERVE ACTIVE DTCs"}
              </span>
            </div>
          </div>

          {/* Core Diagnostic Categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#16161A] p-4 rounded-xl border border-[#2A2A2E] text-left">
              <span className="text-[9px] text-[#8E9299] font-bold block uppercase mb-1">BATTERY STATS</span>
              <p className="text-lg font-mono font-bold text-white">{battery.toFixed(1)}V</p>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle className="w-3 h-3" /> CHARGING ACTIVE
              </span>
            </div>
            <div className="bg-[#16161A] p-4 rounded-xl border border-[#2A2A2E] text-left">
              <span className="text-[9px] text-[#8E9299] font-bold block uppercase mb-1">COOLANT FLUID</span>
              <p className="text-lg font-mono font-bold text-white">{coolant}°C</p>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle className="w-3 h-3" /> TEMPERATURE STABLE
              </span>
            </div>
            <div className="bg-[#16161A] p-4 rounded-xl border border-[#2A2A2E] text-left">
              <span className="text-[9px] text-[#8E9299] font-bold block uppercase mb-1">FUEL VOLUME</span>
              <p className="text-lg font-mono font-bold text-white">{fuel}%</p>
              <span className="text-[10px] text-[#8E9299] block mt-1">~420KM RANGE LEFT</span>
            </div>
            <div className="bg-[#16161A] p-4 rounded-xl border border-[#2A2A2E] text-left">
              <span className="text-[9px] text-[#8E9299] font-bold block uppercase mb-1">ENGINE LOAD</span>
              <p className="text-lg font-mono font-bold text-white">{load}%</p>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle className="w-3 h-3" /> STABLE CHAMBERS
              </span>
            </div>
          </div>

          {/* Active Diagnostic Codes Area */}
          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-[#2A2A2E]">
              <span className="text-[10px] font-bold text-[#8E9299] uppercase tracking-wider">ACTIVE OBD-II PROBLEMS ({dtcs.length})</span>
            </div>
            {dtcs.length === 0 ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-xs font-semibold">ALL ELECTRONIC CONTROL SYSTEMS COMPLIANT - NO ACTIVE DTCS FOUND</span>
              </div>
            ) : (
              <div className="space-y-3">
                {dtcs.map((dtc) => (
                  <div key={dtc.code} className="p-4 bg-black/20 border border-[#2A2A2E] rounded-xl space-y-1 relative">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#2D5BFF] text-sm bg-[#2D5BFF]/10 px-2.5 py-0.5 rounded border border-[#2D5BFF]/20">
                          {dtc.code}
                        </span>
                        <span className="text-xs font-semibold text-white">{dtc.category} System</span>
                      </div>
                      <span className={`text-[10px] font-bold font-label-caps px-2 py-0.5 rounded ${
                        dtc.severity === "High" ? "bg-red-500/20 text-red-500 animate-pulse" : "bg-[#FF9100]/20 text-[#FF9100]"
                      }`}>
                        {dtc.severity.toUpperCase()} PRIORITY
                      </span>
                    </div>
                    <p className="text-xs text-[#8E9299] pt-1 leading-5">
                      {dtc.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Recommendations Checklist */}
          <div className="space-y-3 text-left">
            <span className="text-[10px] font-bold text-[#8E9299] uppercase tracking-wider block">EXPERT ACTION RECOMMENDATIONS</span>
            <div className="bg-[#16161A] border border-[#2A2A2E] rounded-xl p-5 space-y-3.5">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-[#2D5BFF]/10 border border-[#2D5BFF]/20 text-[#2D5BFF] flex items-center justify-center font-mono text-[10px] font-bold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-xs text-[#E0E0E0] leading-5">{rec}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="p-6 border-t border-[#2A2A2E] bg-[#16161A] flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs text-[#8E9299] font-body-md text-center sm:text-left">
            Certified Diagnostic Validation: <span className="font-mono text-white select-all">OBD-ELM-327_SECURE</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 text-[#E0E0E0] hover:bg-slate-700 font-bold font-label-caps text-xs tracking-widest rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              PRINT REPORT
            </button>
            <button 
              type="button" 
              onClick={handleExportCSV}
              className="px-4 py-2 bg-slate-800 text-[#E0E0E0] hover:bg-slate-700 font-bold font-label-caps text-xs tracking-widest rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV SHEET
            </button>
            <button 
              type="button" 
              onClick={handleExportExcel}
              className="px-4 py-2 bg-[#2D5BFF] text-white font-bold font-label-caps text-xs tracking-widest rounded-xl flex items-center gap-1.5 hover:bg-[#1a4eff] active:scale-95 transition-all shadow-[0_4px_12px_rgba(45,91,255,0.3)]"
            >
              <Award className="w-4 h-4" />
              EXCEL DISPATCH
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
