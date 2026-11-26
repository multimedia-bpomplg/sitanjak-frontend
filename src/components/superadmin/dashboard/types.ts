export type RangePreset = "all" | "today" | "7d" | "30d" | "month" | "year";

export interface DashboardFilterState {
  range: RangePreset;
  year: number;
  month: number;
  posisi: string;
  mentorId: string;
  kategoriMagang: "" | "Reguler" | "PKPA";
  asalJenis: "" | "Universitas" | "SMK";
  statusMagang: "" | "Sedang Magang" | "Belum Waktu Magang" | "Selesai";
}

export interface SuperadminDashboardSummary {
  success: boolean;
  generatedAt: string;
  filterOptions: {
    years: number[];
    analyticsDates?: string[];
    formasiTitles: string[];
    instansiList: string[];
    jurusanList: string[];
    jenisKelaminList: string[];
    mentors: Array<{
      _id: string;
      name: string;
      posisiMentor: string;
    }>;
  };
  participantTrend: {
    mode: "monthly" | "daily" | "yearly_month";
    labels: string[];
    fullLabels: string[];
    counts: number[];
    totalUniquePeserta: number;
  };
  participantStatusSummary: {
    total: number;
    aktif: number;
    selesai: number;
    ditolak: number;
    menunggu: number;
  };
  cards: {
    pesertaDisetujuiTotal: number;
    pesertaSedangMagang: number;
    pesertaBelumMulai: number;
    pesertaSelesai: number;
    pesertaTidakMagang: number;
    akunPesertaAktif: number;
    akunMentorAktif: number;
    akunAdminAktif: number;
    akunSuperadminAktif: number;
    kuotaTotal: number;
    kuotaTerisi: number;
    kuotaPersen: number;
    absensiHariIniHadir: number;
    absensiHariIniTerlambat: number;
    absensiHariIniIzin: number;
    absensiHariIniTotal: number;
    persenKehadiranHariIni: number;
    rataRataSurvey: number;
    totalSurvey: number;
    rataRataNilaiAkhir: number;
    totalDinilai: number;
    pendaftaranTotal: number;
    pendaftaranMenunggu: number;
    pendaftaranSedangDiproses: number;
    pendaftaranDisetujui: number;
    pendaftaranDitolak: number;
    pendaftaranHariIni: number;
    pesertaTanpaMentor: number;
    logbookTotal: number;
    logbookMenunggu: number;
    logbookDisetujui: number;
    logbookDitolak: number;
    logbookRevisi: number;
    logbookHariIni: number;
    laporanTotal: number;
    laporanMenunggu: number;
    laporanRevisi: number;
    laporanDisetujui: number;
    laporanDitolak: number;
    evaluasiTotal: number;
    evaluasiMenunggu: number;
    evaluasiRevisi: number;
    evaluasiDisetujui: number;
    belumDinilaiSelesai: number;
    feedbackTotal: number;
    feedbackBelumDirespon: number;
    feedbackDirespon: number;
    feedbackRevisi: number;
    selesaiBelumSurat: number;
    selesaiBelumSertifikat: number;
  };
  trendChart: {
    mode: "daily" | "monthly";
    labels: string[];
    pendaftaranMasuk: number[];
    pendaftaranDisetujui: number[];
    logbookMasuk: number[];
    logbookDisetujui: number[];
    logbookMenunggu: number[];
    absensiHadir: number[];
    absensiTelat: number[];
    absensiIzin: number[];
  };
  pipelineStatus: Array<{
    label: string;
    selesai: number;
    menunggu: number;
    revisi: number;
    ditolak: number;
  }>;
  formasiOccupancy: Array<{
    title: string;
    kuota: number;
    terisi: number;
    menungguPendaftar: number;
    sisaKuota: number;
  }>;
  mentorWorkload: Array<{
    mentorId: string;
    name: string;
    posisiMentor: string;
    pesertaAktif: number;
    pesertaTotal: number;
    logbookMenunggu: number;
    laporanMenunggu: number;
    evaluasiMenunggu: number;
  }>;
  surveyIndicators: {
    kepuasanMagang: number;
    rekomendasiProgram: number;
    kemudahanProses: number;
    peningkatanSkill: number;
  };
  nilaiBuckets: Array<{
    label: string;
    count: number;
  }>;
  demographics: {
    kategori: Array<{ label: string; count: number }>;
    asalJenis: Array<{ label: string; count: number }>;
    gender: Array<{ label: string; count: number }>;
    tipePeserta: Array<{ label: string; count: number }>;
    formasiDemand: Array<{ label: string; count: number }>;
    jurusanBreakdown: Array<{ label: string; count: number }>;
    instansiBreakdown: Array<{ nama: string; jenis: string; count: number }>;
    topAsalNama: Array<{ nama: string; jenis: string; count: number }>;
  };
  perkiraanSelesai: Array<{
    periode: string;
    count: number;
  }>;
  actionQueues: {
    pendaftaranMenunggu: Array<{
      _id: string;
      kategori: string;
      status: string;
      createdAt: string;
      jumlahPeserta: number;
      namaPemohon: string;
      asalNama: string;
      posisi: string;
    }>;
    logbookMenunggu: Array<{
      nama: string;
      email: string;
      mentorName: string;
      count: number;
      oldestDate: string;
    }>;
    laporanMenunggu: Array<{
      nama: string;
      email: string;
      mentorName: string;
      status: string;
      submittedAt: string;
    }>;
    dokumenBelumLengkap: Array<{
      nama: string;
      email: string;
      posisi: string;
      mentorName: string;
      tanggalSelesaiMagang: string;
      missing: string[];
    }>;
  };
}
