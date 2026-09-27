"use client";

import * as React from "react";
import { Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle, Info, X } from "lucide-react";
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
    ];

    const rows = [
      ["Alexander Wright", 740, 125000, 42, "employed", "California", "mortgage", 450000, 380000, 0.055],
      ["Elena Rostova", 680, 85000, 36, "self-employed", "New York", "personal", 35000, 22000, 0.095],
      ["Marcus Vance", 810, 210000, 51, "employed", "Texas", "business", 750000, 520000, 0.065],
      ["Sophia Lin", 620, 58000, 29, "unemployed", "Florida", "auto", 28000, 19000, 0.115],
      ["David Miller", 715, 96000, 47, "retired", "Illinois", "mortgage", 310000, 210000, 0.048],
    ];

    downloadCsv(headers, rows, "cro_bank_portfolio_template.csv");
    toast.success("Downloaded sample CSV portfolio template!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith(".csv")) {
        toast.error("Invalid file format. Please select a valid .csv file.");
        return;
      }
      setFile(selected);
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
      setFile(null);
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
    <Modal isOpen={isOpen} onClose={onClose} title="Import Real Bank Portfolio CSV (CRO Input)">
      <div className="space-y-5 text-xs text-slate-300 pt-1">
        {/* Header Description */}
        <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-slate-100 text-xs">
              Upload Custom Bank Balance Sheet & Loan Portfolio
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Chief Risk Officers (CROs) can import real customer and loan books instead of generating synthetic data.
              Existing active records will be updated with your imported portfolio.
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
              <span>Download Sample Template</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
            <table className="w-full text-[11px] text-left border-collapse">
              <thead className="bg-slate-900 text-indigo-300 font-mono text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-2 border-r border-slate-800">Column Header</th>
                  <th className="p-2 border-r border-slate-800">Required</th>
                  <th className="p-2 border-r border-slate-800">Format / Acceptable Values</th>
                  <th className="p-2">Example</th>
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
                  <td className="p-2 border-r border-slate-800 text-slate-400">Float Annual Income ($)</td>
                  <td className="p-2 text-cyan-300">125000</td>
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
                  <td className="p-2 border-r border-slate-800 text-slate-400">Float Principal ($)</td>
                  <td className="p-2 text-cyan-300">450000</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-800 font-semibold text-white">outstanding</td>
                  <td className="p-2 border-r border-slate-800 text-emerald-400">Yes</td>
                  <td className="p-2 border-r border-slate-800 text-slate-400">Float Current Balance ($)</td>
                  <td className="p-2 text-cyan-300">380000</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-800 font-semibold text-white">interest_rate</td>
                  <td className="p-2 border-r border-slate-800 text-emerald-400">Yes</td>
                  <td className="p-2 border-r border-slate-800 text-slate-400">Decimal rate (0.055 or 5.5%)</td>
                  <td className="p-2 text-cyan-300">0.055</td>
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
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-white text-xs">{file.name}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB • Click to change file
                </div>
              </div>
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
                  Supports .csv format up to 50MB
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="border-slate-800 text-slate-400">
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleUpload}
            loading={uploading}
            disabled={!file}
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import & Initialize Portfolio</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ImportCsvModal;
