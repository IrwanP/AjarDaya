import React, { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import CommandCenter from "./components/CommandCenter";
import CohortIntelligence from "./components/CohortIntelligence";
import EquitySupportGaps from "./components/EquitySupportGaps";
import InterventionSimulator from "./components/InterventionSimulator";
import ResourcePlanner from "./components/ResourcePlanner";
import ActionBriefView from "./components/ActionBriefView";
import WalkthroughStepper from "./components/WalkthroughStepper";

import { 
  Home, 
  LayoutDashboard, 
  BrainCircuit, 
  Flame, 
  PlayCircle, 
  Coins, 
  FileCheck2, 
  Sparkles, 
  Menu, 
  X, 
  HelpCircle,
  Globe,
  CheckCircle2,
  Info
} from "lucide-react";

export default function App() {
  const [activeView, setActiveView] = useState<string>("landing");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);

  // Traceability states to link Support Gap Lens and Cohort Analyzer
  const [selectedGroup, setSelectedGroup] = useState<string>("Low-income learners");
  const [selectedDomain, setSelectedDomain] = useState<string>("Digital access");
  const [selectedSupportGapFilter, setSelectedSupportGapFilter] = useState<string | null>(null);
  const [highlightedLearnerName, setHighlightedLearnerName] = useState<string | null>(null);

  // Check backend server connection and API Key status on load
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch("/api/health");
        const data = await res.json();
        if (data && data.hasApiKey) {
          setHasApiKey(true);
        }
      } catch (err) {
        console.warn("Could not connect to health endpoint. Running on static client fallbacks.");
      }
    };
    checkHealth();
  }, []);

  const navItems = [
    { id: "landing", label: "Landing Page", icon: Home },
    { id: "command_center", label: "Command Center", icon: LayoutDashboard },
    { id: "cohort_intelligence", label: "Cohort Analyzer", icon: BrainCircuit },
    { id: "equity_gaps", label: "Support Gap Lens", icon: Flame },
    { id: "intervention_simulator", label: "Intervention Simulator", icon: PlayCircle },
    { id: "resource_planner", label: "Resource Planner", icon: Coins },
    { id: "action_brief", label: "Action Brief", icon: FileCheck2 }
  ];

  // Render active panel based on state selection
  const renderActiveView = () => {
    switch (activeView) {
      case "landing":
        return (
          <LandingPage 
            isDemoActive={isDemoActive}
            onStartDemo={() => {
              setIsDemoActive(true);
              setActiveView("command_center");
            }}
            onResetDemo={() => {
              setIsDemoActive(false);
              setActiveView("landing");
            }}
            onNavigate={(id) => setActiveView(id)} 
          />
        );
      case "command_center":
        return (
          <CommandCenter 
            isDemoActive={isDemoActive}
            onNavigate={(id) => setActiveView(id)} 
          />
        );
      case "cohort_intelligence":
        return (
          <CohortIntelligence 
            isDemoActive={isDemoActive}
            onNavigate={(id) => {
              setActiveView(id);
            }}
            selectedSupportGapFilter={selectedSupportGapFilter}
            setSelectedSupportGapFilter={setSelectedSupportGapFilter}
            highlightedLearnerName={highlightedLearnerName}
            setHighlightedLearnerName={setHighlightedLearnerName}
            setSelectedGroup={setSelectedGroup}
            setSelectedDomain={setSelectedDomain}
          />
        );
      case "equity_gaps":
        return (
          <EquitySupportGaps 
            isDemoActive={isDemoActive}
            onNavigate={(id) => {
              setActiveView(id);
            }}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            selectedDomain={selectedDomain}
            setSelectedDomain={setSelectedDomain}
            selectedSupportGapFilter={selectedSupportGapFilter}
            setSelectedSupportGapFilter={setSelectedSupportGapFilter}
            setHighlightedLearnerName={setHighlightedLearnerName}
            hasApiKey={hasApiKey}
          />
        );
      case "intervention_simulator":
        return (
          <InterventionSimulator 
            isDemoActive={isDemoActive}
            onNavigate={(id) => setActiveView(id)}
            hasApiKey={hasApiKey}
          />
        );
      case "resource_planner":
        return (
          <ResourcePlanner 
            isDemoActive={isDemoActive}
            onNavigate={(id) => setActiveView(id)}
          />
        );
      case "action_brief":
        return (
          <ActionBriefView 
            isDemoActive={isDemoActive}
            onNavigate={(id) => setActiveView(id)}
            onResetDemo={() => {
              setIsDemoActive(false);
              setActiveView("landing");
            }}
            hasApiKey={hasApiKey}
          />
        );
      default:
        return (
          <LandingPage 
            isDemoActive={isDemoActive}
            onStartDemo={() => {
              setIsDemoActive(true);
              setActiveView("command_center");
            }}
            onResetDemo={() => {
              setIsDemoActive(false);
              setActiveView("landing");
            }}
            onNavigate={(id) => setActiveView(id)} 
          />
        );
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex text-slate-800 font-sans antialiased selection:bg-teal-100 selection:text-teal-900">
      
      {/* Sidebar - Persistent Desktop, Collapsible Mobile */}
      <aside 
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 w-60 h-screen bg-slate-900 text-white border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } md:sticky md:top-0 shrink-0`}
      >
        <div>
          {/* Brand/Branding header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 select-none">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-teal-500/10">
                A
              </div>
              <div className="text-left">
                <span className="font-display font-semibold text-lg text-white tracking-tight block">AjarDaya</span>
              </div>
            </div>
            
            {/* Close sidebar on mobile */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isDemoActive && (
            <div className="mx-4 mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2.5 text-amber-300">
              <Sparkles className="w-4.5 h-4.5 text-amber-400 shrink-0" />
              <div>
                <p className="text-[11px] font-bold">Judge Demo Mode</p>
                <p className="text-[9px] text-slate-400">East Java Cluster Active</p>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="py-4 space-y-1 text-left">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => {
                    setActiveView(item.id);
                    // Close sidebar on mobile
                    if (window.innerWidth < 768) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-6 py-2.5 text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? "bg-teal-500/10 border-r-4 border-teal-500 text-teal-400 font-semibold"
                      : "border-r-4 border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? "text-teal-400" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-slate-800 space-y-3 text-left bg-slate-950/20">
          <div className="relative group flex items-center gap-3 cursor-help p-1 rounded-lg hover:bg-slate-850 transition-colors">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center border border-teal-400 text-white font-bold shrink-0">
              PA
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-slate-100 truncate">Pak Arif</span>
                <Info className="w-3 h-3 text-slate-500 group-hover:text-teal-400 transition-colors shrink-0" />
              </div>
              <p className="text-xs text-slate-400 truncate">NGO Program Manager</p>
            </div>

            {/* User Tooltip */}
            <div className="absolute left-0 bottom-full mb-3.5 w-64 bg-slate-950 text-slate-200 text-[11px] leading-relaxed p-3 rounded-lg shadow-xl border border-slate-800 hidden group-hover:block z-50 font-normal pointer-events-none">
              <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-slate-950 border-b border-r border-slate-800 rotate-45"></div>
              Pak Arif is the logged-in program manager for the Nusantara Learning Foundation workspace. He reviews community learning data, identifies support gaps, and coordinates interventions.
            </div>
          </div>

          {/* Connected state badge */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700 text-[10px] text-teal-300 font-mono">
            <span className={`w-2 h-2 rounded-full ${hasApiKey ? "bg-emerald-400 animate-pulse" : "bg-amber-500"} inline-block`}></span>
            <span>{hasApiKey ? "Gemini connected" : "Demo reasoning mode"}</span>
          </div>

          <div className="px-2">
            <p className="text-[10px] text-slate-500 font-mono">
              © 2026 AjarDaya Indonesia.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50">
        
        {/* Global top navigation bar */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 z-30 select-none shrink-0 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              {activeView === "landing" ? "AjarDaya Platform" : 
               activeView === "command_center" ? "Community Learning Command Center" :
               activeView === "cohort_intelligence" ? "Cohort Intelligence Analyzer" :
               activeView === "equity_gaps" ? "Equity & Support Gap Lens" :
               activeView === "intervention_simulator" ? "Impact Intervention Simulator" :
               activeView === "resource_planner" ? "Resource Allocation Planner" : "Community Action Brief"}
            </h1>
          </div>

          {/* Quick status information / actions */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 relative">
              <div className="relative group flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg text-xs text-slate-500 font-medium cursor-help hover:bg-slate-100/50 transition-colors">
                <span>NGO Supporter: <span className="font-bold text-slate-700">Nusantara Learning Foundation</span></span>
                <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                
                {/* Custom Tooltip */}
                <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 text-slate-100 text-[11px] leading-relaxed p-3 rounded-lg shadow-xl border border-slate-800 hidden group-hover:block z-50 font-normal pointer-events-none transition-all">
                  <div className="absolute -top-1.5 right-4 w-3 h-3 bg-slate-900 border-t border-l border-slate-800 rotate-45"></div>
                  Nusantara Learning Foundation is the demo organization workspace. In a real setup, this would be created during organization registration by an NGO, school, foundation, or community partner.
                </div>
              </div>
            </div>
            
            <button
              id="top-help-btn"
              onClick={() => setIsHelpOpen(true)}
              className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer"
              title="Glossary & Information"
            >
              <HelpCircle className="w-4.5 h-4.5" />
            </button>
          </div>
        </header>

        {/* View render wrapper */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative space-y-6">
          {isDemoActive && activeView !== "landing" && (
            <WalkthroughStepper activeView={activeView} onNavigate={(id) => setActiveView(id)} />
          )}
          {renderActiveView()}
        </main>
      </div>

      {/* Help Glossary Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-teal-700">
                <HelpCircle className="w-5 h-5" />
                <h3 className="font-display font-bold text-slate-800">AjarDaya Support Glossary</h3>
              </div>
              <button 
                onClick={() => setIsHelpOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed overflow-y-auto max-h-[360px] pr-1">
              <div>
                <h4 className="font-bold text-slate-800 uppercase font-mono">1. Access (Physical Access)</h4>
                <p>Availability of study spaces, geographical travel distances, volunteer tutor availability, and teaching continuity at target locations.</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 uppercase font-mono">2. Literacy (Reading Proficiency)</h4>
                <p>Level of basic reading comprehension, directed reading interest, vocabulary mastery, and home reading habits.</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 uppercase font-mono">3. Numeracy (Arithmetic Proficiency)</h4>
                <p>Foundational arithmetic logic, understanding of scale/proportions, and ability to solve basic multiplication/division problems in everyday life.</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 uppercase font-mono">4. Mentorship (Teacher/Mentor Guidance)</h4>
                <p>Availability of trained tutors, safe mentor-to-student ratio (max 1:20), and consistent emotional and academic guidance after school.</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 uppercase font-mono">5. Participation (Parental & Community Support)</h4>
                <p>Parent support, student attendance at Community Study Centers, engagement of local tribal/community figures, and school committee collaboration.</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 uppercase font-mono">6. Digital Access (Infrastructure Access)</h4>
                <p>Availability of learning devices, internet connectivity, stable power supply, and proficiency in using digital learning tools.</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsHelpOpen(false)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close Info
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
