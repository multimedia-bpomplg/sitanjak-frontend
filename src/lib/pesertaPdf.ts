import { isPkpaPeserta } from "@/lib/pesertaKategori";

export type PesertaPdfItem = {
  userId?: string | null;
  pendaftaranId?: string;
  pesertaId?: string;
  nama: string;
  email: string;
  wa?: string;
  posisi: string;
  jurusan?: string;
  kategoriMagang?: "PKPA" | "Reguler";
  kategori?: string;
  asal?: {
    jenis?: string;
    nama?: string;
  } | null;
  statusMagang?: string;
  phase?: string;
  jenisKelamin?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  tanggalMulaiMagang?: string;
  tanggalSelesaiMagang?: string;
  provinsi?: string;
  kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  alamatLengkap?: string;
  mentor?: {
    _id?: string;
    name?: string;
    email?: string;
    posisiMentor?: string;
  } | null;
};

export type ExportPesertaPdfOptions = {
  title?: string;
  subtitle?: string;
  roleLabel?: string;
  printedByName?: string;
  printedByDetail?: string;
  filterSummary?: string;
  fileName?: string;
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

function formatIndoDate(dateStr?: string): string {
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
  return new Date().toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

function resolveStatusLabel(p: PesertaPdfItem): string {
  switch (p.phase) {
    case "sedang_magang":
      return "Sedang Magang";
    case "belum_mulai":
      return "Belum Mulai";
    case "selesai":
      return "Selesai";
    case "tidak_magang":
      return "Tidak Magang";
    default:
      return p.statusMagang || "Aktif";
  }
}

function formatAsalInstitusi(asal?: PesertaPdfItem["asal"]): string {
  if (!asal?.nama) return "-";
  return asal.jenis ? `${asal.jenis} - ${asal.nama}` : asal.nama;
}

function formatBirthInfo(tempat?: string, tanggal?: string): string {
  const place = tempat?.trim();
  const dateFormatted = formatIndoDate(tanggal);
  if (place && dateFormatted !== "-") return `${place}, ${dateFormatted}`;
  if (place) return place;
  if (dateFormatted !== "-") return dateFormatted;
  return "-";
}

function formatWilayahDomisili(p: PesertaPdfItem): string {
  const parts = [p.kelurahan, p.kecamatan, p.kota, p.provinsi]
    .map((v) => v?.trim())
    .filter((v): v is string => Boolean(v));
  return parts.length > 0 ? parts.join(", ") : "-";
}

function formatMentorInfo(mentor?: PesertaPdfItem["mentor"]): string {
  if (!mentor?.name) return "Belum ditentukan";
  const parts = [mentor.name];
  if (mentor.posisiMentor) parts.push(`(${mentor.posisiMentor})`);
  return parts.join(" ");
}

type KeyValueRow = {
  label: string;
  value: string;
};

type PreparedRow = KeyValueRow & {
  lines: string[];
  height: number;
};

export async function downloadPesertaLengkapPdf(
  pesertaList: PesertaPdfItem[],
  options: ExportPesertaPdfOptions = {},
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  const contentWidth = pageWidth - marginX * 2; // 180mm
  const bottomLimit = pageHeight - 16;

  // Muat logo BPOM (kiri) & logo SITANJAK (kanan)
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

  let y = 12;

  /* ================= KOP SURAT ================= */
  const kopCenterX = pageWidth / 2;

  if (logoBpom) {
    const targetH = 16;
    const rawW = (logoBpom.width / logoBpom.height) * targetH;
    const targetW = Math.min(24, rawW);
    const drawH = (targetW / logoBpom.width) * logoBpom.height;
    const logoY = y + (18 - drawH) / 2;
    doc.addImage(logoBpom.dataUrl, "PNG", marginX, logoY, targetW, drawH);
  }

  if (logoSitanjak) {
    const targetH = 16;
    const rawW = (logoSitanjak.width / logoSitanjak.height) * targetH;
    const targetW = Math.min(26, rawW);
    const drawH = (targetW / logoSitanjak.width) * logoSitanjak.height;
    const logoY = y + (18 - drawH) / 2;
    doc.addImage(
      logoSitanjak.dataUrl,
      "PNG",
      pageWidth - marginX - targetW,
      logoY,
      targetW,
      drawH,
    );
  }

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("BALAI BESAR PENGAWAS OBAT DAN MAKANAN", kopCenterX, y + 4.5, {
    align: "center",
  });

  doc.setFontSize(10.5);
  doc.text("DI PALEMBANG", kopCenterX, y + 9.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Jl. Pangeran Ratu, 5 Ulu, Kec. Seberang Ulu I, Kota Palembang, Sumatera Selatan 30254",
    kopCenterX,
    y + 14,
    { align: "center" },
  );

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.6);
  doc.setTextColor(2, 132, 199);
  doc.text(
    "Sistem Informasi Tahapan dan Jangkauan Magang Akademik (SITANJAK)",
    kopCenterX,
    y + 18,
    { align: "center" },
  );

  y += 21.5;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.7);
  doc.line(marginX, y, pageWidth - marginX, y);
  doc.setLineWidth(0.25);
  doc.line(marginX, y + 1.1, pageWidth - marginX, y + 1.1);
  y += 7;

  /* ================= JUDUL & RINGKASAN EKSPOR ================= */
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.text(
    options.title || "DATA LENGKAP PESERTA MAGANG",
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

  // Metadata Box
  const printedByText = options.printedByName
    ? options.roleLabel
      ? `${options.roleLabel}: ${options.printedByName}${options.printedByDetail ? ` (${options.printedByDetail})` : ""}`
      : options.printedByName
    : options.roleLabel || "SITANJAK BBPOM Palembang";

  const metaLeftX = marginX + 3.5;
  const metaRightX = marginX + contentWidth / 2 + 3;
  const metaColWidth = contentWidth / 2 - 26;

  doc.setFontSize(8);
  const printedByLines = doc.splitTextToSize(printedByText, metaColWidth);
  const filterLines = doc.splitTextToSize(
    options.filterSummary || "Semua Peserta",
    metaColWidth,
  );
  const metaBoxHeight =
    Math.max(printedByLines.length, 1) * 3.8 +
    Math.max(filterLines.length, 1) * 3.8 +
    5.5;

  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(186, 230, 253);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, y, contentWidth, metaBoxHeight, 1.8, 1.8, "FD");

  const metaRow1Y = y + 4.5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(3, 105, 161);
  doc.text("Dicetak Oleh", metaLeftX, metaRow1Y);
  doc.text("Tanggal Cetak", metaRightX, metaRow1Y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(printedByLines, metaLeftX + 22, metaRow1Y);
  doc.text(`${formatPrintDateTimeWib()} WIB`, metaRightX + 23, metaRow1Y);

  const metaRow2Y =
    metaRow1Y + Math.max(printedByLines.length, 1) * 3.8 + 1.2;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(3, 105, 161);
  doc.text("Filter Aktif", metaLeftX, metaRow2Y);
  doc.text("Jumlah Data", metaRightX, metaRow2Y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(filterLines, metaLeftX + 22, metaRow2Y);
  doc.setFont("helvetica", "bold");
  doc.text(`${pesertaList.length} Peserta`, metaRightX + 23, metaRow2Y);

  y += metaBoxHeight + 5.5;

  /* ================= DAFTAR DATA PESERTA LENGKAP ================= */
  const colGap = 5;
  const colWidth = (contentWidth - colGap - 7) / 2; // padding kiri/kanan 3.5mm
  const labelWidth = 28;
  const valueWidth = colWidth - labelWidth - 2.5;
  const lineHeight = 3.7;
  const rowGap = 1.4;
  const headerBarHeight = 7.5;

  const prepareRows = (rows: KeyValueRow[]): { items: PreparedRow[]; totalH: number } => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    let totalH = 0;
    const items = rows.map((row) => {
      const textVal = row.value && row.value.trim() ? row.value.trim() : "-";
      const lines = doc.splitTextToSize(textVal, valueWidth) as string[];
      const height = Math.max(1, lines.length) * lineHeight + rowGap;
      totalH += height;
      return { ...row, lines, height };
    });
    return { items, totalH };
  };

  pesertaList.forEach((p, idx) => {
    const statusLabel = resolveStatusLabel(p);
    const programLabel = isPkpaPeserta(p) ? "PKPA" : "Reguler";
    const kategoriLabel =
      (p.kategori || "").toLowerCase() === "bersama" ? "Kelompok" : "Mandiri";
    const periodeText =
      p.tanggalMulaiMagang || p.tanggalSelesaiMagang
        ? `${formatIndoDate(p.tanggalMulaiMagang)} s.d. ${formatIndoDate(p.tanggalSelesaiMagang)}`
        : "-";

    const leftPrepared = prepareRows([
      { label: "Nama Lengkap", value: p.nama || "-" },
      { label: "Email", value: p.email || "-" },
      { label: "No. WhatsApp", value: p.wa || "-" },
      { label: "Jenis Kelamin", value: p.jenisKelamin || "-" },
      {
        label: "Tempat, Tgl Lahir",
        value: formatBirthInfo(p.tempatLahir, p.tanggalLahir),
      },
      { label: "Alamat Lengkap", value: p.alamatLengkap || "-" },
      { label: "Wilayah Domisili", value: formatWilayahDomisili(p) },
    ]);

    const rightPrepared = prepareRows([
      { label: "Posisi", value: p.posisi || "-" },
      { label: "Jurusan", value: p.jurusan || "-" },
      { label: "Asal Institusi", value: formatAsalInstitusi(p.asal) },
      { label: "Kategori", value: `${programLabel} • ${kategoriLabel}` },
      { label: "Periode Magang", value: periodeText },
      { label: "Status Magang", value: statusLabel },
      { label: "Mentor", value: formatMentorInfo(p.mentor) },
      { label: "Email Mentor", value: p.mentor?.email || "-" },
    ]);

    const subTitleHeight = 5.2;
    const bodyHeight =
      subTitleHeight + Math.max(leftPrepared.totalH, rightPrepared.totalH) + 3;
    const cardHeight = headerBarHeight + bodyHeight;

    if (y + cardHeight > bottomLimit) {
      doc.addPage();
      y = 14;
    }

    // Card Outer Border
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.roundedRect(marginX, y, contentWidth, cardHeight, 1.8, 1.8, "FD");

    // Card Header Strip
    doc.setFillColor(224, 242, 254);
    doc.setDrawColor(186, 230, 253);
    doc.roundedRect(marginX, y, contentWidth, headerBarHeight, 1.8, 1.8, "FD");
    // Square off bottom corners of header strip
    doc.rect(marginX, y + headerBarHeight - 2, contentWidth, 2, "F");
    doc.line(
      marginX,
      y + headerBarHeight,
      marginX + contentWidth,
      y + headerBarHeight,
    );

    // Header Title (Left) & Status (Right)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(12, 74, 110);
    const titleMaxWidth = contentWidth - 65;
    const headerTitle = `${idx + 1}. ${p.nama || "-"}`;
    const truncatedTitle =
      doc.getTextWidth(headerTitle) > titleMaxWidth
        ? `${doc.splitTextToSize(headerTitle, titleMaxWidth - 4)[0]}...`
        : headerTitle;
    doc.text(truncatedTitle, marginX + 3.5, y + 5);

    doc.setFontSize(7.8);
    doc.setTextColor(3, 105, 161);
    doc.text(
      `${statusLabel}  |  ${programLabel} (${kategoriLabel})`,
      marginX + contentWidth - 3.5,
      y + 5,
      { align: "right" },
    );

    const colStartY = y + headerBarHeight + 4.2;
    const leftX = marginX + 3.5;
    const rightX = leftX + colWidth + colGap;

    // Vertical divider between 2 columns
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.line(
      leftX + colWidth + colGap / 2,
      y + headerBarHeight + 2,
      leftX + colWidth + colGap / 2,
      y + cardHeight - 2.5,
    );

    // Subheadings
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.6);
    doc.setTextColor(2, 132, 199);
    doc.text("DATA DIRI, KONTAK & DOMISILI", leftX, colStartY);
    doc.text("INFORMASI MAGANG & PEMBIMBING", rightX, colStartY);

    const drawColumnRows = (items: PreparedRow[], baseX: number) => {
      let rowY = colStartY + subTitleHeight;
      items.forEach((item) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.6);
        doc.setTextColor(71, 85, 105);
        doc.text(item.label, baseX, rowY);
        doc.text(":", baseX + labelWidth - 1.5, rowY);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.8);
        doc.setTextColor(15, 23, 42);
        doc.text(item.lines, baseX + labelWidth + 1.5, rowY);

        rowY += item.height;
      });
    };

    drawColumnRows(leftPrepared.items, leftX);
    drawColumnRows(rightPrepared.items, rightX);

    y += cardHeight + 4;
  });

  /* ================= FOOTER HALAMAN ================= */
  const totalPages = doc.getNumberOfPages();
  for (let pageIdx = 1; pageIdx <= totalPages; pageIdx++) {
    doc.setPage(pageIdx);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "Dokumen resmi dihasilkan oleh SITANJAK — Balai Besar POM di Palembang",
      marginX,
      pageHeight - 8,
    );
    doc.text(
      `Halaman ${pageIdx} dari ${totalPages}`,
      pageWidth - marginX,
      pageHeight - 8,
      { align: "right" },
    );
  }

  const defaultFileName = `data-peserta-magang-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(options.fileName || defaultFileName);
}
