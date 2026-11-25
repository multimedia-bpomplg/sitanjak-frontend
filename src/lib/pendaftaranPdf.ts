import { isPkpaPeserta } from "@/lib/pesertaKategori";
import type { PendaftaranExtraFilterState } from "@/components/pendaftaran/PendaftaranFilterToolbar";

export type PendaftaranPdfRow = {
  pendaftaranId: string;
  kategori: string;
  createdAt?: string;
  statusPendaftaran: string;
  statusMagang: string;
  nama: string;
  email: string;
  wa?: string;
  asalJenis?: string;
  asalNama?: string;
  jurusan?: string;
  posisi: string;
  mentorName?: string;
  tanggalMulaiMagang?: string;
  tanggalSelesaiMagang?: string;
  jawabanAdmin?: string;
};

export type ExportPendaftaranPdfOptions = {
  title?: string;
  subtitle?: string;
  roleLabel?: string;
  printedByName?: string;
  printedByDetail?: string;
  filterSummary?: string;
  fileName?: string;
  totalPendaftaran?: number;
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
  return new Date().toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export function buildPendaftaranFilterSummary(params: {
  statusFilter: string;
  extraFilters: PendaftaranExtraFilterState;
  mentorOptions?: Array<{ value: string; label: string }>;
  search?: string;
}): string {
  const parts: string[] = [];

  if (params.statusFilter && params.statusFilter !== "Semua") {
    parts.push(`Status: ${params.statusFilter}`);
  }
  if (params.extraFilters.kategori === "sendiri") {
    parts.push("Tipe: Individu");
  } else if (params.extraFilters.kategori === "bersama") {
    parts.push("Tipe: Kelompok");
  }
  if (params.extraFilters.mentor && params.extraFilters.mentor !== "semua") {
    if (params.extraFilters.mentor === "tanpa_mentor") {
      parts.push("Mentor: Belum Ditetapkan");
    } else {
      const mLabel =
        params.mentorOptions?.find(
          (m) => m.value === params.extraFilters.mentor,
        )?.label || params.extraFilters.mentor;
      parts.push(`Mentor: ${mLabel}`);
    }
  }

  if (params.extraFilters.date) {
    parts.push(`Tanggal Daftar: ${formatIndoDate(params.extraFilters.date)}`);
  } else {
    if (params.extraFilters.month) {
      parts.push(
        `Bulan: ${MONTH_LABELS[params.extraFilters.month] || params.extraFilters.month}`,
      );
    }
    if (params.extraFilters.year) {
      parts.push(`Tahun: ${params.extraFilters.year}`);
    }
  }

  const q = params.search?.trim();
  if (q) {
    parts.push(`Pencarian: "${q}"`);
  }

  return parts.length > 0 ? parts.join(" | ") : "Semua Data Pendaftaran";
}

export function buildPendaftaranPdfRows<
  TItem extends {
    _id: string;
    kategori: string;
    createdAt?: string;
    status: string;
    jawabanAdmin?: string;
    peserta: Array<{
      nama?: string;
      email?: string;
      wa?: string;
      asal?: { jenis?: string; nama?: string };
      jurusan?: string;
      posisi?: string;
      tanggalMulaiMagang?: string;
      tanggalSelesaiMagang?: string;
    }>;
  },
>(
  items: TItem[],
  resolveMentorName: (peserta: TItem["peserta"][number]) => string | undefined,
  resolveMagangStatus: (
    item: TItem,
    peserta: TItem["peserta"][number],
  ) => string,
): PendaftaranPdfRow[] {
  const rows: PendaftaranPdfRow[] = [];
  for (const item of items) {
    for (const p of item.peserta) {
      rows.push({
        pendaftaranId: item._id,
        kategori: item.kategori,
        createdAt: item.createdAt,
        statusPendaftaran: item.status,
        statusMagang: resolveMagangStatus(item, p),
        nama: p.nama || "-",
        email: p.email || "-",
        wa: p.wa || "-",
        asalJenis: p.asal?.jenis,
        asalNama: p.asal?.nama,
        jurusan: p.jurusan,
        posisi: p.posisi || "-",
        mentorName: resolveMentorName(p),
        tanggalMulaiMagang: p.tanggalMulaiMagang,
        tanggalSelesaiMagang: p.tanggalSelesaiMagang,
        jawabanAdmin: item.jawabanAdmin,
      });
    }
  }
  return rows;
}

function getStatusColors(status: string): {
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
    case "Ditolak":
      return {
        fill: [255, 241, 242],
        border: [254, 205, 211],
        text: [190, 18, 60],
      };
    case "Sedang Diproses":
      return {
        fill: [240, 249, 255],
        border: [186, 230, 253],
        text: [3, 105, 161],
      };
    default:
      return {
        fill: [255, 251, 235],
        border: [253, 230, 138],
        text: [180, 83, 9],
      };
  }
}

