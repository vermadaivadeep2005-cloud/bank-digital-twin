export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface PredictRiskPayload {
  credit_score: number;
  income: number;
  age: number;
  employment_status: string;
  loan_type: string;
  principal: number;
  outstanding: number;
  interest_rate: number;
}

export interface PredictRiskResponse {
  probability_of_default: number;
  risk_grade: string;
  risk_level: string;
  variant: "success" | "info" | "warning" | "danger";
  debt_to_income_ratio: number;
  top_risk_drivers: { feature: string; importance: number }[];
  model_type: string;
}

export interface Kpis {
  total_customers: number;
  total_loans: number;
  total_outstanding: number;
  npl_ratio: number;
  capital: number;
  rwa: number;
  car: number;
  roa: number;
  nim: number;
}

export interface KpiTimePoint {
  date: string;
  npl_ratio: number;
  car: number;
  roa: number;
  total_outstanding: number;
}

export interface KpiTrendResponse {
  current: Kpis;
  history: KpiTimePoint[];
}

export interface Customer {
  id: string;
  name: string;
  age: number;
  income: number;
  credit_score: number;
  employment_status: string;
  region: string;
  created_at?: string;
}

export interface Loan {
  id: string;
  customer_id?: string;
  principal: number;
  outstanding: number;
  interest_rate: number;
  term_months: number;
  loan_type: string;
  status: string;
  region: string;
  origination_date?: string;
  created_at?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface StressTestPayload {
  scenario_name: string;
  unemployment_shock: number;
  rate_shock: number;
  n_sims: number;
  horizon_months: number;
  seed?: number;
}

export interface StressSummary {
  expected_loss: number;
  p5_loss: number;
  p50_loss: number;
  p95_loss: number;
  worst_case_loss: number;
  best_case_loss: number;
  initial_capital: number;
  portfolio_size: number;
  n_loans: number;
}

export interface SegmentImpact {
  category: string;
  expected_loss: number;
  loss_pct: number;
}

export interface StressTestResponse {
  scenario_name: string;
  params: StressTestPayload;
  summary: StressSummary;
  distribution: number[];
  capital_paths: { p5: number[]; p50: number[]; p95: number[] };
  survived_pct: number;
  segment_breakdown?: {
    by_type: SegmentImpact[];
    by_region: SegmentImpact[];
  };
}

export interface StressRunOut {
  id: string;
  scenario_name: string;
  params: StressTestPayload;
  results: {
    summary: StressSummary;
    survived_pct: number;
  };
  created_at: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  unemployment_shock: number;
  rate_shock: number;
  horizon_months: number;
  n_sims: number;
  risk_level: "Low" | "Moderate" | "High" | "Severe" | "Extreme";
}
