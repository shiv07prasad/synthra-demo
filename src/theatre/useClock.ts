import { useCallback, useEffect, useRef, useState } from "react";

// A playback clock in "script seconds". Uses setInterval rather than rAF so the show keeps
// advancing even if the tab is briefly backgrounded during a live demo.
export function useClock(end: number) {
  const [t, setT] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const speedRef = useRef(speed);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = ((now - last) / 1000) * speedRef.current;
      last = now;
      setT((prev) => Math.min(end, prev + dt));
    }, 33);
    return () => clearInterval(id);
  }, [playing, end]);

  useEffect(() => {
    if (t >= end) setPlaying(false);
  }, [t, end]);

  const start = useCallback((from = 0) => {
    setT(from);
    setPlaying(true);
  }, []);

  const seek = useCallback((to: number) => {
    setT(to);
    setPlaying(false);
  }, []);

  return {
    t,
    playing,
    speed,
    started: t >= 0,
    finished: t >= end,
    start,
    seek,
    toggle: () => setPlaying((p) => (t >= end ? p : !p)),
    cycleSpeed: () => setSpeed((s) => (s === 1 ? 2 : s === 2 ? 0.5 : 1)),
  };
}

export type Clock = ReturnType<typeof useClock>;
