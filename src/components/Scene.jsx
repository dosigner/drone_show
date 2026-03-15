"use client";

import React, { useEffect, useState } from "react";
import DroneShowCanvas from "./DroneShowCanvas";

const MOBILE_BREAKPOINT = 768;
const HUD_AUTO_CLOSE_MS = 2600;
const LOCAL_HOSTNAMES = ["localhost", "127.0.0.1", "::1"];

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

function TiltIcon({ className = "" }) {
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
      <path d="M7 4.8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14.4a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2Z" />
      <path d="m10 7 4 0" />
      <path d="m9 14 6-2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

function canUseDeviceOrientation() {
  if (typeof window === "undefined") {
    return false;
  }

  if (typeof window.DeviceOrientationEvent === "undefined") {
    return false;
  }

  return window.isSecureContext || LOCAL_HOSTNAMES.includes(window.location.hostname);
}

function requiresDeviceOrientationPermission() {
  if (typeof window === "undefined") {
    return false;
  }

  return typeof window.DeviceOrientationEvent?.requestPermission === "function";
}

export default function Scene() {
  const [stepInfo, setStepInfo] = useState({ label: "준비 중", index: 0, total: 10 });
  const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [mobileHudExpanded, setMobileHudExpanded] = useState(false);
  const [gyroAvailable, setGyroAvailable] = useState(false);
  const [gyroEnabled, setGyroEnabled] = useState(false);
  const [gyroError, setGyroError] = useState("");

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      setIsPortrait(window.innerWidth < window.innerHeight);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setGyroAvailable(canUseDeviceOrientation());
  }, []);

  useEffect(() => {
    if (gyroAvailable) {
      return;
    }

    setGyroEnabled(false);
  }, [gyroAvailable]);

  useEffect(() => {
    if (!gyroAvailable) {
      return;
    }

    if (requiresDeviceOrientationPermission()) {
      return;
    }

    setGyroEnabled(true);
    setGyroError("");
  }, [gyroAvailable]);

  useEffect(() => {
    if (!isMobile || !mobileHudExpanded) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setMobileHudExpanded(false);
    }, HUD_AUTO_CLOSE_MS);

    return () => window.clearTimeout(timer);
  }, [isMobile, mobileHudExpanded, stepInfo]);

  useEffect(() => {
    if (!isMobile || !gyroEnabled || typeof navigator === "undefined" || !navigator.wakeLock?.request) {
      return undefined;
    }

    let wakeLock = null;
    let disposed = false;

    async function requestWakeLock() {
      if (disposed || document.visibilityState !== "visible") {
        return;
      }

      try {
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => {
          wakeLock = null;
        });
      } catch (error) {
        console.error("wake lock request failed:", error);
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && !wakeLock) {
        requestWakeLock();
      }
    }

    requestWakeLock();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
        wakeLock = null;
      }
    };
  }, [gyroEnabled, isMobile]);

  const resetLabel = gyroEnabled ? "기준점 재설정" : "카메라 리셋";
  const mobileHint = gyroEnabled ? "기기를 기울여 회전 · 두 손가락 줌" : "한 손가락 회전 · 두 손가락 줌";

  const handleResetCamera = () => {
    window.dispatchEvent(new CustomEvent("reset-camera"));
    if (isMobile) {
      setMobileHudExpanded(true);
    }
  };

  const handleToggleGyro = async () => {
    if (!gyroAvailable) {
      return;
    }

    if (isMobile) {
      setMobileHudExpanded(true);
    }

    if (gyroEnabled) {
      setGyroEnabled(false);
      setGyroError("");
      return;
    }

    try {
      const requestPermission = window.DeviceOrientationEvent?.requestPermission;

      if (typeof requestPermission === "function") {
        const permission = await requestPermission.call(window.DeviceOrientationEvent);

        if (permission !== "granted") {
          setGyroEnabled(false);
          setGyroError("기기 기울기 권한을 허용해 주세요.");
          return;
        }
      }

      setGyroError("");
      setGyroEnabled(true);
    } catch (error) {
      console.error("gyro permission request failed:", error);
      setGyroEnabled(false);
      setGyroError("기기 기울기 권한을 허용해 주세요.");
    }
  };

  const toggleMobileHud = () => {
    setMobileHudExpanded((value) => !value);
  };

  return (
    <div className="relative h-dvh min-h-dvh w-screen overflow-hidden bg-black font-sans">
      <DroneShowCanvas onStepChange={setStepInfo} gyroEnabled={gyroEnabled} />

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
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${isPortrait ? "8px" : "12px"})` }}
      >
        {mobileHudExpanded ? (
          <div className="pointer-events-none px-3">
            <div className={`pointer-events-auto mx-auto mb-2 w-full rounded-[28px] border border-white/10 shadow-2xl backdrop-blur-2xl ${isPortrait ? "max-w-full bg-black/55 px-3 py-3" : "max-w-[24rem] bg-black/45 px-4 py-4"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-white/40">ADD Drone Show</p>
                  <p className={`mt-1.5 truncate font-semibold text-white/90 ${isPortrait ? "text-sm" : "text-base"}`}>{stepInfo.label}</p>
                  <p className="mt-0.5 text-xs text-white/45">{mobileHint}</p>
                  {gyroAvailable ? (
                    <p className={`mt-1 text-[11px] ${gyroEnabled ? "text-cyan-200/80" : "text-white/35"}`}>
                      {gyroEnabled ? "기울기 조종 켜짐" : "기울기 조종 꺼짐"}
                    </p>
                  ) : null}
                  {gyroError ? <p className="mt-1 text-[11px] text-amber-200/80">{gyroError}</p> : null}
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

              <div className={`rounded-2xl border border-white/8 bg-white/[0.04] px-3 ${isPortrait ? "mt-2.5 py-2" : "mt-4 py-3"}`}>
                <div className="flex items-center justify-between text-[11px] text-white/55">
                  <span>진행도</span>
                  <span>
                    {stepInfo.index + 1} / {stepInfo.total}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  {Array.from({ length: stepInfo.total }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        i === stepInfo.index
                          ? `bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.55)] ${isPortrait ? "w-6" : "w-8"}`
                          : i < stepInfo.index
                            ? `bg-white/45 ${isPortrait ? "w-2.5" : "w-3"}`
                            : `bg-white/10 ${isPortrait ? "w-2.5" : "w-3"}`
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className={`flex items-center justify-between gap-2 ${isPortrait ? "mt-2.5" : "mt-4"}`}>
                {gyroAvailable ? (
                  <button
                    onClick={handleToggleGyro}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border text-sm font-medium shadow-lg backdrop-blur-xl active:scale-[0.98] ${isPortrait ? "h-10" : "h-12"} ${
                      gyroEnabled
                        ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100"
                        : "border-white/10 bg-black/30 text-white/75"
                    }`}
                  >
                    <TiltIcon className="h-4 w-4" />
                    <span>{gyroEnabled ? "기울기 조종 끄기" : "기울기 조종 켜기"}</span>
                  </button>
                ) : null}
                <button
                  onClick={handleResetCamera}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/6 text-sm font-medium text-white/85 shadow-lg backdrop-blur-xl active:scale-[0.98] ${isPortrait ? "h-10" : "h-12"}`}
                >
                  <ResetIcon className="h-4 w-4" />
                  <span>{resetLabel}</span>
                </button>
                <button
                  onClick={() => setMobileHudExpanded(false)}
                  className={`flex min-w-[4.5rem] items-center justify-center rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white/70 active:scale-[0.98] ${isPortrait ? "h-10" : "h-12"}`}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="pointer-events-none px-3">
          <div className="flex items-end justify-between gap-2">
            <button
              onClick={toggleMobileHud}
              className={`pointer-events-auto flex min-w-0 flex-1 items-center gap-2.5 rounded-full border border-white/10 text-left text-white shadow-2xl backdrop-blur-2xl active:scale-[0.98] ${isPortrait ? "bg-black/50 px-3 py-2" : "bg-black/40 px-4 py-3"}`}
            >
              <div className="h-2 w-2 shrink-0 rounded-full bg-cyan-400 animate-pulse" />
              <div className="min-w-0">
                <p className={`truncate font-medium text-white/90 ${isPortrait ? "text-[13px]" : "text-sm"}`}>{stepInfo.label}</p>
                <p className="mt-0.5 text-[11px] text-white/45">
                  {stepInfo.index + 1} / {stepInfo.total}
                </p>
              </div>
            </button>

            {gyroAvailable ? (
              <button
                onClick={handleToggleGyro}
                className={`pointer-events-auto flex shrink-0 items-center justify-center rounded-full border shadow-2xl backdrop-blur-2xl active:scale-[0.98] ${isPortrait ? "h-10 w-10" : "h-12 w-12"} ${
                  gyroEnabled
                    ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100"
                    : "border-white/10 bg-black/40 text-white/75"
                }`}
                title={gyroEnabled ? "기울기 조종 끄기" : "기울기 조종 켜기"}
              >
                <TiltIcon className="h-[18px] w-[18px]" />
              </button>
            ) : null}

            <button
              onClick={handleResetCamera}
              className={`pointer-events-auto flex shrink-0 items-center justify-center rounded-full border border-white/10 text-white/75 shadow-2xl backdrop-blur-2xl active:scale-[0.98] ${isPortrait ? "h-10 w-10 bg-black/50" : "h-12 w-12 bg-black/40"}`}
              title={resetLabel}
            >
              <ResetIcon className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
