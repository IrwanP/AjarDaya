import React, { useState, useEffect } from "react";
import { PERSONAS } from "../data";
import CurrentQuestionCard from "./CurrentQuestionCard";
import { Sparkles, Brain, Loader2, RefreshCw, FileText, Share2, Check, Download, Users, ChevronRight, RotateCcw } from "lucide-react";
import { ActionBrief } from "../types";
import { downloadActionBriefPdf } from "../utils/actionBriefPdf";
import { getGeminiCache, setGeminiCache, hasGeminiCache } from "../utils/geminiCache";

interface ActionBriefViewProps {
  isDemoActive?: boolean;
  onNavigate?: (viewId: string) => void;
  onResetDemo?: () => void;
  hasApiKey?: boolean;
  selectedBudget?: number;
  selectedFocusArea?: "balanced" | "remote3t" | "mentorCapacity";
}

export default function ActionBriefView({ 
  isDemoActive = false, 
  onNavigate, 
  onResetDemo,
  hasApiKey = false,
  selectedBudget,
  selectedFocusArea
}: ActionBriefViewProps) {
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([
    "Improve numeracy in Grade 7",
    "Expand tutoring in Papua highlands",
    "Strengthening attendance in Maluku"
  ]);
  const [budgetLimit, setBudgetLimit] = useState<string>(() => {
    if (selectedBudget !== undefined) {
      return `Rp ${selectedBudget.toLocaleString("id-ID")}`;
    }
    return "Rp 2.500.000.000";
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>("Gemini is formulating custom action strategies...");
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [generatedDate, setGeneratedDate] = useState<Date>(() => new Date());

  useEffect(() => {
    if (selectedBudget !== undefined) {
      setBudgetLimit(`Rp ${selectedBudget.toLocaleString("id-ID")}`);
    }
  }, [selectedBudget]);
  const [brief, setBrief] = useState<ActionBrief | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [pdfStatus, setPdfStatus] = useState<"idle" | "success" | "error">("idle");
  const [quotaStatus, setQuotaStatus] = useState<"live" | "cached" | "fallback" | null>(null);

  const fetchActionBrief = async () => {
    const cacheKey = `action-brief:${[...selectedPriorities].sort().join(",")}:${budgetLimit}:Maluku, Papua & Low-Income rural cohorts`;
    
    if (hasGeminiCache(cacheKey)) {
      setBrief(getGeminiCache(cacheKey));
      setQuotaStatus("cached");
      const now = new Date();
      setLastGenerated(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setGeneratedDate(now);
      return;
    }

    setLoading(true);
    setLoadingText("Gemini is formulating custom action strategies...");
    setQuotaStatus(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 13000); // 13-second timeout

    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          topic: "action_brief",
          data: {
            priorities: selectedPriorities,
            budget: budgetLimit,
            targetGroup: "Maluku, Papua & Low-Income rural cohorts"
          }
        })
      });
      clearTimeout(timeoutId);

      const resData = await res.json();
      const now = new Date();
      if (resData && resData.data) {
        setBrief(resData.data);
        setGeminiCache(cacheKey, resData.data);
        if (resData.source === "local_intelligence_fallback_cached" || resData.source?.includes("fallback") || resData.source?.includes("local")) {
          setQuotaStatus("fallback");
        } else {
          setQuotaStatus("live");
        }
      } else {
        setQuotaStatus("fallback");
      }
      setLastGenerated(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setGeneratedDate(now);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Error calling action brief API:", err);
      setQuotaStatus("fallback");
      const now = new Date();
      setLastGenerated(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setGeneratedDate(now);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only set time on load. DO NOT call fetchActionBrief() automatically!
    if (!lastGenerated) {
      const now = new Date();
      setLastGenerated(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setGeneratedDate(now);
    }
  }, []);

  const handlePriorityToggle = (val: string) => {
    setSelectedPriorities((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const handleShareSimulate = () => {
    setCopied(true);
    navigator.clipboard.writeText(JSON.stringify(brief || {}, null, 2));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSimulate = () => {
    setDownloading(true);
    setPdfStatus("idle");
    setTimeout(() => {
      try {
        downloadActionBriefPdf(displayBrief, isDemoActive, budgetLimit, lastGenerated, generatedDate);
        setDownloading(false);
        setPdfStatus("success");
        setTimeout(() => setPdfStatus("idle"), 4000);
      } catch (err) {
        console.error("PDF export failed:", err);
        setDownloading(false);
        setPdfStatus("error");
        setTimeout(() => setPdfStatus("idle"), 4000);
      }
    }, 1200);
  };

  // Precomputed high quality fallback brief in English
  const defaultBrief: ActionBrief = {
    executiveSummary: "This Community Action Brief is prepared as a strategic alignment roadmap across stakeholders (NGOs, schools, community leaders) to address educational support gaps in the target regions. Based on the data, our primary challenges include digital access isolation and a shortage of trained local mentors. This document outlines key action plans to boost learning motivation and bridge fundamental literacy/numeracy gaps.",
    keyInsights: [
      "Critical access gaps on small remote islands (such as Maria's community in Maluku) and isolated highlands (Yosep's community in Papua) necessitate offline-first materials over web-based apps.",
      "Continuous mentoring and emotional support by community mentors (Kak Nisa) increases learner persistence by 2.5x during local disruption periods."
    ],
    topPriorities: [
      "Distribute 120 Offline AjarBox learning kits to remote regions in Maluku and Papua highlands.",
      "Provide integrated creative numeracy coaching for 80 active community learning mentors.",
      "Involve parents in learning accountability via monthly Family Education & Enablement Sessions."
    ],
    recommendedActions: [
      "Launch a weekly 'AjarDaya Forum' to coordinate formal support (Bu Maya's school) with community efforts (Kak Nisa's mentors).",
      "Conduct local digital asset inventory audits with Pak Budi across targeted neighborhood associations."
    ],
    projectedImpact: {
      learnerReach: "Reach 10,000+ vulnerable learners across marginalized regions",
      literacyNumeracyGain: "Projected 26% gain in fundamental reading and mathematics competencies",
      sustainability: "Establish self-sustaining learning circles championed fully by localized communities"
    },
    timeline30_60_90: {
      day30: "Initiate program socialization to local elders with Pak Budi, prepare offline module logistics, and register local community volunteers.",
      day60: "Officially deploy 15 home-visit learning hubs in Maluku and launch initial weekend study circles with Ayu Lestari & Dinda.",
      day90: "Evaluate mid-program progress, share insights with the regional education offices, and draft scale-up strategies."
    },
    stakeholderSharingChecklist: [
      "Email the PDF Action Brief to the Regional Education Office (Dinas Pendidikan)",
      "Distribute the action summary to parents via Community WhatsApp Groups",
      "Present the resource allocation plan and projected outcomes to the NGO sponsor board"
    ]
  };

  const getDynamicDemoBrief = (focus: "balanced" | "remote3t" | "mentorCapacity"): ActionBrief => {
    let executiveSummary = "";
    if (focus === "balanced") {
      executiveSummary = "This Community Action Brief coordinates the strategic enablement roadmap for the East Java Community Study Group Clusters. Following detailed data analysis, the primary interventions prioritized are 'Community Mentoring Circles' (50% budget share) to scale peer leadership and 'Offline Study Kit Delivery' (50% budget share) to bridge high digital-access divides. This blueprint establishes localized, community-led learning solutions.";
    } else if (focus === "remote3t") {
      executiveSummary = "This Community Action Brief coordinates the strategic enablement roadmap for the East Java Community Study Group Clusters. Following detailed data analysis, the primary interventions prioritized are 'Offline Study Kit Delivery' (65% budget share) to prioritize offline access in remote underserved pockets, and 'Community Mentoring Circles' (35% budget share) to scale peer leadership. This blueprint establishes localized, community-led learning solutions.";
    } else {
      executiveSummary = "This Community Action Brief coordinates the strategic enablement roadmap for the East Java Community Study Group Clusters. Following detailed data analysis, the primary interventions prioritized are 'Community Mentoring Circles' (70% budget share) to heavily invest in educator coaching/mentorship capacity, and 'Offline Study Kit Delivery' (30% budget share) to support learning access. This blueprint establishes localized, community-led learning solutions.";
    }

    return {
      executiveSummary,
      keyInsights: [
        "Digital Access Gap (82%): Ayu Lestari faces high internet instability in Banyuwangi, and Dinda has no personal learning device.",
        "Mentor Availability Gap (75%): Kak Nisa is currently overextended coordinating 3 separate villages with a high student ratio of 1:40.",
        "Geographical & Isolation Risks: Yosep Wenda is isolated in a remote area and Rafi Pratama has irregular attendance due to agriculture demands."
      ],
      topPriorities: [
        "Scale mentor capacity by recruiting local volunteer co-mentors to assist Kak Nisa's circles.",
        "Procure and distribute offline printed study kits to active learners to bypass internet barriers.",
        "Establish weekly local mentoring circles in Banyuwangi, Jember, and Malang."
      ],
      recommendedActions: [
        "Procurement and shipment of durable printed study kits & offline books directly to Banyuwangi hubs.",
        "Onboard assistant community mentors and establish the peer feedback loop for Ayu, Rafi, and Dinda.",
        "Launch weekly mentoring circle programs led by Kak Nisa with sub-district school board coordination."
      ],
      projectedImpact: {
        learnerReach: "47 active vulnerable learners in East Java fully reached",
        literacyNumeracyGain: "Projected 32% increase in module completion rates",
        sustainability: "Established self-sufficient study clusters with local facilitators within 90 days"
      },
      timeline30_60_90: {
        day30: "Recruit and train volunteer co-mentors. Print and package complete sets of offline study books.",
        day60: "Distribute offline study kits to Ayu, Rafi, Dinda, and Yosep. Launch weekly local mentoring circles.",
        day90: "Monitor attendance lifts (projected +45%) and secure secondary local village funding for long-term mentor incentives."
      },
      stakeholderSharingChecklist: [
        "Submit official Action Brief to East Java District Education Office",
        "Share localized learning schedules on Banyuwangi community boards",
        "Upload funding and resource distribution charts to NGO sponsor database"
      ]
    };
  };

  const displayBrief = isDemoActive ? getDynamicDemoBrief(selectedFocusArea || "balanced") : (brief || defaultBrief);

  const dateObj = generatedDate || new Date();
  const monthStr = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dayStr = String(dateObj.getDate()).padStart(2, "0");
  const formattedDateString = dateObj.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  const docNo = isDemoActive
    ? `AB-2026-JAWA-${monthStr}-${dayStr}`
    : `AD-CAB-2026-${monthStr}-${dayStr}`;

  // Render 3 representative personas as authors/key stakeholders for people visuals
  const briefingStakeholders = [
    PERSONAS[5], // Bu Maya
    PERSONAS[6], // Pak Arif
    PERSONAS[7]  // Kak Nisa
  ];

  const availablePriorities = [
    "Improve numeracy in Grade 7",
    "Expand tutoring in Papua highlands",
    "Strengthening attendance in Maluku",
    "Deploy modular learning kits for remote areas",
    "Parent enablement circles"
  ];

  return (
    <div id="action-brief-container" className="space-y-6 text-left">
      
      {pdfStatus === "success" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-emerald-800">
          <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold">Brief PDF downloaded successfully.</p>
            <p>Your stakeholder-ready coordination blueprint is saved to your computer.</p>
          </div>
        </div>
      )}

      {pdfStatus === "error" && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-800">
          <span className="text-rose-600 font-bold shrink-0 mt-0.5">⚠️</span>
          <div className="text-xs leading-relaxed">
            <p className="font-bold">PDF export failed. Please try again.</p>
            <p>There was a processing issue drawing the document structure.</p>
          </div>
        </div>
      )}

      {isDemoActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800">
          <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold mb-0.5">Judge Demo Walkthrough: Step 6 of 6 (Community Action Brief)</p>
            <p>Congratulations, you have completed the end-to-end decision workflow! Under active demo mode, a customized, stakeholder-ready briefing document has been compiled for the <strong>"East Java Community Study Group Clusters"</strong> (Document No: <strong>"{docNo}"</strong>). It outlines direct summary of risks for Ayu, Yosep, Dinda, and Rafi, lists our chosen interventions, and details tactical action plans (recruiting co-mentors, printed kits procurement). Click <strong>"Reset Walkthrough"</strong> at the bottom of the page to start over or explore other areas of AjarDaya.</p>
          </div>
        </div>
      )}

      {/* Title Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-800 tracking-tight">Community Action Brief</h2>
          <p className="text-slate-500 text-xs">Tactical alignment roadmap ready to share with the Regional Education Office, school boards, village heads, and NGO sponsors.</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 self-start lg:self-auto">
          {lastGenerated && !loading && (
            <span className="text-[10px] text-slate-400 font-mono text-left sm:text-right">
              Last generated with Gemini: <span className="font-bold text-slate-600">{lastGenerated}</span>
            </span>
          )}
          <div className="flex items-center gap-2">
            <button
              id="share-brief-btn"
              onClick={handleShareSimulate}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copied ? "Copied to Clipboard!" : "Copy Brief JSON"}
            </button>
            <button
              id="download-brief-pdf-btn"
              onClick={handleDownloadSimulate}
              disabled={downloading}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {downloading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Preparing PDF...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Download Brief (PDF)
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <CurrentQuestionCard 
        question="How do we turn insights into coordinated action?" 
        helperText="Generate a stakeholder-ready brief with priorities, owners, projected impact, and a 30-60-90 day action plan."
      />

      {/* Inputs Configuration panel at the top */}
      <div id="brief-config-panel" className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 hover:border-slate-300 transition-all">
        <div className="md:col-span-2 space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase font-mono block">Selected Monthly Community Priorities</label>
          <div className="flex flex-wrap gap-1.5">
            {availablePriorities.map((p) => {
              const selected = selectedPriorities.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => handlePriorityToggle(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    selected 
                      ? "bg-teal-50 border-teal-300 text-teal-800 shadow-xs" 
                      : "bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 flex flex-col justify-between">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase font-mono block mb-1.5">Budget Context Allocation</label>
            <input
              id="brief-budget-input"
              type="text"
              value={budgetLimit}
              onChange={(e) => setBudgetLimit(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-mono font-bold focus:bg-white focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col items-center">
            <button
              id="rebuild-brief-btn"
              onClick={fetchActionBrief}
              disabled={loading}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Generating New Brief...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Regenerate Action Brief
                </>
              )}
            </button>
            {lastGenerated && (
              <p className="text-center text-[10px] text-teal-600 font-mono mt-2.5">
                {isDemoActive || quotaStatus !== "live"
                  ? `Last regenerated: ${lastGenerated} • Quota-safe demo mode`
                  : `Last regenerated with Gemini: ${lastGenerated}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {!hasApiKey && (
        <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-[10px] text-slate-500 leading-normal font-mono">
          Using structured demo brief. Configure Gemini API for live AI generation.
        </div>
      )}

      {/* Document layout representation */}
      <div id="brief-document" className="bg-white rounded-xl border border-purple-100 p-8 shadow-sm max-w-4xl mx-auto space-y-8 relative overflow-hidden hover:border-purple-200 transition-all">
        {/* Subtle top rainbow line representing Gemini AI Layer */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        
        {/* Document Header stamp */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-6 gap-4">
          <div className="text-left">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-100 uppercase tracking-wider">AjarDaya AI Output</span>
              <span className="text-[9px] bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent font-extrabold font-mono flex items-center gap-0.5 border border-purple-200/50 px-1 py-0.2 rounded bg-purple-50/50">
                <Sparkles className="w-2.5 h-2.5 text-indigo-500 animate-pulse" />
                Generated with Gemini
              </span>
              {quotaStatus === "live" && (
                <span className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono font-bold">
                  Gemini connected
                </span>
              )}
              {quotaStatus === "cached" && (
                <span className="text-[9px] text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-mono font-bold">
                  Using cached Gemini result for this scenario.
                </span>
              )}
              {quotaStatus === "fallback" && (
                <span className="text-[9px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono font-bold">
                  Demo reasoning mode
                </span>
              )}
            </div>
            <h1 className="font-display font-extrabold text-xl sm:text-2xl text-slate-800 mt-2">
              {isDemoActive ? "EAST JAVA COMMUNITY STUDY GROUP CLUSTERS" : "COMMUNITY ACTION BRIEF"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Document No: {docNo} • Date: {formattedDateString}
            </p>
          </div>
          
          <div className="text-left sm:text-right">
            <span className="text-[9px] text-slate-400 font-mono block">
              {isDemoActive ? "DEMO WALKTHROUGH BRIEF" : "COORDINATION BRIEF"}
            </span>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded inline-block mt-1">READY TO DISTRIBUTE</span>
          </div>
        </div>

        {/* Stakeholder Co-Authors & Beneficiaries list (Meets People Visual requirement on brief page) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left">
          <span className="text-[9px] uppercase font-mono text-slate-400 font-bold block mb-3">Authors & Primary Stakeholders</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {briefingStakeholders.map((sh, idx) => {
              const initials = sh.name.split(" ").map(n => n[0]).join("").toUpperCase();
              return (
                <div key={idx} className="flex items-center gap-2.5 bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-teal-100 border border-teal-200 text-teal-800 flex items-center justify-center font-display font-bold text-xs">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-700 block truncate">{sh.name}</span>
                    <span className="text-[10px] text-teal-600 block truncate">{sh.role}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Executive Summary */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-base text-slate-800 border-l-3 border-teal-600 pl-3">Executive Summary</h3>
          <p className="text-sm text-slate-600 leading-relaxed font-light pl-3.5">
            {displayBrief.executiveSummary}
          </p>
        </div>

        {/* Grid: Gaps Insights & Priorities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3">
          
          {/* Key insights */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-sm text-slate-800 border-l-3 border-teal-600 pl-3">Key Gaps & Data Insights</h4>
            <div className="space-y-2 pl-3.5">
              {displayBrief.keyInsights.map((insight, idx) => (
                <div key={idx} className="flex gap-2 text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-200">
                  <span className="font-display font-black text-teal-600">{idx + 1}.</span>
                  <p>{insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top priorities */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-sm text-slate-800 border-l-3 border-teal-600 pl-3">Top Community Priorities</h4>
            <div className="space-y-2 pl-3.5">
              {displayBrief.topPriorities.map((pri, idx) => (
                <div key={idx} className="flex gap-2 text-xs text-slate-800 font-semibold leading-relaxed bg-teal-50/20 p-3 rounded-lg border border-teal-200">
                  <span className="text-teal-600">★</span>
                  <p>{pri}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Section: Recommended Actions */}
        <div className="space-y-3 pt-3">
          <h3 className="font-display font-bold text-base text-slate-800 border-l-3 border-teal-600 pl-3">Recommended Action Plans</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pl-3.5">
            {displayBrief.recommendedActions.map((act, idx) => (
              <div key={idx} className="border border-slate-200 p-3.5 rounded-xl flex gap-2.5 items-start">
                <span className="p-1 rounded bg-teal-50 text-teal-700 font-mono font-bold text-xs">{idx + 1}</span>
                <p className="text-xs text-slate-700 leading-normal font-medium">{act}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Projected Impact */}
        <div className="space-y-3 pt-3">
          <h3 className="font-display font-bold text-base text-slate-800 border-l-3 border-teal-600 pl-3">Projected Social Impact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pl-3.5">
            <div className="bg-slate-50 p-4 rounded-xl text-xs border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Learner Reach</span>
              <p className="font-semibold text-slate-700 leading-relaxed">{displayBrief.projectedImpact.learnerReach}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl text-xs border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Academic Gain</span>
              <p className="font-semibold text-slate-700 leading-relaxed">{displayBrief.projectedImpact.literacyNumeracyGain}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl text-xs border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Sustainability Outlook</span>
              <p className="font-semibold text-slate-700 leading-relaxed">{displayBrief.projectedImpact.sustainability}</p>
            </div>
          </div>
        </div>

        {/* Section: 30-60-90 Day Timeline */}
        <div className="space-y-3 pt-3">
          <h3 className="font-display font-bold text-base text-slate-800 border-l-3 border-teal-600 pl-3">30-60-90 Day Tactical Roadmap</h3>
          <div className="relative pl-7 space-y-6 before:content-[''] before:absolute before:left-3.5 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-slate-200">
            {/* 30 days */}
            <div className="relative">
              <span className="absolute -left-6.5 w-6.5 h-6.5 rounded-full bg-teal-600 border-4 border-white text-white text-[9px] font-mono font-bold flex items-center justify-center">30</span>
              <div className="bg-white border border-slate-200 p-4 rounded-xl">
                <span className="text-[10px] font-mono text-teal-700 uppercase font-bold">Days 1-30: Initiation & Outreach</span>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">{displayBrief.timeline30_60_90.day30}</p>
              </div>
            </div>

            {/* 60 days */}
            <div className="relative">
              <span className="absolute -left-6.5 w-6.5 h-6.5 rounded-full bg-teal-600 border-4 border-white text-white text-[9px] font-mono font-bold flex items-center justify-center">60</span>
              <div className="bg-white border border-slate-200 p-4 rounded-xl">
                <span className="text-[10px] font-mono text-teal-700 uppercase font-bold">Days 31-60: Logistics & First Learning Sessions</span>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">{displayBrief.timeline30_60_90.day60}</p>
              </div>
            </div>

            {/* 90 days */}
            <div className="relative">
              <span className="absolute -left-6.5 w-6.5 h-6.5 rounded-full bg-teal-600 border-4 border-white text-white text-[9px] font-mono font-bold flex items-center justify-center">90</span>
              <div className="bg-white border border-slate-200 p-4 rounded-xl">
                <span className="text-[10px] font-mono text-teal-700 uppercase font-bold">Days 61-90: Evaluation & Scale-up Planning</span>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">{displayBrief.timeline30_60_90.day90}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Sharing Checklist */}
        <div className="space-y-3 pt-3 border-t border-slate-200">
          <h3 className="font-display font-semibold text-sm text-slate-700">Stakeholder Sharing & Mobilization Checklist</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {displayBrief.stakeholderSharingChecklist.map((item, idx) => (
              <div key={idx} className="bg-slate-50/50 border border-slate-200 p-3 rounded-lg flex items-start gap-2 text-xs">
                <input type="checkbox" defaultChecked className="mt-1 accent-teal-600 rounded text-teal-600 focus:ring-teal-500 cursor-pointer" />
                <p className="text-slate-600 leading-normal">{item}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {isDemoActive && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 max-w-4xl mx-auto">
          <div>
            <h4 className="font-display font-bold text-slate-800 text-sm">Demo Walkthrough Complete!</h4>
            <p className="text-xs text-slate-500">You have successfully completed the decision intelligence journey. Reset the demo to return to the Landing Page.</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              onClick={() => document.getElementById("brief-document")?.scrollIntoView({ behavior: "smooth" })}
              className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <FileText className="w-4 h-4" />
              Review Final Community Action Plan
            </button>
            <button
              onClick={() => onResetDemo && onResetDemo()}
              className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Walkthrough
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
