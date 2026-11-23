export interface EvaluasiMagangPayload {
  fasilitator: {
    nama: string;
    judulMateri: string;
    skor1: number;
    skor2: number;
    skor3: number;
    skor4: number;
    skor5: number;
    adaSaran: "Ya" | "Tidak";
    saran: string;
  };
  penyelenggara: {
    skor1: number;
    skor2: number;
    skor3: number;
    skor4: number;
    skor5: number;
    bermanfaat: "Ya" | "Tidak";
    alasanBermanfaat?: string;
    adaMasukan: "Ya" | "Tidak";
    masukan: string;
  };
  suratPernyataan: {
    nama: string;
    nim: string;
    programPendidikan: string;
    universitas: string;
    tanggalSurat: string;
    ttdImage?: string;
  };
}

export const FASILITATOR_QUESTIONS = [
  "Penguasaan dan pemahaman materi yang disampaikan kepada peserta yang disampaikan dalam Praktik Kerja Lapangan (PKL)/Magang",
  "Interaksi fasilitator / pembimbing dengan peserta Praktik Kerja Lapangan (PKL)/Magang",
  "Suasana pembelajaran yang diciptakan oleh fasilitator/pembimbing selama Praktik Kerja Lapangan (PKL)/Magang",
  "Kesesuaian dan kebermanfaatan materi yang diberikan oleh widyaiswara / narasumber / fasilitator",
  "Pemberian motivasi oleh widyaiswara/ narasumber/ fasilitator kepada peserta",
];

export const FASILITATOR_QUESTIONS_PKPA = [
  "Penguasaan dan pemahaman materi yang disampaikan kepada peserta yang disampaikan dalam Praktik Kerja Profesi Apoteker",
  "Interaksi fasilitator / pembimbing dengan peserta Praktik Kerja Profesi Apoteker",
  "Suasana pembelajaran yang diciptakan oleh fasilitator/pembimbing selama Praktik Kerja Profesi Apoteker",
  "Kesesuaian dan kebermanfaatan materi yang diberikan oleh widyaiswara / narasumber / fasilitator",
  "Pemberian motivasi oleh widyaiswara/ narasumber/ fasilitator kepada peserta",
];

export const PENYELENGGARA_QUESTIONS = [
  "Kesesuaian pelaksanaan dengan tujuan Praktik Kerja Lapangan (PKL)/Magang",
  "Kesiapan dan ketersediaan sarana dan prasarana fasilitas Praktik Kerja Lapangan (PKL)/Magang",
  "Kebersihan dan kerapihan tempat Praktik Kerja Lapangan (PKL)/Magang",
  "Lingkungan dan suasana lingkungan dalam mendukung proses pembelajaran dalam Praktik Kerja Lapangan (PKL)/Magang",
  "Pelayanan yang diberikan panitia terhadap peserta Praktik Kerja Lapangan (PKL)/Magang",
];

export const PENYELENGGARA_QUESTIONS_PKPA = [
  "Kesesuaian pelaksanaan dengan tujuan Praktik Kerja Profesi Apoteker",
  "Kesiapan dan ketersediaan sarana dan prasarana fasilitas Praktik Kerja Profesi Apoteker",
  "Kebersihan dan kerapihan tempat Praktik Kerja Profesi Apoteker",
  "Lingkungan dan suasana lingkungan dalam mendukung proses pembelajaran dalam Praktik Kerja Profesi Apoteker",
  "Pelayanan yang diberikan panitia terhadap peserta Praktik Kerja Profesi Apoteker",
];

