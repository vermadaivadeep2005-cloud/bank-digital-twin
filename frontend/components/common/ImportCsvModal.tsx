"use client";

import * as React from "react";
import { Upload, FileSpreadsheet, Download, Info, Eye, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { importBankCsv } from "@/lib/api";
import { downloadCsv } from "@/lib/exportUtils";

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportCsvModal({ isOpen, onClose, onSuccess }: ImportCsvModalProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [previewHeaders, setPreviewHeaders] = React.useState<string[]>([]);
  const [previewRows, setPreviewRows] = React.useState<string[][]>([]);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleDownloadSample = () => {
    const headers = [
      "name",
      "credit_score",
      "income",
      "age",
      "employment_status",
      "region",
      "loan_type",
      "principal",
      "outstanding",
      "interest_rate",
      "currency",
      "status",
    ];

    const rows = [
      ["Alexander Wright", 740, 125000, 42, "employed", "California", "mortgage", 450000, 380000, 0.055, "USD", "current"],
      ["Elena Rostova", 680, 7182500, 36, "self-employed", "New York", "personal", 2957500, 1859000, 0.095, "INR", "current"],
      ["Marcus Vance", 810, 210000, 51, "employed", "Texas", "business", 750000, 520000, 0.065, "USD", "current"],
      ["Sophia Lin", 620, 53360, 29, "unemployed", "Florida", "auto", 25760, 17480, 0.115, "EUR", "delinquent"],
      ["David Miller", 715, 74880, 47, "retired", "Illinois", "mortgage", 241800, 163800, 0.048, "GBP", "current"],
    ];

    downloadCsv(headers, rows, "cro_multi_currency_template.csv");
    toast.success("Downloaded sample multi-currency CSV template!");
  };

  const parseCsvPreview = (selectedFile: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text
        .split(/\r\n|\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length > 0) {
        const headers = lines[0].split(",").map((h) => h.replace(/^["']|["']$/g, "").trim());
        const rows = lines.slice(1, 11).map((line) =>
          line.split(",").map((cell) => cell.replace(/^["']|["']$/g, "").trim())
        );

        setPreviewHeaders(headers);
        setPreviewRows(rows);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith(".csv")) {
        toast.error("Invalid file format. Please select a valid .csv file.");
        return;
      }
      setFile(selected);
      parseCsvPreview(selected);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      if (!dropped.name.endsWith(".csv")) {
        toast.error("Invalid file format. Please select a valid .csv file.");
        return;
      }
      setFile(dropped);
      parseCsvPreview(dropped);
    }
  };

  const clearSelectedFile = () => {
    setFile(null);
    setPreviewHeaders([]);
    setPreviewRows([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a CSV file to import.");
      return;
    }

    setUploading(true);
    try {
      const res = await importBankCsv(file);
      toast.success(res.message || "Successfully imported portfolio CSV!");
      clearSelectedFile();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : err instanceof Error
          ? err.message
          : "Failed to import CSV";
      toast.error(msg || "CSV Import failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Bank Portfolio CSV (Multi-Currency CRO Input)">
      <div className="space-y-5 text-xs text-slate-300 pt-1 max-h-[80vh] overflow-y-auto pr-1">
        {/* Header Description */}
        <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-slate-100 text-xs">
              Upload Custom Bank Balance Sheet & Multi-Currency Portfolio
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Supports single or multi-currency customer books (<span className="text-cyan-300 font-mono">USD, INR, EUR, GBP</span>).
              The engine automatically normalizes multi-currency figures into baseline risk metrics while preserving customer data.
            </p>
          </div>
        </div>

        {/* CSV Schema Guidelines */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white text-xs font-mono uppercase tracking-wider">
              Required & Optional CSV Columns Guidelines
            </span>
            <button
              onClick={handleDownloadSample}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 cursor-pointer hover:underline"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Multi-Currency Template</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
            <table className="w-full text-[11px] text-left border-collapse">
              <thead className="bg-slate-900 text-indigo-300 font-mono text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-2 border-r border-slate-800">Column Header</th>
                  <th className="p-2 border-r border-slate-800">Required</th>
                  <th className="p-2 border-r border-slate-800">Format / Acceptable Values</th>
                  <th className="p-2">Multi-Currency Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-slate-300">
                <tr>
                  <td className="p-2 border-r border-slate-800 font-semibold text-white">name</td>
                  <td className="p-2 border-r border-slate-800 text-emerald-400">Yes</td>
                  <td className="p-2 border-r border-slate-800 text-slate-400">String (Full Name)</td>
                  <td className="p-2 text-cyan-300">&quot;Alexander Wright&quot;</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-800 font-semibold text-white">credit_score</td>
                  <td className="p-2 border-r border-slate-800 text-emerald-400">Yes</td>
                  <td className="p-2 border-r border-slate-800 text-slate-400">Integer (300 to 850)</td>
                  <td className="p-2 text-cyan-300">740</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-800 font-semibold text-white">income</td>
                  <td className="p-2 border-r border-slate-800 text-emerald-400">Yes</td>
                  <td className="p-2 border-r border-slate-800 text-slate-400">Float Income (USD, INR, EUR, GBP)</td>
                  <td className="p-2 text-cyan-300">7182500</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-800 font-semibold text-white">loan_type</td>
                  <td className="p-2 border-r border-slate-800 text-emerald-400">Yes</td>
                  <td className="p-2 border-r border-slate-800 text-slate-400">mortgage, personal, auto, business</td>
                  <td className="p-2 text-cyan-300">&quot;mortgage&quot;</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-800 font-semibold text-white">principal</td>
                  <td className="p-2 border-r border-slate-800 text-emerald-400">Yes</td>
                  <td className="p-2 border-r border-slate-800 text-slate-400">Float Principal Amount (Multi-Currency)</td>
                  <td className="p-2 text-cyan-300">2957500</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-800 font-semibold text-white">outstanding</td>
                  <td className="p-2 border-r border-slate-800 text-emerald-400">Yes</td>
                  <td className="p-2 border-r border-slate-800 text-slate-400">Float Current Balance (Multi-Currency)</td>
                  <td className="p-2 text-cyan-300">1859000</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-800 font-semibold text-white">interest_rate</td>
                  <td className="p-2 border-r border-slate-800 text-emerald-400">Yes</td>
                  <td className="p-2 border-r border-slate-800 text-slate-400">Decimal rate (0.055 or 5.5%)</td>
                  <td className="p-2 text-cyan-300">0.055</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-800 font-semibold text-white">currency</td>
                  <td className="p-2 border-r border-slate-800 text-slate-400 font-semibold">Optional</td>
                  <td className="p-2 border-r border-slate-800 text-slate-400">USD, INR, EUR, GBP (Defaults to USD)</td>
                  <td className="p-2 text-cyan-300">&quot;INR&quot; / &quot;EUR&quot; / &quot;GBP&quot;</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-800 font-semibold text-white">status</td>
                  <td className="p-2 border-r border-slate-800 text-slate-400 font-semibold">Optional</td>
                  <td className="p-2 border-r border-slate-800 text-slate-400">current, delinquent, default (Inferred if empty)</td>
                  <td className="p-2 text-cyan-300">&quot;current&quot;</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-800 font-semibold text-white">employment_status</td>
                  <td className="p-2 border-r border-slate-800 text-slate-500">Optional</td>
                  <td className="p-2 border-r border-slate-800 text-slate-400">employed, self-employed, unemployed, retired</td>
                  <td className="p-2 text-cyan-300">&quot;employed&quot;</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-800 font-semibold text-white">region</td>
                  <td className="p-2 border-r border-slate-800 text-slate-500">Optional</td>
                  <td className="p-2 border-r border-slate-800 text-slate-400">State / Region String</td>
                  <td className="p-2 text-cyan-300">&quot;California&quot;</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
            file
              ? "border-emerald-500/50 bg-emerald-950/20"
              : "border-slate-800 hover:border-indigo-500/50 bg-slate-950 hover:bg-slate-900/50"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />

          {file ? (
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-white text-xs flex items-center gap-2">
                    <span>{file.name}</span>
                    <Badge variant="success" className="text-[10px]">Ready to Preview</Badge>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB • Click to choose another file
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelectedFile();
                }}
                className="p-2 text-slate-400 hover:text-rose-400 transition"
                title="Remove file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-200 text-xs">
                  Drag & drop your CSV file here, or <span className="text-cyan-400 underline">browse</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Supports .csv format up to 50MB (Single or Multi-Currency)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Interactive CSV Data Preview Table */}
        {file && previewRows.length > 0 && (
          <div className="space-y-2 p-3 bg-slate-950/90 border border-emerald-500/30 rounded-2xl animate-fade-in shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-white text-xs font-mono uppercase tracking-wider">
                  CSV Live Data Preview Container
                </span>
              </div>
              <Badge variant="neutral" className="font-mono text-[10px] bg-slate-900 text-slate-300">
                Previewing top {previewRows.length} rows
              </Badge>
            </div>

            <div className="overflow-x-auto max-h-56 rounded-xl border border-slate-800 bg-slate-900/90">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead className="bg-slate-950 text-emerald-300 font-mono text-[10px] uppercase sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="p-2 border-r border-slate-800 text-center">#</th>
                    {previewHeaders.map((h, i) => (
                      <th key={i} className="p-2 border-r border-slate-800 last:border-r-0 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono text-slate-200 text-[11px]">
                  {previewRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/50 transition">
                      <td className="p-2 border-r border-slate-800 text-center font-bold text-slate-500">{rIdx + 1}</td>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2 border-r border-slate-800 last:border-r-0 whitespace-nowrap">
                          {previewHeaders[cIdx]?.toLowerCase() === "currency" ? (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                              {cell || "USD"}
                            </span>
                          ) : (
                            cell
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <Button variant="outline" size="sm" onClick={onClose} className="border-slate-800 text-slate-400">
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleUpload}
            loading={uploading}
            disabled={!file}
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            <Upload className="w-4 h-4" />
            <span>Confirm & Import Portfolio CSV</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ImportCsvModal;
