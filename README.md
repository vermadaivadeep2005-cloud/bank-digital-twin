# 🏦 Bank Digital Twin — Enterprise Synthetic Financial Simulation & Risk Intelligence Platform

---

## 📌 Executive Summary

### 🏢 Non-Technical Overview
The **Bank Digital Twin** is an enterprise-grade virtual replica of a commercial financial institution. Just as a physical digital twin in aerospace or manufacturing simulates jet engines or smart cities, the Bank Digital Twin simulates thousands of synthetic customers, deposit accounts, commercial/retail loan books, and real-time transaction streams.

It empowers bank executives, Chief Risk Officers (CROs), quantitative risk analysts, and regulatory examiners to:
- **Test Bank Solvency**: Stress-test capital adequacy against severe macroeconomic crises (e.g., commercial property market crashes, stagflation, aggressive interest rate hikes) without placing actual balance sheet capital at risk.
- **Run Real-Time What-If Hypothesis Tests**: Compute instant (<50ms) balance sheet impacts using dynamic macroeconomic shock sliders.
- **Predict Financial Metric Trajectories**: Forecast 30-day, 60-day, and 90-day trajectories for Capital Adequacy Ratio (CAR %), Non-Performing Loans (NPL %), Net Interest Margin (NIM %), deposits, and liquidity with 95% confidence intervals.
- **Detect Financial Fraud & Anomalies**: Monitor real-time transaction streams using unsupervised IsolationForest ML and heuristic velocity rule engines to intercept high-risk midnight wires and crypto transfers.
- **Explain Borrower Default Risk**: Analyze borrower risk profiles using explainable AI credit scoring backed by SHAP (SHapley Additive exPlanations) feature attributions.
- **Automate Regulatory Compliance**: Evaluate real-time balance sheet compliance against RBI, Basel III/IV, and FATF capital & liquidity requirements (CAR $\ge 9\%$, Tier 1 $\ge 7\%$, CET1 $\ge 5.5\%$, LCR $\ge 100\%$).

---

### 💻 Technical Overview
Built on a high-performance **FastAPI (Python 3.11)** backend and a **Next.js 16 / React 19** frontend, the platform integrates specialized computational engines:
1. **NumPy Vectorized Vasicek Monte Carlo Engine**: Executes **10,000 portfolio capital paths across multi-year horizons in under 500ms** using Vasicek single-factor asset correlation math and dual Gaussian / Student's $t$-Copulas.
2. **Surrogate Response Surface Engine**: Enables real-time <50ms What-If balance sheet recalculations and dynamic sensitivity tornado ranking.
3. **Statsmodels Time-Series Forecasting Engine**: Computes Holt-Winters Exponential Smoothing & Autoregressive models with shaded 80% and 95% statistical confidence bounds.
4. **Scikit-Learn IsolationForest & Rule-Based Fraud Detection System**: Performs unsupervised anomaly scoring and rule-based velocity checks on transaction streams.
5. **Calibrated Random Forest Credit Scorecard**: Integrates Isotonic Regression and SHAP TreeExplainer attribution for explainable borrower risk evaluation.
6. **Multi-Currency Global Context**: Multi-currency engine (`$` USD, `₹` INR, `€` EUR, `£` GBP) with live ECB exchange rate synchronization.

---

## 🖼️ Platform Screenshots & Interface Showcase

### 📈 Executive Overview Dashboard
![Overview Dashboard](frontend/public/screenshots/dashboard.png)

### ⚡ Monte Carlo Stress Testing Engine
![Stress Engine](frontend/public/screenshots/stress_engine.png)

### 📁 Loan Portfolio Explorer & AI Credit Risk Scorecard
![Loan Portfolio Explorer](frontend/public/screenshots/loan_portfolio.png)

### 📈 Predictive Metric Forecasting & 3D Risk Breakdown
![Predictive Forecasting](frontend/public/screenshots/predictive_forecasting.png)

---

