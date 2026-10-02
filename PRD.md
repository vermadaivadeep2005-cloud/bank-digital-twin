# 🏦 Bank Digital Twin — Product Requirements Document (PRD)

**Document Status:** Approved & Production-Ready  
**Product Version:** v2.4.0 (Enterprise Release)  
**Last Updated:** October 2026  
**Target Platform:** Web (Desktop & Tablet)  
**Architecture:** Decoupled Monorepo (Next.js 16 Frontend + FastAPI Python 3.11 Backend)

---

## 1. 🎯 Executive Overview & Purpose

### 1.1 Product Vision
The **Bank Digital Twin** is an enterprise-grade virtual replica of a commercial financial institution. Designed for Chief Risk Officers (CROs), quantitative risk analysts, treasury managers, and regulatory examiners, the platform simulates synthetic retail/commercial loan portfolios, deposit bases, and real-time transaction streams.

### 1.2 Core Capabilities
* **Solvency Stress Testing:** Execute 10,000-path Monte Carlo simulations across 60-month horizons using Vasicek single-factor credit correlation models and Student's t-copulas for heavy-tailed extreme risk.
* **Instant (<50ms) What-If Sensitivity:** Interactive macroeconomic shock sliders (unemployment, interest rate hikes, commercial property drops, deposit run rates) powered by a surrogate response surface engine.
* **Predictive Metric Forecasting:** 30-day, 60-day, and 90-day time-series projections with 95% statistical confidence bounds for Capital Adequacy Ratio (CAR %), Non-Performing Loans (NPL %), Net Interest Margin (NIM %), and liquidity metrics.
* **Unsupervised Fraud Sentinel:** Live transaction stream monitoring powered by Scikit-Learn `IsolationForest` ML and multi-vector velocity rule engines.
* **Explainable AI Credit Risk Scoring:** Calibrated Random Forest scorecard backed by SHAP (SHapley Additive exPlanations) feature attributions for retail and commercial borrowers.
* **Automated Regulatory Compliance:** Real-time balance sheet compliance evaluations against Basel III/IV, CCAR, and DFAST standards (CAR $\ge 8\%$, Tier 1 $\ge 6\%$, CET1 $\ge 4.5\%$, LCR $\ge 100\%$, NSFR $\ge 100\%$).
* **Currency Normalization Engine:** Base currency standardization protecting mathematical calculations, Monte Carlo simulations, and risk ratios from currency fluctuation drift or double-conversion errors.

---

## 2. 🏗️ System Architecture & Technology Stack

```
                          ┌────────────────────────────────────────────────────────┐
                          │      Next.js 16 (App Router) + React 19 Frontend       │
                          │     Tailwind CSS Glassmorphic Dark UI + Jakarta Sans   │
                          └───────────────────────────┬────────────────────────────┘
                                                      │ REST API Pipeline
                                                      ▼
                          ┌────────────────────────────────────────────────────────┐
                          │           FastAPI ASGI Backend (Python 3.11)           │
                          │            Async Request Pipeline & Router             │
                          └──────┬────────────┬─────────────┬────────────┬─────────┘
                                 │            │             │            │
                                 ▼            ▼             ▼            ▼
                   ┌─────────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
                   │ IsolationForest │ │ Scikit-Learn │ │ NumPy Vector │ │ Statsmodels  │
                   │ Anomaly Engine  │ │ RandomForest │ │ Vasicek Engine│ │ Forecasting  │
                   │ + Velocity Rules│ │ + SHAP + ISO │ │ Monte Carlo  │ │ Engine       │
                   └─────────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
                                 │            │             │            │
                                 └────────────┴──────┬──────┴────────────┘
                                                     ▼
                                      ┌──────────────────────────────┐
                                      │ SQLAlchemy 2.0 ORM Database  │
                                      │  SQLite (Default) / Postgres │
                                      └──────────────────────────────┘
```

### 2.1 Technology Stack Specifications

