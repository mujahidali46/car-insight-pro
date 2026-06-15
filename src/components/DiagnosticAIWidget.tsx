import React, { useState } from "react";
import { Vehicle, DTCUnit } from "../types";
import { Sparkles, Loader2, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";

interface DiagnosticAIWidgetProps {
  currentVehicle: Vehicle;
  onClearFaults: () => void;
  activeFaults: DTCUnit[];
}

export default function DiagnosticAIWidget({ currentVehicle, onClearFaults, activeFaults }: DiagnosticAIWidgetProps) {
  const [selectedDtc, setSelectedDtc] = useState<string>("P0171");
  const [symptoms, setSymptoms] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    code: string;
    severity: string;
    summary: string;
    possibleCauses: string[];
    recommendedSteps: string[];
    analysis?: string;
    aiGroundingNotes?: string;
  } | null>(null);

  const handleAIDiagnosis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/analyze-dtc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dtcCode: selectedDtc,
          vehicleName: `${currentVehicle.year} ${currentVehicle.brand} ${currentVehicle.model}`,
          symptoms: symptoms || "Scanned during dynamic multi-system ECU health check."
        })
      });

      if (!response.ok) {
        throw new Error("Diagnostic server returned error state.");
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err: any) {
      setError(err.message || "Unable to run Gemini AI diagnostics. Please check standard connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="ai-diagnostic-assembly" className="bg-[#111114] border border-[#2A2A2E] rounded-xl p-6 relative overflow-hidden space-y-6 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#2D5BFF]/5 rounded-full blur-[60px]" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2A2A2E]">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#2D5BFF]" />
            <h4 className="text-lg font-bold text-[#E0E0E0]">Car Insight AI Diagnostic Assistant</h4>
          </div>
          <p className="text-xs text-[#8E9299] mt-1 font-body-md">
            Advanced neural-network fault interpreter cross-correlating manufacturer codes and dynamic symptoms.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={onClearFaults}
            className="px-4 py-2 border border-red-500/20 text-red-500 bg-red-500/5 hover:bg-red-500/10 active:scale-95 transition-all text-xs font-bold font-label-caps rounded-xl"
          >
            CLEAR VEHICLE DTCs
          </button>
        </div>
      </div>

      {/* Input panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-[#8E9299] uppercase tracking-wider mb-1 text-left">
              TARGET OBD-II TROUBLE CODE (DTC)
            </label>
            <div className="flex gap-2">
              <select
                value={selectedDtc}
                onChange={(e) => setSelectedDtc(e.target.value)}
                className="flex-1 bg-[#16161A] border border-[#2A2A2E] rounded-xl px-4 py-2 text-sm text-[#E0E0E0] focus:outline-none focus:border-[#2D5BFF] transition-colors"
              >
                <option value="P0113">P0113 - Intake Air Temperature Circuit High</option>
                <option value="P0171">P0171 - Fuel System Too Lean (Bank 1)</option>
                <option value="P0300">P0300 - Random/Multiple Misfire Detected</option>
                <option value="P0420">P0420 - Catalytic System Below Threshold</option>
                <option value="P2563">P2563 - VGT Turbo Actuator Sensor Range</option>
                <option value="C0040">C0040 - Wheel Speed Sensor Malfunction</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#8E9299] uppercase tracking-wider mb-1 text-left">
              AMBINET VEHICLE SYMPTOMS & NOTES (OPTIONAL)
            </label>
            <textarea
              placeholder="E.g., Rough idling, hesitation on acceleration, check engine light blinking, exhaust smells rich..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={3}
              className="w-full bg-[#16161A] border border-[#2A2A2E] rounded-xl px-4 py-3 text-sm text-[#E0E0E0] placeholder:text-[#8E9299]/50 focus:outline-none focus:border-[#2D5BFF] transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={handleAIDiagnosis}
            disabled={loading}
            className="w-full bg-[#2D5BFF] text-white font-bold font-label-caps text-xs tracking-widest py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#1a4eff] active:scale-95 disabled:opacity-50 transition-all shadow-[0_4px_20px_rgba(45,91,255,0.2)]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                GENERATING RECONCILED DIAGNOSIS...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-current text-[#00E676]" />
                RUN CODES MODEL ANALYSIS
              </>
            )}
          </button>
        </div>

        {/* Dynamic Display Panel */}
        <div className="bg-black/30 border border-[#2A2A2E] rounded-2xl p-5 min-h-[220px] flex flex-col justify-between">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 py-8">
              <Loader2 className="w-8 h-8 text-[#2D5BFF] animate-spin" />
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-[#2D5BFF] tracking-wider animate-pulse">CONNECTING INTEL ENGINE</p>
                <p className="text-[10px] text-[#8E9299]">Cross-referencing technical service bulletins...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center space-y-2 text-center text-red-500 py-8">
              <AlertTriangle className="w-8 h-8 opacity-70 text-red-500" />
              <p className="text-xs font-bold font-label-caps text-red-500">DIAGNOSTIC CHANNEL OFFLINE</p>
              <p className="text-[10px] text-[#8E9299] max-w-sm">{error}</p>
            </div>
          ) : analysisResult ? (
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-mono font-bold text-[#2D5BFF] bg-[#2D5BFF]/10 px-2.5 py-0.5 rounded border border-[#2D5BFF]/20">
                      {analysisResult.code}
                    </span>
                    <span className={`text-[9px] font-bold font-label-caps px-2 py-0.5 rounded ${
                      analysisResult.severity === "High" ? "bg-red-500/20 text-red-400" :
                      analysisResult.severity === "Moderate" ? "bg-[#FF9100]/20 text-[#FF9100]" : "bg-[#00E676]/20 text-[#00E676]"
                    }`}>
                      {analysisResult.severity.toUpperCase()} SEVERITY
                    </span>
                  </div>
                  <h6 className="text-xs font-bold font-body-lg text-[#E0E0E0] mt-2 leading-tight">
                    {analysisResult.summary}
                  </h6>
                </div>
              </div>

              {/* Collapsible causes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-[#2A2A2E]">
                <div>
                  <span className="text-[9px] font-bold text-[#8E9299] uppercase tracking-wider">POSSIBLE FAULT CAUSES</span>
                  <ul className="mt-1 space-y-1 list-disc list-inside text-[11px] text-[#8E9299]">
                    {analysisResult.possibleCauses.slice(0, 4).map((cause, idx) => (
                      <li key={idx} className="truncate text-[#E0E0E0]" title={cause}>{cause}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#8E9299] uppercase tracking-wider">NEXT REPAIR ACTIONS</span>
                  <ul className="mt-1 space-y-1 list-decimal list-inside text-[11px] text-[#8E9299]">
                    {analysisResult.recommendedSteps.slice(0, 4).map((step, idx) => (
                      <li key={idx} className="truncate text-[#E0E0E0]" title={step}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {analysisResult.aiGroundingNotes && (
                <div className="p-2.5 bg-[#2D5BFF]/5 border border-[#2D5BFF]/10 rounded-xl text-[10px] text-[#2D5BFF]/95 mt-2">
                  <div className="flex gap-1.5 items-start">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2D5BFF] flex-shrink-0 mt-0.5" />
                    <span>{analysisResult.aiGroundingNotes}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-2 text-center py-8">
              <HelpCircle className="w-8 h-8 text-[#8E9299] opacity-40 animate-pulse" />
              <p className="text-xs font-bold text-[#8E9299] uppercase tracking-wider">PENDING MODEL WORKLOAD</p>
              <p className="text-[10px] text-[#8E9299] max-w-[220px]">
                Select a diagnostic code on the left and start the AI analyzer to generate expert automotive telemetry models.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
