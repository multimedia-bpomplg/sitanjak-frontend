"use client";

import { useState, type RefObject } from "react";
import { Download, Loader2 } from "lucide-react";
import { showToast } from "@/components/ui/toastDashboard";
import { downloadElementAsPng } from "@/lib/exportChartImage";

type Props = {
  targetRef: RefObject<HTMLElement | null>;
  fileName: string;
  label: string;
};

export default function ChartDownloadButton({
  targetRef,
  fileName,
  label,
}: Props) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    const el = targetRef.current;
    if (!el || downloading) return;

    try {
      setDownloading(true);
      await downloadElementAsPng(el, fileName);
      showToast.success(`Gambar grafik "${label}" berhasil diunduh`);
    } catch (err) {
      console.error("Gagal mengunduh gambar grafik:", err);
      showToast.error("Gagal mengunduh gambar grafik");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      type="button"
      data-export-ignore="true"
      onClick={handleDownload}
      disabled={downloading}
      title={`Unduh gambar ${label} (PNG)`}
      aria-label={`Unduh gambar ${label}`}
      className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 shadow-2xs transition cursor-pointer disabled:opacity-50 shrink-0"
    >
      {downloading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Download className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
