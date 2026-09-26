"use client";

import * as React from "react";
import { Info } from "lucide-react";

export function Tooltip({ text }: { text: string }) {
  const [show, setShow] = React.useState(false);

  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 text-xs bg-slate-800 text-slate-200 rounded-lg shadow-xl border border-slate-700 z-50 pointer-events-none font-sans">
          {text}
        </div>
      )}
    </div>
  );
}