| Layer | Technology | Version | Purpose & Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router) | `16.3.6` | Server Components, hybrid client rendering, fast client routing. |
| **UI Library & Styling** | React + Tailwind CSS | `19.0.0` / `3.4.0` | High-density dark glassmorphic financial UI with responsive layout grids. |
| **Typography & Motion** | Plus Jakarta Sans / Framer Motion | `^12.0.0` | Professional modern financial typography and 60fps card hover tilt animations. |
| **Visualization Engine** | Recharts & Custom 3D SVG Canvas | `^2.15.0` | Area drawdown fan charts, sensitivity tornado bars, and isometric 3D cylinder pie charts. |
| **Backend Framework** | FastAPI + Uvicorn | `0.115.0` | High-throughput asynchronous Python ASGI server with automated OpenAPI docs (`/docs`). |
| **Quantitative Engine** | NumPy + SciPy | `2.1.0` / `1.14.0` | Vectorized matrix calculations executing 10,000 Monte Carlo paths in <500ms. |
| **Machine Learning** | Scikit-Learn + SHAP | `1.5.0` / `0.46.0` | IsolationForest anomaly detection, Random Forest credit scoring, and TreeExplainer attributions. |
| **Time-Series Engine** | Statsmodels | `0.14.0` | Exponential Smoothing & ARIMA forecasting with upper/lower 95% confidence bounds. |
| **Database & ORM** | SQLAlchemy 2.0 | `2.0.35` | Zero-setup local SQLite database with automatic fallback to PostgreSQL via `DATABASE_URL`. |

---

## 3. 💱 Currency Normalization & Mathematical Engine Standard

To prevent mathematical distortion, unit confusion, or calculation drift across multi-currency portfolios, the platform enforces a **Decoupled Architecture for Financial Normalization**:

### 3.1 Normalization Architecture Rules
1. **Ingestion Normalization (Base Unit Standard):**  
   Upon portfolio ingestion or CSV import, foreign monetary values ($\text{USD}$, $\text{EUR}$, $\text{GBP}$, $\text{AED}$) are converted immediately into a unified base currency quantity prior to database storage:
   $$\text{Amount}_{\text{Base}} = \text{Amount}_{\text{Original}} \times \text{FX Rate}_{\text{Original}\rightarrow\text{Base}}$$

2. **Calculation Engine Immunity:**  
   All downstream mathematical models (Expected Loss, Vasicek Copulas, VaR, RWA, Capital Adequacy Ratios) execute exclusively on base-normalized numbers in the backend database. UI currency toggling has **zero impact** on mathematical simulation outputs.

3. **Presentation Layer Decoupling:**  
   The frontend currency selector (`CurrencyContext.tsx`) converts calculated base numbers to display values dynamically at render time:
   $$\text{Amount}_{\text{Display}} = \text{Amount}_{\text{Base}} \times \text{FX Rate}_{\text{Display}}$$

4. **Scale Invariance of Key Financial Ratios:**  
   Percentage-based banking metrics—including Capital Adequacy Ratio ($\text{CAR} = \frac{\text{Tier 1 Capital}}{\text{RWA}}$) and Non-Performing Loan Ratio ($\text{NPL} = \frac{\text{Defaulted Loans}}{\text{Total Loans}}$)—are scale-invariant and remain 100% identical regardless of chosen presentation currency.

---

## 4. 📄 Detailed Page Requirements & Feature Specifications

### 4.1 Executive Overview Dashboard (`/`)
* **KPI Header Cards:** Displays Capital Adequacy Ratio (CAR: 15.2%), Non-Performing Loans (NPL: 2.5%), Tier 1 Capital ($1.20B), Risk-Weighted Assets (RWA: $7.89B), Return on Assets (ROA: 1.4%), and Net Interest Margin (NIM: 3.2%).
* **3D Flippy Hover Cards:** Primary KPI cards feature hardware-accelerated 3D hover perspective tilt.
* **Collapsible AI CRO Copilot:** Positioned below the fold with an indigo-to-cyan gradient border, presenting automated executive memos and Basel III compliance badges.
* **Data Export:** Instant export of balance sheet summaries in formatted JSON or CSV.

### 4.2 What-If Interactive Simulator (`/what-if`)
* **Real-Time Macro Shock Sliders:**
  * Unemployment Rate Shock: `3.5%` to `20.0%`
  * Interest Rate Hike: `-2.0%` to `+8.0%`
  * Commercial Property Price Drop: `0%` to `50%`
  * Deposit Outflow Rate: `0%` to `40%`
