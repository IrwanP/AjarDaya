import React from "react";
import { Persona } from "../types";
import { GraduationCap, Briefcase, UserCheck, ShieldAlert, Award } from "lucide-react";

interface PersonaCardProps {
  id: string;
  persona: Persona;
  isSelected?: boolean;
  onClick?: () => void;
  key?: any;
}

export default function PersonaCard({ id, persona, isSelected = false, onClick }: PersonaCardProps) {
  const getAvatarBg = (seed: string) => {
    switch (seed) {
      case "ayu": return "bg-teal-100 text-teal-800 border-teal-200";
      case "rafi": return "bg-blue-100 text-blue-800 border-blue-200";
      case "dinda": return "bg-orange-100 text-orange-800 border-orange-200";
      case "maria": return "bg-sky-100 text-sky-800 border-sky-200";
      case "yosep": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "maya": return "bg-purple-100 text-purple-800 border-purple-200";
      case "arif": return "bg-slate-100 text-slate-800 border-slate-200";
      case "nisa": return "bg-rose-100 text-rose-800 border-rose-200";
      case "budi": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getRoleIcon = (seed: string) => {
    switch (seed) {
      case "ayu":
      case "rafi":
      case "dinda":
      case "maria":
      case "yosep":
        return <GraduationCap className="w-3.5 h-3.5 inline mr-1" />;
      case "maya":
        return <Award className="w-3.5 h-3.5 inline mr-1" />;
      case "arif":
        return <Briefcase className="w-3.5 h-3.5 inline mr-1" />;
      case "nisa":
        return <UserCheck className="w-3.5 h-3.5 inline mr-1" />;
      case "budi":
        return <ShieldAlert className="w-3.5 h-3.5 inline mr-1" />;
      default:
        return null;
    }
  };

  // Extract initials
  const initials = persona.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <div
      id={id}
      onClick={onClick}
      className={`rounded-xl border p-4 transition-all duration-200 text-left ${
        onClick ? "cursor-pointer" : ""
      } ${
        isSelected
          ? "border-teal-500 bg-teal-50/40 shadow-sm"
          : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Customized Avatar Graphic using SVG representation */}
        <div className={`w-12 h-12 rounded-xl border flex-shrink-0 flex items-center justify-center font-display font-bold text-sm ${getAvatarBg(persona.avatarSeed)} shadow-inner`}>
          <svg viewBox="0 0 40 40" className="w-full h-full p-1 opacity-90">
            {/* Draw beautiful simplified illustration representing different cultures */}
            <circle cx="20" cy="15" r="7" fill="currentColor" fillOpacity="0.4" />
            <path d="M 8,33 C 8,26 15,24 20,24 C 25,24 32,26 32,33 Z" fill="currentColor" fillOpacity="0.6" />
            <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" className="font-mono text-[10px] font-bold fill-current">
              {initials}
            </text>
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h4 className="font-display font-semibold text-sm text-slate-800 truncate">
              {persona.name}
            </h4>
            <span className="text-[10px] bg-slate-50 text-slate-500 font-mono px-1.5 py-0.5 rounded border border-slate-100 flex-shrink-0">
              {persona.region}
            </span>
          </div>

          <p className="text-[11px] font-medium text-teal-700 mt-1 flex items-center">
            {getRoleIcon(persona.avatarSeed)}
            {persona.role}
          </p>

          <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-3">
            "{persona.bio}"
          </p>
        </div>
      </div>
    </div>
  );
}
