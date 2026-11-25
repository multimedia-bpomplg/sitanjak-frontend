import type { ManageEvaluasiItem } from "@/components/Laporan/EvaluasiReviewModal";
import { isPkpaPeserta } from "@/lib/pesertaKategori";

export type ExportEvaluasiRekapPdfOptions = {
  role: "mentor" | "admin" | "superadmin";
  printedByName?: string;
  printedByDetail?: string;
  filterSummary?: string;
  fileName?: string;
  summary: {
    totalPeserta: number;
    menunggu: number;
    revisi: number;
    disetujui: number;
    belumMengisi: number;
  };
};

type LoadedLogoInfo = {
  dataUrl: string;
  width: number;
  height: number;
};

async function loadImageAsDataUrl(src: string): Promise<LoadedLogoInfo | null> {
  if (typeof window === "undefined") return null;
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

async function loadFirstAvailableImage(
  sources: string[],
): Promise<LoadedLogoInfo | null> {
  for (const src of sources) {
    const loaded = await loadImageAsDataUrl(src);
    if (loaded) return loaded;
  }
  return null;
}

const MONTH_LABELS: Record<string, string> = {
  "1": "Januari",
  "2": "Februari",
  "3": "Maret",
  "4": "April",
  "5": "Mei",
  "6": "Juni",
  "7": "Juli",
  "8": "Agustus",
  "9": "September",
  "10": "Oktober",
  "11": "November",
  "12": "Desember",
};

function formatIndoDate(dateStr?: string | null): string {
  if (!dateStr || dateStr === "-") return "-";
  const trimmed = dateStr.trim();
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  const d = isoMatch
    ? new Date(
        Number(isoMatch[1]),
        Number(isoMatch[2]) - 1,
        Number(isoMatch[3]),
      )
    : new Date(trimmed);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPrintDateTimeWib(): string {
  return `${new Date().toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  })} WIB`;
}

function computeAvgScore(scores: Array<number | undefined>): string {
  const valid = scores.filter(
    (s): s is number => typeof s === "number" && !Number.isNaN(s),
  );
  if (valid.length === 0) return "-";
  const avg = valid.reduce((acc, n) => acc + n, 0) / valid.length;
  return `${avg.toFixed(1)}/5`;
}

function getStatusColors(status?: string | null): {
  fill: [number, number, number];
  border: [number, number, number];
  text: [number, number, number];
} {
  switch (status) {
    case "Disetujui":
      return {
        fill: [236, 253, 245],
        border: [167, 243, 208],
        text: [4, 120, 87],
      };
    case "Revisi":
      return {
        fill: [255, 241, 242],
        border: [254, 205, 211],
        text: [190, 18, 60],
      };
    case "Menunggu":
      return {
        fill: [255, 251, 235],
        border: [253, 230, 138],
        text: [180, 83, 9],
      };
    default:
      return {
        fill: [241, 245, 249],
        border: [203, 213, 225],
        text: [71, 85, 105],
      };
  }
}

export function buildEvaluasiFilterSummary(params: {
  activeFilter: string;
  isAdminScope: boolean;
  mentorFilter: string;
  formasiFilter: string;
  formasiOptions: Array<{ value: string; label: string }>;
  jurusanFilter: string;
  jurusanOptions: Array<{ value: string; label: string }>;
  instansiFilter: string;
  instansiOptions: Array<{ value: string; label: string }>;
  yearFilter?: string;
  monthFilter?: string;
  dateFilter?: string;
  searchQuery?: string;
}): string {
  const parts: string[] = [];

  if (params.activeFilter === "menunggu") parts.push("Status: Menunggu");
  else if (params.activeFilter === "revisi") parts.push("Status: Revisi");
  else if (params.activeFilter === "disetujui") parts.push("Status: Disetujui");
  else if (params.activeFilter === "belum") parts.push("Status: Belum Mengisi");

  if (params.isAdminScope && params.mentorFilter !== "all") {
    parts.push(`Mentor: ${params.mentorFilter}`);
  }

  if (params.isAdminScope && params.formasiFilter !== "all") {
    const fLabel =
      params.formasiOptions.find((f) => f.value === params.formasiFilter)
        ?.label || params.formasiFilter;
    parts.push(`Formasi: ${fLabel}`);
  }

  if (!params.isAdminScope && params.jurusanFilter !== "all") {
    const jLabel =
      params.jurusanOptions.find((j) => j.value === params.jurusanFilter)
        ?.label || params.jurusanFilter;
    parts.push(`Jurusan: ${jLabel}`);
  }

  if (!params.isAdminScope && params.instansiFilter !== "all") {
    const iLabel =
      params.instansiOptions.find((i) => i.value === params.instansiFilter)
        ?.label || params.instansiFilter;
    parts.push(`Instansi: ${iLabel}`);
  }

  if (params.dateFilter) {
    parts.push(`Tanggal: ${formatIndoDate(params.dateFilter)}`);
  } else {
    if (params.monthFilter) {
      parts.push(
        `Bulan: ${MONTH_LABELS[params.monthFilter] || params.monthFilter}`,
      );
    }
    if (params.yearFilter) {
      parts.push(`Tahun: ${params.yearFilter}`);
    }
  }

  const q = params.searchQuery?.trim();
  if (q) {
    parts.push(`Pencarian: "${q}"`);
  }

  return parts.length > 0
    ? parts.join(" | ")
    : "Semua Data Evaluasi & Surat Pernyataan";
}

export async function downloadRekapEvaluasiPdf(
  items: ManageEvaluasiItem[],
  options: ExportEvaluasiRekapPdfOptions,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 269mm
  const bottomLimit = pageHeight - 16;

  const [logoBpom, logoSitanjak] = await Promise.all([
    loadFirstAvailableImage([
      "/images/assets-new/logo-bpom.png",
      "/images/footer/BPOM.png",
    ]),
    loadFirstAvailableImage([
      "/images/icons/sitanjak.png",
      "/images/assets-new/sitanjak-bgputih.png",
    ]),
  ]);

  let y = 11;
  const kopCenterX = pageWidth / 2;

  /* ================= KOP SURAT RESMI ================= */
  if (logoBpom) {
    const targetH = 18;
    const rawW = (logoBpom.width / logoBpom.height) * targetH;
    const targetW = Math.min(24, rawW);
    const drawH = (targetW / logoBpom.width) * logoBpom.height;
    const logoY = y + (19 - drawH) / 2;
    doc.addImage(logoBpom.dataUrl, "PNG", marginX + 2, logoY, targetW, drawH);
  }

  if (logoSitanjak) {
    const targetH = 17;
    const rawW = (logoSitanjak.width / logoSitanjak.height) * targetH;
    const targetW = Math.min(28, rawW);
    const drawH = (targetW / logoSitanjak.width) * logoSitanjak.height;
    const logoY = y + (19 - drawH) / 2;
    doc.addImage(
      logoSitanjak.dataUrl,
      "PNG",
      pageWidth - marginX - targetW - 2,
      logoY,
      targetW,
      drawH,
    );
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "BADAN PENGAWAS OBAT DAN MAKANAN REPUBLIK INDONESIA",
    kopCenterX,
    y + 4,
    { align: "center" },
  );

  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(
    "BALAI BESAR PENGAWAS OBAT DAN MAKANAN DI PALEMBANG",
    kopCenterX,
    y + 9.5,
    { align: "center" },
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Jl. Pangeran Ratu, 5 Ulu, Kec. Seberang Ulu I, Kota Palembang, Sumatera Selatan 30254",
    kopCenterX,
    y + 14.2,
    { align: "center" },
  );

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.6);
  doc.setTextColor(2, 132, 199);
  doc.text(
    "Sistem Informasi Tahapan dan Jangkauan Magang Akademik (SITANJAK) • Rekapitulasi Evaluasi & Surat Pernyataan",
    kopCenterX,
    y + 18.2,
    { align: "center" },
  );

  y += 21.5;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.line(marginX, y, pageWidth - marginX, y);
  doc.setLineWidth(0.25);
  doc.line(marginX, y + 1.2, pageWidth - marginX, y + 1.2);
  y += 6.5;

  /* ================= JUDUL & METADATA LAPORAN ================= */
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(
    "LAPORAN REKAPITULASI EVALUASI & SURAT PERNYATAAN PESERTA MAGANG",
    kopCenterX,
    y,
    { align: "center" },
  );
  y += 4.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Balai Besar Pengawas Obat dan Makanan di Palembang",
    kopCenterX,
    y,
    { align: "center" },
  );
  y += 4.5;

  const roleLabel =
    options.role === "superadmin"
      ? "Superadmin"
      : options.role === "mentor"
        ? "Mentor Pembimbing"
        : "Admin";

  const printedByText = options.printedByName
    ? `${roleLabel}: ${options.printedByName}${options.printedByDetail ? ` (${options.printedByDetail})` : ""}`
    : roleLabel;

  const metaLeftX = marginX + 3.5;
  const metaRightX = marginX + contentWidth / 2 + 4;
  const metaValWidth = contentWidth / 2 - 30;

  doc.setFontSize(8);
  const printedByLines = doc.splitTextToSize(printedByText, metaValWidth);
  const filterLines = doc.splitTextToSize(
    options.filterSummary || "Semua Data Evaluasi & Surat Pernyataan",
    metaValWidth,
  );
  const metaBoxHeight =
    Math.max(printedByLines.length, 1) * 3.8 +
    Math.max(filterLines.length, 1) * 3.8 +
    5;

  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(186, 230, 253);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, y, contentWidth, metaBoxHeight, 1.8, 1.8, "FD");

  const metaRow1Y = y + 4.3;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(3, 105, 161);
  doc.text("Dicetak Oleh", metaLeftX, metaRow1Y);
  doc.text("Tanggal Cetak", metaRightX, metaRow1Y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(printedByLines, metaLeftX + 23, metaRow1Y);
  doc.text(formatPrintDateTimeWib(), metaRightX + 24, metaRow1Y);

  const metaRow2Y =
    metaRow1Y + Math.max(printedByLines.length, 1) * 3.8 + 1;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(3, 105, 161);
  doc.text("Filter Aktif", metaLeftX, metaRow2Y);
  doc.text("Jumlah Data", metaRightX, metaRow2Y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(filterLines, metaLeftX + 23, metaRow2Y);
  doc.setFont("helvetica", "bold");
  doc.text(
    `${items.length} Peserta Ditampilkan`,
    metaRightX + 24,
    metaRow2Y,
  );

  y += metaBoxHeight + 3.5;

  /* ================= RINGKASAN EKSEKUTIF KPI ================= */
  const kpiGap = 3.5;
  const kpiW = (contentWidth - kpiGap * 3) / 4;
  const kpiH = 12;
  const kpis: Array<{
    label: string;
    value: string;
    sub: string;
    fill: [number, number, number];
    border: [number, number, number];
    accent: [number, number, number];
  }> = [
    {
      label: "Total Peserta",
      value: `${options.summary.totalPeserta}`,
      sub: `${options.summary.belumMengisi} belum mengisi formulir`,
      fill: [248, 250, 252],
      border: [203, 213, 225],
      accent: [15, 23, 42],
    },
    {
      label: "Menunggu Penindakan",
      value: `${options.summary.menunggu}`,
      sub: "Menunggu persetujuan mentor",
      fill: [255, 251, 235],
      border: [253, 230, 138],
      accent: [180, 83, 9],
    },
    {
      label: "Perlu Revisi",
      value: `${options.summary.revisi}`,
      sub: "Dikembalikan untuk perbaikan",
      fill: [255, 241, 242],
      border: [254, 205, 211],
      accent: [190, 18, 60],
    },
    {
      label: "Disetujui",
      value: `${options.summary.disetujui}`,
      sub: "Evaluasi & pernyataan sah",
      fill: [236, 253, 245],
      border: [167, 243, 208],
      accent: [4, 120, 87],
    },
  ];

  kpis.forEach((kpi, idx) => {
    const x = marginX + idx * (kpiW + kpiGap);
    doc.setFillColor(...kpi.fill);
    doc.setDrawColor(...kpi.border);
    doc.setLineWidth(0.28);
    doc.roundedRect(x, y, kpiW, kpiH, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105);
    doc.text(kpi.label, x + 3, y + 4.2);

    doc.setFontSize(10);
    doc.setTextColor(...kpi.accent);
    doc.text(kpi.value, x + kpiW - 3, y + 4.6, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, x + 3, y + 9.2);
  });

  y += kpiH + 4.5;

  /* ================= TABEL REKAPITULASI EVALUASI ================= */
  // Total = 9 + 48 + 48 + 30 + 48 + 46 + 40 = 269mm
  const cols = [
    { label: "No", width: 9, align: "center" as const },
    { label: "Peserta & NIM/Program", width: 48, align: "left" as const },
    { label: "Institusi, Formasi & Jurusan", width: 48, align: "left" as const },
    { label: "Mentor", width: 30, align: "left" as const },
    { label: "Evaluasi Fasilitator", width: 48, align: "left" as const },
    { label: "Evaluasi Penyelenggara", width: 46, align: "left" as const },
    { label: "Status & Tanggal Kirim", width: 40, align: "center" as const },
  ];

  const drawTableHeader = (startY: number): number => {
    const headerH = 8;
    doc.setFillColor(3, 105, 161);
    doc.setDrawColor(2, 132, 199);
    doc.setLineWidth(0.25);
    doc.rect(marginX, startY, contentWidth, headerH, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.3);
    doc.setTextColor(255, 255, 255);

    let cursorX = marginX;
    cols.forEach((col, i) => {
      const textX =
        col.align === "center" ? cursorX + col.width / 2 : cursorX + 2.2;
      doc.text(col.label, textX, startY + 5.1, { align: col.align });
      if (i < cols.length - 1) {
        doc.setDrawColor(14, 165, 233);
        doc.line(
          cursorX + col.width,
          startY + 1.4,
          cursorX + col.width,
          startY + headerH - 1.4,
        );
      }
      cursorX += col.width;
    });
    return startY + headerH;
  };

  y = drawTableHeader(y);
  const lineH = 3.4;

  items.forEach((item, idx) => {
    const ev = item.evaluasi;
    const programTag = isPkpaPeserta(item) ? "PKPA" : "Reguler";

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);

    const namaLines = doc.splitTextToSize(
      `${item.nama || "-"} (${programTag})`,
      cols[1].width - 4.4,
    ) as string[];
    const extraPeserta = [
      item.email || "",
      ev?.suratPernyataan?.nim ? `NIM/NISN: ${ev.suratPernyataan.nim}` : "",
    ]
      .filter(Boolean)
      .join(" • ");
    const subPesertaLines = doc.splitTextToSize(
      extraPeserta || "-",
      cols[1].width - 4.4,
    ) as string[];

    const instLines = doc.splitTextToSize(
      item.asal?.nama || "-",
      cols[2].width - 4.4,
    ) as string[];
    const posJurusan = [
      item.posisi || "-",
      item.jurusan && item.jurusan !== "-" ? item.jurusan : "",
    ]
      .filter(Boolean)
      .join(" • ");
    const posLines = doc.splitTextToSize(
      posJurusan,
      cols[2].width - 4.4,
    ) as string[];

    const mentorLines = doc.splitTextToSize(
      item.mentorName && item.mentorName !== "-"
        ? item.mentorName
        : "Belum ditetapkan",
      cols[3].width - 4.4,
    ) as string[];

    const fasilitatorText = ev
      ? [
          `${ev.fasilitator?.nama || "-"} (Rata-rata: ${computeAvgScore([
            ev.fasilitator?.skor1,
            ev.fasilitator?.skor2,
            ev.fasilitator?.skor3,
            ev.fasilitator?.skor4,
            ev.fasilitator?.skor5,
          ])})`,
          ev.fasilitator?.saran && ev.fasilitator.saran !== "-"
            ? `Saran: ${ev.fasilitator.saran}`
            : "",
        ]
          .filter(Boolean)
          .join("\n")
      : "Belum mengisi evaluasi";
    const fasilitatorLines = doc.splitTextToSize(
      fasilitatorText,
      cols[4].width - 4.4,
    ) as string[];

    const penyelenggaraText = ev
      ? [
          `Rata-rata: ${computeAvgScore([
            ev.penyelenggara?.skor1,
            ev.penyelenggara?.skor2,
            ev.penyelenggara?.skor3,
            ev.penyelenggara?.skor4,
            ev.penyelenggara?.skor5,
          ])} • Bermanfaat: ${ev.penyelenggara?.bermanfaat || "-"}`,
          ev.penyelenggara?.masukan && ev.penyelenggara.masukan !== "-"
            ? `Masukan: ${ev.penyelenggara.masukan}`
            : "",
        ]
          .filter(Boolean)
          .join("\n")
      : "-";
    const penyelenggaraLines = doc.splitTextToSize(
      penyelenggaraText,
      cols[5].width - 4.4,
    ) as string[];

    const submittedText = ev?.submittedAt
      ? `Kirim: ${formatIndoDate(ev.submittedAt)}`
      : "Belum dikirim";
    const noteLines = ev?.mentorNote
      ? (doc.splitTextToSize(
          `Catatan: ${ev.mentorNote}`,
          cols[6].width - 4.4,
        ) as string[])
      : [];

    const rowH = Math.max(
      14,
      Math.max(
        (namaLines.length + subPesertaLines.length) * lineH + 4,
        (instLines.length + posLines.length) * lineH + 4,
        mentorLines.length * lineH + 4,
        fasilitatorLines.length * lineH + 4,
        penyelenggaraLines.length * lineH + 4,
        (noteLines.length + 1) * lineH + 10.5,
      ),
    );

    if (y + rowH > bottomLimit) {
      doc.addPage();
      y = 14;
      y = drawTableHeader(y);
    }

    if (idx % 2 === 1) doc.setFillColor(248, 250, 252);
    else doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.22);
    doc.rect(marginX, y, contentWidth, rowH, "FD");

    let divX = marginX;
    for (let i = 0; i < cols.length - 1; i++) {
      divX += cols[i].width;
      doc.line(divX, y, divX, y + rowH);
    }

    const textY = y + 4.1;
    let cx = marginX;

    // 1. No
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105);
    doc.text(String(idx + 1), cx + cols[0].width / 2, textY, {
      align: "center",
    });
    cx += cols[0].width;

    // 2. Peserta & NIM/Program
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(15, 23, 42);
    doc.text(namaLines, cx + 2.2, textY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.6);
    doc.setTextColor(71, 85, 105);
    doc.text(subPesertaLines, cx + 2.2, textY + namaLines.length * lineH + 0.4);
    cx += cols[1].width;

    // 3. Institusi, Formasi & Jurusan
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(3, 105, 161);
    doc.text(instLines, cx + 2.2, textY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.6);
    doc.setTextColor(71, 85, 105);
    doc.text(posLines, cx + 2.2, textY + instLines.length * lineH + 0.4);
    cx += cols[2].width;

    // 4. Mentor
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.9);
    doc.setTextColor(51, 65, 85);
    doc.text(mentorLines, cx + 2.2, textY);
    cx += cols[3].width;

    // 5. Evaluasi Fasilitator
    doc.setFont("helvetica", ev ? "normal" : "italic");
    doc.setFontSize(6.7);
    doc.setTextColor(ev ? 15 : 148, ev ? 23 : 163, ev ? 42 : 184);
    doc.text(fasilitatorLines, cx + 2.2, textY);
    cx += cols[4].width;

    // 6. Evaluasi Penyelenggara
    doc.setFont("helvetica", ev ? "normal" : "italic");
    doc.setFontSize(6.7);
    doc.setTextColor(ev ? 15 : 148, ev ? 23 : 163, ev ? 42 : 184);
    doc.text(penyelenggaraLines, cx + 2.2, textY);
    cx += cols[5].width;

    // 7. Status & Tanggal Kirim
    const statusLabel = ev ? ev.status : "Belum Mengisi";
    const sc = getStatusColors(ev?.status ?? null);
    const bW = cols[6].width - 6;
    const bH = 5.2;
    const bX = cx + 3;
    const bY = y + 2.6;
    doc.setFillColor(...sc.fill);
    doc.setDrawColor(...sc.border);
    doc.roundedRect(bX, bY, bW, bH, 1.2, 1.2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(...sc.text);
    doc.text(statusLabel, bX + bW / 2, bY + 3.55, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.4);
    doc.setTextColor(71, 85, 105);
    doc.text(submittedText, cx + cols[6].width / 2, bY + bH + 3.2, {
      align: "center",
    });

    if (noteLines.length > 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(6.2);
      doc.setTextColor(100, 116, 139);
      doc.text(noteLines, cx + 2.2, bY + bH + 6.4);
    }

    y += rowH;
  });

  /* ================= BLOK PENGESAHAN ================= */
  const signBlockHeight = 32;
  if (y + signBlockHeight + 6 > bottomLimit) {
    doc.addPage();
    y = 18;
  } else {
    y += 7;
  }

  const signX = pageWidth - marginX - 72;
  const todayIndo = formatIndoDate(
    new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }),
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Palembang, ${todayIndo}`, signX, y);
  doc.text(`${roleLabel} Program Magang,`, signX, y + 4.2);
  doc.text("BBPOM di Palembang", signX, y + 8.2);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(
    options.printedByName || "Tim Pengelola Magang SITANJAK",
    signX,
    y + 24,
  );
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.25);
  doc.line(signX, y + 25.2, signX + 66, y + 25.2);

  /* ================= FOOTER HALAMAN ================= */
  const totalPages = doc.getNumberOfPages();
  for (let pageIdx = 1; pageIdx <= totalPages; pageIdx++) {
    doc.setPage(pageIdx);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.line(marginX, pageHeight - 11.5, pageWidth - marginX, pageHeight - 11.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.4);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "Dokumen resmi dihasilkan oleh SITANJAK — Balai Besar POM di Palembang",
      marginX,
      pageHeight - 7.5,
    );
    doc.text(
      `Halaman ${pageIdx} dari ${totalPages}`,
      pageWidth - marginX,
      pageHeight - 7.5,
      { align: "right" },
    );
  }

  const dateStamp = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Jakarta",
  });
  const defaultFileName = `Laporan-Rekap-Evaluasi-Pernyataan-${options.role}-${dateStamp}.pdf`;
  doc.save(options.fileName || defaultFileName);
}