export function getEvaluasiTexts(isPkpa = false) {
  if (isPkpa) {
    return {
      page1Title: "FORMULIR EVALUASI PRAKTIK KERJA PROFESI APOTEKER (PKPA)",
      page2Title: "FORMULIR EVALUASI PKPA",
      programPhrase: "Praktik Kerja Profesi Apoteker",
      fasilitatorQuestions: FASILITATOR_QUESTIONS_PKPA,
      fasilitatorSaranPrompt:
        "Adakah saran/masukan terkait pengajar/fasilitator selama pelaksanaan Praktik Kerja Profesi Apoteker?",
      penyelenggaraQuestions: PENYELENGGARA_QUESTIONS_PKPA,
      penyelenggaraBermanfaatPrompt:
        "Menurut Saudara, apakah Praktik Kerja Profesi Apoteker ini bermanfaat?",
      penyelenggaraMasukanPrompt:
        "Adakah masukan terkait Praktik Kerja Profesi Apoteker yang sudah dilakukan?",
      suratPernyataanParagraph:
        "Dengan ini menyatakan bahwa data/ informasi yang saya peroleh dari Balai Besar POM di Palembang untuk kegiatan PKPA tersebut tidak akan digunakan untuk publikasi dan Balai Besar POM akan menerima salinan dokumen laporan hasil PKPA tersebut. Demikian surat pernyataan ini saya buat untuk dipergunakan sebagaimana mestinya.",
    };
  }

  return {
    page1Title: "FORMULIR EVALUASI PRAKTIK KERJA LAPANGAN (PKL)/MAGANG",
    page2Title: "FORMULIR EVALUASI PKL/Magang",
    programPhrase: "Praktik Kerja Lapangan (PKL)/Magang",
    fasilitatorQuestions: FASILITATOR_QUESTIONS,
    fasilitatorSaranPrompt:
      "Adakah saran/masukan terkait pengajar/fasilitator selama pelaksanaan Praktik Kerja Lapangan (PKL)/Magang?",
    penyelenggaraQuestions: PENYELENGGARA_QUESTIONS,
    penyelenggaraBermanfaatPrompt:
      "Menurut Saudara, apakah Praktik Kerja Lapangan (PKL)/Magang ini bermanfaat?",
    penyelenggaraMasukanPrompt:
      "Adakah masukan terkait Praktik Kerja Lapangan (PKL)/Magang yang sudah dilakukan?",
    suratPernyataanParagraph:
      "Dengan ini menyatakan bahwa data/ informasi yang saya peroleh dari Balai Besar POM di Palembang untuk kegiatan Praktik Kerja Lapangan (PKL)/Magang tersebut tidak akan digunakan untuk publikasi dan Balai Besar POM akan menerima salinan dokumen laporan hasil PKL/Magang tersebut. Demikian surat pernyataan ini saya buat untuk dipergunakan sebagaimana mestinya.",
  };
}

export const RATING_LEGEND: Array<{ score: number; label: string }> = [
  { score: 5, label: "Sangat Baik" },
  { score: 4, label: "Baik" },
  { score: 3, label: "Netral" },
  { score: 2, label: "Kurang" },
  { score: 1, label: "Sangat Kurang" },
];