export async function downloadPendaftaranPdf(
  rows: PendaftaranPdfRow[],
  options: ExportPendaftaranPdfOptions = {},
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
    "Sistem Informasi Tahapan dan Jangkauan Magang Akademik (SITANJAK) • Layanan Pendaftaran Magang Resmi",
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
    options.title || "LAPORAN REKAPITULASI DATA PENDAFTARAN MAGANG",
    kopCenterX,
    y,
    { align: "center" },
  );
  y += 4.5;

  if (options.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(options.subtitle, kopCenterX, y, { align: "center" });
    y += 4.5;
  } else {
    y += 1.5;
  }

  const printedByText = options.printedByName
    ? options.roleLabel
      ? `${options.roleLabel}: ${options.printedByName}${options.printedByDetail ? ` (${options.printedByDetail})` : ""}`
      : options.printedByName
    : options.roleLabel || "SITANJAK BBPOM Palembang";

  const uniquePendaftaranMap = new Map<string, string>();
  const individuIds = new Set<string>();
  const kelompokIds = new Set<string>();
  for (const r of rows) {
    uniquePendaftaranMap.set(r.pendaftaranId, r.statusPendaftaran);
    if (r.kategori === "bersama") kelompokIds.add(r.pendaftaranId);
    else individuIds.add(r.pendaftaranId);
  }

  const totalReg = options.totalPendaftaran ?? uniquePendaftaranMap.size;
  let countDisetujui = 0;
  let countProses = 0;
  let countDitolak = 0;
  uniquePendaftaranMap.forEach((st) => {
    if (st === "Disetujui") countDisetujui += 1;
    else if (st === "Ditolak") countDitolak += 1;
    else countProses += 1;
  });

  const metaLeftX = marginX + 3.5;
  const metaRightX = marginX + contentWidth / 2 + 4;
  const metaValWidth = contentWidth / 2 - 30;

  doc.setFontSize(8);
  const printedByLines = doc.splitTextToSize(printedByText, metaValWidth);
  const filterLines = doc.splitTextToSize(
    options.filterSummary || "Semua Data Pendaftaran",
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
  doc.text(`${formatPrintDateTimeWib()} WIB`, metaRightX + 24, metaRow1Y);

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
    `${totalReg} Berkas Pendaftaran (${rows.length} Calon Peserta)`,
    metaRightX + 24,
    metaRow2Y,
  );

  y += metaBoxHeight + 3.5;

  /* ================= RINGKASAN EKSEKUTIF ================= */
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
      label: "Total Pendaftaran",
      value: `${totalReg} Berkas`,
      sub: `${individuIds.size} Individu • ${kelompokIds.size} Kelompok`,
      fill: [248, 250, 252],
      border: [203, 213, 225],
      accent: [15, 23, 42],
    },
    {
      label: "Disetujui",
      value: `${countDisetujui} Berkas`,
      sub: "Lolos verifikasi administrasi",
      fill: [236, 253, 245],
      border: [167, 243, 208],
      accent: [4, 120, 87],
    },
    {
      label: "Menunggu / Diproses",
      value: `${countProses} Berkas`,
      sub: "Dalam antrean / tinjauan admin",
      fill: [255, 251, 235],
      border: [253, 230, 138],
      accent: [180, 83, 9],
    },
    {
      label: "Ditolak",
      value: `${countDitolak} Berkas`,
      sub: "Tidak memenuhi syarat / kuota",
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

    doc.setFontSize(9.5);
    doc.setTextColor(...kpi.accent);
    doc.text(kpi.value, x + kpiW - 3, y + 4.5, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, x + 3, y + 9.2);
  });

  y += kpiH + 4.5;

  /* ================= TABEL DATA PENDAFTARAN ================= */
  // Total = 10 + 30 + 56 + 50 + 48 + 38 + 37 = 269mm
  const cols = [
    { key: "no", label: "No", width: 10, align: "center" as const },
    { key: "daftar", label: "Tgl Daftar & Tipe", width: 30, align: "left" as const },
    { key: "peserta", label: "Nama Peserta & Kontak", width: 56, align: "left" as const },
    { key: "asal", label: "Asal Institusi & Jurusan", width: 50, align: "left" as const },
    { key: "posisi", label: "Posisi & Mentor", width: 48, align: "left" as const },
    { key: "periode", label: "Periode Magang", width: 38, align: "left" as const },
    { key: "status", label: "Status Pendaftaran", width: 37, align: "center" as const },
  ];

  const headerH = 8;

  const drawTableHeader = (startY: number) => {
    doc.setFillColor(3, 105, 161);
    doc.setDrawColor(2, 132, 199);
    doc.setLineWidth(0.25);
    doc.rect(marginX, startY, contentWidth, headerH, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.6);
    doc.setTextColor(255, 255, 255);

    let cursorX = marginX;
    cols.forEach((col, i) => {
      const textX =
        col.align === "center" ? cursorX + col.width / 2 : cursorX + 2.5;
      doc.text(col.label, textX, startY + 5.2, {
        align: col.align,
      });
      if (i < cols.length - 1) {
        doc.setDrawColor(14, 165, 233);
        doc.line(
          cursorX + col.width,
          startY + 1.5,
          cursorX + col.width,
          startY + headerH - 1.5,
        );
      }
      cursorX += col.width;
    });
    return startY + headerH;
  };

  y = drawTableHeader(y);

  const lineH = 3.5;

  rows.forEach((row, index) => {
    const programLabel = isPkpaPeserta({ jurusan: row.jurusan })
      ? "PKPA"
      : "Reguler";
    const tipeLabel = row.kategori === "bersama" ? "Kelompok" : "Individu";
    const tglDaftar = formatIndoDate(row.createdAt, true);

    const col1Lines = [String(index + 1)];

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.4);

    const daftarLines = doc.splitTextToSize(
      `${tglDaftar}\n${tipeLabel} (${programLabel})`,
      cols[1].width - 4.5,
    ) as string[];

    const pesertaContact = [row.email || "-", row.wa ? `WA: ${row.wa}` : ""]
      .filter(Boolean)
      .join("\n");
    const namaLines = doc.splitTextToSize(
      row.nama || "-",
      cols[2].width - 4.5,
    ) as string[];
    const kontakLines = doc.splitTextToSize(
      pesertaContact,
      cols[2].width - 4.5,
    ) as string[];

    const institusiText = row.asalNama
      ? `${row.asalJenis ? `${row.asalJenis} - ` : ""}${row.asalNama}`
      : "-";
    const institusiLines = doc.splitTextToSize(
      institusiText,
      cols[3].width - 4.5,
    ) as string[];
    const jurusanLines = doc.splitTextToSize(
      `Jurusan: ${row.jurusan || "-"}`,
      cols[3].width - 4.5,
    ) as string[];

    const posisiLines = doc.splitTextToSize(
      row.posisi || "-",
      cols[4].width - 4.5,
    ) as string[];
    const mentorLines = doc.splitTextToSize(
      `Mentor: ${row.mentorName || "Belum ditetapkan"}`,
      cols[4].width - 4.5,
    ) as string[];

    const mulaiStr = formatIndoDate(row.tanggalMulaiMagang, true);
    const selesaiStr = formatIndoDate(row.tanggalSelesaiMagang, true);
    const periodeLines = doc.splitTextToSize(
      `${mulaiStr}\ns.d. ${selesaiStr}`,
      cols[5].width - 4.5,
    ) as string[];

    const statusBadgeH = 5.2;
    const statusSubLines = doc.splitTextToSize(
      row.statusMagang || "-",
      cols[6].width - 5,
    ) as string[];

    const colHeights = [
      col1Lines.length * lineH,
      daftarLines.length * lineH,
      (namaLines.length + kontakLines.length) * lineH + 0.6,
      (institusiLines.length + jurusanLines.length) * lineH + 0.6,
      (posisiLines.length + mentorLines.length) * lineH + 0.6,
      periodeLines.length * lineH,
      statusBadgeH + 1.5 + statusSubLines.length * 3.1,
    ];
    const rowH = Math.max(12, Math.max(...colHeights) + 4.2);

    if (y + rowH > bottomLimit) {
      doc.addPage();
      y = 14;
      y = drawTableHeader(y);
    }

    // Zebra background & row border
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.22);
    doc.rect(marginX, y, contentWidth, rowH, "FD");

    // Vertical column dividers
    let divX = marginX;
    for (let i = 0; i < cols.length - 1; i++) {
      divX += cols[i].width;
      doc.setDrawColor(226, 232, 240);
      doc.line(divX, y, divX, y + rowH);
    }

    const baseTextY = y + 4.4;
    let colX = marginX;

    // 1. No
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(col1Lines[0], colX + cols[0].width / 2, baseTextY, {
      align: "center",
    });
    colX += cols[0].width;

    // 2. Tgl Daftar & Tipe
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.3);
    doc.setTextColor(15, 23, 42);
    doc.text(daftarLines, colX + 2.2, baseTextY);
    colX += cols[1].width;

    // 3. Nama Peserta & Kontak
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.6);
    doc.setTextColor(15, 23, 42);
    doc.text(namaLines, colX + 2.2, baseTextY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(
      kontakLines,
      colX + 2.2,
      baseTextY + namaLines.length * lineH + 0.5,
    );
    colX += cols[2].width;

    // 4. Asal Institusi & Jurusan
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.3);
    doc.setTextColor(15, 23, 42);
    doc.text(institusiLines, colX + 2.2, baseTextY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(
      jurusanLines,
      colX + 2.2,
      baseTextY + institusiLines.length * lineH + 0.5,
    );
    colX += cols[3].width;

    // 5. Posisi & Mentor
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.3);
    doc.setTextColor(3, 105, 161);
    doc.text(posisiLines, colX + 2.2, baseTextY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(
      mentorLines,
      colX + 2.2,
      baseTextY + posisiLines.length * lineH + 0.5,
    );
    colX += cols[4].width;

    // 6. Periode Magang
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(15, 23, 42);
    doc.text(periodeLines, colX + 2.2, baseTextY);
    colX += cols[5].width;

    // 7. Status Badge + Status Magang
    const stColors = getStatusColors(row.statusPendaftaran);
    const badgeW = cols[6].width - 6;
    const badgeX = colX + 3;
    const badgeY = y + 2.3;
    doc.setFillColor(...stColors.fill);
    doc.setDrawColor(...stColors.border);
    doc.setLineWidth(0.25);
    doc.roundedRect(badgeX, badgeY, badgeW, statusBadgeH, 1.2, 1.2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.9);
    doc.setTextColor(...stColors.text);
    doc.text(
      row.statusPendaftaran,
      badgeX + badgeW / 2,
      badgeY + 3.6,
      { align: "center" },
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      statusSubLines,
      badgeX + badgeW / 2,
      badgeY + statusBadgeH + 3.4,
      { align: "center" },
    );

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
  doc.text(
    `${options.roleLabel || "Pengelola"} Program Magang,`,
    signX,
    y + 4.2,
  );
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

  const defaultFileName = `Laporan-Pendaftaran-Magang-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(options.fileName || defaultFileName);
}
