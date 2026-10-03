"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CompliancePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/stress");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-slate-400 text-sm">
        Redirecting to Stress Engine Compliance Matrix...
      </p>
    </div>
  );
}
