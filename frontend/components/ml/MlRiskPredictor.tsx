"use client";

import * as React from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { predictMlRisk } from "@/lib/api";
import { PredictRiskResponse } from "@/types/api";

export function MlRiskPredictor() {
  const [creditScore, setCreditScore] = React.useState(720);
  const [income, setIncome] = React.useState(85000);
  const [age] = React.useState(40);
  const [employmentStatus, setEmploymentStatus] = React.useState("employed");
  const [loanType, setLoanType] = React.useState("mortgage");
  const [principal] = React.useState(300000);
  const [outstanding] = React.useState(220000);
  const [interestRate, setInterestRate] = React.useState(0.055);

  const [result, setResult] = React.useState<PredictRiskResponse | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handlePredict = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await predictMlRisk({
        credit_score: creditScore,
        income,
        age,
        employment_status: employmentStatus,
        loan_type: loanType,
        principal,
        outstanding,
        interest_rate: interestRate,
      });
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [creditScore, income, age, employmentStatus, loanType, principal, outstanding, interestRate]);

  React.useEffect(() => {
    queueMicrotask(() => {
      handlePredict();
    });
  }, [handlePredict]);

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
        <div>
          <CardTitle className="text-base">Credit Default Predictor</CardTitle>
          <CardDescription>Random Forest Risk Scorecard</CardDescription>
        </div>

        <Badge variant="info">Scikit-Learn Model</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Inputs */}
        <div className="space-y-3 text-xs">
          <div>
            <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1">
              <span>Credit Score</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{creditScore}</span>
            </div>
            <input
              type="range"
              min="300"
              max="850"
              value={creditScore}
              onChange={(e) => setCreditScore(parseInt(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-600 dark:text-slate-400 block mb-1">Employment</label>
              <select
                value={employmentStatus}
                onChange={(e) => setEmploymentStatus(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white"
              >
                <option value="employed">Employed</option>
                <option value="self-employed">Self-Employed</option>
                <option value="unemployed">Unemployed</option>
                <option value="retired">Retired</option>
              </select>
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 block mb-1">Loan Asset Type</label>
              <select
                value={loanType}
                onChange={(e) => setLoanType(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white"
              >
                <option value="mortgage">Mortgage</option>
                <option value="personal">Personal</option>
                <option value="auto">Auto</option>
                <option value="business">Business</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-600 dark:text-slate-400 block mb-1">Annual Income ($)</label>
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(parseFloat(e.target.value) || 10000)}
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 block mb-1">Interest Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={(interestRate * 100).toFixed(1)}
                onChange={(e) => setInterestRate(parseFloat(e.target.value) / 100 || 0.05)}
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <Button size="sm" variant="primary" onClick={handlePredict} loading={loading} className="w-full mt-2">
            <span>Calculate Risk Score</span>
          </Button>
        </div>

        {/* Right ML Result Output */}
        <div className="bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">ML Probability of Default</span>
                  <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{result.probability_of_default}%</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Risk Grade</span>
                  <Badge variant={result.variant} size="md">
                    Grade {result.risk_grade} — {result.risk_level}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono block mb-2">
                  Key ML Risk Drivers (Feature Weight %)
                </span>
                <div className="space-y-1.5">
                  {result.top_risk_drivers.map((driver) => (
                    <div key={driver.feature} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 dark:text-slate-300">{driver.feature}</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{driver.importance}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 text-[10px] font-mono text-slate-500 flex justify-between">
                <span>DTI Ratio: {result.debt_to_income_ratio}%</span>
                <span>{result.model_type}</span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">Click &quot;Run ML Prediction&quot;</div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default MlRiskPredictor;
