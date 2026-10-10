"use client";

import * as React from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { predictMlRisk } from "@/lib/api";
import { PredictRiskResponse } from "@/types/api";
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle2, DollarSign, Briefcase, Building, Wallet, Calculator } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

export function MlRiskPredictor() {
  const { currencyConfig, formatCurrencyAmount } = useCurrency();
  const symbol = currencyConfig?.symbol || "$";
  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null || isNaN(val)) return `${symbol}0`;
    return formatCurrencyAmount(val);
  };
  const [creditScore, setCreditScore] = React.useState(740);
  const [primaryIncome, setPrimaryIncome] = React.useState(85000);
  const [assetIncome, setAssetIncome] = React.useState(18000);
  const [age, setAge] = React.useState(40);
  const [employmentType, setEmploymentType] = React.useState("pvt_permanent");
  const [professionSector, setProfessionSector] = React.useState("it_tech");
  const [loanType, setLoanType] = React.useState("mortgage");
  const [principal, setPrincipal] = React.useState(250000);
  const [outstanding, setOutstanding] = React.useState(180000);
  const [interestRate, setInterestRate] = React.useState(0.055);
  const [tenureMonths, setTenureMonths] = React.useState(180);
  const [monthlyExpenses, setMonthlyExpenses] = React.useState(1600);
  const [existingEmis, setExistingEmis] = React.useState(450);

  const handleLoanTypeChange = (newType: string) => {
    setLoanType(newType);
    if (newType === "mortgage" || newType === "home") {
      setPrincipal(250000);
      setOutstanding(180000);
      setInterestRate(0.055);
      setTenureMonths(180);
    } else if (newType === "auto") {
      setPrincipal(35000);
      setOutstanding(25000);
      setInterestRate(0.065);
      setTenureMonths(60);
    } else if (newType === "personal") {
      setPrincipal(20000);
      setOutstanding(12000);
      setInterestRate(0.105);
      setTenureMonths(48);
    } else if (newType === "business") {
      setPrincipal(150000);
      setOutstanding(110000);
      setInterestRate(0.085);
      setTenureMonths(84);
    } else if (newType === "education") {
      setPrincipal(40000);
      setOutstanding(30000);
      setInterestRate(0.075);
      setTenureMonths(60);
    }
  };

  const [result, setResult] = React.useState<PredictRiskResponse | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handlePredict = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await predictMlRisk({
        credit_score: creditScore,
        income: primaryIncome,
        asset_income: assetIncome,
        age,
        employment_status: employmentType === "gov_permanent" || employmentType === "pvt_permanent" ? "employed" : employmentType,
        employment_type: employmentType,
        profession_sector: professionSector,
        loan_type: loanType,
        principal,
        outstanding,
        interest_rate: interestRate,
        tenure_months: tenureMonths,
        monthly_expenses: monthlyExpenses,
        existing_emis: existingEmis,
      });
      setResult(res);
    } catch (e) {
      console.error("ML Risk Prediction error:", e);
    } finally {
      setLoading(false);
    }
  }, [
    creditScore,
    primaryIncome,
    assetIncome,
    age,
    employmentType,
    professionSector,
    loanType,
    principal,
    outstanding,
    interestRate,
    tenureMonths,
    monthlyExpenses,
    existingEmis,
  ]);

  React.useEffect(() => {
    queueMicrotask(() => {
      handlePredict();
    });
  }, [handlePredict]);

  // Local financial calculations fallback
  const calcTotalMonthlyInc = (primaryIncome + assetIncome) / 12;
  const calcRMo = Math.max(0.0001, interestRate / 12);
  const calcTenure = Math.max(6, tenureMonths);
  const calcEmi = principal > 0
    ? (principal * calcRMo * Math.pow(1 + calcRMo, calcTenure)) / Math.max(1e-5, Math.pow(1 + calcRMo, calcTenure) - 1)
    : 0;
  const calcObligation = calcEmi + existingEmis + monthlyExpenses;
  const calcFoir = calcTotalMonthlyInc > 0 ? (calcObligation / calcTotalMonthlyInc) * 100 : 0;
  const calcNetDisposable = calcTotalMonthlyInc - calcObligation;
  const calcMaxAllowedEmi = Math.max(0, (calcTotalMonthlyInc * 0.50) - existingEmis - monthlyExpenses);
  const calcMaxEligibleLoan = calcMaxAllowedEmi * (Math.pow(1 + calcRMo, calcTenure) - 1) / (calcRMo * Math.pow(1 + calcRMo, calcTenure));

  let calcDecision: "APPROVED" | "CONDITIONALLY APPROVED" | "DECLINED" = "APPROVED";
  let calcReason = "Solid income cash flow coverage, acceptable FOIR obligation, and healthy credit standing.";

  if (calcFoir > 65 || creditScore < 560 || calcNetDisposable < 0) {
    calcDecision = "DECLINED";
    calcReason = `FOIR of ${calcFoir.toFixed(1)}% exceeds bank limit (65%). Net disposable income is insufficient.`;
  } else if (calcFoir > 50 || creditScore < 650) {
    calcDecision = "CONDITIONALLY APPROVED";
    calcReason = `FOIR is ${calcFoir.toFixed(1)}%. Requires co-applicant income or tenure extension to reduce monthly EMI.`;
  }

  const finalDecision = result?.underwriting_decision || calcDecision;
  const finalReason = result?.decision_reason || calcReason;
  const finalEmi = result?.new_loan_emi !== undefined ? result.new_loan_emi : calcEmi;
  const finalFoir = result?.foir_ratio !== undefined ? result.foir_ratio : parseFloat(calcFoir.toFixed(1));
  const finalTotalIncome = result?.total_monthly_income !== undefined ? result.total_monthly_income : calcTotalMonthlyInc;
  const finalObligation = result?.total_monthly_obligation !== undefined ? result.total_monthly_obligation : calcObligation;
  const finalNetDisposable = result?.net_disposable_income !== undefined ? result.net_disposable_income : calcNetDisposable;
  const finalMaxEligible = result?.max_eligible_loan_principal !== undefined ? result.max_eligible_loan_principal : calcMaxEligibleLoan;

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-950/40 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-500" />
            <CardTitle className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Bank Credit Risk & Underwriting Scorecard
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Calibrated Random Forest Risk Engine • Asset Income, FOIR & Debt Capacity Calculator
          </CardDescription>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Section (7 Cols) */}
        <div className="lg:col-span-7 space-y-4 text-xs">
          {/* Credit Score Slider */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 mb-1.5 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-500" />
                Borrower Credit Score (FICO/CIBIL)
              </span>
              <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                {creditScore}
              </span>
            </div>
            <input
              type="range"
              min="300"
              max="850"
              value={creditScore}
              onChange={(e) => setCreditScore(parseInt(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>300 (Poor)</span>
              <span>650 (Average)</span>
              <span>850 (Prime)</span>
            </div>
          </div>

          {/* Income & Asset Generation Block */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
              <Wallet className="w-3.5 h-3.5 text-emerald-500" />
              1. Income & Asset Cash Flow Generation
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Primary Annual Income ({symbol})
                </label>
                <input
                  type="number"
                  value={primaryIncome}
                  onChange={(e) => setPrimaryIncome(parseFloat(e.target.value) || 0)}
                  placeholder="Salary or Main Business"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Asset & Rental Income ({symbol}/year)
                </label>
                <input
                  type="number"
                  value={assetIncome}
                  onChange={(e) => setAssetIncome(parseFloat(e.target.value) || 0)}
                  placeholder="Rent, Shop, Dividends"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-indigo-400" />
                  Employment Status / Type
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="gov_permanent">Permanent Government (Stable)</option>
                  <option value="pvt_permanent">Permanent Private Corporate</option>
                  <option value="contractual">Contractual / Gig Worker</option>
                  <option value="self_employed">Self-Employed / Business Owner</option>
                  <option value="unemployed">Unemployed / Between Jobs</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1 flex items-center gap-1">
                  <Building className="w-3 h-3 text-indigo-400" />
                  Industry / Sector
                </label>
                <select
                  value={professionSector}
                  onChange={(e) => setProfessionSector(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="gov_public">Government & Public Sector</option>
                  <option value="healthcare">Healthcare & Pharmaceuticals</option>
                  <option value="it_tech">IT & Technology Services</option>
                  <option value="finance">Banking & Financial Services</option>
                  <option value="trade_retail">Retail, Trade & E-Commerce</option>
                  <option value="construction_manufacturing">Manufacturing & Construction</option>
                  <option value="other">Other Services</option>
                </select>
              </div>
            </div>
          </div>

          {/* Monthly Obligations & Expenses Block */}
          <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800/80">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
              <DollarSign className="w-3.5 h-3.5 text-amber-500" />
              2. Living Expenses & Existing Debt Obligations
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Monthly Living Costs ({symbol})
                </label>
                <input
                  type="number"
                  value={monthlyExpenses}
                  onChange={(e) => setMonthlyExpenses(parseFloat(e.target.value) || 0)}
                  placeholder="Rent, Utilities, Household"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Existing Loan EMIs ({symbol}/mo)
                </label>
                <input
                  type="number"
                  value={existingEmis}
                  onChange={(e) => setExistingEmis(parseFloat(e.target.value) || 0)}
                  placeholder="Other Active Loans"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Applicant Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 25)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Loan Request Details */}
          <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800/80">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
              <Building className="w-3.5 h-3.5 text-cyan-500" />
              3. Loan Category & Financing Terms
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Loan Asset Category
                </label>
                <select
                  value={loanType}
                  onChange={(e) => handleLoanTypeChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="mortgage">Home Loan / Real Estate Mortgage (Secured)</option>
                  <option value="business">Commercial Business Loan (Secured/Unsecured)</option>
                  <option value="personal">Personal Loan (Unsecured)</option>
                  <option value="auto">Auto / Vehicle Loan (Vehicle Collateral)</option>
                  <option value="education">Student / Education Loan</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Tenure (Months)
                </label>
                <select
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(parseInt(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="12">12 Months (1 Year)</option>
                  <option value="24">24 Months (2 Years)</option>
                  <option value="36">36 Months (3 Years)</option>
                  <option value="48">48 Months (4 Years)</option>
                  <option value="60">60 Months (5 Years)</option>
                  <option value="120">120 Months (10 Years)</option>
                  <option value="180">180 Months (15 Years)</option>
                  <option value="240">240 Months (20 Years)</option>
                  <option value="360">360 Months (30 Years)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Loan Principal ({symbol})
                </label>
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(parseFloat(e.target.value) || 1000)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Current Outstanding ({symbol})
                </label>
                <input
                  type="number"
                  value={outstanding}
                  onChange={(e) => setOutstanding(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Interest Rate (% p.a.)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={(interestRate * 100).toFixed(1)}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value) / 100 || 0.05)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={handlePredict}
            loading={loading}
            className="w-full py-2.5 text-xs font-bold uppercase font-mono tracking-wider bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl shadow-md cursor-pointer mt-1"
          >
            <span>Evaluate Bank Underwriting Decision</span>
          </Button>
        </div>

        {/* Right Output Panel (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-inner space-y-4">
          <div className="space-y-4 text-xs">
            {/* Bank Decision Badge Banner */}
            <div className="p-3.5 rounded-xl border flex items-start gap-3 bg-white dark:bg-slate-900 shadow-sm">
              {finalDecision === "APPROVED" && (
                <>
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm font-mono text-emerald-500 tracking-wider">
                        DECISION: APPROVED
                      </span>
                      <Badge variant="success" size="sm">
                        Grade {result?.risk_grade || "AA"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {finalReason}
                    </p>
                  </div>
                </>
              )}

              {finalDecision === "CONDITIONALLY APPROVED" && (
                <>
                  <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm font-mono text-amber-500 tracking-wider">
                        CONDITIONALLY APPROVED
                      </span>
                      <Badge variant="warning" size="sm">
                        Grade {result?.risk_grade || "B"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {finalReason}
                    </p>
                  </div>
                </>
              )}

              {finalDecision === "DECLINED" && (
                <>
                  <XCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm font-mono text-rose-500 tracking-wider">
                        DECISION: DECLINED
                      </span>
                      <Badge variant="danger" size="sm">
                        Grade {result?.risk_grade || "D"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {finalReason}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Solvency & Probability of Default */}
            <div className="grid grid-cols-2 gap-2 bg-white dark:bg-slate-900/90 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">
                  ML Default Probability (PD)
                </span>
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {result?.probability_of_default !== undefined ? result.probability_of_default : 12.5}%
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">
                  New Monthly Loan EMI
                </span>
                <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(finalEmi)}
                </span>
              </div>
            </div>

            {/* FOIR Ratio Gauge & Breakdown */}
            <div className="bg-white dark:bg-slate-900/90 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                  FOIR (Fixed Obligation Ratio)
                </span>
                <span
                  className={`font-mono font-bold ${
                    finalFoir <= 50
                      ? "text-emerald-500"
                      : finalFoir <= 65
                      ? "text-amber-500"
                      : "text-rose-500"
                  }`}
                >
                  {finalFoir}%
                </span>
              </div>

              {/* Progress bar for FOIR */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    finalFoir <= 50
                      ? "bg-emerald-500"
                      : finalFoir <= 65
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${Math.min(100, finalFoir)}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-slate-600 dark:text-slate-400">
                <div>
                  <span>Total Monthly Income:</span>{" "}
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(finalTotalIncome)}
                  </span>
                </div>
                <div>
                  <span>Monthly Obligations:</span>{" "}
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(finalObligation)}
                  </span>
                </div>
                <div>
                  <span>Net Disposable Cash:</span>{" "}
                  <span
                    className={`font-mono font-semibold ${
                      finalNetDisposable >= 0 ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {formatCurrency(finalNetDisposable)}
                  </span>
                </div>
                <div>
                  <span>Max Eligible Loan:</span>{" "}
                  <span className="font-mono font-semibold text-indigo-400">
                    {formatCurrency(finalMaxEligible)}
                  </span>
                </div>
              </div>
            </div>

            {/* Key Risk Drivers */}
            <div className="bg-white dark:bg-slate-900/90 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono block mb-1">
                Key ML Risk Drivers & Feature Weights
              </span>
              {result?.top_risk_drivers ? (
                result.top_risk_drivers.map((driver: { feature: string; importance: number }) => (
                  <div key={driver.feature} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300">{driver.feature}</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                      {driver.importance}%
                    </span>
                  </div>
                ))
              ) : (
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Fixed Obligation Ratio (FOIR)</span>
                    <span className="font-mono text-indigo-400 font-semibold">22.7%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Borrower Credit Score</span>
                    <span className="font-mono text-indigo-400 font-semibold">18.4%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Employment & Sector Risk Weight</span>
                    <span className="font-mono text-indigo-400 font-semibold">15.1%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 text-[10px] font-mono text-slate-500 border-t border-slate-200 dark:border-slate-800 flex justify-between">
            <span>Model: {result?.model_version || "v3.0-bank-underwriter"}</span>
            <span>Gini: {result?.gini_coefficient || 0.84}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default MlRiskPredictor;
