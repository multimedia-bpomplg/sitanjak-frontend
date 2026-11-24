import axios from "axios";

export interface IKuotaBulanan {
  bulan: string; // Format YYYY-MM, contoh: "2026-11"
  kuota: number;
}

export interface IFormasi {
  _id: string;
  title: string;
  kuota: number;
  kuotaDefault?: number;
  kuotaBulanan?: IKuotaBulanan[];
  jumlahPendaftar: number;
  sisaKuota: number;
  kode: string;
  divisi: string;
  jurusan: string[];

  jumlahSelesaiMagang?: number;

  statusMagang?: string[];
  tanggalMulaiMagang?: string[];
  tanggalSelesaiMagang?: string[];
}

export interface SimulasiKuotaBulanItem {
  bulan: string;
  bulanSingkat: string;
  monthKey: string;
  kuotaBulan: number;
  aktif: number;
  sisaKuota: number;
}

const getAuthHeaders = () => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchFormasi = async (): Promise<IFormasi[]> => {
  const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/formasi`);
  return res.data;
};

export const fetchPrediksi = async () => {
  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_API_URL}/formasi/prediksi`,
  );
  return res.data;
};

export const createFormasi = async (payload: {
  title: string;
  kuota: number;
  jurusan?: string[];
}) => {
  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/formasi`,
    payload,
    { headers: getAuthHeaders() },
  );
  return res.data;
};

export const updateKuotaFormasi = async (
  id: string,
  payload: { kuota?: number; kuotaBulanan?: IKuotaBulanan[] },
) => {
  const res = await axios.put(
    `${process.env.NEXT_PUBLIC_API_URL}/formasi/${id}`,
    payload,
    { headers: getAuthHeaders() },
  );
  return res.data;
};

export const upsertKuotaBulanan = async (
  id: string,
  bulan: string,
  kuota: number,
) => {
  const res = await axios.put(
    `${process.env.NEXT_PUBLIC_API_URL}/formasi/${id}/kuota-bulanan`,
    { bulan, kuota },
    { headers: getAuthHeaders() },
  );
  return res.data;
};

export const deleteKuotaBulanan = async (id: string, bulan: string) => {
  const res = await axios.delete(
    `${process.env.NEXT_PUBLIC_API_URL}/formasi/${id}/kuota-bulanan/${bulan}`,
    { headers: getAuthHeaders() },
  );
  return res.data;
};

/* ================== HELPERS KUOTA BULANAN ================== */

export function parseLocalDate(str?: string): Date | null {
  if (!str) return null;
  const trimmed = str.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime())
    ? null
    : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function getMonthKeyFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function formatMonthKeyLabel(
  monthKey: string,
  variant: "long" | "short" = "long",
): string {
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return monthKey;
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", {
    month: variant,
    year: "numeric",
  });
}

export function getKuotaUntukBulan(
  formasi: Pick<IFormasi, "kuota" | "kuotaDefault" | "kuotaBulanan">,
  monthKey: string,
): number {
  const override = formasi.kuotaBulanan?.find((k) => k.bulan === monthKey);
  if (override !== undefined) return override.kuota;
  return formasi.kuotaDefault ?? formasi.kuota ?? 0;
}

export function getOverlappingMonthKeys(
  mulai?: string,
  selesai?: string,
): string[] {
  const start = parseLocalDate(mulai);
  const end = parseLocalDate(selesai) || start;
  if (!start || !end || end < start) return [];

  const keys: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= last) {
    keys.push(getMonthKeyFromDate(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys;
}

export function hitungAktifDiBulan(
  formasi: IFormasi,
  monthStart: Date,
  monthEnd: Date,
): number {
  const mulaiList = formasi.tanggalMulaiMagang || [];
  const selesaiList = formasi.tanggalSelesaiMagang || [];
  const statusList = formasi.statusMagang || [];

  return mulaiList.reduce((acc, mulai, idx) => {
    if (statusList[idx] === "Tidak Magang") return acc;
    const start = parseLocalDate(mulai);
    const end = parseLocalDate(selesaiList[idx]) || start;
    if (!start || !end) return acc;
    const overlap = start <= monthEnd && end >= monthStart;
    return overlap ? acc + 1 : acc;
  }, 0);
}

export function hitungKuotaBulan(
  formasi: IFormasi,
  targetDate: Date = new Date(),
) {
  const monthStart = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    1,
  );
  const monthEnd = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth() + 1,
    0,
  );
  const monthKey = getMonthKeyFromDate(monthStart);
  const kuotaBulan = getKuotaUntukBulan(formasi, monthKey);
  const aktif = hitungAktifDiBulan(formasi, monthStart, monthEnd);
  const sisa = Math.max(0, kuotaBulan - aktif);

  return {
    monthKey,
    kuotaBulan,
    aktif,
    sisa,
  };
}

export function simulasiKuotaBulanan(
  formasi: IFormasi,
  jumlahBulan = 4,
): SimulasiKuotaBulanItem[] {
  const hasil: SimulasiKuotaBulanItem[] = [];
  const sekarang = new Date();

  for (let i = 0; i < jumlahBulan; i++) {
    const bulanStart = new Date(
      sekarang.getFullYear(),
      sekarang.getMonth() + i,
      1,
    );
    const bulanEnd = new Date(
      sekarang.getFullYear(),
      sekarang.getMonth() + i + 1,
      0,
    );
    const monthKey = getMonthKeyFromDate(bulanStart);
    const kuotaBulan = getKuotaUntukBulan(formasi, monthKey);
    const aktif = hitungAktifDiBulan(formasi, bulanStart, bulanEnd);

    hasil.push({
      bulan: bulanStart.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      }),
      bulanSingkat: bulanStart.toLocaleDateString("id-ID", {
        month: "short",
        year: "numeric",
      }),
      monthKey,
      kuotaBulan,
      aktif,
      sisaKuota: Math.max(0, kuotaBulan - aktif),
    });
  }

  return hasil;
}

export function cekSlotMagangByBulan(
  formasi: IFormasi,
  mulai: string,
  selesai: string,
) {
  const newStart = parseLocalDate(mulai);
  const newEnd = parseLocalDate(selesai);
  if (!newStart || !newEnd || newEnd < newStart) {
    return {
      penuh: false,
      aktif: 0,
      kuota: formasi.kuotaDefault ?? formasi.kuota ?? 0,
      sisa: formasi.kuotaDefault ?? formasi.kuota ?? 0,
      bulanPenuh: undefined as string | undefined,
    };
  }

  const mulaiList = formasi.tanggalMulaiMagang || [];
  const selesaiList = formasi.tanggalSelesaiMagang || [];
  const statusList = formasi.statusMagang || [];
  const monthKeys = getOverlappingMonthKeys(mulai, selesai);

  let maxAktif = 0;
  let limitingKuota = formasi.kuotaDefault ?? formasi.kuota ?? 0;
  let minSisa = Number.POSITIVE_INFINITY;
  let bulanPenuh: string | undefined;

  for (const monthKey of monthKeys) {
    const [y, m] = monthKey.split("-").map(Number);
    const mStart = new Date(y, m - 1, 1);
    const mEnd = new Date(y, m, 0);
    const kuotaBulan = getKuotaUntukBulan(formasi, monthKey);

    let aktifBulanIni = 0;
    mulaiList.forEach((rawM, idx) => {
      if (statusList[idx] === "Tidak Magang") return;
      const start = parseLocalDate(rawM);
      const end = parseLocalDate(selesaiList[idx]) || start;
      if (!start || !end) return;

      const overlapApplicant = newStart <= end && newEnd >= start;
      const overlapMonth = start <= mEnd && end >= mStart;
      if (overlapApplicant && overlapMonth) {
        aktifBulanIni += 1;
      }
    });

    const sisaBulanIni = Math.max(0, kuotaBulan - aktifBulanIni);

    if (
      sisaBulanIni < minSisa ||
      (sisaBulanIni === minSisa && aktifBulanIni > maxAktif)
    ) {
      minSisa = sisaBulanIni;
      limitingKuota = kuotaBulan;
      maxAktif = aktifBulanIni;
    }

    if (aktifBulanIni >= kuotaBulan && !bulanPenuh) {
      bulanPenuh = formatMonthKeyLabel(monthKey, "long");
    }
  }

  const resolvedSisa = Number.isFinite(minSisa) ? minSisa : limitingKuota;

  return {
    aktif: maxAktif,
    kuota: limitingKuota,
    sisa: resolvedSisa,
    penuh: Boolean(bulanPenuh),
    bulanPenuh,
  };
}

export function validasiApprovalFormasi(
  pesertaList: Array<{
    posisi?: string;
    tanggalMulaiMagang?: string;
    tanggalSelesaiMagang?: string;
  }>,
  formasiList: IFormasi[],
): string | null {
  const normalize = (val?: string) => (val || "").trim().toLowerCase();

  // Hitung kebutuhan peserta per formasi per bulan
  const neededByFormasiMonth = new Map<string, Map<string, number>>();
  const neededFallbackCount = new Map<string, number>();

  for (const p of pesertaList) {
    const posisiKey = (p.posisi || "").trim();
    if (!posisiKey) continue;

    const formasi = formasiList.find(
      (f) =>
        normalize(f.title) === normalize(posisiKey) ||
        normalize(f.kode) === normalize(posisiKey),
    );
    if (!formasi) continue;

    const monthKeys = getOverlappingMonthKeys(
      p.tanggalMulaiMagang,
      p.tanggalSelesaiMagang,
    );

    if (monthKeys.length === 0) {
      neededFallbackCount.set(
        formasi._id,
        (neededFallbackCount.get(formasi._id) || 0) + 1,
      );
      continue;
    }

    if (!neededByFormasiMonth.has(formasi._id)) {
      neededByFormasiMonth.set(formasi._id, new Map());
    }
    const monthMap = neededByFormasiMonth.get(formasi._id)!;
    for (const mk of monthKeys) {
      monthMap.set(mk, (monthMap.get(mk) || 0) + 1);
    }
  }

  for (const [formasiId, monthMap] of neededByFormasiMonth.entries()) {
    const formasi = formasiList.find((f) => f._id === formasiId);
    if (!formasi) continue;

    for (const [monthKey, neededCount] of monthMap.entries()) {
      const [y, m] = monthKey.split("-").map(Number);
      const mStart = new Date(y, m - 1, 1);
      const mEnd = new Date(y, m, 0);
      const kuotaBulan = getKuotaUntukBulan(formasi, monthKey);
      const terisiBulan = hitungAktifDiBulan(formasi, mStart, mEnd);
      const sisaBulan = Math.max(0, kuotaBulan - terisiBulan);

      if (sisaBulan < neededCount) {
        return `Kuota formasi "${formasi.title}" pada bulan ${formatMonthKeyLabel(monthKey, "long")} tidak mencukupi (tersisa ${sisaBulan} dari ${kuotaBulan}, dibutuhkan ${neededCount}).`;
      }
    }
  }

  for (const [formasiId, neededCount] of neededFallbackCount.entries()) {
    const formasi = formasiList.find((f) => f._id === formasiId);
    if (formasi && formasi.sisaKuota < neededCount) {
      return `Kuota formasi "${formasi.title}" tidak mencukupi (tersisa ${formasi.sisaKuota}, dibutuhkan ${neededCount}).`;
    }
  }

  return null;
}
