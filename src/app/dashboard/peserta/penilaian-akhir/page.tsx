"use client";

import { Fragment, useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ClipboardList,
  User,
  Briefcase,
  Calendar,
  UserCheck,
  Clock,
  CheckCircle2,
  Download,
} from "lucide-react";
import { PesertaDashboardSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";
import { isPkpaPeserta } from "@/lib/pesertaKategori";

/* ================= TYPES ================= */

type AspectScore = {
  nilai?: number | null;
  keterangan?: string;
};

type PenilaianAkhirData = {
  kehadiranTaatJadwal?: AspectScore;
  sikapKerja?: AspectScore;
  penguasaanMateri?: AspectScore;
  praktikKerja?: AspectScore;
  inisiatifKomunikasi?: AspectScore;
  nilaiRataRata?: number | null;
  keteranganRataRata?: string;
  kesan?: string;
  saran?: string;
  penilaiNama?: string;
  penilaiNip?: string;
  penilaiTtdImage?: string;
  tanggalPenilaian?: string;
};

type PesertaProfile = {
  nama: string;
  posisi: string;
  asalJenis: string;
  asalNama: string;
  mulai: string;
  selesai: string;
  mentorNama: string;
  mentorNip: string;
};

/* ================= HELPERS ================= */

function formatIndoDate(raw?: string): string {
  if (!raw || raw === "-") return "-";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getPredikatFromNilai(nilai?: number | null): string {
  if (typeof nilai !== "number" || isNaN(nilai)) return "";
  if (nilai >= 91) return "Sangat Baik";
  if (nilai >= 76) return "Baik";
  if (nilai >= 61) return "Cukup";
  return "Kurang";
}

function formatScoreCell(nilai?: number | null): string {
  if (typeof nilai !== "number" || isNaN(nilai)) return "-";
  return Number.isInteger(nilai) ? String(nilai) : nilai.toFixed(2);
}

type LoadedLogoInfo = {
  dataUrl: string;
  width: number;
  height: number;
};

async function loadImageAsDataUrl(src: string): Promise<LoadedLogoInfo | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width || 100;
        const h = img.naturalHeight || img.height || 100;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          width: w,
          height: h,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export default function PenilaianAkhirPage() {
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [isPkpa, setIsPkpa] = useState(false);
  const [peserta, setPeserta] = useState<PesertaProfile>({
    nama: "Peserta Magang",
    posisi: "Peserta Magang BBPOM",
    asalJenis: "Universitas / Sekolah",
    asalNama: "-",
    mulai: "-",
    selesai: "-",
    mentorNama: "-",
    mentorNip: "",
  });
  const [penilaian, setPenilaian] = useState<PenilaianAkhirData | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") ?? "";
      if (!token) return;

      let email = "";
      let detectedPkpa = false;
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        email = payload?.email || "";
        detectedPkpa = isPkpaPeserta(payload);
      } catch {
        // ignore parse failure
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [pendRes, penilaianRes] = await Promise.all([
        email
          ? fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/pendaftaran/cek?email=${encodeURIComponent(email)}`,
              { headers },
            ).catch(() => null)
          : Promise.resolve(null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/penilaian-akhir/me`, {
          headers,
        }).catch(() => null),
      ]);

      if (pendRes && pendRes.ok) {
        const pendJson = await pendRes.json().catch(() => null);
        const found = (
          pendJson?.peserta as
            | Array<{
                email?: string;
                nama?: string;
                posisi?: string;
                jurusan?: string;
                kategoriMagang?: string;
                asal?: { jenis?: string; nama?: string };
                tanggalMulaiMagang?: string;
                tanggalSelesaiMagang?: string;
                mentor?: { name?: string; nip?: string };
                mentorNama?: string;
              }>
            | undefined
        )?.find((p) => p.email?.toLowerCase() === email.toLowerCase());
        if (found) {
          detectedPkpa = detectedPkpa || isPkpaPeserta(found);
          setPeserta({
            nama: found.nama || "Peserta Magang",
            posisi: found.posisi || "Peserta Magang BBPOM",
            asalJenis: found.asal?.jenis || "Universitas / Sekolah",
            asalNama: found.asal?.nama || "-",
            mulai: found.tanggalMulaiMagang || "-",
            selesai: found.tanggalSelesaiMagang || "-",
            mentorNama: found.mentor?.name || found.mentorNama || "-",
            mentorNip: found.mentor?.nip || "",
          });
        }
      }
      setIsPkpa(detectedPkpa);

      if (penilaianRes && penilaianRes.ok) {
        const penilaianJson = await penilaianRes.json().catch(() => null);
        setPenilaian(penilaianJson?.penilaian || null);
      } else {
        setPenilaian(null);
      }
    } catch {
      setPenilaian(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Hitung rata-rata otomatis jika ada komponen yang terisi
  const computedSummary = useMemo(() => {
    if (!penilaian) {
      return {
        hasAnyScore: false,
        rataRata: null as number | null,
        keterangan: "",
      };
    }

    const scores = [
      penilaian.kehadiranTaatJadwal?.nilai,
      penilaian.sikapKerja?.nilai,
      penilaian.penguasaanMateri?.nilai,
      penilaian.praktikKerja?.nilai,
      penilaian.inisiatifKomunikasi?.nilai,
    ].filter((v): v is number => typeof v === "number" && !isNaN(v));

    const rataRata =
      typeof penilaian.nilaiRataRata === "number" &&
      !isNaN(penilaian.nilaiRataRata)
        ? penilaian.nilaiRataRata
        : scores.length > 0
          ? Number(
              (scores.reduce((acc, s) => acc + s, 0) / scores.length).toFixed(
                2,
              ),
            )
          : null;

    const keterangan =
      penilaian.keteranganRataRata || getPredikatFromNilai(rataRata);

    return {
      hasAnyScore: scores.length > 0 || rataRata !== null,
      rataRata,
      keterangan,
    };
  }, [penilaian]);

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const marginLeft = 20;
      const pageWidth = 210;
      const contentWidth = pageWidth - marginLeft * 2; // 170mm
      let y = 14;

      // Kop Resmi BBPOM + Logo BPOM
      const logoInfo =
        (await loadImageAsDataUrl("/images/assets-new/logo-bpom.png")) ||
        (await loadImageAsDataUrl("/images/footer/BPOM.png"));

      if (logoInfo) {
        const targetH = 19;
        const targetW = (logoInfo.width / logoInfo.height) * targetH;
        doc.addImage(logoInfo.dataUrl, "PNG", marginLeft, y, targetW, targetH);
      }

      const kopCenterX = pageWidth / 2 + 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(
        "BALAI BESAR PENGAWAS OBAT DAN MAKANAN",
        kopCenterX,
        y + 5.5,
        { align: "center" },
      );
      doc.setFontSize(10.5);
      doc.text("DI PALEMBANG", kopCenterX, y + 11, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.2);
      doc.text(
        "Jl. Pangeran Ratu, 5 Ulu, Kec. Seberang Ulu I, Kota Palembang, Sumatera Selatan 30254",
        kopCenterX,
        y + 16.5,
        { align: "center" },
      );

      y += 22;
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.7);
      doc.line(marginLeft, y, pageWidth - marginLeft, y);
      doc.setLineWidth(0.25);
      doc.line(marginLeft, y + 1.1, pageWidth - marginLeft, y + 1.1);
      y += 9;

      // Judul Resmi (PKPA: 4 baris, Reguler: 3 baris)
      doc.setFont("times", "bold");
      doc.setFontSize(11);
      const titleLines = isPkpa
        ? [
            "LEMBAR PENILAIAN",
            "PRAKTIK KERJA PROFESI APOTEKER",
            "PROGRAM PENDIDIKAN PROFESI",
            "DI BADAN PENGAWAS OBAT DAN MAKANAN RI",
          ]
        : [
            "LEMBAR PENILAIAN",
            "PRAKTIK KERJA LAPANGAN (PKL)/MAGANG",
            "DI BADAN PENGAWAS OBAT DAN MAKANAN RI",
          ];
      titleLines.forEach((line) => {
        doc.text(line, pageWidth / 2, y, { align: "center" });
        y += 5;
      });
      y += 5;

      // Identitas Peserta
      const infoRows: Array<[string, string]> = isPkpa
        ? [
            ["Nama", peserta.nama],
            ["Universitas", peserta.asalNama || "-"],
            ["Unit Kerja PKPA", peserta.posisi],
          ]
        : [
            ["Nama", peserta.nama],
            [peserta.asalJenis || "Universitas", peserta.asalNama || "-"],
            ["Unit Kerja PKL/Magang", peserta.posisi],
            [
              "Periode Magang",
              `${formatIndoDate(peserta.mulai)} - ${formatIndoDate(peserta.selesai)}`,
            ],
          ];

      const colonOffset = 44;
      const valOffset = 48;
      doc.setFontSize(10.5);
      infoRows.forEach(([label, value]) => {
        doc.setFont("times", "normal");
        doc.text(label, marginLeft, y);
        doc.text(":", marginLeft + colonOffset, y);
        const valLines = doc.splitTextToSize(value, contentWidth - valOffset);
        doc.text(valLines, marginLeft + valOffset, y);
        y += Math.max(1, valLines.length) * 5.2;
      });
      y += 3;

      // Tabel Penilaian (Total = 170mm)
      const colWidths = [12, 80, 26, 52];
      const tableRows: Array<{
        no: string;
        rincian: string;
        nilai: string;
        keterangan: string;
        bold?: boolean;
      }> = [
        {
          no: "No",
          rincian: "Rincian",
          nilai: "Nilai",
          keterangan: "Keterangan",
          bold: true,
        },
        {
          no: "1",
          rincian: "Kedisiplinan dan Sikap Kerja",
          nilai: "",
          keterangan: "",
        },
        {
          no: "",
          rincian: "A. Kehadiran dan Taat Jadwal",
          nilai: penilaian?.kehadiranTaatJadwal
            ? formatScoreCell(penilaian.kehadiranTaatJadwal.nilai)
            : "",
          keterangan: penilaian?.kehadiranTaatJadwal?.keterangan || "",
        },
        {
          no: "",
          rincian: "B. Sikap Kerja",
          nilai: penilaian?.sikapKerja
            ? formatScoreCell(penilaian.sikapKerja.nilai)
            : "",
          keterangan: penilaian?.sikapKerja?.keterangan || "",
        },
        {
          no: "2",
          rincian: "Kemampuan",
          nilai: "",
          keterangan: "",
        },
        {
          no: "",
          rincian: "A. Penguasaan Materi",
          nilai: penilaian?.penguasaanMateri
            ? formatScoreCell(penilaian.penguasaanMateri.nilai)
            : "",
          keterangan: penilaian?.penguasaanMateri?.keterangan || "",
        },
        {
          no: "",
          rincian: "B. Praktik Kerja",
          nilai: penilaian?.praktikKerja
            ? formatScoreCell(penilaian.praktikKerja.nilai)
            : "",
          keterangan: penilaian?.praktikKerja?.keterangan || "",
        },
        {
          no: "",
          rincian: "C. Inisiatif dan Hubungan Kerja/Komunikasi",
          nilai: penilaian?.inisiatifKomunikasi
            ? formatScoreCell(penilaian.inisiatifKomunikasi.nilai)
            : "",
          keterangan: penilaian?.inisiatifKomunikasi?.keterangan || "",
        },
        {
          no: "",
          rincian: "Nilai Rata-Rata",
          nilai:
            computedSummary.rataRata !== null
              ? formatScoreCell(computedSummary.rataRata)
              : "",
          keterangan: computedSummary.keterangan || "",
        },
      ];

      doc.setFontSize(10);
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(isPkpa ? 0.35 : 0.25);

      tableRows.forEach((row, idx) => {
        doc.setFont("times", row.bold ? "bold" : "normal");
        const rincianLines = doc.splitTextToSize(
          row.rincian,
          colWidths[1] - 5,
        );
        const ketLines = doc.splitTextToSize(
          row.keterangan || "",
          colWidths[3] - 5,
        );
        const maxLines = Math.max(1, rincianLines.length, ketLines.length);
        const rowHeight = Math.max(7.2, maxLines * 4.6 + 2.6);

        let x = marginLeft;
        const cells = [row.no, rincianLines, row.nilai, ketLines];
        cells.forEach((cellContent, cIdx) => {
          const w = colWidths[cIdx];
          doc.rect(x, y, w, rowHeight, "S");

          if (
            cIdx === 0 ||
            cIdx === 2 ||
            (idx === 0 && (cIdx === 1 || cIdx === 3))
          ) {
            doc.text(
              String(cellContent),
              x + w / 2,
              y + rowHeight / 2 + 1.4,
              { align: "center" },
            );
          } else {
            doc.text(cellContent as string[], x + 2.5, y + 4.8);
          }
          x += w;
        });

        y += rowHeight;
      });

      y += 6;

      // Acuan Nilai (format rapi sejajar)
      doc.setFont("times", "normal");
      doc.setFontSize(10);
      doc.text("Nilai :", marginLeft, y);
      y += 5;

      const scaleRows: Array<[string, string]> = [
        ["91-100", ": Sangat Baik"],
        ["76-90", ": Baik"],
        ["61-75", ": Cukup"],
        ["< 61", ": Kurang"],
      ];
      scaleRows.forEach(([range, label]) => {
        doc.text(range, marginLeft, y);
        doc.text(label, marginLeft + 24, y);
        y += 4.8;
      });

      y += 1.5;

      // Kesan & Saran
      doc.text("Kesan", marginLeft, y);
      doc.text(":", marginLeft + 24, y);
      if (penilaian?.kesan) {
        const kesanLines = doc.splitTextToSize(
          penilaian.kesan,
          contentWidth - 28,
        );
        doc.text(kesanLines, marginLeft + 27, y);
        y += Math.max(1, kesanLines.length) * 5 + 4;
      } else {
        y += 10;
      }

      doc.text("Saran", marginLeft, y);
      doc.text(":", marginLeft + 24, y);
      if (penilaian?.saran) {
        const saranLines = doc.splitTextToSize(
          penilaian.saran,
          contentWidth - 28,
        );
        doc.text(saranLines, marginLeft + 27, y);
        y += Math.max(1, saranLines.length) * 5 + 10;
      } else {
        y += 16;
      }

      // Blok Tanda Tangan + Cap BBPOM di kanan bawah (Reguler & PKPA)
      const signX = pageWidth - marginLeft - 62;
      const dateStr = penilaian?.tanggalPenilaian
        ? formatIndoDate(penilaian.tanggalPenilaian)
        : new Date().toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
      doc.setFont("times", "normal");
      doc.text(`Palembang, ${dateStr}`, signX, y);
      y += 5;
      doc.text(
        isPkpa ? "Pembimbing Unit PKPA," : "Pembimbing Unit PKL/Magang,",
        signX,
        y,
      );
      const signLabelY = y;
      y += 22;

      const [capInfo, ttdInfo] = await Promise.all([
        loadImageAsDataUrl("/images/assets-new/cap.png"),
        penilaian?.penilaiTtdImage?.startsWith("data:image/png")
          ? loadImageAsDataUrl(penilaian.penilaiTtdImage)
          : Promise.resolve(null),
      ]);

      if (capInfo) {
        const capH = 24;
        const capW = (capInfo.width / capInfo.height) * capH;
        const capX = signX - 20;
        const capY = signLabelY + 0.5;
        doc.addImage(capInfo.dataUrl, "PNG", capX, capY, capW, capH);
      }

      if (ttdInfo) {
        const maxTtdW = 46;
        const maxTtdH = 17;
        const ratio = Math.min(
          maxTtdW / ttdInfo.width,
          maxTtdH / ttdInfo.height,
        );
        const drawW = ttdInfo.width * ratio;
        const drawH = ttdInfo.height * ratio;
        const drawX = signX + Math.max(0, (maxTtdW - drawW) / 2);
        const drawY = signLabelY + 2.5 + Math.max(0, (maxTtdH - drawH) / 2);
        doc.addImage(ttdInfo.dataUrl, "PNG", drawX, drawY, drawW, drawH);
      }

      const signName =
        penilaian?.penilaiNama ||
        (peserta.mentorNama && peserta.mentorNama !== "-"
          ? peserta.mentorNama
          : "                              ");
      doc.text(`( ${signName} )`, signX, y);
      y += 5;
      const signNip =
        penilaian?.penilaiNip?.trim() ||
        (peserta.mentorNip && peserta.mentorNip !== "-"
          ? peserta.mentorNip
          : "");
      doc.text(signNip ? `NIP. ${signNip}` : "NIP.", signX, y);

      const filePrefix = isPkpa
        ? "Penilaian_Akhir_PKPA"
        : "Penilaian_Akhir_Magang";
      const safeFileName = `${filePrefix}_${peserta.nama.replace(/[^a-zA-Z0-9]+/g, "_")}.pdf`;
      doc.save(safeFileName);
      showToast.success("Penilaian Akhir Magang (PDF) berhasil diunduh");
    } catch (error) {
      console.error("Gagal membuat PDF penilaian:", error);
      showToast.error("Gagal mengunduh file PDF Penilaian Akhir Magang");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return <PesertaDashboardSkeleton />;
  }

  const assessmentGroups = [
    {
      no: "1",
      title: "Kedisiplinan dan Sikap Kerja",
      items: [
        {
          label: "A. Kehadiran dan Taat Jadwal",
          data: penilaian?.kehadiranTaatJadwal,
        },
        {
          label: "B. Sikap Kerja",
          data: penilaian?.sikapKerja,
        },
      ],
    },
    {
      no: "2",
      title: "Kemampuan",
      items: [
        {
          label: "A. Penguasaan Materi",
          data: penilaian?.penguasaanMateri,
        },
        {
          label: "B. Praktik Kerja",
          data: penilaian?.praktikKerja,
        },
        {
          label: "C. Inisiatif dan Hubungan Kerja/Komunikasi",
          data: penilaian?.inisiatifKomunikasi,
        },
      ],
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ================= 1. HEADER & BACK BUTTON ================= */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pt-1">
        <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
          <Link
            href="/dashboard/peserta/laporan-akhir"
            aria-label="Kembali ke Perkembangan Magang"
            className="print:hidden mt-0.5 w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition shrink-0 shadow-2xs"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-snug">
                Penilaian Akhir Magang
              </h1>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                  isPkpa
                    ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800"
                    : "bg-blue-50 text-[#1D64F2] border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                }`}
              >
                {isPkpa ? "Khusus PKPA" : "Reguler"}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Rekapitulasi nilai kedisiplinan, sikap kerja, dan kemampuan selama
              program magang di BBPOM di Palembang.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={downloadingPdf}
          className="print:hidden w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl bg-[#1D64F2] hover:bg-blue-700 disabled:opacity-60 text-sm font-bold text-white transition shrink-0 shadow-2xs"
        >
          <Download className="w-4 h-4" />
          <span>{downloadingPdf ? "Mengunduh..." : "Unduh PDF"}</span>
        </button>
      </div>

      {/* ================= 2. BANNER STATUS PENILAIAN ================= */}
      {computedSummary.hasAnyScore ? (
        <div className="rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Penilaian Akhir Telah Diterbitkan
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5 leading-relaxed">
                Dinilai oleh{" "}
                <b>{penilaian?.penilaiNama || peserta.mentorNama}</b>
                {penilaian?.tanggalPenilaian
                  ? ` pada ${formatIndoDate(penilaian.tanggalPenilaian)}`
                  : ""}
                .
              </p>
            </div>
          </div>

          {computedSummary.rataRata !== null && (
            <div className="w-full sm:w-auto flex sm:block items-center justify-between px-3.5 py-2 sm:py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 text-center shrink-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Nilai Rata-Rata
              </p>
              <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatScoreCell(computedSummary.rataRata)}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="print:hidden rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 p-3.5 sm:p-4 flex items-start gap-2.5 sm:gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
              Menunggu Penilaian Akhir dari Mentor
            </p>
            <p className="text-xs text-amber-800/90 dark:text-amber-300 mt-0.5 leading-relaxed">
              Nilai akhir magang Anda belum diinput oleh Mentor / Admin. Di
              bawah ini adalah rincian komponen penilaian akhir magang yang
              akan dinilai.
            </p>
          </div>
        </div>
      )}

      {/* ================= 3. INFORMASI PESERTA ================= */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-3.5 sm:p-5 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 text-sm">
          <div className="flex items-start gap-2.5">
            <User className="w-4 h-4 text-[#1D64F2] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nama Peserta
              </p>
              <p className="font-bold text-slate-900 dark:text-white break-words leading-snug">
                {peserta.nama}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Briefcase className="w-4 h-4 text-[#1D64F2] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fungsi / Bidang Penempatan
              </p>
              <p className="font-bold text-slate-900 dark:text-white break-words leading-snug">
                {peserta.posisi}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Calendar className="w-4 h-4 text-[#1D64F2] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Periode Magang
              </p>
              <p className="font-bold text-slate-900 dark:text-white leading-snug">
                {formatIndoDate(peserta.mulai)} –{" "}
                {formatIndoDate(peserta.selesai)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <UserCheck className="w-4 h-4 text-[#1D64F2] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mentor Pembimbing
              </p>
              <p className="font-bold text-slate-900 dark:text-white break-words leading-snug">
                {penilaian?.penilaiNama || peserta.mentorNama}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 4. TABEL PENILAIAN AKHIR MAGANG ================= */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-3.5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <ClipboardList className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Daftar Nilai Akhir Magang
            </h2>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${
              computedSummary.hasAnyScore
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
            }`}
          >
            {computedSummary.hasAnyScore ? "Sudah Dinilai" : "Belum Dinilai"}
          </span>
        </div>

        {/* MOBILE VIEW (< sm): Card list rapi tanpa scroll horizontal */}
        <div className="sm:hidden space-y-3">
          {assessmentGroups.map((group) => (
            <div
              key={group.no}
              className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900/40"
            >
              <div className="px-3.5 py-2.5 bg-slate-100/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                  {group.no}
                </span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug">
                  {group.title}
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {group.items.map((item) => (
                  <div key={item.label} className="p-3 space-y-2">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-100 leading-snug">
                      {item.label}
                    </p>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Nilai:
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                          {item.data ? formatScoreCell(item.data.nilai) : "-"}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 text-right">
                        {item.data?.keterangan || "-"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Mobile Nilai Rata-Rata Summary */}
          <div className="rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/60 dark:bg-blue-950/30 p-3.5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                Nilai Rata-Rata
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {computedSummary.keterangan || "Belum dinilai"}
              </p>
            </div>
            <span className="text-lg font-extrabold text-[#1D64F2] dark:text-blue-400 tabular-nums shrink-0">
              {computedSummary.rataRata !== null
                ? formatScoreCell(computedSummary.rataRata)
                : "-"}
            </span>
          </div>
        </div>

        {/* DESKTOP VIEW (>= sm): Tabel berbingkai resmi */}
        <div className="hidden sm:block overflow-x-auto rounded-lg border border-slate-300 dark:border-slate-600">
          <table className="w-full border-collapse text-sm text-slate-800 dark:text-slate-100">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/80 text-slate-900 dark:text-white font-bold">
                <th className="border-b border-r border-slate-300 dark:border-slate-600 px-3 py-2.5 text-center w-12">
                  No
                </th>
                <th className="border-b border-r border-slate-300 dark:border-slate-600 px-3.5 py-2.5 text-center">
                  Rincian
                </th>
                <th className="border-b border-r border-slate-300 dark:border-slate-600 px-3 py-2.5 text-center w-24 sm:w-28">
                  Nilai
                </th>
                <th className="border-b border-slate-300 dark:border-slate-600 px-3.5 py-2.5 text-center w-44 sm:w-52">
                  Keterangan
                </th>
              </tr>
            </thead>
            <tbody>
              {assessmentGroups.map((group) => (
                <Fragment key={group.no}>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/70 font-bold text-slate-900 dark:text-white">
                    <td className="border-b border-r border-slate-300 dark:border-slate-600 px-3 py-2.5 text-center">
                      {group.no}
                    </td>
                    <td className="border-b border-r border-slate-300 dark:border-slate-600 px-3.5 py-2.5">
                      {group.title}
                    </td>
                    <td className="border-b border-r border-slate-300 dark:border-slate-600 px-3 py-2.5 text-center" />
                    <td className="border-b border-slate-300 dark:border-slate-600 px-3.5 py-2.5" />
                  </tr>
                  {group.items.map((item) => (
                    <tr
                      key={item.label}
                      className="bg-white dark:bg-slate-800/40"
                    >
                      <td className="border-b border-r border-slate-300 dark:border-slate-600 px-3 py-2.5 text-center" />
                      <td className="border-b border-r border-slate-300 dark:border-slate-600 px-3.5 py-2.5 leading-snug">
                        {item.label}
                      </td>
                      <td className="border-b border-r border-slate-300 dark:border-slate-600 px-3 py-2.5 text-center font-semibold tabular-nums">
                        {item.data ? formatScoreCell(item.data.nilai) : ""}
                      </td>
                      <td className="border-b border-slate-300 dark:border-slate-600 px-3.5 py-2.5 text-slate-600 dark:text-slate-300">
                        {item.data?.keterangan || ""}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}

              {/* NILAI RATA-RATA */}
              <tr className="bg-slate-100/90 dark:bg-slate-900/70 font-bold text-slate-900 dark:text-white">
                <td className="border-r border-slate-300 dark:border-slate-600 px-3 py-3 text-center" />
                <td className="border-r border-slate-300 dark:border-slate-600 px-3.5 py-3">
                  Nilai Rata-Rata
                </td>
                <td className="border-r border-slate-300 dark:border-slate-600 px-3 py-3 text-center text-[#1D64F2] dark:text-blue-400 tabular-nums">
                  {computedSummary.rataRata !== null
                    ? formatScoreCell(computedSummary.rataRata)
                    : ""}
                </td>
                <td className="px-3.5 py-3">
                  {computedSummary.keterangan || ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Acuan Nilai & Kesan / Saran */}
        <div className="pt-1 space-y-3 sm:space-y-4 text-sm text-slate-800 dark:text-slate-200">
          {/* Acuan Nilai (Horizontal) */}
          <div className="rounded-xl bg-slate-50/90 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700 p-3 sm:p-4 space-y-2">
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              Nilai :
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                {
                  range: "91-100",
                  label: "Sangat Baik",
                  colorClass: "text-emerald-700 dark:text-emerald-400",
                },
                {
                  range: "76-90",
                  label: "Baik",
                  colorClass: "text-[#1D64F2] dark:text-blue-400",
                },
                {
                  range: "61-75",
                  label: "Cukup",
                  colorClass: "text-amber-700 dark:text-amber-400",
                },
                {
                  range: "< 61",
                  label: "Kurang",
                  colorClass: "text-red-600 dark:text-red-400",
                },
              ].map((item) => (
                <div
                  key={item.range}
                  className="flex items-center justify-between gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700"
                >
                  <span className="font-medium text-slate-600 dark:text-slate-300 tabular-nums shrink-0">
                    {item.range}
                  </span>
                  <span className={`font-bold text-right ${item.colorClass}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Kesan & Saran */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden">
            <div className="p-3.5 sm:p-4 space-y-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Kesan :
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line break-words leading-relaxed min-h-[2rem]">
                {penilaian?.kesan || "-"}
              </p>
            </div>

            <div className="p-3.5 sm:p-4 space-y-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Saran :
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line break-words leading-relaxed min-h-[2rem]">
                {penilaian?.saran || "-"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
