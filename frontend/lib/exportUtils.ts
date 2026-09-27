/**
 * Utility functions for exporting application data to JSON, CSV, and polished plain PDF reports.
 */

export function downloadJson(data: unknown, filename: string = "export.json") {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCsv(headers: string[], rows: (string | number)[][], filename: string = "export.csv") {
  const csvContent =
    headers.join(",") +
    "\n" +
    rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface PdfReportOptions {
  title?: string;
  subtitle?: string;
  metrics?: { label: string; value: string | number; detail?: string }[];
  tables?: { title: string; headers: string[]; rows: (string | number)[][] }[];
  chartSelector?: string; // CSS selector for chart container elements to extract as graphics
}

/**
 * Exports a clean, plain PDF report containing ONLY graphs, charts, and structured metrics tables,
 * avoiding full UI DOM screenshots, sidebars, or dark UI chrome.
 */
export function exportPdfReport(options: PdfReportOptions = {}) {
  if (typeof window === "undefined") return;

  const {
    title = "Bank Digital Twin — Executive Risk & Solvency Audit Report",
    subtitle = `Generated on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} • Basel III/IV Compliant`,
    metrics = [],
    tables = [],
    chartSelector = ".recharts-wrapper, svg.chart-svg, canvas",
  } = options;

  // Extract SVG or Canvas chart elements from current page DOM
  const chartElements = document.querySelectorAll(chartSelector);
  const chartHtmls: string[] = [];

  chartElements.forEach((el, i) => {
    if (el instanceof SVGElement || el.tagName === "SVG" || el.querySelector("svg")) {
      const svgNode = el.tagName === "SVG" ? el : el.querySelector("svg");
      if (svgNode) {
        chartHtmls.push(`
          <div class="chart-card">
            <h4>Chart Visualization ${i + 1}</h4>
            <div class="chart-container">${svgNode.outerHTML}</div>
          </div>
        `);
      }
    } else if (el instanceof HTMLCanvasElement) {
      chartHtmls.push(`
        <div class="chart-card">
          <h4>Chart Canvas ${i + 1}</h4>
          <img src="${el.toDataURL("image/png")}" style="max-width: 100%; height: auto;" />
        </div>
      `);
    }
  });

  const printWindow = window.open("", "_blank", "width=900,height=1000");
  if (!printWindow) {
    alert("Please allow popups to download the PDF report.");
    return;
  }

  const metricsHtml =
    metrics.length > 0
      ? `
        <div class="section-title">Key Risk & Solvency Metrics</div>
        <div class="metrics-grid">
          ${metrics
            .map(
              (m) => `
            <div class="metric-card">
              <div class="metric-label">${m.label}</div>
              <div class="metric-value">${m.value}</div>
              ${m.detail ? `<div class="metric-detail">${m.detail}</div>` : ""}
            </div>
          `
            )
            .join("")}
        </div>
      `
      : "";

  const tablesHtml = tables
    .map(
      (t) => `
      <div class="section-title">${t.title}</div>
      <table>
        <thead>
          <tr>${t.headers.map((h) => `<th>${h}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${t.rows
            .map(
              (r) => `
            <tr>${r.map((cell) => `<td>${cell}</td>`).join("")}</tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `
    )
    .join("");

  const chartsSectionHtml =
    chartHtmls.length > 0
      ? `
        <div class="section-title">Risk & Portfolio Charts</div>
        <div class="charts-grid">
          ${chartHtmls.join("")}
        </div>
      `
      : "";

  const docHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #1e293b;
            background: #ffffff;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.5;
          }
          .header {
            border-bottom: 2px solid #0284c7;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .header h1 {
            font-size: 20px;
            margin: 0 0 6px 0;
            color: #0f172a;
          }
          .header .subtitle {
            font-size: 11px;
            color: #64748b;
          }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            margin: 20px 0 10px 0;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 20px;
          }
          .metric-card {
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 10px 12px;
            background: #f8fafc;
          }
          .metric-label {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
          }
          .metric-value {
            font-size: 18px;
            font-weight: 700;
            color: #0284c7;
            margin-top: 2px;
          }
          .metric-detail {
            font-size: 9px;
            color: #475569;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
          }
          th {
            background: #f1f5f9;
            color: #334155;
            font-weight: 700;
            text-align: left;
            padding: 8px 10px;
            border: 1px solid #cbd5e1;
          }
          td {
            padding: 7px 10px;
            border: 1px solid #e2e8f0;
          }
          tr:nth-child(even) {
            background: #f8fafc;
          }
          .chart-card {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
            background: #ffffff;
            page-break-inside: avoid;
          }
          .chart-card h4 {
            margin: 0 0 10px 0;
            font-size: 12px;
            color: #334155;
          }
          .chart-container svg {
            width: 100% !important;
            height: auto !important;
            max-height: 280px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #cbd5e1;
            font-size: 10px;
            color: #94a3b8;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <div class="subtitle">${subtitle}</div>
        </div>

        ${metricsHtml}
        ${chartsSectionHtml}
        ${tablesHtml}

        <div class="footer">
          Aegis Bank Digital Twin &copy; ${new Date().getFullYear()} — Proprietary Financial Solvency Audit Report
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 600);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(docHtml);
  printWindow.document.close();
}

export function printPdfReport() {
  exportPdfReport();
}
