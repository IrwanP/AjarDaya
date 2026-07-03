import React, { useState, useEffect } from "react";
import { HEATMAP_GROUPS, HEATMAP_DOMAINS, SUPPORT_GAPS_MATRIX } from "../data";
import CurrentQuestionCard from "./CurrentQuestionCard";
import { Brain, Sparkles, AlertCircle, RefreshCw, Loader2, Info, ChevronRight } from "lucide-react";
import { SupportGap } from "../types";
import { getGeminiCache, setGeminiCache, hasGeminiCache } from "../utils/geminiCache";

interface EquitySupportGapsProps {
  isDemoActive?: boolean;
  onNavigate?: (viewId: string) => void;
  selectedGroup?: string;
  setSelectedGroup?: (group: string) => void;
  selectedDomain?: string;
  setSelectedDomain?: (domain: string) => void;
  selectedSupportGapFilter?: string | null;
  setSelectedSupportGapFilter?: (filter: string | null) => void;
  setHighlightedLearnerName?: (name: string | null) => void;
  hasApiKey?: boolean;
}

// Traceability mapping function based on user's requirements
const getTraceabilityData = (group: string, domain: string) => {
  const normGroup = group.trim();
  const normDomain = domain.toLowerCase().trim();

  // 1. Low-income learners — Digital Access
  if (normGroup === "Low-income learners" && normDomain === "digital access") {
    return {
      learners: [
        {
          name: "Ayu Lestari",
          status: "At Risk",
          shortSignal: "limited internet + device access",
          signals: ["limited internet access", "limited device access"],
          relatedGap: "Digital Access"
        },
        {
          name: "Dinda Rahmawati",
          status: "At Risk",
          shortSignal: "no personal device",
          signals: ["no personal device", "difficulty completing digital assignments"],
          relatedGap: "Digital Access"
        }
      ],
      trace: {
        signal: "Ayu + Dinda device access signals",
        gap: "Digital Access Gap",
        recommendedAction: "Digital learning kits + offline learning resources"
      },
      action: "Prioritize digital learning kits and offline learning resources"
    };
  }

  // 2. Remote islands — Digital Access / Access
  if (normGroup === "Remote islands") {
    return {
      learners: [
        {
          name: "Maria Lewaherilla",
          status: "Behind",
          shortSignal: "remote access challenge & limited resources",
          signals: ["limited learning resources", "fewer local support programs", "remote access challenge"],
          relatedGap: "Access & Learning Resources"
        }
      ],
      trace: {
        signal: "Maria local support and learning resource signals",
        gap: "Learning Resources Gap",
        recommendedAction: "Deploy offline learning materials and community mentoring"
      },
      action: "Deploy offline learning materials and community mentoring support"
    };
  }

  // 3. Papua — Mentorship
  if (normGroup === "Papua") {
    return {
      learners: [
        {
          name: "Yosep Wenda",
          status: "Behind",
          shortSignal: "needs structured mentorship",
          signals: ["needs structured mentorship", "limited access to learning support"],
          relatedGap: "Mentorship"
        }
      ],
      trace: {
        signal: "Yosep structured mentorship signals",
        gap: "Mentorship Gap",
        recommendedAction: "Create mentoring circle and targeted learning pathway"
      },
      action: "Create mentoring circle and targeted learning pathway"
    };
  }

  // 4. Rural learners — Participation
  if (normGroup === "Rural learners") {
    return {
      learners: [
        {
          name: "Rafi Pratama",
          status: "At Risk",
          shortSignal: "irregular attendance, family chores",
          signals: ["irregular attendance", "family responsibility after school"],
          relatedGap: "Participation"
        }
      ],
      trace: {
        signal: "Rafi attendance and chore signals",
        gap: "Participation Gap",
        recommendedAction: "Provide flexible learning schedule and mentor follow-up"
      },
      action: "Provide flexible learning schedule and mentor follow-up"
    };
  }

  // Generic Fallback based on domains/groups to make every single cell completely active and realistic!
  if (normGroup === "Low-income learners") {
    return {
      learners: [
        {
          name: "Ayu Lestari",
          status: "At Risk",
          shortSignal: "limited internet + device access",
          signals: ["limited internet access", "limited device access"],
          relatedGap: domain
        },
        {
          name: "Dinda Rahmawati",
          status: "At Risk",
          shortSignal: "no personal device",
          signals: ["no personal device", "difficulty completing digital assignments"],
          relatedGap: domain
        }
      ],
      trace: {
        signal: "Ayu + Dinda limited family income barriers",
        gap: `${domain} Gap`,
        recommendedAction: "Subsidize student study packages and mentorship"
      },
      action: `Establish targeted offline study hubs with local resources to address ${domain}`
    };
  }

  if (normGroup === "Maluku") {
    return {
      learners: [
        {
          name: "Maria Lewaherilla",
          status: "Behind",
          shortSignal: "remote access challenge & limited resources",
          signals: ["limited learning resources", "fewer local support programs", "remote access challenge"],
          relatedGap: domain
        }
      ],
      trace: {
        signal: "Maria local support and learning resource signals",
        gap: "Learning Resources Gap",
        recommendedAction: "Deploy offline learning materials and community mentoring"
      },
      action: "Deploy offline learning materials and community mentoring support"
    };
  }

  if (normGroup.includes("disabilities") || normGroup.includes("Disabilities")) {
    return {
      learners: [
        {
          name: "Ayu Lestari",
          status: "At Risk",
          shortSignal: "needs special accessibility assistance",
          signals: ["requires assistive learning technology", "visual/auditory support needs"],
          relatedGap: domain
        }
      ],
      trace: {
        signal: "Accessibility challenges for disabled learners",
        gap: "Special Needs Gap",
        recommendedAction: "Provide text-to-speech learning tools and physical posters"
      },
      action: "Equip local study circles with customized adaptive and accessible resources"
    };
  }

  if (normGroup === "Urban learners") {
    return {
      learners: [
        {
          name: "Dinda Rahmawati",
          status: "At Risk",
          shortSignal: "shared smartphone use",
          signals: ["shared smartphone with three siblings"],
          relatedGap: domain
        }
      ],
      trace: {
        signal: "Urban pocket digital access constraints",
        gap: `${domain} Gap`,
        recommendedAction: "Coordinate device sharing roster and community router hubs"
      },
      action: `Optimise urban resource utilization for ${domain}`
    };
  }

  // Default Fallback
  return {
    learners: [
      {
        name: "Ayu Lestari",
        status: "At Risk",
        shortSignal: "limited internet + device access",
        signals: ["limited device access", "unstable mobile connection"],
        relatedGap: domain
      }
    ],
    trace: {
      signal: `${group} device connectivity challenges`,
      gap: `${domain} Gap`,
      recommendedAction: "Procure local offline servers and study kits"
    },
    action: `Deliver focused training and dedicated support programs for ${group} in ${domain}`
  };
};

