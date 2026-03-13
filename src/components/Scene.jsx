"use client";

import React, { useState } from "react";
import DroneShowCanvas from "./DroneShowCanvas";

export default function Scene() {
  const [currentStep, setCurrentStep] = useState("준비 중");

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <DroneShowCanvas onStepChange={setCurrentStep} />

      <div className="pointer-events-none absolute left-5 top-5 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white backdrop-blur-md">
        <p className="text-[10px] uppercase tracking-[0.35em] text-white/45">ADD Drone Show</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">창조관 드론쇼 시뮬레이션</h1>
        <p className="mt-2 text-sm text-cyan-200/90">현재 연출: {currentStep}</p>
        <p className="mt-2 text-xs text-white/50">드래그 회전 · 휠/핀치 줌 · SVG 형상 지원</p>
      </div>
    </div>
  );
}
