"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Formation } from "@/utils/formations";

export interface SequenceState {
  currentIndex: number;
  isPlaying: boolean;
  progress: number;
  phase: "transition" | "hold";
  formationName: string;
  formationNameKo: string;
}

export function useFormationSequence(formations: Formation[]) {
  const [state, setState] = useState<SequenceState>({
    currentIndex: 0,
    isPlaying: false,
    progress: 0,
    phase: "hold",
    formationName: formations[0]?.name ?? "",
    formationNameKo: formations[0]?.nameKo ?? "",
  });

  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const formationsRef = useRef(formations);

  useEffect(() => {
    formationsRef.current = formations;
    if (formations.length > 0 && formations[0]?.name !== "loading") {
      setState((prev) => ({
        ...prev,
        formationName: formations[prev.currentIndex]?.name ?? "",
        formationNameKo: formations[prev.currentIndex]?.nameKo ?? "",
      }));
    }
  }, [formations]);

  const getPhaseTimings = useCallback(
    (index: number) => {
      const f = formations[index];
      if (!f) return { transition: 2000, hold: 4000 };
      return { transition: f.transitionDuration, hold: f.duration };
    },
    [formations]
  );

  const tick = useCallback(() => {
    const now = performance.now();
    const elapsed = now - startTimeRef.current;

    setState((prev) => {
      if (!prev.isPlaying) return prev;

      const { transition, hold } = getPhaseTimings(prev.currentIndex);
      const totalPhaseDuration = transition + hold;

      if (elapsed < transition) {
        return {
          ...prev,
          phase: "transition",
          progress: elapsed / transition,
        };
      } else if (elapsed < totalPhaseDuration) {
        return {
          ...prev,
          phase: "hold",
          progress: 1,
        };
      } else {
        const nextIndex = (prev.currentIndex + 1) % formations.length;
        startTimeRef.current = now;
        return {
          ...prev,
          currentIndex: nextIndex,
          phase: "transition",
          progress: 0,
          formationName: formations[nextIndex]?.name ?? "",
          formationNameKo: formations[nextIndex]?.nameKo ?? "",
        };
      }
    });

    animFrameRef.current = requestAnimationFrame(tick);
  }, [formations, getPhaseTimings]);

  const play = useCallback(() => {
    startTimeRef.current = performance.now();
    setState((prev) => ({ ...prev, isPlaying: true }));
  }, []);

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  const reset = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    startTimeRef.current = performance.now();
    setState({
      currentIndex: 0,
      isPlaying: false,
      progress: 0,
      phase: "hold",
      formationName: formations[0]?.name ?? "",
      formationNameKo: formations[0]?.nameKo ?? "",
    });
  }, [formations]);

  useEffect(() => {
    if (state.isPlaying) {
      animFrameRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(animFrameRef.current);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [state.isPlaying, tick]);

  return {
    state,
    play,
    pause,
    reset,
    previousFormation:
      formations[
        (state.currentIndex - 1 + formations.length) % formations.length
      ],
    currentFormation: formations[state.currentIndex],
  };
}