## 🏗 System Architecture & Technology Stack

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │      Next.js 16 (App Router) + React 19 Frontend       │
                                  │     Tailwind CSS Glassmorphic Dark UI + Jakarta Sans   │
                                  └───────────────────────────┬────────────────────────────┘
                                                              │  REST API Pipeline
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
                                              │    SQLite (Default) / Postgres │
                                              └──────────────────────────────┘
```

### 🛠 Tech Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 16 (App Router) + React 19 | Server Components, hybrid client rendering, fast client-side navigation. |
| **Styling & Fonts** | Tailwind CSS + Plus Jakarta Sans | High-density dark glassmorphic financial UI with modern Gen-Z typography. |
| **Animations & Motion** | Framer Motion | Smooth 60fps card transitions and interactive 3D flippy card hover effects. |
| **Data Visualization** | Recharts & Custom 3D SVG Canvas | Multi-series area charts, sensitivity tornado bars, and custom isometric 3D cylinder pie charts (`ThreeDPieChart`). |
| **Backend Framework** | FastAPI + Uvicorn | High-throughput asynchronous Python web server with automated OpenAPI documentation (`/docs`). |
| **Machine Learning** | Scikit-Learn 1.9 + SHAP 0.51 | Calibrated Random Forest credit risk scoring, IsolationForest anomaly detection, and TreeExplainer feature attributions. |
| **Quantitative Engine** | NumPy 2.3 + SciPy 1.17 | Matrix vectorized Vasicek loss calculations running 10,000 Monte Carlo simulation paths in <500ms. |
| **Time-Series Engine** | Statsmodels 0.15 | Exponential Smoothing & ARIMA forecasting with upper/lower confidence bounds. |
| **Database & ORM** | SQLAlchemy 2.0 + SQLite / PostgreSQL | Zero-setup local SQLite storage (`bank_twin.db`) with full PostgreSQL compatibility via `DATABASE_URL`. |

---

## 🧮 Mathematical & Quantitative Financial Models

### 1. Baseline Credit Risk & Logistic Scoring Model
Computes the monthly baseline **Probability of Default** ($\text{PD}$) for each loan using borrower credit scores, employment type, and loan collateral:

$$\text{Score Factor} = \frac{1}{1 + e^{\frac{\text{CreditScore} - 620}{40}}}$$

$$\text{Baseline PD} = \text{Score Factor} \times M_{\text{employment}} \times M_{\text{loan\_type}} \times 0.002$$

### 2. Vasicek Single-Factor Credit Model (Basel III Standard)
Models how macroeconomic shocks ($Z$) affect portfolio credit correlation and loan default probabilities:

$$Y_i = \sqrt{\rho_i} Z + \sqrt{1 - \rho_i} \epsilon_i$$

Under an economic shock $Z$, the conditional default probability is:

$$\text{Conditional PD}(Z) = \Phi \left( \frac{\Phi^{-1}(\text{Base PD}) - \sqrt{\rho_i} Z}{\sqrt{1 - \rho_i}} \right)$$

### 3. Dual-Copula Monte Carlo Simulation Engine
Simulates thousands of parallel 24-month economic futures ($n=1,000 \text{ to } 10,000$ simulation paths):
* **Gaussian Copula**: Draws standard normal macro shocks $Z \sim \mathcal{N}(0,1)$.
* **Student's $t$-Copula**: Draws heavy-tailed extreme shock events using Student's $t$-distribution with $\nu$ degrees of freedom.
* **Value at Risk ($\text{VaR}_{\alpha}$)**: $\text{VaR}_{\alpha} = \text{Percentile}(L_{\text{total}}, \alpha)$
* **Conditional Value at Risk ($\text{CVaR}_{\alpha}$ / Expected Shortfall)**: $\text{CVaR}_{\alpha} = \mathbb{E}[L_{\text{total}} \mid L_{\text{total}} \ge \text{VaR}_{\alpha}]$

### 4. Regulatory Balance Sheet Ratios (Basel III / RBI)
* **Risk-Weighted Assets ($\text{RWA}$)**: $\text{RWA} = \sum_{i} \left( \text{Loan Outstanding}_i \times \text{Risk Weight}_i \right)$
* **Capital Adequacy Ratio ($\text{CAR}$)**: $\text{CAR} = \frac{\text{Tier 1 Capital}}{\text{RWA}} \ge 9.0\%$
* **Liquidity Coverage Ratio ($\text{LCR}$)**: $\text{LCR} = \frac{\text{HQLA}}{\text{30-Day Net Cash Outflows}} \ge 100\%$

---

## 📁 Codebase Directory Structure

```
bank-digital-twin/
├── backend/
│   ├── app/
│   │   ├── api/             # API routes (/simulation, /forecast, /compliance, /loans)
│   │   ├── core/            # Configuration, security, background tasks
│   │   ├── models/          # SQLAlchemy ORM database models (Customer, Loan, Account)
│   │   ├── schemas/         # Pydantic data validation schemas
│   │   ├── services/        # Business logic services (KPI, Compliance, AI Advisor)
│   │   └── simulation/      # Quantitative finance engines (Monte Carlo, Vasicek, ML)
│   ├── scripts/             # Data seeding and portfolio ingestion scripts
│   ├── tests/               # Automated unit test suite (pytest)
│   ├── bank_twin.db         # SQLite database file
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable UI components & Recharts visualizers
│   ├── context/             # Global Currency & Application React Contexts
│   ├── lib/                 # API client utilities and export helpers
│   ├── public/              # Static images and screenshots
│   └── types/               # TypeScript interface definitions
├── bank_twin.db             # Root SQLite database file
├── PRD.md                   # Product Requirements Document
└── README.md                # Full Project Documentation
```

---

## 📊 Complete Page Navigation & Feature Specification

### 1. 📈 Overview Dashboard (`/`)
* **Core Financial Metrics**: Capital Adequacy Ratio (CAR: 15.2%), Non-Performing Loans (NPL: 2.5%), Tier 1 Capital ($1.20B), Risk Weighted Assets (RWA: $7.89B), Return on Assets (ROA: 1.4%), Net Interest Margin (NIM: 3.2%).
* **3D Flippy Hover Cards**: Interactive primary KPI grid featuring hardware-accelerated 3D hover tilt.
* **Trend Visualizations**: 30-day historical trend lines and asset class risk breakdown.
* **Collapsible AI CRO Copilot**: Positioned cleanly below the fold with indigo-to-cyan gradient borders, providing real-time executive summaries and Basel III compliance badges.
* **Data Export**: Export balance sheet summaries in formatted JSON or CSV formats.

### 2. 🎛️ What-If Interactive Simulator (`/what-if`)
* **Real-Time Macro Shock Sliders**:
  * **Unemployment Rate Shock**: 3.5% to 20.0%
  * **Interest Rate Hike**: -2.0% to +8.0%
  * **Commercial Property Price Drop**: 0% to 50%
  * **Deposit Outflow %**: 0% to 40%
* **Surrogate Response Surface**: Computes post-stress CAR %, NPL %, Net Losses ($), and Solvency Risk Levels in **<50ms**.
* **Dynamic Sensitivity Tornado Ranking Chart**: Automatically recalculates and animates in real-time as sliders change, ranking macro shock factors by marginal CAR % impact per 1% shock.

### 3. 📈 Predictive Metric Forecasting (`/forecasts`)
* **Multi-Metric Selection**: Switch between Capital Adequacy Ratio (CAR %), Non-Performing Loans (NPL %), Net Interest Margin (NIM %), Liquidity Ratio %, and Tier 1 Capital.
* **Time-Series Projections**: Select 30-day, 60-day, or 90-day forecast horizons with shaded 95% statistical confidence bounds.
* **Dual Distribution Pie Charts**:
  * **Forecast Risk Profile Pie**: Categorizes forecasted data points into Optimal, Stable, Watchlist, and Critical risk zones.
  * **Isometric 3D Cylinder Pie Chart (`ThreeDPieChart`)**: Rendered with pseudo-3D side wall depth, exploded slices, radial callout pins, and dynamic metric breakdown.

### 4. 🛡️ Fraud & Anomaly Center (`/fraud`)
* **Clean & Focused Interface**: Streamlined heading layout designed for rapid operational response.
* **Unsupervised IsolationForest ML**: Anomaly likelihood scoring combined with contamination parameters.
* **Multi-Vector Rule Engine**:
  * `LARGE_TRANSACTION_AMOUNT (> $10k)`
  * `HIGH_VELOCITY (> 5 txns in 5 min)`
  * `MIDNIGHT_HIGH_VALUE_WIRE`
  * `HIGH_RISK_CATEGORY_TRANSFER`
* **Real-Time Sentinel Stream**: Live alert counts, Critical & High Risk counts, Total Capital at Risk ($), and ML Model Precision metrics.
* **Interactive Threat Simulation**: Includes a **"Simulate Anomaly Threat"** button to test instant live sentinel threat interception and toast alerts.

### 5. ⚡ Monte Carlo Stress Testing Engine (`/stress`)
* **Vectorized Monte Carlo Matrix**: Executes 10,000 asset paths using Vasicek single-factor credit correlation.
* **Custom Shock Controls**: Configure GDP contraction, interest rate shocks, CRE property drops, and unemployment spikes.
* **Quant Outputs**: P5, P50, and P95 drawdown fan charts, loss severity histograms, Value at Risk (VaR 99%), Expected Shortfall (CVaR 99%), and capital post-stress pass/fail indicators.

### 6. 📁 Loan Portfolio Explorer (`/portfolio`)
* **Clean Full Ledger View**: Streamlined full-width loan ledger displaying principal, outstanding, interest rate, status, and region.
* **Bank Credit Risk & Underwriting Scorecard**: Interactive loan decision calculator for evaluating credit scores, income, living costs, and debt obligations with dynamic multi-currency support (`$`, `₹`, `€`, `£`).

### 7. 📚 Stress Scenario Library (`/scenarios`)
* **Preset Macro Scenarios**: 2008 Global Financial Crisis, 2023 SVB Liquidity Run, Commercial Real Estate Collapse, and Stagflation Shock.
* **Natural Language Synthesizer**: Convert plain-English risk descriptions into quantitative stress parameters.

### 8. ⚖️ Regulatory Compliance & Reporting (`/compliance` & `/reports`)
* **RBI, Basel III/IV & FATF Matrix**: Evaluates Capital Adequacy Ratio (CAR $\ge 9\%$), Tier 1 Ratio ($\ge 7\%$), CET1 ($\ge 5.5\%$), Liquidity Coverage Ratio (LCR $\ge 100\%$), and Net Stable Funding Ratio (NSFR $\ge 100\%$).
* **Automated Report Generation**: Generate and download official PDF, CSV, and JSON audit reports.

---

## 🏆 Current Project Status & Achievements

- ✅ **All Core Features & Pages Fully Operational**: Integrated across interactive charts, real-time recalculations, and backend APIs.
- ✅ **100% Pytest Pass Rate**: All 21 unit and integration backend tests pass cleanly (`test_auth.py`, `test_compliance.py`, `test_forecasts.py`, `test_fraud.py`, `test_fx.py`, `test_kpis.py`, `test_ml_model.py`, `test_simulator.py`, `test_transactions.py`, `test_what_if.py`).
- ✅ **0 TypeScript Errors & Clean Production Build**: Clean `npx tsc --noEmit` and production `npm run build` output across the entire Next.js codebase.
- ✅ **Clean Codebase**: Cleaned up temporary log files and unnecessary build artifacts.

---

## 🚀 How to Run & Demonstrate the Project

### 1. Prerequisites & Installation

#### Backend Setup (Python 3.11)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Frontend Setup (Node.js & Next.js)
```bash
cd frontend
npm install
```

---

### 2. Launching Local Servers

#### Start Backend API Server (Port 8000)
```bash
PYTHONPATH=backend backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```
* Interactive Swagger API Documentation: `http://localhost:8000/docs`