function formatIndoDate(raw?: string): string {
  if (!raw || raw === "-") return "-";
  const d = new Date(raw.includes("T") ? raw : `${raw}T00:00:00`);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function loadImageDimensions(
  dataUrl: string,
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (typeof Image === "undefined") {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

function drawCheckmark(doc: any, centerX: number, centerY: number) {
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.55);
  doc.line(centerX - 1.5, centerY + 0.1, centerX - 0.3, centerY + 1.4);
  doc.line(centerX - 0.3, centerY + 1.4, centerX + 1.8, centerY - 1.3);
  doc.setLineWidth(0.25);
}

function drawRatingLegend(doc: any, x: number, startY: number): number {
  const boxW = 68;
  const lineH = 4.6;
  const padY = 2.2;
  const boxH = RATING_LEGEND.length * lineH + padY * 2;

  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.35);
  doc.rect(x, startY, boxW, boxH);

  doc.setFont("times", "normal");
  doc.setFontSize(10);
  RATING_LEGEND.forEach((item, idx) => {
    const ty = startY + padY + 3.4 + idx * lineH;
    doc.text(String(item.score), x + 3, ty);
    doc.text(":", x + 16, ty);
    doc.text(item.label, x + 26, ty);
  });

  return startY + boxH;
}

function drawIntroParagraphs(
  doc: any,
  marginLeft: number,
  contentWidth: number,
  startY: number,
  periodeText: string,
  programPhrase: string,
): number {
  let y = startY;
  doc.setFont("times", "normal");
  doc.setFontSize(10.5);

  const p1 = `Kuisioner evaluasi ini digunakan dalam ${programPhrase} tanggal ${periodeText} pada Balai Besar Pengawas Obat dan Makanan di Palembang. Evaluasi ini akan menjadi bahan masukkan dalam rangka penyempurnaan program ${programPhrase} di masa yang akan mendatang.`;
  const p1Lines = doc.splitTextToSize(p1, contentWidth);
  doc.text(p1Lines, marginLeft, y);
  y += p1Lines.length * 4.8 + 1.5;

  const p2 =
    "Kami meminta bantuan saudara untuk mengisi setiap pernyataan di bawah ini sesuai dengan presepsi / pendapat saudara. isilah dengan memberi tanda checklist (✓) pada kotak tanggapan yang tersedia dengan kategori penilaian:";
  // Standard Type1 Times does not render ✓; draw plain text without ✓ glyph issues:
  const p2Clean = p2.replace("✓", "v");
  const p2Lines = doc.splitTextToSize(p2Clean, contentWidth);
  doc.text(p2Lines, marginLeft, y);
  y += p2Lines.length * 4.8 + 2;

  return y;
}

function drawEvaluationTable(
  doc: any,
  opts: {
    marginLeft: number;
    contentWidth: number;
    startY: number;
    questions: string[];
    scores: number[];
    footerLines: Array<{ text: string; bold?: boolean }>;
  },
) {
  const { marginLeft, contentWidth, startY, questions, scores, footerLines } =
    opts;
  const noW = 12;
  const ratingColW = 9.5;
  const ratingTotalW = ratingColW * 5; // 47.5
  const evalW = contentWidth - noW - ratingTotalW;

  const colNoX = marginLeft;
  const colEvalX = colNoX + noW;
  const colRateStartX = colEvalX + evalW;

  let y = startY;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.35);

  // Table header (2-row merged header)
  const hTop = 6.5;
  const hSub = 6.5;
  const headerH = hTop + hSub;

  doc.rect(colNoX, y, noW, headerH);
  doc.rect(colEvalX, y, evalW, headerH);
  doc.rect(colRateStartX, y, ratingTotalW, hTop);

  for (let i = 0; i < 5; i++) {
    doc.rect(colRateStartX + i * ratingColW, y + hTop, ratingColW, hSub);
  }

  doc.setFont("times", "bold");
  doc.setFontSize(10.5);
  doc.text("No", colNoX + noW / 2, y + 6, { align: "center" });
  doc.text("Evaluasi", colEvalX + evalW / 2, y + 6, { align: "center" });
  doc.text("Penilaian", colRateStartX + ratingTotalW / 2, y + 4.5, {
    align: "center",
  });
  for (let i = 0; i < 5; i++) {
    doc.text(
      String(i + 1),
      colRateStartX + i * ratingColW + ratingColW / 2,
      y + hTop + 4.5,
      { align: "center" },
    );
  }

  y += headerH;

  // Question rows
  doc.setFont("times", "normal");
  doc.setFontSize(10);

  questions.forEach((q, idx) => {
    const lines = doc.splitTextToSize(q, evalW - 5);
    const rowH = Math.max(11, lines.length * 4.5 + 3.5);

    doc.rect(colNoX, y, noW, rowH);
    doc.rect(colEvalX, y, evalW, rowH);
    for (let c = 0; c < 5; c++) {
      doc.rect(colRateStartX + c * ratingColW, y, ratingColW, rowH);
    }

    doc.text(String(idx + 1), colNoX + noW / 2, y + 5.2, { align: "center" });
    doc.text(lines, colEvalX + 2.5, y + 5);

    const selected = scores[idx];
    if (selected >= 1 && selected <= 5) {
      const cx = colRateStartX + (selected - 1) * ratingColW + ratingColW / 2;
      const cy = y + rowH / 2;
      drawCheckmark(doc, cx, cy);
    }

    y += rowH;
  });

  // Footer row (merged across Evaluasi + Penilaian)
  const mergedW = evalW + ratingTotalW;
  const wrappedEntries: Array<{ lines: string[]; bold?: boolean }> = [];
  let totalLines = 0;
  footerLines.forEach((entry) => {
    const lines = doc.splitTextToSize(entry.text, mergedW - 6);
    wrappedEntries.push({ lines, bold: entry.bold });
    totalLines += lines.length;
  });

  const footerH = Math.max(20, totalLines * 4.6 + 6);
  doc.rect(colNoX, y, noW, footerH);
  doc.rect(colEvalX, y, mergedW, footerH);

  let fy = y + 5.2;
  wrappedEntries.forEach((entry) => {
    doc.setFont("times", entry.bold ? "bold" : "normal");
    doc.setFontSize(10);
    doc.text(entry.lines, colEvalX + 3, fy);
    fy += entry.lines.length * 4.6 + 0.8;
  });

  return y + footerH;
}