* **Surrogate Response Surface Engine:** Computes post-stress CAR %, NPL %, Net Losses, and Solvency Risk Levels in **<50ms**.
* **Dynamic Sensitivity Tornado Chart:** Ranks macroeconomic shocks by marginal capital impact per 1% shock.

### 4.3 Predictive Metric Forecasting (`/forecasts`)
* **Multi-Metric Selection:** Toggle between CAR %, NPL %, NIM %, Liquidity Ratio %, and Tier 1 Capital.
* **Forecast Horizons:** 30-day, 60-day, and 90-day time-series projections with shaded 95% confidence intervals.
* **Isometric 3D Cylinder Pie Chart (`ThreeDPieChart`):** Pseudo-3D side wall depth rendering with exploded slices and radial callout pins categorizing forecast zones (Optimal, Stable, Watchlist, Critical).

### 4.4 Fraud & Anomaly Intelligence Center (`/fraud`)
* **Unsupervised IsolationForest ML:** Live anomaly likelihood scoring combined with velocity rule checks (`LARGE_AMOUNT > $10k`, `HIGH_VELOCITY > 5 txns/5 min`, `MIDNIGHT_WIRE`, `HIGH_RISK_CATEGORY`).
* **Real-Time Threat Simulator:** **"Simulate Anomaly Threat"** button triggers live threat interception toasts and updates sentinel counters.
* **Flagged Transaction Stream Table:** Search by TxID/Category, filter by risk tier tabs (All, Critical, High, Medium), and view full transaction details.

### 4.5 Monte Carlo Stress Testing Engine (`/stress`)
* **Vectorized Monte Carlo Matrix:** Executes 10,000 asset paths using Vasicek single-factor asset correlation and Student's t-copula options.
* **Quant Outputs:** P5/P50/P95 drawdown fan charts, loss severity histograms, Value at Risk (VaR 99%), Expected Shortfall (CVaR 99%), and Basel III pass/fail indicators.

### 4.6 Loan Portfolio Explorer (`/portfolio`)
* **Borrower Catalog:** Searchable/filterable table of retail and commercial loans.
* **Explainable AI Scorecard:** Modal view showing borrower default probabilities and SHAP feature attributions (income, credit score, debt-to-income, employment status).

### 4.7 Multi-Currency CSV Portfolio Import (`ImportCsvModal`)
* **CSV Import Engine:** Parses user-uploaded bank customer portfolios containing columns (`name`, `credit_score`, `income`, `age`, `employment_status`, `region`, `loan_type`, `principal`, `outstanding`, `interest_rate`, `currency`, `status`).
* **Auto Normalization:** Automatically standardizes imported currency values to base units prior to database persistence.

---

## 5. 🚀 100% Free Tier Deployment Specifications

The platform is optimized for zero-cost cloud deployment using **Render** (FastAPI backend) and **Vercel** (Next.js frontend).

### 5.1 Render Deployment (Backend API)
* **Service Type:** Web Service (Free Tier)
* **Root Directory:** `backend`
* **Build Command:** `pip install -r requirements.txt`
* **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
* **Environment Variables:** `PYTHON_VERSION=3.11.0`
* **Auto Table Creation:** Managed on startup by SQLAlchemy `Base.metadata.create_all(bind=engine)`.

### 5.2 Vercel Deployment (Frontend UI)
* **Framework Preset:** `Next.js`
* **Root Directory:** `frontend`
* **Build Command:** `npm run build`
* **Environment Variables:** `NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com`

---

## 6. 🧪 Verification & Acceptance Criteria

1. **Backend Test Suite:** 100% pass rate across all 16 Pytest test files (`pytest backend/tests/`).
2. **Frontend Type Safety:** Zero errors output from `npx tsc --noEmit`.
3. **API Performance:** Response latency $<50\text{ms}$ for surrogate What-If calculations and $<500\text{ms}$ for 10,000-path Monte Carlo simulations.
4. **Currency Safety:** Idempotency and non-corruption verified across all 12 Golden Test Scenarios.
