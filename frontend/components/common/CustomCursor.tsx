"use client";

import * as React from "react";

export function CustomCursor() {
  const cursorDotRef = React.useRef<HTMLDivElement>(null);
  const cursorRingRef = React.useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // Disable on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;

    let animationFrameId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) setIsVisible(true);

      // Direct update for dot for zero latency
      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }

      // Check if hovering interactive element
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = Boolean(
          target.closest("a, button, input, select, textarea, [role='button'], .interactive")
        );
        setIsHovered(isInteractive);
      }
    };

    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    // Smooth lerp for ring follower
    const render = () => {
      ringX += (mouseX - ringX) * 0.2;
      ringY += (mouseY - ringY) * 0.2;

      if (cursorRingRef.current) {
        cursorRingRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden hidden md:block">
      {/* Precision Core Cursor Dot */}
      <div
        ref={cursorDotRef}
        className="fixed top-0 left-0 w-2 h-2 -ml-1 -mt-1 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.8)] pointer-events-none transition-opacity duration-200"
      />

      {/* Smooth Lag Follower Ring */}
      <div
        ref={cursorRingRef}
        className={`fixed top-0 left-0 rounded-full border border-cyan-400/40 bg-indigo-500/5 backdrop-blur-[1px] pointer-events-none transition-all duration-200 ease-out -ml-3 -mt-3 ${
          isHovered
            ? "w-10 h-10 -ml-5 -mt-5 border-cyan-300 bg-cyan-500/10 shadow-[0_0_15px_rgba(56,189,248,0.3)] scale-110"
            : "w-6 h-6"
        }`}
      />
    </div>
  );
}

export default CustomCursor;
