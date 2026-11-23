"use client";

import { useState } from "react";

const AVATAR_COWOK_SRC = "/images/assets-new/avatar/avatar-cowok.png";
const AVATAR_CEWEK_SRC = "/images/assets-new/avatar/avatar-cewek.png";

/**
 * Mengembalikan path gambar avatar berdasarkan jenis kelamin peserta,
 * atau null jika jenis kelamin belum tersedia/tidak dikenali.
 */
export function getPesertaAvatarSrc(jenisKelamin?: string): string | null {
  const normalized = (jenisKelamin || "").trim().toLowerCase();
  if (!normalized) return null;

  if (
    normalized.includes("laki") ||
    normalized.includes("pria") ||
    normalized === "l"
  ) {
    return AVATAR_COWOK_SRC;
  }

  if (
    normalized.includes("perempuan") ||
    normalized.includes("wanita") ||
    normalized === "p"
  ) {
    return AVATAR_CEWEK_SRC;
  }

  return null;
}

/**
 * Mengambil maksimal 2 huruf inisial nama peserta sebagai fallback avatar.
 */
export function getPesertaInitial(nama = "-"): string {
  return (
    nama
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "P"
  );
}

type PesertaAvatarProps = {
  nama?: string;
  jenisKelamin?: string;
  className?: string;
};

/**
 * Menampilkan avatar peserta berdasarkan jenis kelamin (cowok/cewek),
 * dengan fallback ke inisial nama jika data belum tersedia atau gambar gagal dimuat.
 */
export function PesertaAvatar({
  nama = "P",
  jenisKelamin,
  className = "",
}: PesertaAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const avatarSrc = getPesertaAvatarSrc(jenisKelamin);
  const showImage = Boolean(avatarSrc && failedSrc !== avatarSrc);

  return (
    <div
      className={`rounded-full overflow-hidden flex items-center justify-center font-extrabold shrink-0 select-none ${className}`}
    >
      {showImage && avatarSrc ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarSrc}
            alt={`Avatar ${nama}`}
            onError={() => setFailedSrc(avatarSrc)}
            className="w-full h-full object-cover"
          />
        </>
      ) : (
        <span>{getPesertaInitial(nama)}</span>
      )}
    </div>
  );
}
