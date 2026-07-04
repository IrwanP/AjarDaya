import React, { useState, useEffect } from "react";
import CurrentQuestionCard from "./CurrentQuestionCard";
import { Sparkles, Brain, Loader2, RefreshCw, AlertTriangle, Coins, ChevronRight } from "lucide-react";
import { ResourceAllocation } from "../types";
import { getGeminiCache, setGeminiCache, hasGeminiCache } from "../utils/geminiCache";

interface ResourcePlannerProps {
  isDemoActive?: boolean;
  onNavigate?: (viewId: string) => void;
  hasApiKey?: boolean;
  selectedBudget?: number;
  setSelectedBudget?: (b: number) => void;
  selectedFocusArea?: "balanced" | "remote3t" | "mentorCapacity";
  setSelectedFocusArea?: (f: "balanced" | "remote3t" | "mentorCapacity") => void;
}

export default function ResourcePlanner({ 
  isDemoActive = false, 
  onNavigate,
  hasApiKey = false,
  selectedBudget,
  setSelectedBudget,
  selectedFocusArea,
  setSelectedFocusArea
}: ResourcePlannerProps) {
  const [localBudgetInput, setLocalBudgetInput] = useState<number>(2500000000); // 2.5 Billion IDR default
  const budgetInput = selectedBudget !== undefined ? selectedBudget : localBudgetInput;
  const setBudgetInput = setSelectedBudget || setLocalBudgetInput;

  const [localSelectedFocusArea, setLocalSelectedFocusArea] = useState<"balanced" | "remote3t" | "mentorCapacity">("balanced");
  const activeFocusArea = selectedFocusArea !== undefined ? selectedFocusArea : localSelectedFocusArea;
  const changeSelectedFocusArea = setSelectedFocusArea || setLocalSelectedFocusArea;

  const [focusArea, setFocusArea] = useState<string>("Balanced Enablement");
  const [loading, setLoading] = useState<boolean>(false);
  const [allocation, setAllocation] = useState<ResourceAllocation | null>(null);
  const [quotaStatus, setQuotaStatus] = useState<"live" | "cached" | "fallback" | null>(null);
  const [lastOptimized, setLastOptimized] = useState<string | null>(null);
  const [highlightRefreshed, setHighlightRefreshed] = useState<boolean>(false);

  const getFriendlyFocusAreaName = (focus: "balanced" | "remote3t" | "mentorCapacity"): string => {
    switch (focus) {
      case "balanced": return "Balanced Enablement";
      case "remote3t": return "3T Accessibility Emphasis";
      case "mentorCapacity": return "Teacher & Mentor Capacity";
    }
  };

  interface FocusAllocation {
    recommendedAllocation: Array<{ area: string; percentage: number; amountIdr: string }>;
    regionalDistribution: Array<{ region: string; percentage: number; justification: string }>;
    justification: string;
    impactScore: number;
    projectedOutcomes: string[];
  }

  const getAllocationData = (focus: "balanced" | "remote3t" | "mentorCapacity", budget: number): FocusAllocation => {
    switch (focus) {
      case "balanced":
        return {
          recommendedAllocation: [
            { area: "Community Mentoring Circles", percentage: 50, amountIdr: `Rp ${(budget * 0.50).toLocaleString("id-ID")}` },
            { area: "Offline Study Kit Delivery", percentage: 50, amountIdr: `Rp ${(budget * 0.50).toLocaleString("id-ID")}` }
          ],
          regionalDistribution: [
            { region: "East Java Community Study Group Clusters", percentage: 60, justification: "Balanced funding for local study spaces and material delivery in Banyuwangi." },
            { region: "Maluku Islands & Papua (3T Pockets)", percentage: 40, justification: "Ensures Maria and Yosep's circles are sustained alongside local Java hubs." }
          ],
          justification: "Balanced enablement distributes resources evenly between learner access support and mentor/community facilitation. This ensures both physical resources and human guidance are scaled hand-in-hand.",
          impactScore: 94,
          projectedOutcomes: [
            "Learners receive both offline materials and mentor support.",
            "Communities maintain balanced progress across access and guidance gaps.",
            "Kak Nisa's coordination load is reduced from 1:40 to a sustainable 1:20 with assistant facilitators."
          ]
        };
      case "remote3t":
        return {
          recommendedAllocation: [
            { area: "Offline Study Kit Delivery", percentage: 65, amountIdr: `Rp ${(budget * 0.65).toLocaleString("id-ID")}` },
            { area: "Community Mentoring Circles", percentage: 35, amountIdr: `Rp ${(budget * 0.35).toLocaleString("id-ID")}` }
          ],
          regionalDistribution: [
            { region: "Maluku Islands & Papua (3T Communities)", percentage: 70, justification: "Heavy material and infrastructure injection for extreme access bottlenecks faced by Maria and Yosep." },
            { region: "East Java Disadvantaged Pockets", percentage: 30, justification: "Directed towards Ayu and Dinda's low-connectivity villages." }
          ],
          justification: "Remote and underserved areas need stronger offline study access because connectivity and infrastructure barriers are the main bottlenecks. This focuses resources on printed materials and localized kits.",
          impactScore: 97,
          projectedOutcomes: [
            "More learners in remote areas receive printed modules and offline learning kits.",
            "Access gaps are reduced for learners with limited internet or devices.",
            "Maria and Yosep's remote cohorts receive solar-powered learning boxes to bypass grid outages."
          ]
        };
      case "mentorCapacity":
        return {
          recommendedAllocation: [
            { area: "Community Mentoring Circles", percentage: 70, amountIdr: `Rp ${(budget * 0.70).toLocaleString("id-ID")}` },
            { area: "Offline Study Kit Delivery", percentage: 30, amountIdr: `Rp ${(budget * 0.30).toLocaleString("id-ID")}` }
          ],
          regionalDistribution: [
            { region: "East Java Community Study Group Clusters", percentage: 75, justification: "Supports tutor allowances and intensive mentor coaching led by Kak Nisa." },
            { region: "West Java & Maluku Mentorship Hubs", percentage: 25, justification: "Direct training and coordination resources to decrease extreme student-mentor ratios." }
          ],
          justification: "Teacher and mentor capacity focuses investment on localized coaching, mentor coordination, and learning facilitation. This ensures educators are supported and less overextended.",
          impactScore: 95,
          projectedOutcomes: [
            "Mentor availability improves.",
            "Community study groups receive more consistent guidance.",
            "At-risk learners receive closer follow-up."
          ]
        };
    }
  };

  const fetchOptimizations = async () => {
    setLoading(true);
    setQuotaStatus(null);

    // Simulate standard optimization calculation processing delay (700-1200ms)
    await new Promise((resolve) => setTimeout(resolve, 900));

    const cacheKey = `resource:${budgetInput}:${focusArea}`;

    // If walkthrough demo is active, do not trigger any live server calls
    if (isDemoActive) {
      setQuotaStatus("fallback");
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastOptimized(timeStr);
      setHighlightRefreshed(true);
      setTimeout(() => setHighlightRefreshed(false), 1200);
      setLoading(false);
      return;
    }

    if (hasGeminiCache(cacheKey)) {
      setAllocation(getGeminiCache(cacheKey));
      setQuotaStatus("cached");
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastOptimized(timeStr);
      setHighlightRefreshed(true);
      setTimeout(() => setHighlightRefreshed(false), 1200);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 13000); // 13-second timeout

    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          topic: "resource_allocator",
          data: {
            totalBudget: budgetInput,
            focusArea: focusArea
          }
        })
      });
      clearTimeout(timeoutId);

      const resData = await res.json();
      if (resData && resData.data) {
        setAllocation(resData.data);
        setGeminiCache(cacheKey, resData.data);
        if (resData.source === "local_intelligence_fallback_cached" || resData.source?.includes("fallback") || resData.source?.includes("local")) {
          setQuotaStatus("fallback");
        } else {
          setQuotaStatus("live");
        }
      } else {
        setQuotaStatus("fallback");
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Error calling resource allocator API:", err);
      setQuotaStatus("fallback");
    } finally {
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastOptimized(timeStr);
      setHighlightRefreshed(true);
      setTimeout(() => setHighlightRefreshed(false), 1200);
      setLoading(false);
    }
  };

  useEffect(() => {
    setFocusArea(getFriendlyFocusAreaName(activeFocusArea));
  }, [activeFocusArea]);

  useEffect(() => {
    const cacheKey = `resource:${budgetInput}:${focusArea}`;
    if (hasGeminiCache(cacheKey)) {
      setAllocation(getGeminiCache(cacheKey));
      setQuotaStatus("cached");
    } else {
      setAllocation(null);
      setQuotaStatus("fallback");
    }
  }, [focusArea, budgetInput]);

  const activeLocalAllocation = getAllocationData(activeFocusArea, budgetInput);

  const displayRecommended = isDemoActive 
    ? activeLocalAllocation.recommendedAllocation 
    : (allocation?.recommendedAllocation || activeLocalAllocation.recommendedAllocation);

  const displayRegional = isDemoActive 
    ? activeLocalAllocation.regionalDistribution 
    : (allocation?.regionalDistribution || activeLocalAllocation.regionalDistribution);
  
  const displayJustification = isDemoActive
    ? activeLocalAllocation.justification
    : (allocation?.justification || activeLocalAllocation.justification);

  const displayScore = isDemoActive 
    ? activeLocalAllocation.impactScore 
    : (allocation?.impactScore || activeLocalAllocation.impactScore);

  const displayOutcomes = isDemoActive
    ? activeLocalAllocation.projectedOutcomes
    : (allocation?.projectedOutcomes || activeLocalAllocation.projectedOutcomes);

  return (
    <div id="resource-planner-container" className="space-y-6 text-left">
      
      {isDemoActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800">
          <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold mb-0.5">Judge Demo Walkthrough: Step 5 of 6 (Resource Allocation Planner)</p>
            <p>Our optimization engine splits your budget. See the recommended funding split below: <strong>"Community Mentoring Circles" (60%)</strong> and <strong>"Offline Study Kit Delivery" (40%)</strong>. Read the dedicated AI Recommendation Note highlighting why we prioritize mentoring circles. Then, proceed to Step 6 (Action Brief) at the bottom of the page.</p>
          </div>
        </div>
      )}

      {/* Title Header */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="font-display font-bold text-2xl text-slate-800 tracking-tight">Resource Allocation Planner</h2>
        <p className="text-slate-500 text-xs">Simulate budget division, assign geographical resource weightings, and evaluate projected community impact scores.</p>
      </div>

      <CurrentQuestionCard 
        question="Where should limited resources go?" 
        helperText="Review AI-assisted allocation recommendations and stakeholder trade-offs."
      />

      {isDemoActive && (
        <div className="bg-teal-50 border-2 border-teal-200 rounded-xl p-4.5 flex gap-3 text-left shadow-xs">
          <Brain className="w-5 h-5 text-teal-700 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-teal-950 uppercase font-mono tracking-wider">AI Recommendation Note</h4>
            <p className="text-xs text-teal-900 leading-relaxed mt-1">
              <strong>Prioritize Community Mentoring Circles</strong> to address immediate learner guidance gaps (Ayu, Rafi, Dinda, and Yosep) and support community coordinator overextension.
            </p>
          </div>
        </div>
      )}

      {/* Humanity Advisory Warning Banner */}
      <div id="human-advisory-banner" className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-left shadow-xs">
        <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-amber-900 uppercase font-mono tracking-wider">Human-in-the-Loop Advisory Notice</h4>
          <p className="text-xs text-amber-800 leading-relaxed mt-1">
            <strong>Artificial Intelligence (AI) serves strictly as a decision-support tool</strong>, not as a replacement for human judgment. The recommendations below are calculated purely on mathematical efficiency across support gap data. Final decisions, localized social wisdom, and contextual adjustments rest entirely with community leaders and human coordinators.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Budget Input & Configurations Panel - 5 cols */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 hover:border-slate-300 transition-all">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Coins className="w-5 h-5 text-teal-600" />
            <h3 className="font-display font-semibold text-slate-900 text-sm tracking-tight">Budget Planning Parameters</h3>
          </div>

          {/* Budget Input Slider and Display */}
          <div className="space-y-3.5 text-left">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600 uppercase font-mono">Total Available Budget</label>
              <span className="text-sm font-mono font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded">
                Rp {budgetInput.toLocaleString("id-ID")}
              </span>
            </div>
            
            <input
              id="budget-input-range"
              type="range"
              min={500000000} // 500 Million IDR
              max={5000000000} // 5 Billion IDR
              step={100000000}
              value={budgetInput}
              onChange={(e) => setBudgetInput(Number(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Min: Rp 500 Million</span>
              <span>Max: Rp 5 Billion</span>
            </div>
          </div>

          {/* Focus Selector */}
          <div className="space-y-2 text-left">
            <label className="text-xs font-semibold text-slate-600 uppercase font-mono">Priority Focus Area</label>
            <div className="space-y-2">
              {[
                { id: "balanced", title: "Balanced Enablement", desc: "Evenly distributes resources between physical learning material distribution and educator capacity-building." },
                { id: "remote3t", title: "Remote & Underserved Areas (3T)", desc: "Prioritizes communities in Indonesia’s disadvantaged, frontier, and outermost regions where connectivity, infrastructure, and education services are limited." },
                { id: "mentorCapacity", title: "Teacher & Mentor Capacity", desc: "Invests heavily in intensive in-person training, coaching sessions, and localized mentor allowances." }
              ].map((opt) => (
                <div
                  key={opt.id}
                  id={`focus-option-${opt.id}`}
                  onClick={() => {
                    changeSelectedFocusArea(opt.id as any);
                    setFocusArea(getFriendlyFocusAreaName(opt.id as any));
                  }}
                  className={`border rounded-xl p-3.5 cursor-pointer transition-all text-left hover:border-teal-400 hover:bg-slate-50/50 ${
                    activeFocusArea === opt.id
                      ? "border-teal-500 bg-teal-50/30 shadow-xs ring-1 ring-teal-500/20"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <span className="text-xs font-bold text-slate-800 flex items-center flex-wrap gap-1">
                    {opt.title}
                    {opt.id === "remote3t" && (
                      <span className="relative group inline-flex items-center cursor-help shrink-0">
                        <span className="text-[9px] inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-100 text-slate-500 font-bold border border-slate-300 select-none">
                          i
                        </span>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-slate-800 text-white text-[11px] leading-relaxed p-2.5 rounded-lg shadow-xl z-50 font-sans font-normal normal-case">
                          3T refers to Indonesia’s disadvantaged, frontier, and outermost regions, often facing limited access, infrastructure, and public services.
                          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></span>
                        </span>
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block leading-normal">{opt.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <button
              id="calculate-optimization-btn"
              onClick={fetchOptimizations}
              disabled={loading}
              className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Optimizing allocation...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 text-amber-400" />
                  Optimize Resource Allocation Plan
                </>
              )}
            </button>

            {lastOptimized && (
              <p className="text-center text-[10px] text-teal-600 font-mono mt-2.5 animate-pulse">
                Last optimized: {lastOptimized} • Quota-safe demo mode
              </p>
            )}
          </div>
        </div>

        {/* Output Allocations Results Panel - 7 cols */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 hover:border-slate-300 transition-all">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="font-display font-bold text-sm text-slate-800">Recommended Resource Allocation Plan</h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">AI algorithmic resource modeling</p>
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
            
            {/* Projected Impact Score */}
            <div id="projected-impact-score-badge" className="text-right flex items-center gap-2 bg-teal-50 px-3.5 py-1.5 rounded-xl border border-teal-100">
              <span className="text-[10px] uppercase font-mono text-teal-600 block">Projected Impact Score:</span>
              <span className="text-2xl font-display font-black text-teal-700">{displayScore}</span>
            </div>
          </div>

          {/* Justification summary */}
          <div className={`transition-all duration-1000 border rounded-xl p-4 text-left ${
            highlightRefreshed 
              ? "bg-teal-50 border-teal-300 shadow-xs ring-1 ring-teal-200/50" 
              : "bg-slate-50 border-slate-200"
          }`}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-4 h-4 text-teal-700" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 font-mono">Budget Allocation Justification</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-light">
              "{displayJustification}"
            </p>
          </div>

          {/* Allocation Breakdown Progress bars */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-400">Recommended Funding Distribution by Category</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayRecommended.map((item, idx) => (
                <div key={idx} className="bg-slate-50/50 border border-slate-200 p-3.5 rounded-xl text-left space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 truncate mr-2" title={item.area}>{item.area}</span>
                    <span className="font-mono font-bold text-teal-700 flex-shrink-0">{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-600 h-full rounded-full" style={{ width: `${item.percentage}%` }}></div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono font-semibold">
                    Equivalent to: {item.amountIdr}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Regional distribution table */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-400">Regional Geographic Distribution</h4>
              <span className="text-[10px] text-slate-400 italic font-medium">
                3T = disadvantaged, frontier, and outermost regions.
              </span>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
              {displayRegional.map((reg, idx) => (
                <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white text-xs text-left">
                  <div className="sm:max-w-xs">
                    <span className="font-bold text-slate-800 block">{reg.region}</span>
                    <span className="text-[11px] text-slate-500 leading-normal block mt-0.5">{reg.justification}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[9px] text-slate-400 block uppercase font-mono">Funding Share</span>
                    <span className="font-mono font-black text-teal-700 text-sm">{reg.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projected Outcomes bullet points */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-400">Projected Social Outcomes</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {displayOutcomes.map((out, idx) => (
                <div key={idx} className="bg-teal-50/30 border border-teal-100/30 p-3 rounded-xl text-left flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 flex-shrink-0"></span>
                  <p className="text-xs text-slate-600 leading-normal">{out}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {isDemoActive && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
          <div>
            <h4 className="font-display font-bold text-slate-800 text-sm">Next Step in Walkthrough</h4>
            <p className="text-xs text-slate-500">Generate a comprehensive, stakeholder-ready executive briefing document.</p>
          </div>
          <button
            onClick={() => onNavigate && onNavigate("action_brief")}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            Next: Generate Action Brief
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}