#### Start Frontend Dev Server (Port 3000)
```bash
cd frontend
npm run dev
```
* Web Application UI: `http://localhost:3000`

---

### 3. Running the Verification Suite

#### Run Backend Pytest Suite (21/21 Passed)
```bash
python3 -m pytest backend/tests/
```

#### Run Frontend TypeScript Type-Check & Production Build
```bash
cd frontend
npx tsc --noEmit
npm run build
```

---

## 🎭 Step-by-Step Client Demonstration Guide

When presenting the **Bank Digital Twin** to clients, executives, or examiners, follow this 5-step walkthrough:

1. **Step 1: Overview Dashboard (`http://localhost:3000/`)**
   * Highlight the baseline financial posture: **Capital Adequacy Ratio (CAR: 15.2%)** and **NPL Ratio (2.5%)**.
   * Hover over the top KPI cards to demonstrate the 3D Flippy Card effect.
   * Scroll below the fold to show the collapsible **AI CRO Executive Copilot** memo with its indigo-cyan gradient border and Basel III compliance status.

2. **Step 2: What-If Interactive Simulator (`http://localhost:3000/what-if`)**
   * Explain: *"Instead of running a full 10,000-path Monte Carlo simulation every time an analyst asks a question, our surrogate model recalculates balance sheet impacts in <50ms."*
   * Drag the **Unemployment Rate Shock** slider to `15.0%`.
   * Drag the **Commercial Property Price Drop** slider to `25.0%`.
   * Point out how the **Sensitivity Tornado Ranking Chart** immediately updates in real-time to highlight which macro factor poses the largest threat to capital.

