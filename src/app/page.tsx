"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEnter = () => {
    setEntering(true);
    setTimeout(() => router.push("/show"), 800);
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* Animated starfield background */}
      <div className="absolute inset-0">
        {mounted &&
          Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.6 + 0.1,
                animation: `twinkle ${2 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />

      {/* Content */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center h-full px-6 transition-all duration-700 ${
          entering ? "opacity-0 scale-110" : mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Logo / Title */}
        <div className="text-center mb-12">
          <p className="text-xs md:text-sm tracking-[0.4em] text-white/40 uppercase mb-4 font-light">
            Agency for Defense Development
          </p>
          <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-white mb-3">
            <span className="bg-gradient-to-r from-blue-400 via-white to-blue-400 bg-clip-text text-transparent">
              ADD DRONE SHOW
            </span>
          </h1>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto my-6" />
          <p className="text-sm md:text-lg text-white/50 font-light tracking-wide">
            국방과학연구소 창조관 야간 드론쇼 시뮬레이션
          </p>
        </div>

        {/* Enter button */}
        <button
          onClick={handleEnter}
          className="group relative px-10 py-4 md:px-14 md:py-5 rounded-full 
                     border border-white/20 bg-white/5 backdrop-blur-sm
                     text-white text-sm md:text-base tracking-widest uppercase
                     hover:bg-white/15 hover:border-white/40 hover:scale-105
                     transition-all duration-500 cursor-pointer"
        >
          <span className="relative z-10">드론쇼 시작</span>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 via-transparent to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </button>

        {/* Info */}
        <div className="mt-16 flex gap-8 text-center">
          <div>
            <p className="text-2xl md:text-3xl font-bold text-white/80">1,000+</p>
            <p className="text-xs text-white/30 mt-1 tracking-wider">DRONES</p>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div>
            <p className="text-2xl md:text-3xl font-bold text-white/80">8</p>
            <p className="text-xs text-white/30 mt-1 tracking-wider">FORMATIONS</p>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div>
            <p className="text-2xl md:text-3xl font-bold text-white/80">3D</p>
            <p className="text-xs text-white/30 mt-1 tracking-wider">INTERACTIVE</p>
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <p className="text-xs text-white/20 tracking-widest animate-pulse">
          CLICK TO ENTER
        </p>
      </div>
    </div>
  );
}
