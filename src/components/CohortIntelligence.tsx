import React, { useState, useEffect } from "react";
import CohortDonutChart from "./CohortDonutChart";
import CurrentQuestionCard from "./CurrentQuestionCard";
import { COHORT_GRADES, INDONESIA_MAP_REGIONS, PERSONAS } from "../data";
import { Sparkles, Brain, Loader2, AlertCircle, RefreshCw, Eye, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { CohortIntelligenceData, CohortNBA } from "../types";
import { getGeminiCache, setGeminiCache, hasGeminiCache } from "../utils/geminiCache";

interface CohortIntelligenceProps {
  isDemoActive?: boolean;
  onNavigate?: (viewId: string) => void;
  selectedSupportGapFilter?: string | null;
  setSelectedSupportGapFilter?: (filter: string | null) => void;
  highlightedLearnerName?: string | null;
  setHighlightedLearnerName?: (name: string | null) => void;
  setSelectedGroup?: (group: string) => void;
  setSelectedDomain?: (domain: string) => void;
}

// Learner mapping information for reverse connection and gaps column
const LEARNER_GAP_INFO: Record<string, { gaps: string[], group: string, domain: string }> = {
  "Ayu Lestari": {
    gaps: ["Digital Access", "Mentorship", "Learning Resources"],
    group: "Low-income learners",
    domain: "Digital access"
  },
  "Rafi Pratama": {
    gaps: ["Participation", "Attendance", "Family / Community Support"],
    group: "Rural learners",
    domain: "Participation"
  },
  "Dinda Rahmawati": {
    gaps: ["Digital Access", "Learning Resources"],
    group: "Low-income learners",
    domain: "Digital access"
  },
  "Maria Lewaherilla": {
    gaps: ["Learning Resources", "Digital Access", "Regional Support", "Offline Resources"],
    group: "Remote islands",
    domain: "Access"
  },
  "Yosep Wenda": {
    gaps: ["Mentorship", "Regional Support", "Learning Pathway"],
    group: "Papua",
    domain: "Mentorship"
  }
};

const isLearnerAffectedByFilter = (learnerName: string, filter: string | null) => {
  if (!filter) return true;
  
  const normFilter = filter.toLowerCase().trim();
  
  // If it is a compound "Group × Domain" filter
  if (normFilter.includes("×")) {
    const [groupPart, domainPart] = normFilter.split("×").map(s => s.trim());
    
    if (groupPart === "low-income learners" && domainPart === "digital access") {
      return ["Ayu Lestari", "Dinda Rahmawati"].includes(learnerName);
    }
    if (groupPart === "remote islands" && (domainPart === "digital access" || domainPart === "access" || domainPart === "learning resources")) {
      return ["Maria Lewaherilla"].includes(learnerName);
    }
    if (groupPart === "papua" && (domainPart === "mentorship" || domainPart === "regional support")) {
      return ["Yosep Wenda"].includes(learnerName);
    }
    if (groupPart === "rural learners" && (domainPart === "participation" || domainPart === "attendance")) {
      return ["Rafi Pratama"].includes(learnerName);
    }
    
    // Fallbacks to handle the category perfectly
    if (groupPart === "low-income learners") {
      return ["Ayu Lestari", "Dinda Rahmawati"].includes(learnerName);
    }
    if (groupPart === "remote islands") {
      return ["Maria Lewaherilla"].includes(learnerName);
    }
    if (groupPart === "papua") {
      return ["Yosep Wenda"].includes(learnerName);
    }
    if (groupPart === "rural learners") {
      return ["Rafi Pratama"].includes(learnerName);
    }
    if (groupPart === "urban learners") {
      return ["Ayu Lestari", "Dinda Rahmawati"].includes(learnerName);
    }
    if (groupPart === "maluku") {
      return ["Maria Lewaherilla"].includes(learnerName);
    }
    if (groupPart.includes("disabilities")) {
      return ["Ayu Lestari"].includes(learnerName);
    }
  }

  // Single-domain fallbacks
  if (normFilter === "digital access") {
    return ["Ayu Lestari", "Dinda Rahmawati", "Maria Lewaherilla"].includes(learnerName);
  }
  if (normFilter === "mentorship") {
    return ["Ayu Lestari", "Yosep Wenda"].includes(learnerName);
  }
  if (normFilter === "participation") {
    return ["Rafi Pratama"].includes(learnerName);
  }
  if (normFilter === "access") {
    return ["Maria Lewaherilla", "Yosep Wenda", "Ayu Lestari", "Dinda Rahmawati", "Rafi Pratama"].includes(learnerName);
  }
  if (normFilter === "literacy") {
    return ["Maria Lewaherilla"].includes(learnerName);
  }
  if (normFilter === "numeracy") {
    return ["Maria Lewaherilla"].includes(learnerName);
  }
  return true;
};

export default function CohortIntelligence({ 
  isDemoActive = false, 
  onNavigate,
  selectedSupportGapFilter = null,
  setSelectedSupportGapFilter,
  highlightedLearnerName = null,
  setHighlightedLearnerName,
  setSelectedGroup,
  setSelectedDomain
}: CohortIntelligenceProps) {
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>(COHORT_GRADES[0]);
  const [selectedRegion, setSelectedRegion] = useState<string>("All Regions");
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<CohortIntelligenceData | null>(null);
  const [quotaStatus, setQuotaStatus] = useState<"live" | "cached" | "fallback" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Premium fallbacks
  const defaultNBA: CohortNBA[] = [
    {
      targetCohort: "At Risk Students (22%)",
      actionTitle: "Establish Peer Mentoring Circles (Peer Circles)",
      impactDescription: "Grouping at-risk students with peer mentors improves assignment completion by 25% and reduces learning anxiety.",
      primaryOwner: "Kak Nisa (Community Mentor)",
      priority: "High"
    },
    {
      targetCohort: "Behind Students (12%)",
      actionTitle: "Formulate Targeted Reading Remedial Plans",
      impactDescription: "15-minute daily private sessions using illustrated word cards help lagging students catch up within 6 weeks.",
      primaryOwner: "Bu Maya (School Counselor)",
      priority: "Critical"
    },
    {
      targetCohort: "On Track Students (62%)",
      actionTitle: "Introduce Creative Local Problem-Solving Projects",
      impactDescription: "On-track students are given independent project-based modules addressing village problems to cultivate leadership.",
      primaryOwner: "Pak Arif (NGO Program Manager)",
      priority: "Medium"
    }
  ];

  const defaultTrend = `The performance trend of class ${selectedGrade} in ${selectedRegion} indicates that in-person community study circles at village halls achieve more stable outcomes compared to independent mobile learning in weak cellular coverage areas.`;
  const defaultBlockers = [
    "Lack of personal devices for night study (students sharing phones with parents)",
    "Language of instruction (formal Indonesian) not fully mastered by children in remote Papua",
    "Domestic duties such as helping harvest fields or caring for younger siblings while parents work"
  ];

  // Cohort numbers customized loosely by Grade levels for high fidelity simulation
  const getCohortMetrics = (grade: string) => {
    if (isDemoActive) {
      return { onTrack: 58, atRisk: 31, behind: 21, notStarted: 14 };
    }
    if (grade.includes("Early")) {
      return { onTrack: 58, atRisk: 24, behind: 14, notStarted: 4 };
    } else if (grade.includes("4-6")) {
      return { onTrack: 65, atRisk: 18, behind: 12, notStarted: 5 };
    } else if (grade.includes("SMP")) {
      return { onTrack: 62, atRisk: 21, behind: 11, notStarted: 6 };
    } else {
      return { onTrack: 71, atRisk: 15, behind: 10, notStarted: 4 };
    }
  };

  const metrics = getCohortMetrics(selectedGrade);

  const fetchCohortNBA = async () => {
    const cacheKey = `cohort-actions:${selectedGrade}:${selectedRegion}`;
    setError(null);
    setLoading(true);
    setQuotaStatus(null);

    // If walkthrough demo or quota-safe mode is active, do not trigger any live server calls
    if (isDemoActive) {
      // Simulate standard calculation processing delay (800ms)
      await new Promise((resolve) => setTimeout(resolve, 800));
      const demoData = {
        nba: [
          {
            targetCohort: "Behind Learners (12%)",
            actionTitle: "Structured Remedial Support & Offline Study Kits",
            impactDescription: "Prioritize offline printed modules and 1-on-1 tutoring sessions for Yosep Wenda (Papua) and Maria Lewaherilla (Maluku) to bridge literacy and basic numeracy gaps.",
            primaryOwner: "Bu Maya (School Counselor) & Pak Budi",
            priority: "Critical"
          },
          {
            targetCohort: "At-Risk Learners (22%)",
            actionTitle: "Activate Peer-to-Peer Learning Circles (Peer Circles)",
            impactDescription: "Grouping at-risk students (like Ayu Lestari, Rafi Pratama, Dinda Rahmawati) with peer mentors improves assignment completion by 25% and reduces learning anxiety.",
            primaryOwner: "Kak Nisa (Community Mentor)",
            priority: "High"
          },
          {
            targetCohort: "On-Track Learners (62%)",
            actionTitle: "Offer Local Creative Project Challenges",
            impactDescription: "Students who are already on-track are given self-paced project-based learning modules to solve village challenges and build leadership.",
            primaryOwner: "Pak Arif (NGO Program Manager)",
            priority: "Medium"
          }
        ],
        regionalTrend: `The progress trend for ${selectedGrade} in ${selectedRegion} indicates that in-person community study circles at village halls achieve more stable outcomes compared to independent mobile learning in weak cellular coverage areas.`,
        topBlockers: [
          "Lack of personal devices for night study (students sharing phones with parents)",
          "Language of instruction (formal Indonesian) not fully mastered by children in remote Papua",
          "Domestic duties such as helping harvest fields or caring for younger siblings while parents work"
        ]
      };
      setData(demoData);
      setGeminiCache(cacheKey, demoData);
      setQuotaStatus("fallback");
      setLoading(false);
      return;
    }

    if (hasGeminiCache(cacheKey)) {
      setData(getGeminiCache(cacheKey));
      setQuotaStatus("cached");
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
          topic: "cohort_actions",
          data: {
            grade: selectedGrade,
            region: selectedRegion,
            onTrack: metrics.onTrack,
            atRisk: metrics.atRisk,
            behind: metrics.behind,
            notStarted: metrics.notStarted
          }
        })
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }

      const resData = await res.json();
      if (resData && resData.data) {
        setData(resData.data);
        setGeminiCache(cacheKey, resData.data);
        if (resData.source === "local_intelligence_fallback_cached" || resData.source?.includes("fallback") || resData.source?.includes("local")) {
          setQuotaStatus("fallback");
        } else {
          setQuotaStatus("live");
        }
      } else {
        setQuotaStatus("fallback");
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Error fetching cohort NBA:", err);
      setError(err?.message || "Failed to run AI analysis. Please try again.");
      setQuotaStatus("fallback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cacheKey = `cohort-actions:${selectedGrade}:${selectedRegion}`;
    setError(null);
    if (hasGeminiCache(cacheKey)) {
      setData(getGeminiCache(cacheKey));
      setQuotaStatus("cached");
    } else {
      setData(null);
      setQuotaStatus("fallback");
    }
  }, [selectedGrade, selectedRegion]);

  const displayNBA = data?.nba || defaultNBA;
  const displayTrend = data?.regionalTrend || defaultTrend;
  const displayBlockers = data?.topBlockers || defaultBlockers;

  // Cohort details table sample data
  const cohortTableData = [
    { name: "Ayu Lestari", region: "East Java", progress: "62%", status: "At Risk", blocker: "Limited internet and shared device access" },
    { name: "Rafi Pratama", region: "East Java", progress: "58%", status: "At Risk", blocker: "Irregular attendance due to family responsibilities" },
    { name: "Dinda Rahmawati", region: "West Java", progress: "45%", status: "At Risk", blocker: "No personal device and weak internet coverage" },
    { name: "Maria Lewaherilla", region: "Maluku Islands", progress: "32%", status: "Behind", blocker: "Frequent power outages and limited offline resources" },
    { name: "Yosep Wenda", region: "Papua", progress: "15%", status: "Behind", blocker: "Language barrier and limited structured mentorship" }
  ];

  const statusPriority: Record<string, number> = {
    "Behind": 1,
    "At Risk": 2,
    "On Track": 3
  };

  const sortedCohortTableData = [...cohortTableData].sort((a, b) => {
    const priorityA = statusPriority[a.status] ?? 4;
    const priorityB = statusPriority[b.status] ?? 4;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    const valA = parseInt(a.progress.replace("%", ""), 10) || 0;
    const valB = parseInt(b.progress.replace("%", ""), 10) || 0;
    return valA - valB;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "On Track":
        return "bg-teal-50 text-teal-700 border border-teal-200/60";
      case "At Risk":
        return "bg-amber-50 text-amber-700 border border-amber-200/60";
      case "Behind":
        return "bg-rose-50 text-rose-700 border border-rose-200/60";
      case "Not Started":
      default:
        return "bg-slate-50 text-slate-600 border border-slate-200/60";
    }
  };

  return (
    <div id="cohort-intelligence-container" className="space-y-6 text-left">
      
      {isDemoActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800">
          <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold mb-0.5">Judge Demo Walkthrough: Step 2 of 6 (Cohort Intelligence Analyzer)</p>
            <p>Here, the cohort is segmented into learning groups (On Track, At Risk, Behind, Not Started). Click <strong>"View Signals"</strong> next to any learner to analyze their specific background and challenges. Try clicking "View Signals" for <strong>Ayu Lestari</strong> to see her age (17), motivation, and internet barriers in Banyuwangi. Then, click the proceed button at the bottom to continue to Step 3.</p>
          </div>
        </div>
      )}

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 gap-3">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-800 tracking-tight">Cohort Intelligence Analyzer</h2>
          <p className="text-slate-500 text-xs font-sans">Analyze cohort progress and formulate targeted remedial and support action plans.</p>
        </div>
        
        {/* Dynamic Interactive Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Cohort Grade</label>
            <select
              id="filter-grade"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:border-teal-500 focus:outline-none cursor-pointer"
            >
              {COHORT_GRADES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Region</label>
            <select
              id="filter-region"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:border-teal-500 focus:outline-none cursor-pointer"
            >
              <option value="All Regions">All Regions</option>
              {INDONESIA_MAP_REGIONS.map((r) => (
                <option key={r.name} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedSupportGapFilter && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-teal-850 animate-fade-in mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 shrink-0">
              <Sparkles className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-bold font-display text-teal-950">Active Filter Applied</p>
              <p className="text-xs text-teal-850">Filtered by selected heatmap cell: <span className="font-bold text-teal-950">{selectedSupportGapFilter}</span></p>
              <p className="text-[11px] text-teal-600 font-semibold mt-0.5">These learners are matched using both learner category and support domain signals.</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (setSelectedSupportGapFilter) setSelectedSupportGapFilter(null);
              if (setHighlightedLearnerName) setHighlightedLearnerName(null);
            }}
            className="px-3.5 py-1.5 bg-white hover:bg-teal-100 border border-teal-200 rounded-lg text-teal-850 font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            Clear Filter
          </button>
        </div>
      )}

      <CurrentQuestionCard 
        question="Who needs support first?" 
        helperText="Review learner cohorts to identify at-risk, behind, and not-started learners."
      />

      {/* Grid of donut progress + next-best actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Donut Progress component - 4 cols */}
        <div className="lg:col-span-4 space-y-6">
          <CohortDonutChart 
            onTrack={metrics.onTrack} 
            atRisk={metrics.atRisk} 
            behind={metrics.behind} 
            notStarted={metrics.notStarted} 
          />

          {/* Regional Progress comparison table */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-left hover:border-slate-300 transition-all">
            <h3 className="font-display font-semibold text-sm text-slate-800 mb-3">Regional Progress Comparison</h3>
            <div className="space-y-3">
              {[
                { region: "Jawa", onTrack: 84 },
                { region: "Sumatera", onTrack: 72 },
                { region: "Kalimantan", onTrack: 65 },
                { region: "Sulawesi", onTrack: 58 },
                { region: "Maluku Islands", onTrack: 45 },
                { region: "Papua", onTrack: 38 }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">{item.region}</span>
                    <span className="font-mono font-semibold text-slate-700">{item.onTrack}% On Track</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-teal-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.onTrack}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Next Best Actions (Gemini Generated) - 8 cols */}
        <div className="lg:col-span-8 space-y-6">
          
          <div id="ai-nba-panel" className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative overflow-hidden hover:border-slate-300 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/50 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-800 font-sans tracking-tight">Targeted Action Plan Recommendations (Next-Best Actions)</h3>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Formulated dynamically by Gemini AI</p>
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
              <button
                type="button"
                onClick={fetchCohortNBA}
                disabled={loading}
                className="px-3 py-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 active:scale-95 text-white font-extrabold text-[10px] sm:text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs hover:shadow-md disabled:opacity-50 cursor-pointer shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Running Analysis...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    <span>Run AI Analysis</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 p-3.5 rounded-xl mb-5 leading-relaxed italic">
              "<strong>Trend Analysis:</strong> {displayTrend}"
            </p>

            <div className="space-y-4">
              {displayNBA.map((action, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-teal-100 hover:bg-teal-50/10 transition-all text-left">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                       <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                      <span className="text-xs font-semibold text-slate-700 font-mono bg-teal-50 px-2 py-0.5 rounded text-teal-800">
                        {action.targetCohort}
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      action.priority === "Kritis" || action.priority === "Critical" 
                        ? "bg-rose-50 text-rose-700 border border-rose-100" 
                        : "bg-teal-50 text-teal-700 border border-teal-100"
                    }`}>
                      {action.priority}
                    </span>
                  </div>

                  <h4 className="font-display font-bold text-sm text-slate-800 mb-1">{action.actionTitle}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">{action.impactDescription}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium border-t border-slate-100 pt-2.5">
                    <span>Lead Coordinator:</span>
                    <span className="text-slate-600 font-semibold">{action.primaryOwner}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Learner Blockers list */}
          <div id="blockers-panel" className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
            <h3 className="font-display font-semibold text-slate-800 text-sm mb-3">Top Learning Obstacles (Learner Blockers)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {displayBlockers.map((blocker, idx) => (
                <div key={idx} className="bg-rose-50/10 border border-rose-100/40 p-4 rounded-xl flex gap-2.5 text-left items-start">
                  <span className="font-display font-bold text-slate-300 text-2xl -mt-1">{idx + 1}</span>
                  <p className="text-xs font-medium text-slate-600 leading-normal">{blocker}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Cohort Details table */}
      <div id="cohort-table-panel" className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm overflow-hidden hover:border-slate-300 transition-all">
        <div className="mb-4 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-semibold text-slate-800 text-lg">Cohort Breakdown & Progress Details (Sample Cohort Table)</h3>
            <p className="text-xs text-slate-500 mb-2">Visual breakdown of students' learning progress across target areas</p>
            {/* Subtle Status Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 mt-1 pb-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span><strong>On Track:</strong> progressing normally</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span><strong>At Risk:</strong> warning signals, early support needed</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span><strong>Behind:</strong> significantly lagging, targeted remedial support needed</span>
              </span>
            </div>
          </div>
          {selectedSupportGapFilter && (
            <div className="text-xs text-teal-800 bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <span>Showing matches for <strong>{selectedSupportGapFilter}</strong> ({
                cohortTableData.filter(row => isLearnerAffectedByFilter(row.name, selectedSupportGapFilter)).length
              } of {cohortTableData.length})</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] tracking-wider bg-slate-50/50">
                <th className="py-3 px-4 font-semibold">Student Name</th>
                <th className="py-3 px-4 font-semibold">Target Region</th>
                <th className="py-3 px-4 font-semibold">Module Completion</th>
                <th className="py-3 px-4 font-semibold">Academic Status</th>
                <th className="py-3 px-4 font-semibold font-mono">Related Gaps</th>
                <th className="py-3 px-4 font-semibold">Primary Blocker</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedCohortTableData
                .map((row) => {
                  const isExpanded = expandedStudent === row.name;
                  const persona = PERSONAS.find(p => p.name === row.name);
                  const isAffected = selectedSupportGapFilter ? isLearnerAffectedByFilter(row.name, selectedSupportGapFilter) : false;
                  const isHighlighted = row.name === highlightedLearnerName || isAffected;
                  const isDimmed = selectedSupportGapFilter ? !isAffected : false;
                  
                  // Demo ages
                  const ageMap: Record<string, number> = {
                    "Ayu Lestari": 17,
                    "Rafi Pratama": 15,
                    "Dinda Rahmawati": 14,
                    "Maria Lewaherilla": 16,
                    "Yosep Wenda": 15
                  };
                  const age = ageMap[row.name] || 15;

                  return (
                    <React.Fragment key={row.name}>
                      <tr className={`transition-all duration-350 ${
                        isDimmed ? "opacity-35 grayscale-[25%] bg-slate-50/30" : ""
                      } ${
                        isHighlighted 
                          ? "bg-teal-50/60 border-l-4 border-l-teal-500 font-semibold" 
                          : isExpanded 
                            ? "bg-slate-50/80" 
                            : "hover:bg-slate-50/50"
                      }`}>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{row.name}</span>
                            {isAffected && (
                              <span className="inline-flex items-center px-1.5 py-0.5 bg-teal-100 text-teal-800 rounded-full text-[9px] font-bold">
                                Affected Match
                              </span>
                            )}
                            {row.name === highlightedLearnerName && !isAffected && (
                              <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[9px] font-bold animate-pulse">
                                Active Trace Target
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">{row.region}</td>
                        <td className="py-3.5 px-4 text-teal-700 font-semibold">{row.progress}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusBadgeClass(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {LEARNER_GAP_INFO[row.name]?.gaps.map((gap, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-medium">
                                {gap}
                              </span>
                            )) || <span className="text-slate-400">-</span>}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{row.blocker}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                const info = LEARNER_GAP_INFO[row.name];
                                if (info) {
                                  if (setSelectedGroup) setSelectedGroup(info.group);
                                  if (setSelectedDomain) setSelectedDomain(info.domain);
                                }
                                if (onNavigate) {
                                  onNavigate("equity_gaps");
                                }
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 hover:text-teal-950 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              View Related Support Gaps
                            </button>
                            <button
                              onClick={() => setExpandedStudent(isExpanded ? null : row.name)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {isExpanded ? "Hide" : "Signals"}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="bg-slate-50/50 px-6 py-4 border-y border-slate-200">
                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-left animate-fade-in max-w-4xl">
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-3 border-r border-slate-100 pr-4">
                                  <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Learner Profile</span>
                                  <h4 className="font-display font-bold text-sm text-slate-800">{row.name}</h4>
                                  <span className="text-xs text-slate-500 block mt-1">Age: {age} Years Old</span>
                                  <span className={`inline-block mt-3 px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeClass(row.status)}`}>
                                    Status: {row.status}
                                  </span>
                                </div>
                                <div className="md:col-span-9 pl-0 md:pl-2">
                                  <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">AI-Detected Learning Signals & Context</span>
                                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                                    {persona?.bio || "No specific student bio registered."}
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 pt-3 border-t border-slate-100">
                                    <div>
                                      <span className="text-[10px] font-mono text-slate-400 uppercase block">Active Barriers</span>
                                      <span className="text-xs font-semibold text-slate-700">{row.blocker}</span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] font-mono text-slate-400 uppercase block">Recommended Support</span>
                                      <span className="text-xs font-semibold text-teal-600">
                                        {row.status === "At Risk" 
                                          ? "Structured local mentoring & internet packages"
                                          : "Bilingual mentoring circles & visual learning kits"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {isDemoActive && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
          <div>
            <h4 className="font-display font-bold text-slate-800 text-sm">Next Step in Walkthrough</h4>
            <p className="text-xs text-slate-500">Examine specific support gaps across domains (such as Digital Access and Mentoring).</p>
          </div>
          <button
            onClick={() => onNavigate && onNavigate("equity_gaps")}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            Next: View Support Gaps
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}
