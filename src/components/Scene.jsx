"use client";

import React, { useEffect, useState } from "react";
import DroneShowCanvas from "./DroneShowCanvas";

const MOBILE_BREAKPOINT = 768;
const HUD_AUTO_CLOSE_MS = 2600;

function ResetIcon({ className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

export default function Scene() {
  const [stepInfo, setStepInfo] = useState({ label: "준비 중", index: 0, total: 10 });
  const [isMobile, setIsMobile] = useState(false);
  const [mobileHudExpanded, setMobileHudExpanded] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile || !mobileHudExpanded) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setMobileHudExpanded(false);
    }, HUD_AUTO_CLOSE_MS);

    return () => window.clearTimeout(timer);
  }, [isMobile, mobileHudExpanded, stepInfo]);

  const handleResetCamera = () => {
    window.dispatchEvent(new CustomEvent("reset-camera"));
    if (isMobile) {
      setMobileHudExpanded(true);
    }
  };

  const toggleMobileHud = () => {
    setMobileHudExpanded((value) => !value);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black font-sans">
      <DroneShowCanvas onStepChange={setStepInfo} />

      <div className="pointer-events-none absolute left-4 top-4 hidden max-w-[26rem] rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white shadow-2xl backdrop-blur-xl md:block">
        <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/50">ADD Drone Show</p>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <p className="text-sm font-medium text-cyan-100">{stepInfo.label}</p>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 items-end gap-3 md:flex">
        <div className="pointer-events-none flex flex-col items-center">
          <div className="mb-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 shadow-xl backdrop-blur-xl">
            <p className="text-xs font-medium tracking-widest text-white/70">
              {stepInfo.index + 1} <span className="mx-1 text-white/30">/</span> {stepInfo.total}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur-xl">
            {Array.from({ length: stepInfo.total }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === stepInfo.index
                    ? "w-8 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                    : i < stepInfo.index
                      ? "w-3 bg-white/40"
                      : "w-3 bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>

        <button
          onClick={handleResetCamera}
          className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 shadow-xl backdrop-blur-xl transition-all hover:bg-white/10 hover:text-white active:scale-95"
          title="카메라 리셋"
        >
          <ResetIcon className="transition-transform group-hover:-rotate-90" />
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-8 left-8 hidden rounded-xl border border-white/5 bg-black/20 px-4 py-2 backdrop-blur-md md:block">
        <p className="text-xs text-white/40">드래그: 시점 회전 · 휠/핀치: 줌</p>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 z-20 md:hidden"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        {mobileHudExpanded ? (
          <div className="pointer-events-none px-4">
            <div className="pointer-events-auto mx-auto mb-3 w-full max-w-[24rem] rounded-[28px] border border-white/10 bg-black/45 px-4 py-4 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-white/40">ADD Drone Show</p>
                  <p className="mt-2 truncate text-base font-semibold text-white/90">{stepInfo.label}</p>
                  <p className="mt-1 text-xs text-white/45">한 손가락 회전 · 두 손가락 줌</p>
                </div>
                <button
                  onClick={toggleMobileHud}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70"
                  title="패널 닫기"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3">
                <div className="flex items-center justify-between text-[11px] text-white/55">
                  <span>진행도</span>
                  <span>
                    {stepInfo.index + 1} / {stepInfo.total}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  {Array.from({ length: stepInfo.total }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        i === stepInfo.index
                          ? "w-8 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.55)]"
                          : i < stepInfo.index
                            ? "w-3 bg-white/45"
                            : "w-3 bg-white/10"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  onClick={handleResetCamera}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/6 text-sm font-medium text-white/85 shadow-lg backdrop-blur-xl active:scale-[0.98]"
                >
                  <ResetIcon className="h-4 w-4" />
                  <span>카메라 리셋</span>
                </button>
                <button
                  onClick={() => setMobileHudExpanded(false)}
                  className="flex h-12 min-w-[5rem] items-center justify-center rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white/70 active:scale-[0.98]"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="pointer-events-none px-4">
          <div className="flex items-end justify-between gap-3">
            <button
              onClick={toggleMobileHud}
              className="pointer-events-auto flex min-w-0 flex-1 items-center gap-3 rounded-full border border-white/10 bg-black/40 px-4 py-3 text-left text-white shadow-2xl backdrop-blur-2xl active:scale-[0.98]"
            >
              <div className="h-2 w-2 shrink-0 rounded-full bg-cyan-400 animate-pulse" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white/90">{stepInfo.label}</p>
                <p className="mt-0.5 text-[11px] text-white/45">
                  {stepInfo.index + 1} / {stepInfo.total}
                </p>
              </div>
            </button>

            <button
              onClick={handleResetCamera}
              className="pointer-events-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/75 shadow-2xl backdrop-blur-2xl active:scale-[0.98]"
              title="카메라 리셋"
            >
              <ResetIcon className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
