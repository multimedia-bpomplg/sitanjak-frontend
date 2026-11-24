export type FilterBulan = "semua" | number;
export type FilterTahun = "semua" | number;

export const BULAN_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

type PeriodeDates = {
  tanggalMulaiMagang?: string;
  tanggalSelesaiMagang?: string;
};

export function extractYearMonth(
  dateStr?: string,
): { year: number; month: number } | null {
  if (!dateStr) return null;
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr.trim());
  if (isoMatch) {
    return {
      year: Number(isoMatch[1]),
      month: Number(isoMatch[2]),
    };
  }
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return null;
  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth() + 1,
  };
}

export function getPesertaYearMonthRange(
  peserta: PeriodeDates,
): { minYm: number; maxYm: number } | null {
  const start = extractYearMonth(peserta.tanggalMulaiMagang);
  const end = extractYearMonth(peserta.tanggalSelesaiMagang);
  if (!start && !end) return null;

  const s = start ?? end!;
  const e = end ?? start!;
  const sYm = s.year * 12 + (s.month - 1);
  const eYm = e.year * 12 + (e.month - 1);
  return {
    minYm: Math.min(sYm, eYm),
    maxYm: Math.max(sYm, eYm),
  };
}

export function collectAvailableYears(list: PeriodeDates[]): number[] {
  const years = new Set<number>([new Date().getFullYear()]);
  for (const item of list) {
    const range = getPesertaYearMonthRange(item);
    if (!range) continue;
    const startYear = Math.floor(range.minYm / 12);
    const endYear = Math.floor(range.maxYm / 12);
    for (let y = startYear; y <= endYear; y++) {
      years.add(y);
    }
  }
  return Array.from(years).sort((a, b) => b - a);
}

export function matchesPeriodeFilter(
  peserta: PeriodeDates,
  bulan: FilterBulan,
  tahun: FilterTahun,
): boolean {
  if (bulan === "semua" && tahun === "semua") return true;

  const range = getPesertaYearMonthRange(peserta);
  if (!range) return false;

  const { minYm, maxYm } = range;

  if (tahun !== "semua" && bulan !== "semua") {
    const targetYm = tahun * 12 + (bulan - 1);
    return targetYm >= minYm && targetYm <= maxYm;
  }

  if (tahun !== "semua") {
    const yearStartYm = tahun * 12;
    const yearEndYm = tahun * 12 + 11;
    return maxYm >= yearStartYm && minYm <= yearEndYm;
  }

  if (maxYm - minYm >= 11) return true;
  const startYear = Math.floor(minYm / 12);
  const endYear = Math.floor(maxYm / 12);
  for (let y = startYear; y <= endYear; y++) {
    const candidateYm = y * 12 + ((bulan as number) - 1);
    if (candidateYm >= minYm && candidateYm <= maxYm) {
      return true;
    }
  }
  return false;
}

export function getMentorFilterKey(
  mentor?: { _id?: string; name?: string; email?: string } | null,
): string {
  if (!mentor) return "";
  return (
    mentor._id ||
    mentor.email?.trim().toLowerCase() ||
    mentor.name?.trim().toLowerCase() ||
    ""
  );
}

export function buildPesertaFilterSummary(params: {
  filterTab?: string;
  filterMentor: string;
  mentorOptions: Array<{ value: string; label: string }>;
  filterFormasi: string;
  formasiOptions: Array<{ value: string; label: string }>;
  filterBulan: FilterBulan;
  filterTahun: FilterTahun;
  search?: string;
}): string {
  const parts: string[] = [];

  if (params.filterTab && params.filterTab !== "Semua") {
    parts.push(`Status: ${params.filterTab}`);
  }

  if (params.filterMentor === "tanpa_mentor") {
    parts.push("Mentor: Belum Ditetapkan");
  } else if (params.filterMentor !== "semua") {
    const label =
      params.mentorOptions.find((m) => m.value === params.filterMentor)?.label ||
      params.filterMentor;
    parts.push(`Mentor: ${label}`);
  }

  if (params.filterFormasi !== "semua") {
    const label =
      params.formasiOptions.find((f) => f.value === params.filterFormasi)
        ?.label || params.filterFormasi;
    parts.push(`Formasi: ${label}`);
  }

  if (params.filterBulan !== "semua" || params.filterTahun !== "semua") {
    const bulanLabel =
      params.filterBulan === "semua"
        ? "Semua Bulan"
        : BULAN_OPTIONS.find((b) => b.value === params.filterBulan)?.label ||
          String(params.filterBulan);
    const tahunLabel =
      params.filterTahun === "semua" ? "Semua Tahun" : String(params.filterTahun);
    parts.push(`Periode: ${bulanLabel} ${tahunLabel}`);
  }

  const q = params.search?.trim();
  if (q) {
    parts.push(`Pencarian: "${q}"`);
  }

  return parts.length > 0 ? parts.join(" | ") : "Semua Peserta Magang Disetujui";
}

export function getJwtUserSummary(): { name?: string; email?: string } {
  if (typeof window === "undefined") return {};
  try {
    const token = localStorage.getItem("token");
    if (!token) return {};
    const parts = token.split(".");
    if (parts.length < 2) return {};
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );
    const payload = JSON.parse(jsonStr) as {
      name?: string;
      nama?: string;
      email?: string;
    };
    return {
      name: payload.name || payload.nama,
      email: payload.email,
    };
  } catch {
    return {};
  }
}
