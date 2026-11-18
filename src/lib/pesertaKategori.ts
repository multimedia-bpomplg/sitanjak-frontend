export const PKPA_JURUSAN_LABEL = "Profesi Apoteker / PKPA";

export function isPkpaJurusan(jurusan?: string | null): boolean {
  if (!jurusan) return false;
  const normalized = jurusan.trim().toLowerCase();
  if (!normalized) return false;
  return (
    normalized === "profesi apoteker / pkpa" ||
    normalized.includes("profesi apoteker") ||
    normalized.includes("pkpa")
  );
}

export function isPkpaPeserta(
  data?: {
    kategoriMagang?: string | null;
    jurusan?: string | null;
  } | null,
): boolean {
  if (!data) return false;
  if (data.kategoriMagang === "PKPA") return true;
  return isPkpaJurusan(data.jurusan);
}
