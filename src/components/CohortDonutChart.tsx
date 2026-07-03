import React, { useState } from "react";

interface CohortDonutChartProps {
  onTrack: number;
  atRisk: number;
  behind: number;
  notStarted: number;
}

export default function CohortDonutChart({ onTrack, atRisk, behind, notStarted }: CohortDonutChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = onTrack + atRisk + behind + notStarted;
  
  // Calculate precise relative percentages that sum up to exactly 100%
  const onTrackPercent = Math.round((onTrack / total) * 100);
  const atRiskPercent = Math.round((atRisk / total) * 100);
  const behindPercent = Math.round((behind / total) * 100);
  const notStartedPercent = 100 - (onTrackPercent + atRiskPercent + behindPercent);

  const segments = [
    { label: "On Track", value: onTrack, percent: onTrackPercent, color: "#0d9488", bgClass: "bg-teal-600", borderClass: "border-teal-700", textClass: "text-teal-600", hoverBg: "bg-teal-700" },
    { label: "At Risk", value: atRisk, percent: atRiskPercent, color: "#f59e0b", bgClass: "bg-amber-500", borderClass: "border-amber-600", textClass: "text-amber-600", hoverBg: "bg-amber-600" },
    { label: "Behind", value: behind, percent: behindPercent, color: "#ef4444", bgClass: "bg-rose-500", borderClass: "border-rose-600", textClass: "text-rose-600", hoverBg: "bg-rose-600" },
    { label: "Not Started", value: notStarted, percent: notStartedPercent, color: "#64748b", bgClass: "bg-slate-500", borderClass: "border-slate-600", textClass: "text-slate-500", hoverBg: "bg-slate-600" }
  ];

  return (
    <div id="cohort-progress-panel" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col">
      <div className="w-full text-left mb-4">
        <h3 className="font-display font-semibold text-slate-800 text-sm">Cohort Learning Progress Status</h3>
        <p className="text-[11px] text-slate-400">Active Learners Progress Distribution</p>
      </div>

      {/* 100% Stacked Horizontal Bar Container */}
      <div className="relative w-full mb-6">
        <div className="flex w-full h-8 rounded-xl overflow-hidden shadow-inner bg-slate-100 border border-slate-100">
          {segments.map((seg, idx) => {
            const isHovered = hoveredIdx === idx;
            const isAnyHovered = hoveredIdx !== null;
            
            if (seg.percent <= 0) return null;

            return (
              <div
                key={seg.label}
                style={{ width: `${seg.percent}%` }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`relative h-full transition-all duration-300 cursor-pointer flex items-center justify-center border-r border-white/20 last:border-r-0 ${
                  seg.bgClass
                } ${
                  isHovered 
                    ? "scale-y-[1.12] z-10 shadow-lg brightness-105" 
                    : isAnyHovered 
                      ? "opacity-60 brightness-95" 
                      : ""
                }`}
              >
                {/* Segment percentage label displayed inside if wide enough */}
                {seg.percent >= 8 && (
                  <span className="text-[11px] font-mono font-black text-white select-none drop-shadow-sm">
                    {seg.percent}%
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Dynamic center indicator of hovered or general summary */}
        <div className="mt-3 text-center h-5 flex items-center justify-center">
          {hoveredIdx !== null ? (
            <div className="text-xs font-medium text-slate-700 flex items-center gap-1.5 animate-fade-in">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: segments[hoveredIdx].color }}></span>
              <span className="font-bold text-slate-900">{segments[hoveredIdx].label}:</span>
              <span>{segments[hoveredIdx].percent}% of entire cohort</span>
            </div>
          ) : (
            <div className="text-[10px] font-semibold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span>Hover segments or cards below to focus</span>
            </div>
          )}
        </div>
      </div>

      {/* Legends & Detailed Progress Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5 w-full">
        {segments.map((seg, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <div 
              key={seg.label}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`p-2.5 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                isHovered 
                  ? "border-slate-300 bg-slate-50 shadow-sm translate-y-[-2px]" 
                  : "border-slate-100 hover:bg-slate-50/50 hover:border-slate-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: seg.color }}></span>
                <span className="text-[11px] text-slate-500 font-semibold truncate">{seg.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-lg font-display font-black leading-none ${seg.textClass}`}>
                  {seg.percent}%
                </span>
                <span className="text-[10px] text-slate-400 font-medium">of cohort</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

