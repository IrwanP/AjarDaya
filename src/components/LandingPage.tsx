import React from "react";
import { Persona } from "../types";
import { PERSONAS } from "../data";
import PersonaCard from "./PersonaCard";
import { Sparkles, Globe, HeartHandshake, Compass, Users, CheckCircle2 } from "lucide-react";

interface LandingPageProps {
  onNavigate: (viewId: string) => void;
  isDemoActive?: boolean;
  onStartDemo?: () => void;
  onResetDemo?: () => void;
}

export default function LandingPage({ onNavigate, isDemoActive = false, onStartDemo, onResetDemo }: LandingPageProps) {
  // Grab student and non-student representative personas to feature on the Landing page
  const featuredLeaders = PERSONAS.filter(p => !p.isStudent).slice(0, 3);
  const featuredStudents = PERSONAS.filter(p => p.isStudent).slice(0, 3);

  return (
    <div id="landing-page-container" className="bg-slate-50 min-h-screen">
      {/* Decorative Hero Background Element */}
      <div className="absolute top-0 inset-x-0 h-[480px] bg-gradient-to-b from-teal-500/5 via-teal-100/5 to-transparent pointer-events-none z-0"></div>

      <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-24 z-10">
        
        {/* Header Branding */}
        <div className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500 flex items-center justify-center text-white font-display font-bold text-lg shadow-sm shadow-teal-500/10">
              AD
            </div>
            <div>
              <span className="font-display font-bold text-xl text-slate-800 tracking-tight">AjarDaya</span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-mono">pronounced A-jar Da-ya</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono bg-white px-3 py-1 rounded-full border border-slate-200 shadow-xs">
              v1.0 Hackathon MVP
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold mb-6 animate-fade-in border border-teal-100">
            <Sparkles className="w-3.5 h-3.5" />
            AI Decision Intelligence Platform
          </div>
          
          <h1 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl text-slate-900 tracking-tight leading-none mb-6">
            AjarDaya
          </h1>
          <h2 className="font-display font-medium text-xl md:text-2xl text-teal-800 tracking-tight mb-4">
            AI Decision Intelligence for Community Learning Enablement
          </h2>
          <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Helping schools, NGOs, mentors, and local communities turn learner data into coordinated, impactful action.
          </p>

          {isDemoActive ? (
            <div className="max-w-2xl mx-auto bg-teal-50 border border-teal-200 rounded-2xl p-6 shadow-sm mb-10 text-left animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-lg text-teal-950 mb-1">
                    East Java Community Learning Circle loaded
                  </h4>
                  <p className="text-slate-700 text-sm leading-relaxed mb-4">
                    Several learners are at risk due to digital access, attendance, mentoring, and regional support gaps. Follow the progress bar at the top or use the button below to start analyzing.
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      id="cta-go-command"
                      onClick={() => onNavigate("command_center")}
                      className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Analyze Community Center
                    </button>
                    <button
                      id="cta-reset-demo"
                      onClick={onResetDemo}
                      className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-semibold text-xs transition-all cursor-pointer"
                    >
                      Reset Demo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                id="cta-try-demo"
                onClick={onStartDemo}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold text-sm transition-all shadow-sm shadow-teal-500/10 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Globe className="w-4 h-4" />
                Try Demo Community
              </button>
              <button
                id="cta-generate-brief"
                onClick={() => onNavigate("action_brief")}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm transition-all hover:shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                Generate Action Brief
              </button>
            </div>
          )}
        </div>

        {/* Workspace Context & Onboarding Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 max-w-5xl mx-auto text-left">
          {/* Demo Workspace Context Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500" />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider">Active Environment</span>
                <span className="text-xs text-slate-400 font-mono">Demo Workspace Context</span>
              </div>
              
              <h3 className="font-display font-bold text-lg text-slate-800">
                Nusantara Learning Foundation
              </h3>
              
              <div className="space-y-2.5 text-xs">
                <div className="grid grid-cols-3 py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-mono">Org Type</span>
                  <span className="col-span-2 font-semibold text-slate-700">NGO Supporter</span>
                </div>
                <div className="grid grid-cols-3 py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-mono">Logged User</span>
                  <span className="col-span-2 font-semibold text-slate-700">Pak Arif</span>
                </div>
                <div className="grid grid-cols-3 py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-mono">User Role</span>
                  <span className="col-span-2 font-semibold text-slate-700">NGO Program Manager</span>
                </div>
                <div className="grid grid-cols-3 py-1.5">
                  <span className="text-slate-400 font-mono">Demo Scenario</span>
                  <span className="col-span-2 text-slate-600 leading-normal">
                    Managing community learning programs and learner support gaps across Indonesian regions
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed font-sans">
              <p>
                <strong>In a real deployment:</strong> An organization registers first, sets its operating regions and program focus, then invites users such as program managers, school counselors, mentors, or community coordinators.
              </p>
            </div>
          </div>

          {/* How Users Enter AjarDaya Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-blue-500" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider">Platform Onboarding</span>
                <span className="text-xs text-slate-400 font-mono">Flow Overview</span>
              </div>
              
              <h3 className="font-display font-bold text-lg text-slate-800">
                How Users Enter AjarDaya
              </h3>

              <div className="space-y-3">
                {[
                  { step: "1", title: "Register Organization", desc: "NGOs, schools, or community partners register their legal entity." },
                  { step: "2", title: "Create Workspace", desc: "Initialize operating boundaries, centers, and clusters." },
                  { step: "3", title: "Invite Program Users", desc: "Add program managers, mentors, and counselors to the workspace." },
                  { step: "4", title: "Load Learner & Program Data", desc: "Import child status, local indicators, and progress maps." },
                  { step: "5", title: "AI-Powered Decisions", desc: "Use Gemini to analyze equity gaps and simulate interventions." }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold font-mono flex items-center justify-center shrink-0 mt-0.5">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 leading-none mb-0.5">{item.title}</h4>
                      <p className="text-[10px] text-slate-500 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Visual Illustration Collage (Featuring Indonesian Context & Photos Guideline) */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm mb-20 max-w-5xl mx-auto relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-5 text-left">
              <h3 className="font-display font-semibold text-2xl text-slate-800 mb-3">Empowered Educational Collaboration</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Powered by artificial intelligence, AjarDaya integrates perspectives from across the learning ecosystem to bridge support gaps accurately.
              </p>

              <div className="space-y-3.5">
                {[
                  "Inclusive, data-informed decision making",
                  "Optimized, targeted resource allocation",
                  "Simulate intervention impacts before allocating funds",
                  "Real-time gap reporting for all stakeholders"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-teal-600 mt-0.5 flex-shrink-0" />
                    <span className="text-xs font-medium text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Collage representing localized people visuals on the landing page */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-5 rounded-xl border border-slate-750 shadow-sm text-left relative overflow-hidden">
                  <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/5 rounded-full"></div>
                  <span className="text-[10px] bg-teal-500/40 text-teal-100 font-mono px-2 py-0.5 rounded-full">Indonesian Context</span>
                  <h4 className="font-display font-bold text-lg mt-3">Learning Together</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Building capacity through independent community mentoring circles across Maluku, Papua, and East Java.
                  </p>
                </div>
                <PersonaCard id="p-ayu" persona={PERSONAS[0]} />
              </div>

              <div className="space-y-4 sm:translate-y-4">
                <PersonaCard id="p-nisa" persona={PERSONAS[7]} />
                <div className="bg-slate-50 border border-slate-250 p-5 rounded-xl text-left">
                  <span className="text-[9px] font-mono uppercase text-slate-400">Decision Support</span>
                  <h4 className="font-display font-semibold text-sm text-slate-800 mt-1">Affirmative Equity Focus</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Analyzing geographical and accessibility barriers in Maluku and Papua to drive educational equity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Core Value Points */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h3 className="font-display font-bold text-2xl text-slate-800">Why Choose AjarDaya?</h3>
            <p className="text-slate-500 text-sm">Four core pillars supporting community learning enablement</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div id="value-community" className="bg-white rounded-xl border border-slate-200 p-6 text-left shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-display font-semibold text-slate-800 mb-2">Community-centered</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Designed from the ground up to be user-friendly for local facilitators and community leaders across Indonesia.
              </p>
            </div>

            <div id="value-data" className="bg-white rounded-xl border border-slate-200 p-6 text-left shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Compass className="w-5 h-5" />
              </div>
              <h4 className="font-display font-semibold text-slate-800 mb-2">Data-informed</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Objectively integrates online learning outcomes with offline community-driven realities.
              </p>
            </div>

            <div id="value-ai" className="bg-white rounded-xl border border-slate-200 p-6 text-left shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-display font-semibold text-slate-800 mb-2">AI-powered</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Powered by Gemini API to formulate remedial action plans, project cost efficiency, and assemble stakeholder briefs.
              </p>
            </div>

            <div id="value-together" className="bg-white rounded-xl border border-slate-200 p-6 text-left shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h4 className="font-display font-semibold text-slate-800 mb-2">Stronger together</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bridges formal school frameworks with the agile flexibility of NGO programs to walk hand-in-hand.
              </p>
            </div>
          </div>
        </div>

        {/* Featured Local Personas / Stakeholders */}
        <div>
          <div className="text-center mb-10">
            <h3 className="font-display font-bold text-2xl text-slate-800">Voices from the Field</h3>
            <p className="text-slate-500 text-sm">Featuring key stakeholders and student personas</p>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-teal-700 font-semibold mb-3 text-left">Teachers, Mentors & Coordinators</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featuredLeaders.map((p, idx) => (
                  <PersonaCard key={idx} id={`leader-${idx}`} persona={p} />
                ))}
              </div>
            </div>

            <div className="pt-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-teal-700 font-semibold mb-3 text-left">Self-Paced Student Personas</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featuredStudents.map((p, idx) => (
                  <PersonaCard key={idx} id={`student-${idx}`} persona={p} />
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
