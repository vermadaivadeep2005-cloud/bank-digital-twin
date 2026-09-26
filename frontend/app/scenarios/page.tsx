"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Play, Sparkles, Wand2, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getScenarios, generateAiScenario } from "@/lib/api";
import { Scenario } from "@/types/api";

export default function ScenariosPage() {
  const router = useRouter();
  const [scenarios, setScenarios] = React.useState<Scenario[]>([]);
  const [aiPrompt, setAiPrompt] = React.useState("");
  const [generatingAi, setGeneratingAi] = React.useState(false);

  React.useEffect(() => {
    getScenarios().then(setScenarios).catch(console.error);
  }, []);

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setGeneratingAi(true);
    try {
      const generated = await generateAiScenario(aiPrompt);
      toast.success(`AI Synthesized Scenario: ${generated.title}`);

      // Add to list and navigate to stress runner with generated parameters
      const newScenario: Scenario = {
        id: `ai-${Date.now()}`,
        title: generated.title,
        description: `${generated.description} — AI Reasoning: ${generated.reasoning}`,
        unemployment_shock: generated.unemployment_shock,
        rate_shock: generated.rate_shock,
        risk_level: generated.risk_level,
        horizon_months: generated.horizon_months,
        n_sims: 10000,
      };

      setScenarios((prev) => [newScenario, ...prev]);

      // Direct launch option
      const url = `/stress?unemp=${generated.unemployment_shock}&rate=${generated.rate_shock}&name=${encodeURIComponent(
        generated.title
      )}`;
      router.push(url);
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to synthesize AI scenario. Please try again.");
    } finally {
      setGeneratingAi(false);
    }
  };

  const getRiskVariant = (risk: string) => {
    switch (risk) {
      case "Low":
        return "success";
      case "Moderate":
        return "info";
      case "High":
        return "warning";
      case "Severe":
      case "Extreme":
        return "danger";
      default:
        return "neutral";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Macroeconomic Stress Scenarios
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pre-built Basel regulatory stress matrices & AI natural language scenario synthesizer
          </p>
        </div>
      </div>

      {/* AI Natural Language Scenario Synthesizer */}
      <Card className="border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-slate-900/60 to-purple-950/20 p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-32 h-32 text-indigo-400" />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Wand2 className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-wide">
              AI Natural Language Scenario Generator
            </h2>
            <Badge variant="info" className="text-[10px]">AI Engine</Badge>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            Describe any hypothetical macroeconomic shock scenario in plain English. AI Engine will parse, quantify, and map shock parameters to Basel III stress parameters.
          </p>

          <form onSubmit={handleAiGenerate} className="flex flex-col sm:flex-row gap-3 pt-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., Severe tech bubble burst causing 8.5% unemployment spike and rapid central bank rate cuts..."
              className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
            <Button
              type="submit"
              disabled={generatingAi || !aiPrompt.trim()}
              variant="primary"
              className="shrink-0 font-semibold"
            >
              {generatingAi ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Shocks...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Synthesize & Run</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </>
              )}
            </Button>
          </form>

          {/* Prompt Presets */}
          <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
            <span className="text-slate-500 font-mono text-[10px] self-center">Try presets:</span>
            <button
              type="button"
              onClick={() => setAiPrompt("Commercial real estate crash with regional bank run and liquidity squeeze")}
              className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-indigo-900/40 text-slate-300 hover:text-indigo-300 border border-slate-700/60 transition-colors"
            >
              🏢 CRE Squeeze
            </button>
            <button
              type="button"
              onClick={() => setAiPrompt("Oil price spike driving hyperinflation and aggressive 400bps rate hikes")}
              className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-indigo-900/40 text-slate-300 hover:text-indigo-300 border border-slate-700/60 transition-colors"
            >
              ⛽ Stagflation & Rate Spike
            </button>
            <button
              type="button"
              onClick={() => setAiPrompt("Global pandemic lock-down with mass layoffs and negative interest rates")}
              className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-indigo-900/40 text-slate-300 hover:text-indigo-300 border border-slate-700/60 transition-colors"
            >
              📉 Global Pandemic Freeze
            </button>
          </div>
        </div>
      </Card>

      {/* Grid of Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenarios.map((sc, idx) => (
          <motion.div
            key={sc.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.05 }}
          >
            <Card className="h-full flex flex-col justify-between hover:border-indigo-500/50 transition-all group">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <Badge variant={getRiskVariant(sc.risk_level)}>{sc.risk_level} Risk</Badge>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{sc.horizon_months}M Horizon</span>
                </div>

                <CardTitle className="text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {sc.title}
                </CardTitle>
                <CardDescription className="mt-2 line-clamp-3 leading-relaxed">
                  {sc.description}
                </CardDescription>

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Unemp Shock</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">+{(sc.unemployment_shock * 100).toFixed(1)} pp</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Rate Shock</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{(sc.rate_shock * 100).toFixed(1)} pp</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-2">
                <Link
                  href={`/stress?unemp=${sc.unemployment_shock}&rate=${sc.rate_shock}&name=${encodeURIComponent(sc.title)}`}
                  className="block"
                >
                  <Button variant="primary" className="w-full">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run This Scenario</span>
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
