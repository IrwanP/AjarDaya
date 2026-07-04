import React, { useState, useEffect } from "react";
import MetricCard from "./MetricCard";
import MapIndonesia from "./MapIndonesia";
import CurrentQuestionCard from "./CurrentQuestionCard";
import { MONTHLY_TREND } from "../data";
import { AlertCircle, ChevronRight, Play, RefreshCw, FileText, Sparkles, Loader2 } from "lucide-react";
import { Alert, CommandCenterData } from "../types";
import { getGeminiCache, setGeminiCache, hasGeminiCache } from "../utils/geminiCache";

interface CommandCenterProps {
  onNavigate: (viewId: string) => void;
  isDemoActive?: boolean;
}

export default function CommandCenter({ onNavigate, isDemoActive = false }: CommandCenterProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [quotaStatus, setQuotaStatus] = useState<"live" | "cached" | "fallback" | null>(null);

  // Function to load insights using our Gemini API backend
  const fetchDashboardInsights = async () => {
    const cacheKey = "command-center:default";
    
    if (hasGeminiCache(cacheKey)) {
      setData(getGeminiCache(cacheKey));
      setQuotaStatus("cached");
      return;
    }

    setLoading(true);
    setQuotaStatus(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 13000); // 13-second timeout

    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          topic: "insights",
          data: {
            totalCommunities: 2458,
            totalLearners: 48765,
            activePrograms: 1238,
            completionRate: "78.6%",
            engagementRate: "82%"
          }
        })
      });
      clearTimeout(timeoutId);

      const resData = await res.json();
      if (resData && resData.data) {
        const fullData = {
          totalCommunities: 2458,
          totalLearners: 48765,
          activePrograms: 1238,
          completionRate: "78.6%",
          engagementRate: "82%",
          summary: resData.data.summary,
          alerts: resData.data.alerts,
          topHighlights: resData.data.topHighlights
        };
        setData(fullData);
        setGeminiCache(cacheKey, fullData);
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
      console.error("Error calling Gemini API for command center:", err);
      setQuotaStatus("fallback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cacheKey = "command-center:default";
    if (hasGeminiCache(cacheKey)) {
      setData(getGeminiCache(cacheKey));
      setQuotaStatus("cached");
    } else {
      setData(null);
      setQuotaStatus("fallback");
    }
  }, []);

  // Standard fallback elements if data is not fully loaded yet
  const defaultSummary = "AjarDaya's decision intelligence reveals that the overall community learning participation rate stands at 82%, heavily driven by high engagement in East Java and Maluku. However, digital access disparities between remote (3T) communities and urban centers remain the critical bottleneck in achieving equitable learning outcomes.";
  const defaultAlerts: Alert[] = [
    {
      id: "alert-1",
      title: "Critical Digital Access in Southeast Maluku",
      severity: "high",
      message: "12 community learning centers managed by Maria in Southeast Maluku saw a 35% drop in active participation due to quota and electricity constraints.",
      action: "Deploy Offline Learning Packages & Independent Offline Study Kits."
    },
    {
      id: "alert-2",
      title: "High Student-to-Mentor Ratio in West Java",
      severity: "medium",
      message: "The student-to-mentor ratio in West Java (Dinda) has reached 1:48, causing high mentor burnout risk for Kak Nisa.",
      action: "Initiate recruitment of local university volunteers or consult Pak Budi."
    },
    {
      id: "alert-3",
      title: "Lagging Numeracy Achievements in Papua",
      severity: "high",
      message: "Yosep's cohort data in Papua shows reading proficiency is improving, but basic numeracy remains stagnant.",
      action: "Focus budget on creative numeracy flashcards and local math kits."
    }
  ];
  const defaultHighlights = [
    "Independent Learning Circles in Maluku achieved an 85% module completion rate using interactive printed materials.",
    "East Java's digital literacy community (Ayu Lestari) recorded a 2.1x increase in reading interest over the last two months."
  ];

  const displaySummary = isDemoActive
    ? "Digital access and mentoring gaps are the two most urgent community issues for the East Java Community Learning Circle. Out of 124 total learners, 31 are identified as At Risk."
    : (data?.summary || defaultSummary);

  const displayAlerts: Alert[] = isDemoActive
    ? [
        {
          id: "demo-alert-1",
          title: "Critical Digital Access Gap (Banyuwangi)",
          severity: "high",
          message: "Ayu Lestari and 18 other learners face severe cellular and device barriers while studying at home.",
          action: "Deploy low-cost Offline Digital Kits & printed storybooks."
        },
        {
          id: "demo-alert-2",
          title: "Mentoring Support Shortage",
          severity: "high",
          message: "Ayu, Rafi, Dinda, and Yosep require more structural guidance. Kak Nisa is overextended.",
          action: "Form Community Mentoring Circles and train local youth coordinators."
        },
        {
          id: "demo-alert-3",
          title: "Flexible Scheduling Need",
          severity: "medium",
          message: "Rafi Pratama faces irregular attendance due to supporting family harvesting duties after school.",
          action: "Implement flexible mentoring session times and peer learning networks."
        }
      ]
    : (data?.alerts || defaultAlerts);

  const displayHighlights = isDemoActive
    ? [
        "Digital Access Gap: High (needs offline modules & devices)",
        "Mentorship Demand: High (Ayu Lestari & Rafi Pratama)"
      ]
    : (data?.topHighlights || defaultHighlights);

  // Render SVG area-chart representing trend
  const svgWidth = 460;
  const svgHeight = 140;
  const maxVal = 55000;
  const points = MONTHLY_TREND.map((t, idx) => {
    const x = (idx / (MONTHLY_TREND.length - 1)) * (svgWidth - 40) + 20;
    const y = svgHeight - (t.participants / maxVal) * (svgHeight - 40) - 20;
    return { x, y, ...t };
  });

  const areaPath = `
    M ${points[0].x}, ${svgHeight - 20}
    ${points.map(p => `L ${p.x},${p.y}`).join(" ")}
    L ${points[points.length - 1].x}, ${svgHeight - 20}
    Z
  `;

  const linePath = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");

  const getSeverityRank = (severity: string): number => {
    switch (severity?.toLowerCase()) {
      case "critical": return 4;
      case "high": return 3;
      case "medium": return 2;
      case "low": return 1;
      default: return 0;
    }
  };

  const sortedAlerts = [...displayAlerts].sort((a, b) => {
    return getSeverityRank(b.severity) - getSeverityRank(a.severity);
  });

  return (
    <div id="command-center-container" className="space-y-6 text-left">
      
      {isDemoActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800">
          <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold mb-0.5">Judge Demo Walkthrough: Step 1 of 6 (Community Learning Command Center)</p>
            <p>We have loaded the <strong>East Java Community Learning Circle</strong>. Notice how the metrics reveal that <strong>31 out of 124 learners</strong> are at risk. In the alerts section below, you can see specific high-priority alerts for Ayu Lestari and Rafi Pratama. Click <strong>Go to Cohort Analyzer (Step 2)</strong> at the bottom of the page or use the sidebar/top wizard to proceed.</p>
          </div>
        </div>
      )}

      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-800 tracking-tight">Community Learning Command Center</h2>
          <p className="text-slate-500 text-xs">Monitor, analyze, and accelerate the impact of community learning across Indonesia.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="refresh-insights-btn"
            onClick={fetchDashboardInsights}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            AI Rescan
          </button>
          <button
            id="brief-action-nav-btn"
            onClick={() => onNavigate("action_brief")}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            Download Action Brief
          </button>
        </div>
      </div>

      <CurrentQuestionCard 
        question="What is happening in the community?" 
        helperText="Start here to understand community health, learner participation, active programs, and urgent alerts."
      />

      {/* Statistics Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          id="metric-communities"
          title="Total Communities"
          value={isDemoActive ? "1" : "2,458"}
          change={isDemoActive ? "0.0%" : "12.4%"}
          isPositive={true}
          iconName="Users"
          colorScheme="teal"
        />
        <MetricCard
          id="metric-learners"
          title="Total Learners"
          value={isDemoActive ? "124" : "48,765"}
          change={isDemoActive ? "-15.0%" : "18.9%"}
          isPositive={!isDemoActive}
          iconName="GraduationCap"
          colorScheme="blue"
        />
        {isDemoActive ? (
          <MetricCard
            id="metric-at-risk"
            title="At-Risk Learners"
            value="31"
            change="25.0%"
            isPositive={false}
            iconName="AlertCircle"
            colorScheme="rose"
          />
        ) : (
          <MetricCard
            id="metric-programs"
            title="Active Programs"
            value="1,238"
            change="15.7%"
            isPositive={true}
            iconName="Activity"
            colorScheme="navy"
          />
        )}
        <MetricCard
          id="metric-completion"
          title="Completion Rate"
          value={isDemoActive ? "68.0%" : "78.6%"}
          change={isDemoActive ? "-10.6%" : "6.2%"}
          isPositive={!isDemoActive}
          iconName="Award"
          colorScheme="amber"
        />
        <MetricCard
          id="metric-engagement"
          title="Class Engagement"
          value={isDemoActive ? "72.0%" : "82.0%"}
          change={isDemoActive ? "-10.0%" : "2.4%"}
          isPositive={!isDemoActive}
          iconName="Compass"
          colorScheme="rose"
        />
      </div>

      {/* AI Intelligence Insights Section */}
      <div id="ai-insights-block" className="bg-gradient-to-r from-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-teal-800/20">
        <div className="absolute right-0 top-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            <h3 className="font-display font-semibold text-sm tracking-wider uppercase text-teal-300">AjarDaya AI Decision Intelligence</h3>
            {quotaStatus === "live" && (
              <span className="text-[9px] text-emerald-300 bg-teal-950/60 border border-teal-800/60 px-1.5 py-0.2 rounded font-mono font-bold">
                Gemini connected
              </span>
            )}
            {quotaStatus === "cached" && (
              <span className="text-[9px] text-blue-300 bg-teal-950/60 border border-teal-800/60 px-1.5 py-0.2 rounded font-mono font-bold">
                Cached Gemini result
              </span>
            )}
            {quotaStatus === "fallback" && (
              <span className="text-[9px] text-amber-300 bg-teal-950/60 border border-teal-800/60 px-1.5 py-0.2 rounded font-mono font-bold">
                Demo reasoning mode
              </span>
            )}
          </div>
          <p className="text-sm md:text-base leading-relaxed text-teal-100 font-light">
            {displaySummary}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-teal-800/50">
            <span className="text-[10px] font-mono uppercase text-teal-400 font-bold">Highlights:</span>
            {displayHighlights.map((hl, idx) => (
              <span key={idx} className="bg-teal-950/60 border border-teal-800/40 text-xs text-teal-200 px-3 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                {hl}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Map & Trend Chart grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MapIndonesia />

        {/* Trend of learner participation over time */}
        <div id="monthly-participation-panel" className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
          <div className="mb-4">
            <h3 className="font-display font-semibold text-slate-900 text-lg tracking-tight">Monthly Participation Trend</h3>
            <p className="text-xs text-slate-500">Active Learners Count (January - June 2026)</p>
          </div>

          <div className="w-full overflow-hidden flex items-center justify-center pt-2">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-lg h-auto overflow-visible">
              {/* Grid Lines */}
              <line x1="20" y1="20" x2={svgWidth - 20} y2="20" stroke="#f1f5f9" strokeDasharray="3,3" />
              <line x1="20" y1="60" x2={svgWidth - 20} y2="60" stroke="#f1f5f9" strokeDasharray="3,3" />
              <line x1="20" y1="100" x2={svgWidth - 20} y2="100" stroke="#f1f5f9" strokeDasharray="3,3" />
              <line x1="20" y1={svgHeight - 20} x2={svgWidth - 20} y2={svgHeight - 20} stroke="#cbd5e1" />

              {/* Area path representing trend */}
              <path d={areaPath} fill="url(#tealGradient)" opacity="0.15" />
              <path d={linePath} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" />

              {/* Data points */}
              {points.map((p, idx) => (
                <g key={idx} className="group cursor-pointer">
                  <circle cx={p.x} cy={p.y} r="5" fill="#0d9488" stroke="#ffffff" strokeWidth="2" />
                  {/* Tooltip */}
                  <text x={p.x} y={p.y - 10} textAnchor="middle" className="text-[9px] font-mono font-bold fill-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    {p.participants.toLocaleString("en-US")}
                  </text>
                  {/* X Axis text label */}
                  <text x={p.x} y={svgHeight - 5} textAnchor="middle" className="text-[10px] font-medium fill-slate-400">
                    {p.month}
                  </text>
                </g>
              ))}

              <defs>
                <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="mt-4 bg-slate-50 rounded-lg p-3 border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Learning Sessions This Month:</span>
            <span className="font-mono font-bold text-slate-800">3,621 Sessions Completed</span>
          </div>
        </div>
      </div>

      {/* Alerts and Priority Actions section */}
      <div id="alerts-priorities-panel" className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition-all">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-slate-900 text-lg tracking-tight">Alerts & Recommended Actions</h3>
            <p className="text-xs text-slate-500">AI-detected priority blockers requiring stakeholder decisions</p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            {displayAlerts.length} Critical Insights
          </span>
        </div>

        <div className="space-y-4">
          {sortedAlerts.map((alert) => (
            <div
              key={alert.id}
              id={`alert-card-${alert.id}`}
              className={`border rounded-xl p-4 transition-all hover:shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-left ${
                (alert.severity as string) === "high" || (alert.severity as string) === "critical"
                  ? "border-rose-200 bg-rose-50/10"
                  : "border-amber-200 bg-amber-50/10"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  (alert.severity as string) === "high" || (alert.severity as string) === "critical" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                }`}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-sm text-slate-800">{alert.title}</span>
                    <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                      (alert.severity as string) === "high" || (alert.severity as string) === "critical" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{alert.message}</p>
                </div>
              </div>

              <div className="border-t md:border-t-0 border-slate-200 pt-3 md:pt-0 flex items-center justify-between md:justify-end gap-3 flex-shrink-0">
                <div className="text-left md:text-right">
                  <span className="text-[10px] uppercase text-slate-400 block tracking-wider">Recommended Action:</span>
                  <span className="text-xs font-semibold text-slate-700">{alert.action}</span>
                </div>
                <button
                  onClick={() => onNavigate("cohort_intelligence")}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isDemoActive && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-display font-bold text-slate-800 text-sm">Next Step in Walkthrough</h4>
            <p className="text-xs text-slate-500">Analyze individual learning signals and segment of learners in East Java.</p>
          </div>
          <button
            onClick={() => onNavigate("cohort_intelligence")}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            Next: Analyze Cohort
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}
