"use client";

import React, { useState, useEffect, useRef } from "react";
import DroneShowCanvas from "./DroneShowCanvas";

export default function Scene() {
  const [stepInfo, setStepInfo] = useState({ label: "준비 중", index: 0, total: 10 });
  const canvasRef = useRef(null);

  const handleResetCamera = () => {
    // Find the canvas element and call its reset method if we exposed it
    // Since we can't easily call a method on the child component without forwardRef,
    // we'll dispatch a custom event that DroneShowCanvas can listen for
    window.dispatchEvent(new CustomEvent('reset-camera'));
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black font-sans">
      <DroneShowCanvas onStepChange={setStepInfo} />

      {/* Top Left: Title Panel (Glassmorphism) */}
      <div className="pointer-events-none absolute left-4 top-4 md:left-6 md:top-6 rounded-2xl border border-white/10 bg-white/5 px-4 md:px-6 py-3 md:py-5 text-white shadow-2xl backdrop-blur-xl max-w-[80vw] md:max-w-none">
        <p className="text-[9px] md:text-[11px] font-semibold uppercase tracking-[0.4em] text-white/50">ADD Drone Show</p>
        <h1 className="mt-1 text-lg md:text-2xl font-bold tracking-tight text-white/90 truncate">창조관 드론쇼 시뮬레이션</h1>
        <div className="mt-2 md:mt-3 flex items-center gap-2 md:gap-3">
          <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-cyan-400 animate-pulse"></div>
          <p className="text-xs md:text-sm font-medium text-cyan-100 truncate">{stepInfo.label}</p>
        </div>
      </div>

      {/* Bottom Center: Cinematic Timeline (Glassmorphism) */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex items-end gap-3 w-[92vw] md:w-auto justify-center">
        <div className="pointer-events-none flex flex-col items-center w-[calc(100%-3.5rem)] md:w-auto">
        <div className="mb-2 md:mb-3 rounded-full border border-white/10 bg-white/5 px-3 md:px-4 py-1 md:py-1.5 shadow-xl backdrop-blur-xl">
          <p className="text-[10px] md:text-xs font-medium tracking-widest text-white/70">
            {stepInfo.index + 1} <span className="mx-1 text-white/30">/</span> {stepInfo.total}
          </p>
        </div>
        
        <div className="flex items-center gap-1 md:gap-2 rounded-xl md:rounded-2xl border border-white/10 bg-white/5 p-2 md:p-3 shadow-2xl backdrop-blur-xl w-full justify-center">
          {Array.from({ length: stepInfo.total }).map((_, i) => (
            <div 
              key={i} 
              className={`h-1 md:h-1.5 rounded-full transition-all duration-500 ${
                i === stepInfo.index 
                  ? "w-6 md:w-8 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" 
                  : i < stepInfo.index 
                    ? "w-2 md:w-3 bg-white/40" 
                    : "w-2 md:w-3 bg-white/10"
              }`}
            />
          ))}
        </div>
        </div>

        <button 
          onClick={handleResetCamera}
          className="group flex h-10 w-10 shrink-0 md:h-12 md:w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 shadow-xl backdrop-blur-xl transition-all hover:bg-white/10 hover:text-white active:scale-95"
          title="카메라 리셋"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-rotate-90 md:w-5 md:h-5">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
        </button>
      </div>
      
      {/* Help Text */}
      <div className="pointer-events-none absolute bottom-6 md:bottom-8 left-4 md:left-8 rounded-lg md:rounded-xl border border-white/5 bg-black/20 px-3 md:px-4 py-1.5 md:py-2 backdrop-blur-md hidden sm:block">
        <p className="text-[10px] md:text-xs text-white/40">드래그: 시점 회전 · 휠/핀치: 줌</p>
      </div>
    </div>
  );
}
