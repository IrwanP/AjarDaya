import React from "react";
import { HelpCircle } from "lucide-react";

interface CurrentQuestionCardProps {
  question: string;
  helperText: string;
}

export default function CurrentQuestionCard({ question, helperText }: CurrentQuestionCardProps) {
  return (
    <div id="current-question-card" className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 shadow-xs mb-4 select-none">
      <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 shrink-0">
        <HelpCircle className="w-4.5 h-4.5" />
      </div>
      <div>
        <span className="text-[9px] text-slate-400 block uppercase font-mono tracking-wider mb-0.5">Current Strategic Question</span>
        <h4 className="font-display font-bold text-slate-900 text-sm md:text-base leading-snug">
          {question}
        </h4>
        <p className="text-xs text-slate-500 leading-relaxed mt-0.5 font-normal">
          {helperText}
        </p>
      </div>
    </div>
  );
}
