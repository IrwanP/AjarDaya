import React from "react";
import * as Icons from "lucide-react";

interface MetricCardProps {
  id: string;
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  iconName: keyof typeof Icons;
  colorScheme: "teal" | "navy" | "amber" | "rose" | "blue";
  subtitle?: string;
}

export default function MetricCard({
  id,
  title,
  value,
  change,
  isPositive = true,
  iconName,
  colorScheme,
  subtitle
}: MetricCardProps) {
  const IconComponent = Icons[iconName] as React.ComponentType<{ className?: string }>;

  const colorStyles = {
    teal: {
      bg: "bg-teal-50/50 hover:bg-teal-50",
      border: "border-teal-100",
      iconBg: "bg-teal-500",
      text: "text-teal-700",
      accent: "teal"
    },
    navy: {
      bg: "bg-slate-50/50 hover:bg-slate-50",
      border: "border-slate-200",
      iconBg: "bg-slate-800",
      text: "text-slate-800",
      accent: "navy"
    },
    amber: {
      bg: "bg-amber-50/50 hover:bg-amber-50",
      border: "border-amber-100",
      iconBg: "bg-amber-500",
      text: "text-amber-700",
      accent: "amber"
    },
    rose: {
      bg: "bg-rose-50/50 hover:bg-rose-50",
      border: "border-rose-100",
      iconBg: "bg-rose-500",
      text: "text-rose-700",
      accent: "rose"
    },
    blue: {
      bg: "bg-blue-50/50 hover:bg-blue-50",
      border: "border-blue-100",
      iconBg: "bg-blue-500",
      text: "text-blue-700",
      accent: "blue"
    }
  }[colorScheme];

  return (
    <div
      id={id}
      className={`bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300 flex flex-col justify-between`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">{title}</p>
          <p className="text-2xl font-display font-extrabold text-slate-900 tracking-tight mt-1">
            {value}
          </p>
        </div>
        <div className={`p-2 rounded-lg ${
          colorScheme === "teal" ? "bg-teal-50 text-teal-600" :
          colorScheme === "blue" ? "bg-blue-50 text-blue-600" :
          colorScheme === "amber" ? "bg-amber-50 text-amber-600" :
          colorScheme === "rose" ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-600"
        }`}>
          {IconComponent && <IconComponent className="w-4 h-4" />}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        {change && (
          <span
            className={`font-semibold rounded-full flex items-center gap-0.5 ${
              isPositive ? "text-teal-600" : "text-rose-600"
            }`}
          >
            {isPositive ? "+" : "-"} {change} {isPositive ? "increase" : "decrease"}
          </span>
        )}
        <span className="text-slate-400 text-[11px]">
          {subtitle || "this month"}
        </span>
      </div>
    </div>
  );
}
