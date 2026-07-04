import React, { useState } from "react";
import { INDONESIA_MAP_REGIONS } from "../data";
import { INDONESIA_REGION_PATHS } from "./indonesiaPaths";

// Precise hotspot marker coordinates centered exactly inside each island group path from geodata
const REGION_HOTSPOTS: Record<string, { x: number; y: number }> = {
  "Sumatra": { x: 135, y: 135 },
  "Jawa": { x: 295, y: 265 },
  "Kalimantan": { x: 370, y: 110 },
  "Sulawesi": { x: 510, y: 150 },
  "Bali & Nusa Tenggara": { x: 485, y: 283 },
  "Maluku Islands": { x: 590, y: 150 },
  "Papua": { x: 735, y: 180 }
};

export default function MapIndonesia() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>("Jawa");

  const activeRegionInfo = INDONESIA_MAP_REGIONS.find(r => r.name === selectedRegion) || INDONESIA_MAP_REGIONS[1];

  const isActive = (regionName: string) => selectedRegion === regionName;

  return (
    <div id="indonesia-map-panel" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm transition-all hover:shadow-md flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
          <div>
            <h3 className="font-display font-semibold text-lg text-slate-800">Community & Learner Distribution</h3>
            <p className="text-xs text-slate-500">Map of Active Learning Communities Across Indonesia</p>
          </div>
          <div className="bg-teal-50 border border-teal-100 rounded-lg px-2.5 py-1 text-[11px] font-mono text-teal-700 flex items-center gap-1.5 font-semibold">
            <span className="w-2 h-2 rounded-full bg-teal-500 inline-block animate-pulse"></span>
            Live Data Hub
          </div>
        </div>

        {/* Map Graphic Container with cool sea tint */}
        <div className="relative w-full h-[260px] bg-[#f2f7fb] rounded-xl overflow-hidden border border-blue-100/60 flex items-center justify-center p-2 select-none">
          
          {/* Subtle decorative grid background - very light and unobtrusive */}
          <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_0.75px,transparent_0.75px)] [background-size:16px_16px] opacity-12 pointer-events-none"></div>
          
          {/* Elegant Floating Selected Region Label */}
          {selectedRegion && (
            <div className="absolute top-3 right-3 bg-slate-900/90 text-white rounded-lg px-2.5 py-1.5 shadow-sm flex items-center gap-2 text-[11px] font-medium z-20 border border-slate-800 backdrop-blur-sm transition-all duration-300">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse shrink-0"></span>
              <span className="font-semibold text-slate-100">{activeRegionInfo.name} — <span className="text-teal-300 font-mono font-bold">{activeRegionInfo.count} communities</span></span>
            </div>
          )}

          {/* Compact Map Legend - Compact, horizontal SaaS row style to sit over empty ocean space (no island overlaps) */}
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-lg py-1 px-2.5 flex items-center gap-3 text-[9px] font-semibold text-slate-500 shadow-xs z-20 pointer-events-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1.5 rounded bg-[#0d9488]/38 border border-[#0b7167] inline-block"></span>
              <span>Selected Region</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0d9488] inline-block animate-pulse"></span>
              <span>Active Community</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1.5 rounded bg-[#14b8a6]/15 border border-[#0d9488]/50 inline-block"></span>
              <span>Other Regions</span>
            </div>
          </div>

          {/* Elegant, clean vector SVG Map of Indonesian Archipelago */}
          <svg 
            viewBox="0 0 880 340" 
            className="w-full h-full max-w-2xl z-10 overflow-visible"
          >
            {/* Render each region as a clean vector outline component */}
            {Object.keys(INDONESIA_REGION_PATHS).map((regionName) => {
              const isRegActive = isActive(regionName);

              return (
                <g 
                  key={regionName}
                  className="cursor-pointer group"
                  onClick={() => setSelectedRegion(regionName)}
                >
                  {/* Subtle soft glow/halo under selected region paths */}
                  {isRegActive && INDONESIA_REGION_PATHS[regionName].map((path) => (
                    <path
                      key={`${path.id}-glow`}
                      d={path.d}
                      fill="none"
                      stroke="#14b8a6"
                      strokeWidth="5"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      opacity="0.2"
                      className="transition-all duration-300 ease-in-out pointer-events-none"
                    />
                  ))}

                  {/* Base Outline and Fill Layers for the Region Paths */}
                  {INDONESIA_REGION_PATHS[regionName].map((path) => (
                    <path
                      key={path.id}
                      d={path.d}
                      className="transition-all duration-300 ease-in-out"
                      // Selected region uses a rich teal fill, non-selected uses a soft visible light teal fill
                      fill={isRegActive ? "rgba(13, 148, 136, 0.38)" : "rgba(20, 184, 166, 0.15)"}
                      // Selected region uses a darker teal outline, non-selected uses a slightly darker, clearly defined teal outline
                      stroke={isRegActive ? "#0b7167" : "rgba(13, 148, 136, 0.5)"}
                      strokeWidth={isRegActive ? "2.0" : "1.1"}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  ))}
                  
                  {/* Invisible broad hover helper path to make clicking small islands easier */}
                  {INDONESIA_REGION_PATHS[regionName].map((path) => (
                    <path
                      key={`${path.id}-hover`}
                      d={path.d}
                      fill="transparent"
                      stroke="transparent"
                      strokeWidth="12"
                      className="cursor-pointer"
                    />
                  ))}
                </g>
              );
            })}

            {/* Glowing, Precise Hotspot Markers with pulsing beacons directly centered on each region */}
            {INDONESIA_MAP_REGIONS.map((reg) => {
              const isSelected = reg.name === selectedRegion;
              const coords = REGION_HOTSPOTS[reg.name] || { x: 440, y: 170 };
              
              return (
                <g 
                  key={reg.name} 
                  className="cursor-pointer group/marker"
                  onClick={() => setSelectedRegion(reg.name)}
                >
                  {/* Soft glow under the marker - dark teal soft glow */}
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={isSelected ? "11" : "8"}
                    fill="#0d9488"
                    opacity={isSelected ? "0.35" : "0.18"}
                    className="transition-all duration-300"
                  />

                  {/* Pulsing ring for selected marker */}
                  {isSelected && (
                    <circle 
                      cx={coords.x} 
                      cy={coords.y} 
                      r="14" 
                      fill="#0d9488" 
                      fillOpacity="0.25"
                      className="animate-ping"
                      style={{ transformOrigin: `${coords.x}px ${coords.y}px`, animationDuration: "2.5s" }}
                    />
                  )}
                  
                  {/* Outer border & white background */}
                  <circle 
                    cx={coords.x} 
                    cy={coords.y} 
                    r={isSelected ? "7.5" : "5"} 
                    fill="#ffffff"
                    stroke={isSelected ? "#0d9488" : "rgba(13, 148, 136, 0.65)"}
                    strokeWidth={isSelected ? "2" : "1.5"}
                    className="transition-all duration-300 group-hover/marker:stroke-teal-600"
                  />
                  
                  {/* Center dot - Dark teal center */}
                  <circle 
                    cx={coords.x} 
                    cy={coords.y} 
                    r={isSelected ? "3" : "1.8"} 
                    fill="#075e54"
                    className="transition-all duration-300 group-hover/marker:fill-teal-700"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Region Summary Panel */}
        <div id="selected-region-info-card" className="mt-4 bg-slate-50 border border-slate-200/60 rounded-xl p-4 transition-all">
          <div className="grid grid-cols-1 md:grid-cols-[1.3fr_0.85fr_0.85fr] gap-4 items-center">
            {/* Region Label - Prevent vertical syllable-by-syllable stacking, allow proper wrapping */}
            <div className="flex items-center gap-2.5 md:border-r md:border-slate-200 md:pr-4 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse shrink-0"></div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] text-slate-400 block uppercase font-mono tracking-wider">Region</span>
                <span 
                  className="font-display font-extrabold text-slate-800 text-sm md:text-base tracking-tight block whitespace-nowrap overflow-visible"
                  style={{ wordBreak: "normal", overflowWrap: "normal" }}
                >
                  {activeRegionInfo.name}
                </span>
              </div>
            </div>

            {/* Communities Count */}
            <div className="flex flex-col pl-0 md:pl-2">
              <span className="text-[9px] text-slate-400 block uppercase font-mono tracking-wider">Communities</span>
              <span className="font-mono font-bold text-slate-800 text-sm whitespace-nowrap">{activeRegionInfo.count.toLocaleString("en-US")} units</span>
            </div>

            {/* Active Learners Count */}
            <div className="flex flex-col border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 pl-0 md:pl-4">
              <span className="text-[9px] text-slate-400 block uppercase font-mono tracking-wider">Active Learners</span>
              <span className="font-mono font-bold text-teal-700 text-sm whitespace-nowrap">{activeRegionInfo.active.toLocaleString("en-US")} learners</span>
            </div>
          </div>
        </div>
      </div>

      {/* Region Selector Chips */}
      <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-slate-100">
        {INDONESIA_MAP_REGIONS.map((reg) => (
          <button
            key={reg.name}
            id={`btn-map-${reg.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
            onClick={() => setSelectedRegion(reg.name)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-semibold tracking-wide transition-all cursor-pointer ${
              selectedRegion === reg.name
                ? "bg-teal-600 text-white shadow-sm shadow-teal-600/10"
                : "bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-100"
            }`}
          >
            {reg.name}
          </button>
        ))}
      </div>
    </div>
  );
}