export async function downloadEvaluasiDanPernyataanPdf(
  payload: EvaluasiMagangPayload,
  periode?: { mulai?: string; selesai?: string; isPkpa?: boolean },
) {
  const isPkpa = Boolean(periode?.isPkpa);
  const texts = getEvaluasiTexts(isPkpa);
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const marginLeft = 22;
  const contentWidth = pageWidth - marginLeft * 2; // 166mm

  const mulaiFormatted = formatIndoDate(periode?.mulai);
  const selesaiFormatted = formatIndoDate(periode?.selesai);
  const periodeText =
    mulaiFormatted !== "-" && selesaiFormatted !== "-"
      ? `${mulaiFormatted} s.d. ${selesaiFormatted}`
      : "....................................";

  /* ==================== HALAMAN 1: EVALUASI FASILITATOR / PEMBIMBING ==================== */
  let y = 20;

  doc.setFont("times", "bold");
  doc.setFontSize(11.5);
  doc.text(texts.page1Title, pageWidth / 2, y, { align: "center" });
  y += 8;

  // Section heading "a. Evaluasi Fasilitator/Pembimbing"
  doc.setFontSize(11);
  doc.text("a.", marginLeft, y);
  const aHeading = "Evaluasi Fasilitator/Pembimbing";
  const aHeadingX = marginLeft + 10;
  doc.text(aHeading, aHeadingX, y);
  const aHeadingW = doc.getTextWidth(aHeading);
  doc.setLineWidth(0.3);
  doc.line(aHeadingX, y + 0.8, aHeadingX + aHeadingW, y + 0.8);
  y += 6;

  doc.setFont("times", "normal");
  doc.setFontSize(10.5);
  doc.text("Lembar evaluasi kualitas Fasilitator / pembimbing", marginLeft, y);
  y += 3;

  // Boxed Facilitator Metadata
  const boxTopY = y;
  const namaLines = doc.splitTextToSize(
    payload.fasilitator.nama || "-",
    contentWidth - 46,
  );
  const judulLines = doc.splitTextToSize(
    payload.fasilitator.judulMateri || "-",
    contentWidth - 46,
  );
  const boxH =
    14 + Math.max(1, namaLines.length) * 5 + Math.max(1, judulLines.length) * 5;

  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.45);
  doc.rect(marginLeft, boxTopY, contentWidth, boxH);

  doc.setFont("times", "bold");
  doc.setFontSize(10.5);
  doc.text(
    "Fasilitator / Pembimbing yang dievaluasi",
    pageWidth / 2,
    boxTopY + 5.5,
    { align: "center" },
  );

  doc.setFont("times", "normal");
  let by = boxTopY + 12;
  doc.text("Nama", marginLeft + 4, by);
  doc.text(":", marginLeft + 40, by);
  doc.text(namaLines, marginLeft + 44, by);
  by += Math.max(1, namaLines.length) * 5 + 1.5;

  doc.text("Judul Materi", marginLeft + 4, by);
  doc.text(":", marginLeft + 40, by);
  doc.text(judulLines, marginLeft + 44, by);

  y = boxTopY + boxH + 5;

  // Intro paragraphs
  y = drawIntroParagraphs(
    doc,
    marginLeft,
    contentWidth,
    y,
    periodeText,
    texts.programPhrase,
  );

  // Legend box
  y = drawRatingLegend(doc, marginLeft, y) + 4;

  // Evaluation table (Fasilitator)
  const fFooterLines: Array<{ text: string; bold?: boolean }> = [
    {
      text: `${texts.fasilitatorSaranPrompt} ${payload.fasilitator.adaSaran}`,
    },
  ];
  if (payload.fasilitator.adaSaran === "Ya") {
    fFooterLines.push({
      text: "Jika Ya, masukan apa yang dapat saudara/i usulkan?",
    });
    fFooterLines.push({
      text: payload.fasilitator.saran || "-",
    });
  }

  drawEvaluationTable(doc, {
    marginLeft,
    contentWidth,
    startY: y,
    questions: texts.fasilitatorQuestions,
    scores: [
      payload.fasilitator.skor1,
      payload.fasilitator.skor2,
      payload.fasilitator.skor3,
      payload.fasilitator.skor4,
      payload.fasilitator.skor5,
    ],
    footerLines: fFooterLines,
  });

  /* ==================== HALAMAN 2: EVALUASI PENYELENGGARA ==================== */
  doc.addPage();
  y = 20;

  doc.setFont("times", "bold");
  doc.setFontSize(11.5);
  doc.text(texts.page2Title, pageWidth / 2, y, {
    align: "center",
  });
  y += 9;

  doc.setFontSize(11);
  doc.text("b.", marginLeft, y);
  const bHeading = "Evaluasi penyelenggara";
  const bHeadingX = marginLeft + 10;
  doc.text(bHeading, bHeadingX, y);
  const bHeadingW = doc.getTextWidth(bHeading);
  doc.setLineWidth(0.3);
  doc.line(bHeadingX, y + 0.8, bHeadingX + bHeadingW, y + 0.8);
  y += 7;

  y = drawIntroParagraphs(
    doc,
    marginLeft,
    contentWidth,
    y,
    periodeText,
    texts.programPhrase,
  );
  y = drawRatingLegend(doc, marginLeft, y) + 5;

  const pFooterLines: Array<{ text: string; bold?: boolean }> = [
    {
      text: `• ${texts.penyelenggaraBermanfaatPrompt} ${payload.penyelenggara.bermanfaat}`,
    },
    ...(payload.penyelenggara.alasanBermanfaat?.trim()
      ? [
          {
            text:
              payload.penyelenggara.bermanfaat === "Ya"
                ? "• Jika ya, manfaat apa yang dapat Saudara jelaskan:"
                : "• Jika tidak, alasan yang disampaikan:",
          },
          {
            text: payload.penyelenggara.alasanBermanfaat.trim(),
          },
        ]
      : []),
    {
      text: `• ${texts.penyelenggaraMasukanPrompt} ${payload.penyelenggara.adaMasukan}`,
    },
  ];
  if (payload.penyelenggara.adaMasukan === "Ya") {
    pFooterLines.push({
      text: "• Jika ya, masukan apa yang dapat Saudara berikan:",
    });
    pFooterLines.push({
      text: payload.penyelenggara.masukan || "-",
    });
  }

  drawEvaluationTable(doc, {
    marginLeft,
    contentWidth,
    startY: y,
    questions: texts.penyelenggaraQuestions,
    scores: [
      payload.penyelenggara.skor1,
      payload.penyelenggara.skor2,
      payload.penyelenggara.skor3,
      payload.penyelenggara.skor4,
      payload.penyelenggara.skor5,
    ],
    footerLines: pFooterLines,
  });

  /* ==================== HALAMAN 3: SURAT PERNYATAAN ==================== */
  doc.addPage();
  y = 24;

  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.text("SURAT PERNYATAAN", pageWidth / 2, y, { align: "center" });
  y += 12;

  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.text("Saya yang bertanda tangan di bawah ini:", marginLeft, y);
  y += 9;

  const spRows: Array<[string, string]> = [
    ["Nama", payload.suratPernyataan.nama || "-"],
    ["NIM", payload.suratPernyataan.nim || "-"],
    ["Program Pendidikan", payload.suratPernyataan.programPendidikan || "-"],
    ["Universitas", payload.suratPernyataan.universitas || "-"],
  ];

  spRows.forEach(([label, val]) => {
    doc.text(label, marginLeft, y);
    doc.text(":", marginLeft + 46, y);
    const valLines = doc.splitTextToSize(val, contentWidth - 50);
    doc.text(valLines, marginLeft + 50, y);
    y += Math.max(1, valLines.length) * 6 + 1;
  });

  y += 3;
  const spParaLines = doc.splitTextToSize(
    texts.suratPernyataanParagraph,
    contentWidth,
  );
  doc.text(spParaLines, marginLeft, y);
  y += spParaLines.length * 5.8 + 18;

  const sigX = marginLeft + contentWidth - 58;
  const formattedTanggal = formatIndoDate(payload.suratPernyataan.tanggalSurat);
  doc.text(`Palembang, ${formattedTanggal}`, sigX, y);
  const sigTopY = y;
  y += 24;

  const ttdImage = payload.suratPernyataan.ttdImage?.trim();
  if (ttdImage && ttdImage.startsWith("data:image/png")) {
    const dims = await loadImageDimensions(ttdImage);
    const maxW = 46;
    const maxH = 17;
    let drawW = 36;
    let drawH = 15;
    if (dims) {
      const ratio = Math.min(maxW / dims.width, maxH / dims.height);
      drawW = dims.width * ratio;
      drawH = dims.height * ratio;
    }
    const drawX = sigX + Math.max(0, (maxW - drawW) / 2);
    const drawY = sigTopY + 3 + Math.max(0, (maxH - drawH) / 2);
    doc.addImage(ttdImage, "PNG", drawX, drawY, drawW, drawH);
  }

  const namaPembuat = payload.suratPernyataan.nama || "                    ";
  doc.text(`( ${namaPembuat} )`, sigX, y);

  const safeName = (payload.suratPernyataan.nama || "Peserta")
    .trim()
    .replace(/\s+/g, "_");
  const prefix = isPkpa ? "Evaluasi_&_Surat_Pernyataan_PKPA" : "Evaluasi_&_Surat_Pernyataan";
  doc.save(`${prefix}_${safeName}.pdf`);
}
