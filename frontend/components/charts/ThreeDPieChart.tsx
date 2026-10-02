"use client";

import React, { useState } from "react";

export interface ThreeDPieDataItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
  darkColor: string;
  detail?: string;
}

interface ThreeDPieChartProps {
  data: ThreeDPieDataItem[];
  title?: string;
  subtitle?: string;
}

export function ThreeDPieChart({ data, title, subtitle }: ThreeDPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(1); // default explode second slice or active slice

  // Compute total and visual minimum angles so 0% or small slices render cleanly in 3D
  const rawTotal = data.reduce((acc, item) => acc + item.value, 0);
  const total = rawTotal > 0 ? rawTotal : 1;

  // Assign minimum visual sweep angle (at least 30 deg per slice for 3 slices)
  const minSweep = 30;
  const rawSweeps = data.map((item) => Math.max(minSweep, (item.value / total) * 360));
  const sweepSum = rawSweeps.reduce((a, b) => a + b, 0) || 360;
  const normalizedSweeps = rawSweeps.map((sw) => (sw / sweepSum) * 360);

  const startAngles: number[] = [];
  let accum = 0;
  for (let i = 0; i < normalizedSweeps.length; i++) {
    startAngles.push(accum);
    accum += normalizedSweeps[i];
  }

  const slices = data.map((item, idx) => {
    const startAngle = startAngles[idx];
    const sliceAngle = normalizedSweeps[idx];
    const endAngle = startAngle + sliceAngle;

    // Mid angle for callout pins & 3D offset
    const midAngle = startAngle + sliceAngle / 2;
    const rad = (midAngle - 90) * (Math.PI / 180);

    return {
      ...item,
      startAngle,
      endAngle,
      midAngle,
      rad,
      pct: Math.round((item.value / total) * 100),
      isExploded: activeIndex === idx,
    };
  });

  // Helper to draw SVG pie arc
  const getArcPath = (cx: number, cy: number, r: number, startA: number, endA: number) => {
    const startRad = (startA - 90) * (Math.PI / 180);
    const endRad = (endA - 90) * (Math.PI / 180);

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const largeArc = endA - startA > 180 ? 1 : 0;

    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-2">
      {/* Title Header */}
      {(title || subtitle) && (
        <div className="border-b border-slate-800/80 pb-4 mb-2">
          {title && <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>}
          {subtitle && <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>}
        </div>
      )}

      {/* 3D Isometric View Container */}
      <div className="relative w-full flex-1 min-h-[240px] flex items-center justify-center overflow-hidden">
        {/* SVG Canvas with 3D Depth Layering */}
        <svg
          viewBox="0 0 400 300"
          className="w-full h-full max-h-[280px] drop-shadow-[0_20px_25px_rgba(0,0,0,0.7)]"
        >
          <defs>
            {/* Ambient Base Shadow Filter */}
            <radialGradient id="pieShadowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>

            {/* Gradient definition for each slice */}
            {slices.map((slice, idx) => (
              <linearGradient key={`grad-${idx}`} id={`slice-grad-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={slice.color} />
                <stop offset="100%" stopColor={slice.darkColor} />
              </linearGradient>
            ))}
          </defs>

          {/* Base Floor Ellipse Shadow */}
          <ellipse cx="200" cy="210" rx="140" ry="45" fill="url(#pieShadowGrad)" />

          {/* 3D Isometric Projection Group */}
          <g transform="translate(0, -10) scale(1, 0.65)">
            {/* 3D Side Walls (Extrusion Layers) */}
            {Array.from({ length: 24 }).map((_, step) => {
              const dy = 24 - step; // Layer offset for depth
              return (
                <g key={`wall-${step}`} transform={`translate(0, ${dy})`}>
                  {slices.map((slice, idx) => {
                    const offsetDistance = slice.isExploded ? 18 : 0;
                    const ox = offsetDistance * Math.cos(slice.rad);
                    const oy = offsetDistance * Math.sin(slice.rad);

                    return (
                      <path
                        key={`slice-wall-${idx}-${step}`}
                        d={getArcPath(200 + ox, 160 + oy, 120, slice.startAngle, slice.endAngle)}
                        fill={slice.darkColor}
                        opacity={0.3 + (step / 24) * 0.4}
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* Top Faces of Slices */}
            {slices.map((slice, idx) => {
              const offsetDistance = slice.isExploded ? 18 : 0;
              const ox = offsetDistance * Math.cos(slice.rad);
              const oy = offsetDistance * Math.sin(slice.rad);

              return (
                <g
                  key={`top-slice-${idx}`}
                  onClick={() => setActiveIndex(activeIndex === idx ? null : idx)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className="cursor-pointer transition-all duration-300 hover:brightness-110"
                >
                  <path
                    d={getArcPath(200 + ox, 160 + oy, 120, slice.startAngle, slice.endAngle)}
                    fill={`url(#slice-grad-${idx})`}
                    stroke="#0f172a"
                    strokeWidth="2"
                  />
                </g>
              );
            })}
          </g>

          {/* 3D Callout Pins with Leader Lines & Stats */}
          {slices.map((slice, idx) => {
            const offsetDistance = slice.isExploded ? 18 : 0;
            const isoRadX = Math.cos(slice.rad) * (120 + offsetDistance);
            const isoRadY = Math.sin(slice.rad) * (120 + offsetDistance) * 0.65;

            const px = 200 + isoRadX * 0.65;
            const py = 150 + isoRadY * 0.7;

            // Vary pin heights per slice index to prevent visual overlap
            const pinHeights = [68, 38, 82];
            const pinHeight = pinHeights[idx % pinHeights.length];

            const isLeft = Math.cos(slice.rad) < 0;
            const elbowWidth = (idx === 1 ? 45 : 30) * (isLeft ? -1 : 1);
            const lx = px + elbowWidth;
            const ly = py - pinHeight;

            return (
              <g key={`pin-${idx}`} className="transition-all duration-300">
                {/* Vertical Pin Line */}
                <line x1={px} y1={py} x2={px} y2={py - pinHeight} stroke={slice.color} strokeWidth="2" strokeDasharray="2 2" />
                {/* Horizontal Elbow Line */}
                <line x1={px} y1={py - pinHeight} x2={lx} y2={py - pinHeight} stroke={slice.color} strokeWidth="2" />

                {/* Bead Pinhead */}
                <circle cx={px} cy={py} r="4" fill="#0f172a" stroke={slice.color} strokeWidth="2.5" />
                <circle cx={lx} cy={py - pinHeight} r="3" fill={slice.color} />

                {/* Callout Number & Label Card */}
                <foreignObject
                  x={isLeft ? lx - 110 : lx + 5}
                  y={py - pinHeight - 22}
                  width="115"
                  height="45"
                  className="overflow-visible"
                >
                  <div
                    className={`p-1.5 rounded-lg border backdrop-blur-md shadow-lg transition-transform duration-300 ${
                      slice.isExploded
                        ? "bg-slate-900/95 border-cyan-400 scale-105"
                        : "bg-slate-900/80 border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold font-mono">
                      <span className="text-white">0{idx + 1}</span>
                      <span style={{ color: slice.color }}>{slice.pct}%</span>
                    </div>
                    <div className="text-[9px] text-slate-300 truncate font-sans font-medium">
                      {slice.name}
                    </div>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend Pills at Bottom */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-800/60">
        {slices.map((slice, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(activeIndex === idx ? null : idx)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition border ${
              slice.isExploded
                ? "bg-slate-800 border-cyan-400 text-white shadow"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
            <span>{slice.name}</span>
            <span className="font-mono font-bold text-white">({slice.pct}%)</span>
          </button>
        ))}
      </div>
    </div>
  );
}
