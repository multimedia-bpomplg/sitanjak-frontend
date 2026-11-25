import type {
  ManageAbsensiItem,
  ManageAbsensiSummary,
  ManageRekapPesertaItem,
  ManageRole,
} from "@/components/absensi/types";

export type ExportAbsensiPdfOptions = {
  role: ManageRole;
  printedByName?: string;
  printedByDetail?: string;
  filterSummary?: string;
  fileName?: string;
  summary: ManageAbsensiSummary;
};

type LoadedLogoInfo = {
  dataUrl: string;
  width: number;
  height: number;
};

const MONTH_LABELS: Record<string, string> = {
  "01": "Januari",
  "02": "Februari",
  "03": "Maret",
  "04": "April",
  "05": "Mei",
  "06": "Juni",
  "07": "Juli",
  "08": "Agustus",
  "09": "September",
  "10": "Oktober",
  "11": "November",
  "12": "Desember",
};

const AREA_LABELS: Record<string, string> = {
  inside: "Di Area BBPOM",
  outside: "Luar Area BBPOM",
  wfh: "Mode WFH",
  izin: "Status Izin",
  missed: "Tidak Absen (0%)",
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

function formatIndoDate(dateStr?: string, shortMonth = false): string {
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
    month: shortMonth ? "short" : "long",
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

function getScoreColors(score: number): {
  fill: [number, number, number];
  border: [number, number, number];
  text: [number, number, number];
} {
  if (score >= 90) {
    return {
      fill: [236, 253, 245],
      border: [167, 243, 208],
      text: [4, 120, 87],
    };
  }
  if (score >= 75) {
    return {
      fill: [255, 251, 235],
      border: [253, 230, 138],
      text: [180, 83, 9],
    };
  }
  return {
    fill: [255, 241, 242],
    border: [254, 205, 211],
    text: [190, 18, 60],
  };
}

export function buildAbsensiFilterSummary(params: {
  mentorFilter: string;
  mentorOptions: Array<{ value: string; label: string }>;
  formasiFilter: string;
  formasiOptions: Array<{ value: string; label: string }>;
  yearFilter: string;
  monthFilter: string;
  dateFilter: string;
  areaFilter: string;
  search?: string;
}): string {
  const parts: string[] = [];

  if (params.mentorFilter && params.mentorFilter !== "semua") {
    const label =
      params.mentorOptions.find((m) => m.value === params.mentorFilter)
        ?.label || params.mentorFilter;
    parts.push(`Mentor: ${label}`);
  }
  if (params.formasiFilter && params.formasiFilter !== "semua") {
    const label =
      params.formasiOptions.find((f) => f.value === params.formasiFilter)
        ?.label || params.formasiFilter;
    parts.push(`Formasi: ${label}`);
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
  if (params.areaFilter) {
    parts.push(
      `Status/Area: ${AREA_LABELS[params.areaFilter] || params.areaFilter}`,
    );
  }
  const q = params.search?.trim();
  if (q) {
    parts.push(`Pencarian: "${q}"`);
  }

  return parts.length > 0 ? parts.join(" | ") : "Semua Data Absensi Kehadiran";
}

export async function downloadAbsensiPdf(
  harianItems: ManageAbsensiItem[],
  rekapItems: ManageRekapPesertaItem[],
  options: ExportAbsensiPdfOptions,
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
    "Sistem Informasi Tahapan dan Jangkauan Magang Akademik (SITANJAK) • Monitoring Kehadiran Peserta",
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
    "LAPORAN REKAPITULASI ABSENSI KEHADIRAN PESERTA MAGANG",
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
    options.filterSummary || "Semua Data Absensi Kehadiran",
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
  doc.text("Cakupan Data", metaRightX, metaRow2Y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(filterLines, metaLeftX + 23, metaRow2Y);
  doc.setFont("helvetica", "bold");
  doc.text(
    `${rekapItems.length} Peserta • ${harianItems.length} Catatan Harian`,
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
      label: "Total Catatan Absen",
      value: `${options.summary.totalRecords}`,
      sub: `Rata-rata Nilai: ${options.summary.averageDailyScore}%`,
      fill: [248, 250, 252],
      border: [203, 213, 225],
      accent: [15, 23, 42],
    },
    {
      label: "Masuk Tepat Waktu",
      value: `${options.summary.tepatWaktuCount}`,
      sub: "Skor 100% (<= batas masuk)",
      fill: [236, 253, 245],
      border: [167, 243, 208],
      accent: [4, 120, 87],
    },
    {
      label: "Terlambat / Pulang Awal",
      value: `${options.summary.terlambatCount}`,
      sub: "Melewati batas waktu absen",
      fill: [255, 251, 235],
      border: [253, 230, 138],
      accent: [180, 83, 9],
    },
    {
      label: "Di Luar Area BBPOM",
      value: `${options.summary.outsideBpomCount}`,
      sub: "Absensi GPS di luar kantor",
      fill: [255, 241, 242],
      border: [254, 205, 211],
      accent: [190, 18, 60],
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

  y += kpiH + 5;

  type TableColumn = {
    label: string;
    width: number;
    align: "left" | "center";
  };

  const drawTableHeader = (cols: TableColumn[], startY: number): number => {
    const headerH = 7.8;
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
      doc.text(col.label, textX, startY + 5, { align: col.align });
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

  /* ================= BAGIAN 1: REKAP NILAI PER PESERTA ================= */
  if (rekapItems.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(12, 74, 110);
    doc.text("A. REKAPITULASI NILAI & KEDISIPLINAN PESERTA", marginX, y);
    y += 3;

    // Total = 10 + 52 + 48 + 38 + 30 + 19 + 24 + 20 + 28 = 269mm
    const rekapCols: TableColumn[] = [
      { label: "No", width: 10, align: "center" },
      { label: "Nama Peserta & Kontak", width: 52, align: "left" },
      { label: "Formasi & Institusi", width: 48, align: "left" },
      { label: "Mentor Pembimbing", width: 38, align: "left" },
      { label: "Kehadiran", width: 30, align: "center" },
      { label: "Alpa (0%)", width: 19, align: "center" },
      { label: "Tepat / Telat", width: 24, align: "center" },
      { label: "Luar Area", width: 20, align: "center" },
      { label: "Rata-rata Nilai", width: 28, align: "center" },
    ];

    y = drawTableHeader(rekapCols, y);
    const lineH = 3.4;

    rekapItems.forEach((r, idx) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.1);

      const namaLines = doc.splitTextToSize(
        r.namaPeserta || "-",
        rekapCols[1].width - 4.4,
      ) as string[];
      const emailLines = doc.splitTextToSize(
        r.email || "-",
        rekapCols[1].width - 4.4,
      ) as string[];

      const posisiLines = doc.splitTextToSize(
        r.posisi || "-",
        rekapCols[2].width - 4.4,
      ) as string[];
      const instLines = doc.splitTextToSize(
        r.institusi || "-",
        rekapCols[2].width - 4.4,
      ) as string[];

      const mentorLines = doc.splitTextToSize(
        r.mentorName || "Belum Ditentukan",
        rekapCols[3].width - 4.4,
      ) as string[];

      const extraMode = [
        (r.wfhCount ?? 0) > 0 ? `${r.wfhCount} WFH` : "",
        (r.izinCount ?? 0) > 0 ? `${r.izinCount} Izin` : "",
      ]
        .filter(Boolean)
        .join(", ");

      const rowH = Math.max(
        11.5,
        Math.max(
          (namaLines.length + emailLines.length) * lineH + 3.6,
          (posisiLines.length + instLines.length) * lineH + 3.6,
          mentorLines.length * lineH + 4,
        ),
      );

      if (y + rowH > bottomLimit) {
        doc.addPage();
        y = 14;
        y = drawTableHeader(rekapCols, y);
      }

      if (idx % 2 === 1) doc.setFillColor(248, 250, 252);
      else doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.22);
      doc.rect(marginX, y, contentWidth, rowH, "FD");

      let divX = marginX;
      for (let i = 0; i < rekapCols.length - 1; i++) {
        divX += rekapCols[i].width;
        doc.line(divX, y, divX, y + rowH);
      }

      const textY = y + 4.1;
      let cx = marginX;

      // No
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.3);
      doc.setTextColor(71, 85, 105);
      doc.text(String(idx + 1), cx + rekapCols[0].width / 2, textY, {
        align: "center",
      });
      cx += rekapCols[0].width;

      // Peserta
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.4);
      doc.setTextColor(15, 23, 42);
      doc.text(namaLines, cx + 2.2, textY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(71, 85, 105);
      doc.text(emailLines, cx + 2.2, textY + namaLines.length * lineH + 0.4);
      cx += rekapCols[1].width;

      // Formasi & Institusi
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.1);
      doc.setTextColor(3, 105, 161);
      doc.text(posisiLines, cx + 2.2, textY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(71, 85, 105);
      doc.text(instLines, cx + 2.2, textY + posisiLines.length * lineH + 0.4);
      cx += rekapCols[2].width;

      // Mentor
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.1);
      doc.setTextColor(15, 23, 42);
      doc.text(mentorLines, cx + 2.2, textY);
      cx += rekapCols[3].width;

      // Kehadiran
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.2);
      doc.text(`${r.totalHari ?? 0} hari`, cx + rekapCols[4].width / 2, textY, {
        align: "center",
      });
      if (extraMode) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.4);
        doc.setTextColor(100, 116, 139);
        doc.text(extraMode, cx + rekapCols[4].width / 2, textY + 3.7, {
          align: "center",
        });
      }
      cx += rekapCols[4].width;

      // Alpa
      const alpaVal = r.tidakAbsen ?? 0;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.2);
      if (alpaVal > 0) doc.setTextColor(190, 18, 60);
      else doc.setTextColor(100, 116, 139);
      doc.text(`${alpaVal} hr`, cx + rekapCols[5].width / 2, textY, {
        align: "center",
      });
      cx += rekapCols[5].width;

      // Tepat / Telat
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.2);
      doc.setTextColor(15, 23, 42);
      doc.text(
        `${r.tepatWaktuMasuk ?? 0} / ${r.telatMasuk ?? 0}`,
        cx + rekapCols[6].width / 2,
        textY,
        { align: "center" },
      );
      cx += rekapCols[6].width;

      // Luar Area
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(
        `${r.luarAreaBpom ?? 0}`,
        cx + rekapCols[7].width / 2,
        textY,
        { align: "center" },
      );
      cx += rekapCols[7].width;

      // Rata-rata Nilai Badge
      const avgScore = r.avgDailyScore ?? 0;
      const sc = getScoreColors(avgScore);
      const bW = 16;
      const bH = 5.2;
      const bX = cx + (rekapCols[8].width - bW) / 2;
      const bY = y + (rowH - bH) / 2;
      doc.setFillColor(...sc.fill);
      doc.setDrawColor(...sc.border);
      doc.roundedRect(bX, bY, bW, bH, 1.2, 1.2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.2);
      doc.setTextColor(...sc.text);
      doc.text(`${avgScore}%`, bX + bW / 2, bY + 3.6, { align: "center" });

      y += rowH;
    });

    y += 7;
  }

  /* ================= BAGIAN 2: LOG ABSENSI HARIAN ================= */
  if (harianItems.length > 0) {
    if (y + 26 > bottomLimit) {
      doc.addPage();
      y = 14;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(12, 74, 110);
    doc.text("B. RINCIAN CATATAN ABSENSI HARIAN", marginX, y);
    y += 3;

    // Total = 10 + 25 + 52 + 34 + 34 + 44 + 44 + 26 = 269mm
    const harianCols: TableColumn[] = [
      { label: "No", width: 10, align: "center" },
      { label: "Tanggal", width: 25, align: "center" },
      { label: "Peserta & Formasi", width: 52, align: "left" },
      { label: "Mentor", width: 34, align: "left" },
      { label: "Mode & Lokasi", width: 34, align: "center" },
      { label: "Check-In (Masuk)", width: 44, align: "left" },
      { label: "Check-Out (Pulang)", width: 44, align: "left" },
      { label: "Nilai Harian", width: 26, align: "center" },
    ];

    y = drawTableHeader(harianCols, y);
    const lineH = 3.4;

    harianItems.forEach((row, idx) => {
      const isMissed =
        row.attendanceMode === "tidak_absen" || row.isVirtualMissed;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);

      const namaLines = doc.splitTextToSize(
        row.namaPeserta || "-",
        harianCols[2].width - 4.4,
      ) as string[];
      const posLines = doc.splitTextToSize(
        row.posisi || "-",
        harianCols[2].width - 4.4,
      ) as string[];
      const mentorLines = doc.splitTextToSize(
        row.mentorName || "Belum Ditentukan",
        harianCols[3].width - 4.4,
      ) as string[];

      const modeText = isMissed
        ? "Tidak Absen\n(Tanpa Record)"
        : row.attendanceMode === "izin"
          ? "Izin"
          : row.attendanceMode === "wfh"
            ? "WFH"
            : row.isAnyOutside
              ? "WFO • Luar Area"
              : "WFO • Di BBPOM";
      const modeLines = doc.splitTextToSize(
        modeText,
        harianCols[4].width - 4,
      ) as string[];

      const inText = isMissed
        ? "-"
        : row.attendanceMode === "izin"
          ? `Izin (${row.izinSubmittedWIB || "-"})`
          : row.checkIn
            ? `${row.checkIn.timeWIB} WIB (${row.checkIn.score}%)\n${row.checkIn.timeStatusLabel || ""}`
            : "Belum Check-In";
      const inLines = doc.splitTextToSize(
        inText,
        harianCols[5].width - 4.4,
      ) as string[];

      const outText = isMissed
        ? "-"
        : row.attendanceMode === "izin"
          ? row.izinNote || "Dengan Keterangan"
          : row.checkOut
            ? `${row.checkOut.timeWIB} WIB (${row.checkOut.score}%)\n${row.checkOut.timeStatusLabel || ""}`
            : "Belum Check-Out";
      const outLines = doc.splitTextToSize(
        outText,
        harianCols[6].width - 4.4,
      ) as string[];

      const rowH = Math.max(
        11.5,
        Math.max(
          (namaLines.length + posLines.length) * lineH + 3.6,
          mentorLines.length * lineH + 4,
          modeLines.length * lineH + 4,
          inLines.length * lineH + 4,
          outLines.length * lineH + 4,
        ),
      );

      if (y + rowH > bottomLimit) {
        doc.addPage();
        y = 14;
        y = drawTableHeader(harianCols, y);
      }

      if (idx % 2 === 1) doc.setFillColor(248, 250, 252);
      else doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.22);
      doc.rect(marginX, y, contentWidth, rowH, "FD");

      let divX = marginX;
      for (let i = 0; i < harianCols.length - 1; i++) {
        divX += harianCols[i].width;
        doc.line(divX, y, divX, y + rowH);
      }

      const textY = y + 4.1;
      let cx = marginX;

      // No
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.2);
      doc.setTextColor(71, 85, 105);
      doc.text(String(idx + 1), cx + harianCols[0].width / 2, textY, {
        align: "center",
      });
      cx += harianCols[0].width;

      // Tanggal
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(
        formatIndoDate(row.date, true),
        cx + harianCols[1].width / 2,
        textY,
        { align: "center" },
      );
      cx += harianCols[1].width;

      // Peserta & Formasi
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.3);
      doc.setTextColor(15, 23, 42);
      doc.text(namaLines, cx + 2.2, textY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.7);
      doc.setTextColor(3, 105, 161);
      doc.text(posLines, cx + 2.2, textY + namaLines.length * lineH + 0.4);
      cx += harianCols[2].width;

      // Mentor
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(mentorLines, cx + 2.2, textY);
      cx += harianCols[3].width;

      // Mode & Lokasi
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.9);
      if (isMissed) doc.setTextColor(190, 18, 60);
      else if (row.isAnyOutside) doc.setTextColor(180, 83, 9);
      else doc.setTextColor(4, 120, 87);
      doc.text(modeLines, cx + harianCols[4].width / 2, textY, {
        align: "center",
      });
      cx += harianCols[4].width;

      // Check-In
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.9);
      doc.setTextColor(15, 23, 42);
      doc.text(inLines, cx + 2.2, textY);
      cx += harianCols[5].width;

      // Check-Out
      doc.text(outLines, cx + 2.2, textY);
      cx += harianCols[6].width;

      // Nilai Harian Badge
      const score = row.dailyScore ?? 0;
      const sc = getScoreColors(score);
      const bW = 16;
      const bH = 5.2;
      const bX = cx + (harianCols[7].width - bW) / 2;
      const bY = y + (rowH - bH) / 2;
      doc.setFillColor(...sc.fill);
      doc.setDrawColor(...sc.border);
      doc.roundedRect(bX, bY, bW, bH, 1.2, 1.2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.1);
      doc.setTextColor(...sc.text);
      doc.text(`${score}%`, bX + bW / 2, bY + 3.6, { align: "center" });

      y += rowH;
    });
  }

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

  const defaultFileName = `Laporan-Absensi-Magang-${options.role}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(options.fileName || defaultFileName);
}