3. **Step 3: Predictive Metric Forecasting (`http://localhost:3000/forecasts`)**
   * Switch the metric selector between **Capital Adequacy Ratio (CAR %)** and **NPL Ratio %**.
   * Change the forecast horizon from **30 Days** to **90 Days**.
   * Point out the shaded 95% statistical confidence bounds on the area graph and showcase the **Isometric 3D Cylinder Pie Chart** displaying risk distribution slices.

4. **Step 4: Fraud & Anomaly Center (`http://localhost:3000/fraud`)**
   * Point out the live **IsolationForest ML** and heuristic velocity rule stream.
   * Click **"Simulate Anomaly Threat"** to trigger a synthetic high-risk crypto/wire transfer and watch the sentinel intercept it in real time.
   * Filter the flagged transaction stream table by clicking the **Critical** or **High** risk tabs.

5. **Step 5: Vectorized Monte Carlo Stress Engine (`http://localhost:3000/stress`)**
   * Select the **2008 Financial Crisis** preset scenario.
   * Click **"Run Stress Test"** to execute 10,000 Vasicek simulation paths.
   * Show the resulting loss distribution histogram, P5/P50/P95 drawdown fan chart, Value at Risk (VaR 99%), and Expected Shortfall metrics.

---

## 💾 Database Configuration (SQLite & PostgreSQL)

The project supports both **SQLite** (default out-of-the-box) and **PostgreSQL**.

* **SQLite (Default)**:
  * File location: `bank_twin.db`
  * Inspect via terminal: `sqlite3 bank_twin.db` -> `.tables` -> `SELECT * FROM transactions LIMIT 10;`
* **PostgreSQL (Optional)**:
  * To connect to a PostgreSQL database, update `DATABASE_URL` in `backend/.env`:
    ```env
    DATABASE_URL=postgresql://username:password@localhost:5432/bank_twin
    ```
  * SQLAlchemy handles table creation automatically upon backend startup.

---

## 📄 License
Enterprise Proprietary — Bank Digital Twin Simulation Platform. All Rights Reserved.