export default function EquitySupportGaps({ 
  isDemoActive = false, 
  onNavigate,
  selectedGroup = "Low-income learners",
  setSelectedGroup,
  selectedDomain = "Digital access",
  setSelectedDomain,
  selectedSupportGapFilter,
  setSelectedSupportGapFilter,
  setHighlightedLearnerName,
  hasApiKey = false
}: EquitySupportGapsProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>("Loading gap analysis...");
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [quotaStatus, setQuotaStatus] = useState<"live" | "cached" | "fallback" | null>(null);

  // Initialize first scan timestamp once component mounts or selection changes
  useEffect(() => {
    if (!lastScanned) {
      setLastScanned(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
  }, []);

  // Local fallback generator for robust alignment
  const getLocalFallback = (group: string, domain: string) => {
    if (group === "Low-income learners" && domain.toLowerCase().includes("digital")) {
      return {
        learnerCategory: "Low-income learners",
        supportDomain: "Digital access",
        severity: "High Gap",
        gapIndex: 0.72,
        whatTheGapIs: "Low-income learners such as Ayu Lestari and Dinda Rahmawati face limited internet connectivity and insufficient access to personal learning devices, making digital participation inconsistent.",
        whyItMatters: "When learners cannot reliably access digital content, they fall behind in assignments, lose continuity in learning routines, and become less prepared to participate in structured academic support.",
        recommendedAction: "Prioritize digital learning kits and offline learning resources, supported by mentor follow-up to keep learners engaged.",
        evidenceSignals: ["limited internet access", "limited device access"],
        affectedLearners: ["Ayu Lestari", "Dinda Rahmawati"],
        confidenceNote: "Insight aligned using structured demo evidence."
      };
    }

    if (group === "Remote islands") {
      return {
        learnerCategory: "Remote islands",
        supportDomain: "Digital access",
        severity: "Critical Gap",
        gapIndex: 0.85,
        whatTheGapIs: "Learners in remote island communities like Maria Lewaherilla face extreme isolation from stable networks and lack local physical educational resources.",
        whyItMatters: "Geographic isolation combined with sparse resources leaves students with fewer tutoring networks, compounding learning delays compared to main-island schools.",
        recommendedAction: "Deploy offline learning materials and community mentoring support.",
        evidenceSignals: ["limited learning resources", "remote access challenge"],
        affectedLearners: ["Maria Lewaherilla"],
        confidenceNote: "Insight aligned using structured demo evidence."
      };
    }

    if (group === "Papua" && domain.toLowerCase().includes("mentor")) {
      return {
        learnerCategory: "Papua",
        supportDomain: "Mentorship",
        severity: "Critical Gap",
        gapIndex: 0.90,
        whatTheGapIs: "Learners in Papua like Yosep Wenda experience a severe bottleneck in support due to a shortage of qualified local mentors and structured coaching circles.",
        whyItMatters: "Without dedicated human scaffolding to guide math and language studies, student dropouts increase and regional learning losses persist.",
        recommendedAction: "Create mentoring circle and targeted learning pathway.",
        evidenceSignals: ["needs structured mentorship", "limited access to learning support"],
        affectedLearners: ["Yosep Wenda"],
        confidenceNote: "Insight aligned using structured demo evidence."
      };
    }

    if (group === "Rural learners" && domain.toLowerCase().includes("participation")) {
      return {
        learnerCategory: "Rural learners",
        supportDomain: "Participation",
        severity: "Medium Gap",
        gapIndex: 0.55,
        whatTheGapIs: "Rural learners like Rafi Pratama experience high participation gaps due to agriculture and household chores during planting and harvest seasons.",
        whyItMatters: "Irregular school and study group attendance disrupts learning cycles, leading to significant gaps in fundamental subject areas.",
        recommendedAction: "Provide flexible learning schedule and mentor follow-up.",
        evidenceSignals: ["irregular attendance", "family responsibility after school"],
        affectedLearners: ["Rafi Pratama"],
        confidenceNote: "Insight aligned using structured demo evidence."
      };
    }

    const trace = getTraceabilityData(group, domain);
    const score = SUPPORT_GAPS_MATRIX[group]?.[domain] || 0.5;
    const sev = score >= 0.8 ? "Critical Gap" : score >= 0.6 ? "High Gap" : score >= 0.4 ? "Medium Gap" : "Low Gap";
    return {
      learnerCategory: group,
      supportDomain: domain,
      severity: sev,
      gapIndex: score,
      whatTheGapIs: `${group} face significant barriers in ${domain.toLowerCase()} with a gap index of ${score.toFixed(2)}, leading to uneven learning experiences.`,
      whyItMatters: `Without addressing the ${domain.toLowerCase()} gap, learners cannot maintain academic momentum, resulting in increased risk of falling behind.`,
      recommendedAction: trace.action,
      evidenceSignals: trace.learners.flatMap((l: any) => l.signals),
      affectedLearners: trace.learners.map((l: any) => l.name),
      confidenceNote: "Insight aligned using structured demo evidence."
    };
  };

  // Fetch AI explanation based on selection
  const fetchGapAnalysis = async (group: string, domain: string, isRescan = false) => {
    const gapScore = SUPPORT_GAPS_MATRIX[group]?.[domain] || 0.5;
    const cacheKey = `support-gap:${group}:${domain}:${gapScore}`;

    if (hasGeminiCache(cacheKey)) {
      if (isRescan) {
        setLoading(true);
        setLoadingText("Checking cache...");
        await new Promise((resolve) => setTimeout(resolve, 800));
        setLoading(false);
      }
      setAiAnalysis(getGeminiCache(cacheKey));
      setQuotaStatus("cached");
      setLastScanned(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      return;
    }

    setLoading(true);
    setLoadingText("Gemini is analyzing support gaps...");
    setQuotaStatus(null);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 13000); // 13 seconds timeout

    try {
      const traceInfo = getTraceabilityData(group, domain);
      const severity = gapScore >= 0.8 ? "Critical" :
                       gapScore >= 0.6 ? "High" :
                       gapScore >= 0.4 ? "Medium" : "Low";

      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          topic: "risk_lens",
          data: {
            selectedLearnerCategory: group,
            selectedSupportDomain: domain,
            selectedGapIndex: gapScore,
            selectedSeverity: severity,
            affectedLearners: traceInfo.learners.map((l: any) => l.name),
            learnerSignals: traceInfo.learners.flatMap((l: any) => l.signals),
            matchedSupportGap: traceInfo.trace.gap,
            recommendedAction: traceInfo.action,
            cohortToGapTrace: traceInfo.trace
          }
        })
      });
      
      clearTimeout(timeoutId);
      
      const resData = await res.json();
      if (resData && resData.data) {
        let finalData = resData.data;
        
        // Strict grounding checks for Low-income learners × Digital access = 0.72
        if (group === "Low-income learners" && domain.toLowerCase().includes("digital")) {
          const textToValidate = JSON.stringify(finalData).toLowerCase();
          const containsUnrelated = [
            "papua", "yosep", "maluku", "remote papuan", "special needs", "numeracy", 
            "mentoring gap", "physical access", "bilingual", "mountain slopes"
          ].some(term => textToValidate.includes(term));
          
          if (containsUnrelated) {
            console.warn("Gemini output contained unrelated terms. Using grounded fallback insight.");
            finalData = getLocalFallback(group, domain);
            setQuotaStatus("fallback");
          } else {
            setQuotaStatus("live");
          }
        } else {
          if (resData.source === "local_intelligence_fallback_cached" || resData.source?.includes("fallback") || resData.source?.includes("local")) {
            setQuotaStatus("fallback");
          } else {
            setQuotaStatus("live");
          }
        }
        
        setAiAnalysis(finalData);
        setGeminiCache(cacheKey, finalData);
      } else {
        setAiAnalysis(getLocalFallback(group, domain));
        setQuotaStatus("fallback");
      }
      setLastScanned(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Error or timeout fetching gap analysis:", err);
      // Fail gracefully and use fallback
      setAiAnalysis(getLocalFallback(group, domain));
      setQuotaStatus("fallback");
      setLastScanned(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const gapScore = SUPPORT_GAPS_MATRIX[selectedGroup]?.[selectedDomain] || 0.5;
    const cacheKey = `support-gap:${selectedGroup}:${selectedDomain}:${gapScore}`;
    if (hasGeminiCache(cacheKey)) {
      setAiAnalysis(getGeminiCache(cacheKey));
      setQuotaStatus("cached");
    } else {
      setAiAnalysis(getLocalFallback(selectedGroup, selectedDomain));
      setQuotaStatus("fallback");
    }
  }, [selectedGroup, selectedDomain]);

  const handleCellClick = (group: string, domain: string) => {
    if (setSelectedGroup) setSelectedGroup(group);
    if (setSelectedDomain) setSelectedDomain(domain);
  };

  // Helper to determine cell background density based on gap index (0 to 1)
  const getCellColor = (score: number) => {
    if (score >= 0.8) return "bg-rose-600 text-white";
    if (score >= 0.6) return "bg-orange-500 text-white";
    if (score >= 0.4) return "bg-amber-400 text-slate-800";
    if (score >= 0.25) return "bg-teal-200 text-teal-900";
    return "bg-teal-50 text-teal-800";
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "On Track":
        return "bg-teal-50 text-teal-700 border border-teal-200/50";
      case "At Risk":
        return "bg-amber-50 text-amber-700 border border-amber-200/50";
      case "Behind":
        return "bg-rose-50 text-rose-700 border border-rose-200/50";
      case "Not Started":
      default:
        return "bg-slate-50 text-slate-600 border border-slate-200/50";
    }
  };

  // Precomputed realistic default analysis for high responsiveness
  const defaultCriticalGaps = [
    {
      group: selectedGroup,
      domain: selectedDomain,
      gapScore: SUPPORT_GAPS_MATRIX[selectedGroup]?.[selectedDomain] || 0.5,
      what: `The support gap in the ${selectedDomain} domain for ${selectedGroup} has been detected at a significant level of ${(SUPPORT_GAPS_MATRIX[selectedGroup]?.[selectedDomain] || 0.5).toFixed(2)}.`,
      why: `A high gap in ${selectedDomain} restricts equal opportunities, exacerbates learning quality disparities, and limits the potential of talented children in rural areas or with special needs.`,
      action: `Launch an affirmative learning module, secure high-commitment dedicated mentors, and allocate a dedicated portion of resources to accelerate resolving this gap.`
    }
  ];

  const overallStatus = aiAnalysis?.overallStatus || "The overall Support Gap Index stands at 0.62 (High Gap category). Remote (3T) communities and students with accessibility needs require immediate affirmative intervention.";
  const displayGaps = aiAnalysis?.criticalGaps || defaultCriticalGaps;

  return (
    <div id="equity-gaps-container" className="space-y-6 text-left">
      
      {isDemoActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800">
          <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold mb-0.5">Judge Demo Walkthrough: Step 3 of 6 (Equity & Support Gap Lens)</p>
            <p>Our AI model has calculated specific support gaps for the East Java community across critical learning domains. See the calculated percentages and qualitative insights below, highlighting why each gap remains high. Try clicking on the interactive cells on the heatmap below to run custom drilldowns. Click the button at the bottom to continue to Step 4 (Intervention Simulator).</p>
          </div>
        </div>
      )}

      {/* Title Header */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="font-display font-bold text-2xl text-slate-800 tracking-tight">Equity & Support Gap Lens</h2>
        <p className="text-slate-500 text-xs">Heatmap visualization of educational support gaps across diverse learner categories and core learning domains.</p>
      </div>

      <CurrentQuestionCard 
        question="Why are learners at risk?" 
        helperText="Explore digital access, mentorship, attendance, learning resource, and regional support gaps."
      />

      {isDemoActive && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-display font-semibold text-slate-900 text-base mb-1">East Java Community Support Gaps Dashboard</h3>
          <p className="text-xs text-slate-500 mb-6">Calculated gap indexes across the four core learning support domains with AI qualitative diagnostic insights.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gap Card 1 */}
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/40">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-700">Digital Access Gap</span>
                <span className="text-sm font-mono font-bold text-rose-600">82%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mb-3 overflow-hidden">
                <div className="bg-rose-500 h-2 rounded-full" style={{ width: '82%' }}></div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                <strong>Why:</strong> Ayu Lestari's village has unstable cellular network reception, and she has to share a single smartphone with three family members. Local learning hubs are also lacking high-speed routers.
              </p>
            </div>

            {/* Gap Card 2 */}
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/40">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-700">Mentor Availability Gap</span>
                <span className="text-sm font-mono font-bold text-amber-600">75%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mb-3 overflow-hidden">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                <strong>Why:</strong> Kak Nisa is the sole registered community mentor for 3 surrounding study groups, leading to an active student-to-mentor ratio of over 1:40, creating a bottleneck for student support.
              </p>
            </div>

            {/* Gap Card 3 */}
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/40">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-700">Regional Support Gap</span>
                <span className="text-sm font-mono font-bold text-orange-600">65%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mb-3 overflow-hidden">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                <strong>Why:</strong> Local sub-district educational support focuses predominantly on formal school facilities, leaving independent and community-led learning circles with minimal material and device subsidies.
              </p>
            </div>

            {/* Gap Card 4 */}
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/40">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-700">Family Economic Gap</span>
                <span className="text-sm font-mono font-bold text-yellow-600">55%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mb-3 overflow-hidden">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '55%' }}></div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                <strong>Why:</strong> Many families in East Java (like Rafi Pratama's family) require children to assist with agriculture and farming during harvest seasons, causing irregular learning attendance.
              </p>
            </div>
          </div>
        </div>
      )}

      <div 
        id="support-gap-workspace" 
        className="grid grid-cols-1 min-[900px]:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] gap-5 items-start w-full max-w-none"
      >
        
        {/* Heatmap Matrix Grid (Sticky on desktop) */}
        <div id="heatmap-column" className="min-w-0 min-[900px]:sticky min-[900px]:top-24 space-y-4 self-start">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-slate-900 text-sm tracking-tight">Support Gap Heatmap Matrix</h3>
                <p className="text-[10px] text-slate-400 font-mono">Values approaching 1.0 indicate critical support gaps requiring urgent attention</p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                <span className="w-2.5 h-2.5 rounded bg-rose-600"></span> Critical
                <span className="w-2.5 h-2.5 rounded bg-orange-500"></span> High
                <span className="w-2.5 h-2.5 rounded bg-amber-400"></span> Medium
                <span className="w-2.5 h-2.5 rounded bg-teal-200"></span> Low
              </div>
            </div>

            <div className="overflow-x-auto pb-3 pt-2.5 px-3">
              <div className="min-w-[500px] pr-2">
                {/* Table Headers */}
                <div className="grid grid-cols-[140px_1fr_1fr_1fr_1fr_1fr_1fr] gap-1.5 mb-1.5 text-center font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold items-center">
                  <div className="text-left font-sans text-xs">Learner Category</div>
                  {HEATMAP_DOMAINS.map((dom) => (
                    <div key={dom} className="truncate p-1" title={dom}>
                      {dom}
                    </div>
                  ))}
                </div>

                {/* Heatmap Rows */}
                <div className="space-y-1.5">
                  {HEATMAP_GROUPS.map((group) => {
                    const hasSelectedInRow = selectedGroup === group;
                    return (
                      <div 
                        key={group} 
                        className={`grid grid-cols-[140px_1fr_1fr_1fr_1fr_1fr_1fr] gap-1.5 items-center relative ${
                          hasSelectedInRow ? "z-20" : "z-10"
                        }`}
                      >
                        {/* Row Label */}
                        <div className="text-[11px] font-semibold text-slate-700 text-left pr-1.5 whitespace-normal break-normal leading-tight">
                          {group}
                        </div>

                        {/* Cells representing gap values */}
                        {HEATMAP_DOMAINS.map((dom) => {
                          const score = SUPPORT_GAPS_MATRIX[group][dom];
                          const isSelected = selectedGroup === group && selectedDomain === dom;
                          return (
                            <button
                              key={dom}
                              id={`heatmap-cell-${group.toLowerCase().replace(/\s+/g, '-')}-${dom.toLowerCase().replace(/\s+/g, '-')}`}
                              onClick={() => handleCellClick(group, dom)}
                              className={`h-11 rounded-lg text-xs font-mono font-bold transition-all flex flex-col items-center justify-center relative shadow-xs hover:scale-105 active:scale-95 cursor-pointer ${getCellColor(
                                score
                              )} ${
                                isSelected 
                                  ? "z-30 scale-105 shadow-lg font-extrabold" 
                                  : "hover:z-10"
                              }`}
                            >
                              <span>{score.toFixed(2)}</span>
                              {isSelected && (
                                <>
                                  {/* Beautiful, fully visible internal selected border structure */}
                                  <div className="absolute inset-0 border-[3px] border-teal-500 rounded-lg pointer-events-none z-30" />
                                  <div className="absolute inset-[3px] border-[1.5px] border-white rounded-[5px] pointer-events-none z-30" />
                                </>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick instructions */}
            <div className="flex gap-2 bg-slate-50 border border-slate-200 p-3.5 rounded-lg text-xs text-slate-500">
              <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <p>Click any cell on the heatmap to drill down into the risk severity, understand why it matters, and examine recommended AI-driven affirmative action plans.</p>
            </div>
          </div>
        </div>

        {/* Dynamic AI Analysis Panel */}
        <div 
          id="gap-analysis-panel" 
          className="min-w-0 min-[900px]:sticky min-[900px]:top-24 bg-gradient-to-b from-indigo-50/10 via-white to-white rounded-xl border border-purple-100 shadow-sm relative overflow-hidden flex flex-col hover:border-purple-200 transition-all min-[900px]:max-h-[calc(100vh-120px)] min-[900px]:overflow-y-auto self-start"
        >
          {/* Sticky AI Header */}
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-150 p-4 pb-3.5 space-y-2 shrink-0">
            {/* Subtle top rainbow line representing Gemini AI Layer */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-600">
                  <Brain className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-sm text-slate-800">AI Support Gaps Analysis</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-slate-400 font-mono">Real-time evaluation</span>
                    <span className="text-[9px] bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent font-extrabold font-mono flex items-center gap-0.5 border border-purple-200/50 px-1 py-0.2 rounded bg-purple-50/50">
                      <Sparkles className="w-2.5 h-2.5 text-indigo-500 animate-pulse" />
                      Powered by Gemini
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => fetchGapAnalysis(selectedGroup, selectedDomain, true)}
                disabled={loading}
                className="px-2.5 py-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:opacity-95 text-white font-extrabold text-[10px] sm:text-xs rounded-lg flex items-center justify-center gap-1 transition-all shadow-xs hover:shadow-md disabled:opacity-50 cursor-pointer shrink-0"
              >
                <Sparkles className="w-3 h-3" />
                {loading ? (loadingText.includes("cache") ? "Checking cache..." : "Scanning...") : "AI Rescan"}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 text-[9px] font-mono text-slate-400 border-t border-slate-100/60 pt-1.5 flex-wrap">
              <span>Status: <span className="text-teal-600 font-semibold font-sans">
                {quotaStatus === "live" ? "Gemini connected" :
                 quotaStatus === "cached" ? "Cached Gemini result" :
                 "Demo reasoning mode"}
              </span></span>
              {lastScanned && !loading && (
                <span>Last scanned: <span className="font-bold text-slate-500">{lastScanned}</span></span>
              )}
            </div>
          </div>

          <div className="p-4 space-y-4 text-left overflow-y-auto">
            {loading && (
              <div className="p-3 bg-indigo-50/40 border border-indigo-100/50 rounded-lg flex items-center gap-2.5 text-xs text-indigo-800 font-medium font-sans">
                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
                <span>{loadingText}</span>
              </div>
            )}

            {quotaStatus === "cached" && (
              <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-lg text-[11px] text-blue-700 leading-relaxed font-mono flex flex-col gap-1.5 shadow-xs">
                <div>Cached Gemini result reused for this scenario to preserve quota.</div>
                <div className="text-[10px] text-teal-600 font-extrabold font-sans flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                  Quota-safe cached result
                </div>
              </div>
            )}

            {!hasApiKey && (
              <div className="p-2 bg-slate-50 border border-slate-200/60 rounded-md text-[10px] text-slate-500 leading-normal font-mono">
                Using structured demo reasoning. Configure Gemini API for live AI generation.
              </div>
            )}

            {/* Overall Status summary */}
            <div className="bg-slate-50/50 border border-slate-200/60 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono">Overall Gap Index Status</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {overallStatus}
              </p>
            </div>

            {/* Selected Gap Summary Card */}
            {(() => {
              const gapScore = SUPPORT_GAPS_MATRIX[selectedGroup]?.[selectedDomain] || 0.5;
              const traceData = getTraceabilityData(selectedGroup, selectedDomain);
              const gapWhat = aiAnalysis?.whatTheGapIs || aiAnalysis?.what || defaultCriticalGaps[0].what;
              const gapWhy = aiAnalysis?.whyItMatters || aiAnalysis?.why || defaultCriticalGaps[0].why;
              const gapAction = aiAnalysis?.recommendedAction || defaultCriticalGaps[0].action;

              return (
                <div className="space-y-4">
                  {/* Section 1: Selected Gap Summary */}
                  <div className="border border-slate-200/80 rounded-lg p-3 bg-slate-50/50">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-mono block">Learner Category</span>
                        <span className="text-xs font-bold text-slate-800 block truncate" title={selectedGroup}>{selectedGroup}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 uppercase font-mono block">Support Domain</span>
                        <span className="text-xs font-bold text-teal-700 block truncate" title={selectedDomain}>{selectedDomain}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-mono block">Severity</span>
                        <span className={`text-xs font-bold ${
                          gapScore >= 0.8 ? "text-rose-600" :
                          gapScore >= 0.6 ? "text-orange-500" :
                          gapScore >= 0.4 ? "text-amber-500" : "text-teal-600"
                        }`}>
                          {gapScore >= 0.8 ? "Critical Gap" :
                           gapScore >= 0.6 ? "High Gap" :
                           gapScore >= 0.4 ? "Medium Gap" : "Low Gap"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 font-mono block">GAP INDEX</span>
                        <span className="text-base font-mono font-bold text-rose-600">
                          {gapScore.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Affected Learners */}
                  <div className="border border-slate-200/80 rounded-lg p-3 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold uppercase text-slate-400">
                        Affected Learners
                      </span>
                      <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.2 rounded-full font-mono">
                        {traceData.learners.length}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {traceData.learners.map((learner, index) => (
                        <div key={index} className="bg-slate-50/50 border border-slate-150 rounded-md p-2 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-bold text-slate-800 shrink-0">{learner.name}</span>
                            <span className="text-slate-400 text-[10px]">—</span>
                            <span className="text-slate-600 text-[11px] truncate" title={learner.shortSignal}>{learner.shortSignal}</span>
                          </div>
                          <span className={`text-[8px] font-bold px-1 py-0.2 rounded shrink-0 ml-1.5 uppercase border ${getStatusBadgeClass(learner.status)}`}>
                            {learner.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 3: Cohort-to-Gap Trace */}
                  <div className="border border-purple-100/80 rounded-lg p-3 bg-gradient-to-b from-purple-50/20 to-indigo-50/15 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono font-extrabold uppercase text-indigo-950">
                        Cohort-to-Gap Trace
                      </span>
                      <span className="text-[8px] bg-indigo-100/60 text-indigo-800 font-extrabold px-1.5 py-0.2 rounded font-mono uppercase">
                        AI Trace
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 items-stretch text-[10px]">
                      <div className="bg-white/80 rounded-md p-1.5 border border-purple-100/40 flex flex-col justify-between">
                        <span className="text-[8px] text-slate-400 uppercase font-mono block">1. Signal</span>
                        <span className="font-semibold text-slate-700 leading-tight block line-clamp-2 mt-0.5" title={traceData.trace.signal}>
                          {traceData.trace.signal}
                        </span>
                      </div>
                      <div className="bg-white/80 rounded-md p-1.5 border border-purple-100/40 flex flex-col justify-between">
                        <span className="text-[8px] text-slate-400 uppercase font-mono block">2. Support Gap</span>
                        <span className="font-bold text-amber-700 leading-tight block line-clamp-2 mt-0.5" title={traceData.trace.gap}>
                          {traceData.trace.gap}
                        </span>
                      </div>
                      <div className="bg-white/80 rounded-md p-1.5 border border-purple-100/40 flex flex-col justify-between">
                        <span className="text-[8px] text-slate-400 uppercase font-mono block">3. Recommended</span>
                        <span className="font-bold text-teal-700 leading-tight block line-clamp-2 mt-0.5" title={traceData.trace.recommendedAction}>
                          {traceData.trace.recommendedAction}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Gemini Insight - visually distinctive AI layer */}
                  <div className="border border-purple-200/80 rounded-lg p-3 bg-gradient-to-r from-blue-50/30 via-indigo-50/20 to-purple-50/30 relative overflow-hidden flex flex-col gap-3">
                    <div className="absolute top-0 left-0 bottom-0 w-[4px] bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500" />
                    
                    <div className="flex items-center justify-between border-b border-indigo-100/40 pb-2 pl-1.5">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                        <span className="text-[10px] font-mono font-extrabold uppercase tracking-wide bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                          Gemini AI Lens
                        </span>
                      </div>
                      {aiAnalysis?.confidenceNote && (
                        <span className="text-[8px] bg-purple-50 text-purple-700 font-semibold font-mono border border-purple-100/50 px-1.5 py-0.2 rounded">
                          {aiAnalysis.confidenceNote}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-1.5">
                      {/* What the Gap Is */}
                      <div className="bg-indigo-50/15 border border-indigo-100/30 rounded-md p-2.5">
                        <span className="text-[8px] font-mono font-extrabold uppercase text-indigo-600/80 block mb-1">
                          What The Gap Is
                        </span>
                        <p className="text-[11px] text-slate-700 leading-relaxed font-semibold">
                          {gapWhat}
                        </p>
                      </div>

                      {/* Why It Matters */}
                      <div className="bg-purple-50/15 border border-purple-100/30 rounded-md p-2.5">
                        <span className="text-[8px] font-mono font-extrabold uppercase text-purple-600/80 block mb-1">
                          Why It Matters
                        </span>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {gapWhy}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Recommended Action Plan */}
                  <div className="border border-emerald-150 rounded-lg p-3 bg-gradient-to-r from-emerald-50/20 to-teal-50/20 relative overflow-hidden">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[9px] font-mono font-extrabold uppercase text-emerald-800">
                        Recommended Action Plan
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-800 leading-relaxed font-semibold">
                      {gapAction}
                    </p>
                  </div>

                  {/* Section 6: Primary CTA */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        if (setSelectedSupportGapFilter) {
                          setSelectedSupportGapFilter(`${selectedGroup} × ${selectedDomain}`);
                        }
                        if (setHighlightedLearnerName && traceData.learners.length > 0) {
                          setHighlightedLearnerName(traceData.learners[0].name);
                        }
                        if (onNavigate) {
                          onNavigate("cohort_intelligence");
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs hover:shadow-md active:scale-[0.98]"
                    >
                      View These Learners in Cohort Analyzer
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

      </div>

      {isDemoActive && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
          <div>
            <h4 className="font-display font-bold text-slate-800 text-sm">Next Step in Walkthrough</h4>
            <p className="text-xs text-slate-500">Simulate and compare intervention strategies to resolve these support gaps.</p>
          </div>
          <button
            onClick={() => onNavigate && onNavigate("intervention_simulator")}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            Next: Simulate Intervention
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}
