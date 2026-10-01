"use client";

import * as React from "react";
import katex from "katex";

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

/**
 * FormattedMarkdown renders raw LLM text into rich HTML:
 * - Markdown Tables -> Clean styled HTML <table>
 * - Publication-grade LaTeX Math Equations via KaTeX (\mathbf{X}, \mathbf{\varepsilon}, \sim, \mu, \frac{a}{b})
 * - Headers, Lists, Bold, Italic, Code tags
 */
export function FormattedMarkdown({ content, className = "" }: FormattedMarkdownProps) {
  const elements = React.useMemo(() => {
    if (!content) return null;

    // Clean up raw text issues
    const cleanedText = content
      .replace(/(\w)--(\w)/g, "$1 - $2")
      .replace(/\s*—\s*—\s*—\s*/g, "---");

    const lines = cleanedText.split("\n");
    const outputNodes: React.ReactNode[] = [];

    let idx = 0;
    while (idx < lines.length) {
      const line = lines[idx];
      const trimmed = line.trim();

      if (!trimmed) {
        idx++;
        continue;
      }

      // Check for Table start (Line starts with | and contains |)
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        const tableLines: string[] = [];
        while (idx < lines.length && lines[idx].trim().startsWith("|") && lines[idx].trim().endsWith("|")) {
          tableLines.push(lines[idx].trim());
          idx++;
        }

        const parsedTable = parseMarkdownTable(tableLines);
        if (parsedTable) {
          outputNodes.push(
            <div key={`table-${idx}`} className="my-3 overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/90 shadow-lg">
              <table className="w-full text-xs text-left text-slate-200 border-collapse">
                <thead className="bg-slate-800/90 text-indigo-300 font-mono text-[11px] uppercase tracking-wider border-b border-slate-700">
                  <tr>
                    {parsedTable.headers.map((h, i) => (
                      <th key={i} className="px-3 py-2 border-r border-slate-700/60 last:border-r-0">
                        {parseInlineStyles(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {parsedTable.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 border-r border-slate-800/60 last:border-r-0 leading-normal">
                          {parseInlineStyles(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // Check for LaTeX Math Block: \[ ... \] or $$ ... $$
      if (trimmed.startsWith("\\[") || trimmed.startsWith("$$")) {
        let mathContent = trimmed;
        // Collect multi-line math block if needed
        if (!trimmed.endsWith("\\]") && !trimmed.endsWith("$$")) {
          idx++;
          while (idx < lines.length) {
            mathContent += " " + lines[idx].trim();
            if (lines[idx].trim().endsWith("\\]") || lines[idx].trim().endsWith("$$")) {
              idx++;
              break;
            }
            idx++;
          }
        } else {
          idx++;
        }

        const rawMath = mathContent
          .replace(/^(\\\[|\$\$)/, "")
          .replace(/(\\\]|\$\$)$/, "")
          .trim();

        outputNodes.push(
          <div key={`math-${idx}`} className="my-3.5 p-3.5 rounded-2xl bg-slate-950/90 border border-cyan-500/40 text-cyan-200 text-xs flex justify-center items-center shadow-lg shadow-indigo-500/10 overflow-x-auto">
            {renderKaTeX(rawMath, true)}
          </div>
        );
        continue;
      }

      // Horizontal Divider (---)
      if (trimmed === "---" || trimmed === "--- -") {
        outputNodes.push(<hr key={`hr-${idx}`} className="my-3 border-slate-800" />);
        idx++;
        continue;
      }

      // Headers (### Header)
      if (trimmed.startsWith("### ")) {
        outputNodes.push(
          <h4 key={`h4-${idx}`} className="font-bold text-sm text-indigo-300 mt-2 mb-1 tracking-tight">
            {parseInlineStyles(trimmed.slice(4))}
          </h4>
        );
        idx++;
        continue;
      }

      if (trimmed.startsWith("## ")) {
        outputNodes.push(
          <h3 key={`h3-${idx}`} className="font-extrabold text-base text-white mt-3 mb-1.5 tracking-tight">
            {parseInlineStyles(trimmed.slice(3))}
          </h3>
        );
        idx++;
        continue;
      }

      if (trimmed.startsWith("# ")) {
        outputNodes.push(
          <h2 key={`h2-${idx}`} className="font-extrabold text-lg text-white mt-3 mb-2 tracking-tight">
            {parseInlineStyles(trimmed.slice(2))}
          </h2>
        );
        idx++;
        continue;
      }

      // Bullet List items (- or * or •)
      if (/^[-*•]\s+/.test(trimmed)) {
        const itemText = trimmed.replace(/^[-*•]\s+/, "");
        outputNodes.push(
          <div key={`li-${idx}`} className="flex items-start gap-2 my-1 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
            <span className="leading-relaxed text-slate-200">
              {parseInlineStyles(itemText)}
            </span>
          </div>
        );
        idx++;
        continue;
      }

      // Numbered List items (1. 2.)
      if (/^\d+\.\s*/.test(trimmed)) {
        const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
        if (numMatch) {
          outputNodes.push(
            <div key={`num-${idx}`} className="flex items-start gap-2 my-1 pl-1">
              <span className="font-mono text-xs font-bold text-indigo-400 shrink-0 mt-0.5">
                {numMatch[1]}.
              </span>
              <span className="leading-relaxed text-slate-200">
                {parseInlineStyles(numMatch[2])}
              </span>
            </div>
          );
          idx++;
          continue;
        }
      }

      // Fallback Paragraph
      outputNodes.push(
        <p key={`p-${idx}`} className="leading-relaxed my-1">
          {parseInlineStyles(trimmed)}
        </p>
      );
      idx++;
    }

    return outputNodes;
  }, [content]);

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}

/**
 * Parses markdown table lines into headers and rows.
 */
function parseMarkdownTable(lines: string[]): { headers: string[]; rows: string[][] } | null {
  if (lines.length < 2) return null;

  const parseRow = (line: string) =>
    line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());

  const headers = parseRow(lines[0]);
  const rows: string[][] = [];

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    // Skip divider row like | --- | --- | or | — — |
    if (/^[|\s\-—:_]+$/.test(raw)) continue;
    const cells = parseRow(raw);
    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  return { headers, rows };
}

/**
 * Renders LaTeX math via KaTeX cleanly.
 */
function renderKaTeX(mathExpr: string, displayMode = false): React.ReactNode {
  try {
    const html = katex.renderToString(mathExpr, {
      displayMode,
      throwOnError: false,
    });
    return (
      <span
        dangerouslySetInnerHTML={{ __html: html }}
        className={displayMode ? "katex-display-container inline-block" : "katex-inline-container inline-block align-middle px-0.5"}
      />
    );
  } catch {
    return <code className="font-mono text-cyan-300 text-xs">{mathExpr}</code>;
  }
}

/**
 * Parses inline syntax: LaTeX math ($...$, \(...\), \mathbf{...}), **bold**, *italic*, `code`, and text.
 */
function parseInlineStyles(text: string): React.ReactNode[] {
  // Regex to split on inline math ($...$, \(...\), \mathbf{...}), bold, italic, code
  const pattern = /(\$\$[^\$]+\$\$|\\\[[\s\S]*?\\\]|\\\([^\)]+\\\)|\$[^\$]+\$|\\mathbf\{[^}]+\}(?:\^(?:\{[^}]+\}|\([^\)]+\)|\w+)|_(?:\{[^}]+\}|\([^\)]+\)|\w+))?|\\(?:mathbf|varepsilon|mu|alpha|beta|sigma|lambda|gamma|delta|theta|phi|rho|omega|tau|psi|eta|kappa|chi|sum|int|frac|sqrt|left|right|sim)\b[^\s,;:()]+|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;

  const parts = text.split(pattern);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Inline display math $$...$$ or \[...\]
    if ((part.startsWith("$$") && part.endsWith("$$")) || (part.startsWith("\\[") && part.endsWith("\\]"))) {
      const expr = part.replace(/^(\$\$|\\\[)/, "").replace(/(\$\$|\\\])$/, "").trim();
      return <span key={idx}>{renderKaTeX(expr, true)}</span>;
    }

    // Inline math $...$ or \(...\) or raw TeX macro like \mathbf{...}
    if (
      (part.startsWith("$") && part.endsWith("$") && part.length > 2) ||
      (part.startsWith("\\(") && part.endsWith("\\)")) ||
      part.startsWith("\\mathbf") ||
      part.startsWith("\\frac") ||
      part.startsWith("\\sim") ||
      part.startsWith("\\mu") ||
      part.startsWith("\\varepsilon")
    ) {
      const expr = part.replace(/^(\$|\\\()/, "").replace(/(\$|\\\))$/, "").trim();
      return <span key={idx}>{renderKaTeX(expr, false)}</span>;
    }

    // **bold**
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong key={idx} className="font-bold text-white tracking-wide">
          {parseInlineStyles(inner)}
        </strong>
      );
    }

    // *italic*
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={idx} className="italic text-cyan-200">
          {parseInlineStyles(inner)}
        </em>
      );
    }

    // `code`
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-[11px] font-semibold"
        >
          {inner}
        </code>
      );
    }

    return part;
  });
}

export default FormattedMarkdown;
