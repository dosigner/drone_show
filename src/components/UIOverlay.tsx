"use client";

import { SequenceState } from "@/hooks/useFormationSequence";
import { Formation } from "@/utils/formations";

interface UIOverlayProps {
  sequenceState: SequenceState;
  formations: Formation[];
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
}

export default function UIOverlay({
  sequenceState,
  formations,
  onPlay,
  onPause,
  onReset,
}: UIOverlayProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm md:text-base font-medium tracking-widest text-white/60 uppercase">
              ADD Drone Show
            </h1>
            <p className="text-xs text-white/30 mt-1 tracking-wider">
              국방과학연구소 창조관
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40 tracking-wider">
              {sequenceState.isPlaying ? "LIVE" : "READY"}
            </p>
            {sequenceState.isPlaying && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-red-400/80">REC</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Formation name display */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        {sequenceState.phase === "transition" && sequenceState.isPlaying && (
          <div className="animate-fade-in">
            <p className="text-2xl md:text-4xl font-bold text-white/90 tracking-wide drop-shadow-lg">
              {sequenceState.formationNameKo}
            </p>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
        {/* Formation progress indicators */}
        <div className="flex justify-center gap-1.5 mb-4">
          {formations.map((f, i) => (
            <div
              key={f.name}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === sequenceState.currentIndex
                  ? "w-8 bg-white/90"
                  : i < sequenceState.currentIndex
                  ? "w-3 bg-white/40"
                  : "w-3 bg-white/15"
              }`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 pointer-events-auto">
          <button
            onClick={onReset}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 
                       flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 
                       transition-all duration-300"
            title="처음으로"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 1 9 9 9.75 9.75 0 0 1-6.74-2.74L3 21" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          <button
            onClick={sequenceState.isPlaying ? onPause : onPlay}
            className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/15 backdrop-blur-md 
                       border border-white/20 flex items-center justify-center text-white 
                       hover:bg-white/25 transition-all duration-300 hover:scale-105"
            title={sequenceState.isPlaying ? "일시정지" : "재생"}
          >
            {sequenceState.isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
            )}
          </button>

          <div className="w-10 h-10 flex items-center justify-center">
            <p className="text-xs text-white/40 tabular-nums">
              {sequenceState.currentIndex + 1}/{formations.length}
            </p>
          </div>
        </div>

        {/* Current formation name */}
        <p className="text-center text-xs text-white/30 mt-3 tracking-wider">
          {sequenceState.formationNameKo}
        </p>
      </div>

    </div>
  );
}
