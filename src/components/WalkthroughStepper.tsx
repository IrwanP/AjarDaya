import React from "react";
import { Check, ArrowRight, Sparkles } from "lucide-react";

interface Step {
  id: string;
  label: string;
  num: number;
}

interface WalkthroughStepperProps {
  activeView: string;
  onNavigate: (viewId: string) => void;
}

export default function WalkthroughStepper({ activeView, onNavigate }: WalkthroughStepperProps) {
  const steps: Step[] = [
    { id: "command_center", label: "Understand Community", num: 1 },
    { id: "cohort_intelligence", label: "Analyze Cohort", num: 2 },
    { id: "equity_gaps", label: "Identify Support Gaps", num: 3 },
    { id: "intervention_simulator", label: "Simulate Intervention", num: 4 },
    { id: "resource_planner", label: "Plan Resources", num: 5 },
    { id: "action_brief", label: "Generate Action Brief", num: 6 },
  ];

  // Helper to determine active index
  const getActiveIndex = () => {
    const idx = steps.findIndex((step) => step.id === activeView);
    return idx === -1 ? 0 : idx;
  };

  const activeIndex = getActiveIndex();

  return (
    <div id="walkthrough-stepper-container" className="space-y-4 select-none">
      {/* Demo Scenario Banner */}
      <div id="demo-scenario-banner" className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-4 md:p-5 shadow-xs flex flex-col md:flex-row md:items-center gap-4 text-left">
        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 shrink-0">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono font-extrabold bg-teal-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
              Scenario Active
            </span>
            <h4 className="font-display font-extrabold text-sm md:text-base text-teal-950">
              Demo loaded: East Java Community Learning Circle
            </h4>
          </div>
          <p className="text-xs text-teal-900/80 leading-relaxed font-normal">
            This guided scenario shows how AjarDaya helps schools, NGOs, mentors, and local stakeholders identify priority learners, understand support gaps, compare interventions, plan resources, and generate a stakeholder-ready action brief.
          </p>
        </div>
      </div>

      {/* Stepper Steps Card */}
      <div id="walkthrough-stepper" className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-100 uppercase tracking-wider">
            Decision Intelligence Workflow Walkthrough
          </span>
          <span className="text-xs text-slate-500 font-mono font-medium">
            Step {activeIndex + 1} of 6
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 pt-1">
          {steps.map((step, idx) => {
            const isCompleted = idx < activeIndex;
            const isActive = idx === activeIndex;
            const isPending = idx > activeIndex;

            return (
              <button
                key={step.id}
                onClick={() => onNavigate(step.id)}
                className={`group flex items-center gap-2 p-2.5 rounded-xl text-left transition-all relative border overflow-hidden cursor-pointer ${
                  isActive
                    ? "bg-teal-50 border-teal-300 text-teal-950 shadow-xs animate-fade-in"
                    : isCompleted
                    ? "bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-50"
                    : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all ${
                    isActive
                      ? "bg-teal-600 text-white"
                      : isCompleted
                      ? "bg-teal-100 text-teal-800"
                      : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-500"
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : step.num}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[10px] font-bold tracking-tight leading-snug truncate ${
                      isActive ? "text-teal-950" : "text-slate-700"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-[8px] text-slate-400 font-mono -mt-0.5">
                    {isActive ? "Active View" : isCompleted ? "Completed" : "Next Step"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Gemini Reasoning Layer Data Flow Indicator */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-[10px] text-slate-500 font-mono">
          <div className="flex items-center gap-1.5 text-teal-800 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
            <span>Gemini reasoning layer supports: gap analysis, intervention recommendation, and action brief generation.</span>
          </div>
          <div className="flex flex-wrap items-center gap-1 bg-slate-50 border border-slate-200/50 px-2 py-1 rounded-md text-[9px]">
            <span className="text-slate-500 font-semibold">Cohort Signals</span>
            <span className="text-slate-300">→</span>
            <span className="text-teal-600 font-bold bg-teal-50 px-1 rounded border border-teal-100 flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" /> Gemini Reasoning
            </span>
            <span className="text-slate-300">→</span>
            <span className="text-slate-500 font-semibold">Support Gaps</span>
            <span className="text-slate-300">→</span>
            <span className="text-slate-500 font-semibold">Intervention Mix</span>
            <span className="text-slate-300">→</span>
            <span className="text-slate-500 font-semibold">Action Brief</span>
          </div>
        </div>
      </div>
    </div>
  );
}
