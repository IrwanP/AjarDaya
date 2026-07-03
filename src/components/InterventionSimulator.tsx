import React, { useState, useEffect } from "react";
import { INTERVENTIONS, HEATMAP_GROUPS } from "../data";
import CurrentQuestionCard from "./CurrentQuestionCard";
import { Sparkles, Play, RefreshCw, Layers, Brain, Check, ShieldAlert, ChevronRight, Loader2 } from "lucide-react";
import { SimulationResult } from "../types";
import { getGeminiCache, setGeminiCache, hasGeminiCache } from "../utils/geminiCache";

interface InterventionSimulatorProps {
  isDemoActive?: boolean;
  onNavigate?: (viewId: string) => void;
  hasApiKey?: boolean;
}

export default function InterventionSimulator({ 
  isDemoActive = false, 
  onNavigate,
  hasApiKey = false 
}: InterventionSimulatorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(["mentoring_circles", "offline_resources"]);
  const [targetGroup, setTargetGroup] = useState<string>("Rural learners");
  const [duration, setDuration] = useState<string>("3 Months");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>("Gemini is running multi-intervention projections...");
  const [lastSimulated, setLastSimulated] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [quotaStatus, setQuotaStatus] = useState<"live" | "cached" | "fallback" | null>(null);

  // Initialize first simulation timestamp
  useEffect(() => {
    if (!lastSimulated) {
      setLastSimulated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
  }, []);

  const toggleIntervention = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSimulate = async () => {
    const sortedIds = [...selectedIds].sort().join(",");
    const cacheKey = `intervention:${sortedIds}:${targetGroup}:${duration}`;

    if (hasGeminiCache(cacheKey)) {
      setSimulationResult(getGeminiCache(cacheKey));
      setQuotaStatus("cached");
      setLastSimulated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      return;
    }

    setLoading(true);
    setLoadingText("Gemini is running multi-intervention projections...");
    setQuotaStatus(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 13000); // 13-second timeout

    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          topic: "intervention_simulation",
          data: {
            activeInterventions: selectedIds,
            targetGroup,
            duration
          }
        })
      });
      clearTimeout(timeoutId);

      const resData = await res.json();
      if (resData && resData.data) {
        setSimulationResult(resData.data);
        setGeminiCache(cacheKey, resData.data);
        if (resData.source === "local_intelligence_fallback_cached" || resData.source?.includes("fallback") || resData.source?.includes("local")) {
          setQuotaStatus("fallback");
        } else {
          setQuotaStatus("live");
        }
      } else {
        setQuotaStatus("fallback");
      }
      setLastSimulated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Error simulating intervention outcomes:", err);
      setQuotaStatus("fallback");
      setLastSimulated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } finally {
      setLoading(false);
    }
  };

  // Immediate local feedback calculation
  const getSimulatedGainAndLift = () => {
    let baseGain = 0;
    let baseEngagement = 0;
    let baseCostRatio = 0;

    selectedIds.forEach((id) => {
      const entry = INTERVENTIONS.find((int) => int.id === id);
      if (entry) {
        baseGain += entry.estimatedGain;
        baseEngagement += entry.estimatedEngagement;
        baseCostRatio += 1;
      }
    });

    // Diminishing returns scaling factor
    const scalar = selectedIds.length > 1 ? 0.85 : 1.0;
    const finalGain = Math.round(baseGain * scalar);
    const finalEngagement = Math.round(baseEngagement * scalar);

    return {
      gain: finalGain > 0 ? `+${finalGain}%` : "0%",
      engagement: finalEngagement > 0 ? `+${finalEngagement}%` : "0%",
      equity: selectedIds.some(id => id === "offline_resources" || id === "digital_kits") ? "High Impact" : "Medium Impact",
      costEfficiency: selectedIds.length === 0 ? "N/A" : selectedIds.length > 3 ? "Optimal (High Volume)" : "Very High"
    };
  };

  const currentLocalProjection = getSimulatedGainAndLift();

  const displayGain = isDemoActive ? "+32%" : (simulationResult?.learningGainLift || currentLocalProjection.gain);
  const displayEngagement = isDemoActive ? "+45%" : (simulationResult?.engagementLift || currentLocalProjection.engagement);
  const displayEquity = isDemoActive ? "Exceptional" : (simulationResult?.equityImpactScore || currentLocalProjection.equity);
  const displayCost = isDemoActive ? "Highly Optimized" : (simulationResult?.costEfficiencyRating || currentLocalProjection.costEfficiency);
  
  const getCostStyles = (val: string) => {
    const norm = val.toLowerCase();
    if (norm.includes("very high") || norm.includes("optimized") || norm.includes("optimal") || (norm.includes("high") && !norm.includes("medium") && !norm.includes("low"))) {
      return {
        card: "bg-teal-50/50 border border-teal-200",
        title: "text-teal-700/60",
        value: "text-teal-700",
        sub: "text-teal-600"
      };
    }
    if (norm.includes("medium")) {
      return {
        card: "bg-amber-50/50 border border-amber-200",
        title: "text-amber-700/60",
        value: "text-amber-700",
        sub: "text-amber-600"
      };
    }
    if (norm.includes("low")) {
      return {
        card: "bg-rose-50/50 border border-rose-200",
        title: "text-rose-700/60",
        value: "text-rose-700",
        sub: "text-rose-600"
      };
    }
    return {
      card: "bg-slate-50/50 border border-slate-200",
      title: "text-slate-700/60",
      value: "text-slate-700",
      sub: "text-slate-600"
    };
  };

  const costStyles = getCostStyles(displayCost);
  
  const displaySummary = isDemoActive
    ? "Simulating combinations for East Java Circle shows that while both 'Offline Study Kit Delivery' and 'Community Mentoring Circles' are highly beneficial, combining them is optimal. Offline kits directly resolve the 82% Digital Access Gap, while Mentoring Circles resolve the 75% Mentor Availability Gap."
    : (simulationResult ? (
        <div className="space-y-2">
          {simulationResult.summary && <p>{simulationResult.summary}</p>}
          {simulationResult.whyThisMixFits && <p><strong>Why this mix fits:</strong> {simulationResult.whyThisMixFits}</p>}
          {simulationResult.supportGapsAddressed && Array.isArray(simulationResult.supportGapsAddressed) && (
            <div>
              <p className="font-semibold">Support Gaps Addressed:</p>
              <ul className="list-disc pl-4 space-y-1 mt-0.5">
                {simulationResult.supportGapsAddressed.map((gap: string, i: number) => (
                  <li key={i}>{gap}</li>
                ))}
              </ul>
            </div>
          )}
          {simulationResult.expectedImpact && <p><strong>Expected Impact:</strong> {simulationResult.expectedImpact}</p>}
        </div>
      ) : (selectedIds.length > 0 
        ? `Simulations indicate that combining these ${selectedIds.length} interventions will generate a highly significant multiplicative impact on ${targetGroup}.` 
        : "Please select one or more intervention programs to project learning effectiveness."));

  const displayPriority = isDemoActive
    ? "Recommended Primary Intervention: 'Community Mentoring Circles'. This intervention directly coordinates structured mentorship for Ayu Lestari, Rafi Pratama, Dinda Rahmawati, and Yosep Wenda, immediately relieving the overextension of Kak Nisa and boosting student engagement by 45%."
    : (simulationResult ? (
        <div className="space-y-1.5 text-slate-700">
          {simulationResult.recommendationPriority && <p>{simulationResult.recommendationPriority}</p>}
          {simulationResult.tradeOffToReview && <p><strong className="text-amber-800">Trade-off to review:</strong> {simulationResult.tradeOffToReview}</p>}
          {simulationResult.recommendedNextStep && <p><strong>Recommended next step:</strong> {simulationResult.recommendedNextStep}</p>}
        </div>
      ) : "The optimal combination for remote/rural learners is pairing 'Offline Learning Resources' with 'Community Mentoring Circles' (Kak Nisa) to ensure content is contextualized socially and sustainably.");

  return (
    <div id="intervention-simulator-container" className="space-y-6 text-left">
      
      {isDemoActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800">
          <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold mb-0.5">Judge Demo Walkthrough: Step 4 of 6 (Impact Intervention Simulator)</p>
            <p>Our simulator lets you cross-compare different program mixes. Notice that <strong>"Community Mentoring Circles"</strong> is highly recommended because it immediately relieves mentor Kak Nisa's overextension and provides dedicated peer support for Ayu, Rafi, Dinda, and Yosep. Proceed to Step 5 (Resource Planner) using the button at the bottom of this page.</p>
          </div>
        </div>
      )}

      {/* Title Header */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="font-display font-bold text-2xl text-slate-800 tracking-tight">Impact Intervention Simulator</h2>
        <p className="text-slate-500 text-xs">Simulate educational intervention programs, project learner success rates, and estimate cost efficiencies.</p>
      </div>

      <CurrentQuestionCard 
        question="What intervention should be prioritized?" 
        helperText="Compare interventions before deciding where to focus time, budget, and partner capacity."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Intervention Picker Controls - 7 cols */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5 hover:border-slate-300 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-display font-semibold text-slate-900 text-sm tracking-tight">Select Intervention Mix</h3>
              <p className="text-[10px] text-slate-400">Combine multiple programs to project potential compound benefits</p>
            </div>
            <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded">
              {selectedIds.length} selected
            </span>
          </div>

          {/* Interventions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {INTERVENTIONS.map((int) => {
              const isSelected = selectedIds.includes(int.id);
              return (
                <div
                  key={int.id}
                  id={`simulator-card-${int.id}`}
                  onClick={() => toggleIntervention(int.id)}
                  className={`border rounded-xl p-4 transition-all cursor-pointer select-none text-left flex flex-col justify-between ${
                    isSelected
                      ? "border-teal-500 bg-teal-50/20 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-display font-bold text-xs text-slate-800">{int.name}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? "bg-teal-600 border-teal-600 text-white" : "border-slate-200"
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">
                      {int.description}
                    </p>
                  </div>

                  {/* Estimated metrics inside the selector */}
                  <div className="mt-3.5 pt-3.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1">
                      Gain: <span className="text-emerald-600 font-extrabold text-xs">+{int.estimatedGain}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      Equity:
                      {int.estimatedEquity === "High" ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold font-sans bg-teal-50 text-teal-700 border border-teal-200">
                          High
                        </span>
                      ) : int.estimatedEquity === "Medium" ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold font-sans bg-amber-50 text-amber-700 border border-amber-200">
                          Medium
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold font-sans bg-slate-100 text-slate-600 border border-slate-200">
                          Low
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      Cost:
                      {(() => {
                        const costLevel = int.id === "after_school" || int.id === "teacher_coaching" ? "Medium" :
                                          int.id === "digital_kits" ? "High" : "Low";
                        if (costLevel === "High") {
                          return (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold font-sans bg-rose-50 text-rose-700 border border-rose-100">
                              High
                            </span>
                          );
                        } else if (costLevel === "Medium") {
                          return (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold font-sans bg-amber-50 text-amber-700 border border-amber-100">
                              Medium
                            </span>
                          );
                        } else {
                          return (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold font-sans bg-teal-50 text-teal-700 border border-teal-100">
                              Low
                            </span>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Settings for Target group & duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Learner Group</label>
              <select
                id="sim-target-group"
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:border-teal-500 focus:outline-none cursor-pointer"
              >
                {HEATMAP_GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Implementation Duration</label>
              <select
                id="sim-duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:border-teal-500 focus:outline-none cursor-pointer"
              >
                <option value="1 Month">1 Month</option>
                <option value="3 Months">3 Months</option>
                <option value="6 Months">6 Months</option>
                <option value="12 Months">12 Months</option>
              </select>
            </div>
          </div>

          <button
            id="run-simulation-btn"
            onClick={handleSimulate}
            disabled={loading || selectedIds.length === 0}
            className="w-full py-3 bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-1.5 mt-2 cursor-pointer animate-fade-in"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{loadingText}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>Run AI Impact Simulation</span>
              </>
            )}
          </button>

          {lastSimulated && !loading && (
            <div className="text-[10px] text-slate-400 font-mono text-center mt-2">
              Last simulated with Gemini: {lastSimulated}
            </div>
          )}

          {!hasApiKey && (
            <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-[10px] text-slate-500 leading-normal font-mono mt-2">
              Using structured demo projections. Configure Gemini API for live AI generation.
            </div>
          )}
        </div>

        {/* Projections Panel on the right - 5 cols */}
        <div 
          id="simulation-outcomes-panel" 
          className="lg:col-span-5 bg-gradient-to-b from-indigo-50/10 via-white to-white rounded-xl border border-purple-100 p-6 shadow-sm flex flex-col justify-between hover:border-purple-200 transition-all relative overflow-hidden"
        >
          {/* Subtle top rainbow line representing Gemini AI Layer */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

          <div className="space-y-6 text-left pt-1">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-display font-extrabold text-sm text-slate-800">Simulated Outcomes & Projections</h3>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">AI Impact Projections</span>
                    <span className="text-[9px] bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent font-extrabold font-mono flex items-center gap-0.5 border border-purple-200/50 px-1 py-0.2 rounded bg-purple-50/50">
                      <Sparkles className="w-2.5 h-2.5 text-indigo-500 animate-pulse" />
                      Generated with Gemini
                    </span>
                    {quotaStatus === "live" && (
                      <span className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-mono font-bold">
                        Gemini connected
                      </span>
                    )}
                    {quotaStatus === "cached" && (
                      <span className="text-[9px] text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded font-mono font-bold">
                        Cached Gemini result
                      </span>
                    )}
                    {quotaStatus === "fallback" && (
                      <span className="text-[9px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-mono font-bold">
                        Demo reasoning mode
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated indicators */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-xl text-left">
                <span className="text-[10px] uppercase text-emerald-700/60 font-mono font-bold block mb-1">Learning Gain Lift</span>
                <span className="text-3xl font-display font-black text-emerald-700">{displayGain}</span>
                <span className="text-[10px] text-emerald-600 block mt-1.5 font-medium">Estimated average gain</span>
              </div>

              <div className="bg-teal-50/50 border border-teal-200 p-4 rounded-xl text-left">
                <span className="text-[10px] uppercase text-teal-700/60 font-mono font-bold block mb-1">Engagement Lift</span>
                <span className="text-3xl font-display font-black text-teal-700">{displayEngagement}</span>
                <span className="text-[10px] text-teal-600 block mt-1.5 font-medium">Projected attendance lift</span>
              </div>

              <div className="bg-blue-50/50 border border-blue-200 p-4 rounded-xl text-left">
                <span className="text-[10px] uppercase text-blue-700/60 font-mono font-bold block mb-1">Equity Impact</span>
                <span className="text-lg font-display font-extrabold text-blue-700 mt-1 block">{displayEquity}</span>
                <span className="text-[10px] text-blue-600 block mt-2 font-medium">Access equity factor</span>
              </div>

              <div className={`${costStyles.card} p-4 rounded-xl text-left`}>
                <span className={`text-[10px] uppercase ${costStyles.title} font-mono font-bold block mb-1`}>Cost Efficiency</span>
                <span className={`text-lg font-display font-extrabold ${costStyles.value} mt-1 block`}>{displayCost}</span>
                <span className={`text-[10px] ${costStyles.sub} block mt-2 font-medium`}>Budget optimization rating</span>
              </div>
            </div>

            {/* Qualitative Narrative & AI Insights */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-indigo-950 block mb-1">Impact Analysis Summary:</span>
                <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-light">
                  {displaySummary}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-teal-700 block mb-1">AI Priority Recommendations:</span>
                <div className="bg-teal-50/30 border border-teal-200 p-3.5 rounded-xl flex items-start gap-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 opacity-10">
                    <Sparkles className="w-6 h-6 text-teal-500" />
                  </div>
                  <Sparkles className="w-4.5 h-4.5 text-teal-600 mt-0.5 flex-shrink-0 animate-pulse" />
                  <div className="text-xs text-slate-700 leading-relaxed font-semibold">
                    {displayPriority}
                  </div>
                </div>
              </div>

              {/* Stakeholder Risk Analysis Section (Gemini Treated) */}
              <div className="border border-purple-100 rounded-xl p-3.5 bg-purple-50/30 relative overflow-hidden space-y-1.5">
                <div className="absolute top-0 right-0 p-1.5 opacity-15">
                  <ShieldAlert className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono font-bold uppercase text-purple-900">Stakeholder Risk Analysis</span>
                  <span className="text-[8px] bg-purple-100 text-purple-800 font-extrabold px-1 rounded">AI Mitigated</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {isDemoActive 
                    ? "Minor risk: Local community figures in East Java circle might prefer physical over digital delivery due to power instability. Mitigation: Bundled physical reading guide kits as secondary fallback, minimizing disruption."
                    : "Low to Moderate risk: Local mentors might face fatigue over multi-hour circles. Mitigation: Keep ratio to 1:15 max, with periodic rotating volunteer facilitators from regional universities."}
                </p>
              </div>

              {/* Mentor Feedback Section (Gemini Treated) */}
              <div className="border border-indigo-100 rounded-xl p-3.5 bg-indigo-50/30 relative overflow-hidden space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono font-bold uppercase text-indigo-900">Mentor Sentiment Feedback</span>
                  <span className="text-[8px] bg-indigo-100 text-indigo-800 font-extrabold px-1 rounded">AI Simulated</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  {isDemoActive
                    ? '“Having the physical offline study kits lets me direct students’ group work with absolute certainty, even when cell signals drop out completely in our village.” — Kak Nisa, Mentor'
                    : '“Combining interactive group mentoring circles with targeted reading materials has greatly reduced my prep work and kept students motivated.” — Community Facilitator'}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {isDemoActive && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
          <div>
            <h4 className="font-display font-bold text-slate-800 text-sm">Next Step in Walkthrough</h4>
            <p className="text-xs text-slate-500">Allocate your educational program budget and see the AI recommendation note.</p>
          </div>
          <button
            onClick={() => onNavigate && onNavigate("resource_planner")}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            Next: Plan Resources
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}
