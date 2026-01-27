"use client";

import { useEffect, useState, useCallback } from "react";

/* ================= TYPES ================= */

type Peserta = {
  nama: string;
  email: string;
  wa: string;
  posisi: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  tanggalMulaiMagang: string;
  tanggalSelesaiMagang: string;
  provinsi: string;
  kota: string;
  kecamatan: string;
  kelurahan: string;
  alamatLengkap: string;
  mentor?: {
    name: string;
    email: string;
    posisiMentor: string;
  };

  // fallback mentor (jika backend taruh di peserta)
  mentorNama?: string;
  mentorEmail?: string;
  mentorPosisi?: string;
};

type Mentor = {
  name: string;
  email: string;
  posisiMentor: string;
};

type Pendaftaran = {
  status: string;
  kategori: string;
  suratPengantar?: string;
  suratBalasan?: string;
  jawabanAdmin?: string;
  peserta: Peserta[];

  // kemungkinan mentor di root
  mentor?: Mentor;
  mentorNama?: string;
  mentorEmail?: string;
  mentorPosisi?: string;
};

/* ================= UTIL ================= */

function hitungDurasi(mulai?: string, selesai?: string) {
  if (!mulai || !selesai) return null;

  const start = new Date(mulai);
  const end = new Date(selesai);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start)
    return null;

  const totalHari = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

  return {
    bulan: Math.floor(totalHari / 30),
    hari: totalHari % 30,
  };
}

const getInitial = (nama = "-") =>
  nama
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

/* ================= MAIN ================= */

export default function PesertaDashboard() {
  const [pendaftaran, setPendaftaran] = useState<Pendaftaran | null>(null);
  const [open, setOpen] = useState(false);

  const FILE_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const payload = JSON.parse(atob(token.split(".")[1]));
      const email = payload.email;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pendaftaran/cek?email=${email}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error("Gagal mengambil data pendaftaran");
      }

      const data = await res.json();
      setPendaftaran(data);
    } catch (err) {
      console.error("Gagal memuat dashboard peserta", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!pendaftaran) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="animate-pulse text-slate-400">
          Memuat dashboard peserta...
        </span>
      </div>
    );
  }

  // ambil email login dari token
  const token = localStorage.getItem("token");
  const payload = token ? JSON.parse(atob(token.split(".")[1])) : null;
  const emailLogin = payload?.email;

  // cari peserta sesuai email login
  const peserta = pendaftaran.peserta.find(
    (p) => p.email.toLowerCase() === emailLogin?.toLowerCase(),
  );

  if (!peserta) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="text-slate-400">
          Data peserta untuk akun ini tidak ditemukan
        </span>
      </div>
    );
  }

  /* ================= RESOLVE MENTOR (ANTI GAGAL) ================= */

  const mentor = {
    nama: peserta?.mentor?.name || "Belum Ditentukan",
    email: peserta?.mentor?.email || "-",
    posisi: peserta?.mentor?.posisiMentor || "-",
  };

  const durasi = hitungDurasi(
    peserta?.tanggalMulaiMagang,
    peserta?.tanggalSelesaiMagang,
  );

  const durasiText = durasi
    ? `(${durasi.bulan} bulan${durasi.hari ? ` ${durasi.hari} hari` : ""})`
    : "";

  const sisaHari = hitungSisaHari(peserta?.tanggalSelesaiMagang);

  const progressMagang = hitungProgressMagang(
    peserta.tanggalMulaiMagang,
    peserta.tanggalSelesaiMagang,
  );

  /* ================= UI ================= */
  return (
    <div className="space-y-10">
      {/* ================= HERO ================= */}
      <div
        className="
            relative overflow-hidden
            rounded-[2.25rem]
            bg-linear-to-r
            from-[#7F1D1D]
            via-[#991B1B]
            to-[#D97706]
            dark:from-indigo-600 dark:via-purple-600 dark:to-fuchsia-600
            px-10 py-12
            shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)]
            text-white
          "
      >
        {/* decorative glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-24 w-md h-112 bg-black/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col sm:flex-row items-center gap-8">
          {/* Avatar */}
          <div
            className="
                flex h-24 w-24 items-center justify-center
                rounded-full
                bg-white/25 backdrop-blur
                text-3xl font-extrabold
                ring-4 ring-white/40
                shadow-xl
              "
          >
            {getInitial(peserta?.nama)}
          </div>

          {/* Text */}
          <div className="text-center sm:text-left space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Halo, {peserta?.nama || "Peserta"}{" "}
              <span className="inline-block ml-1">👋</span>
            </h1>

            <p className="text-white/85 text-base md:text-lg">
              {peserta?.email || "-"}
            </p>

            <span
              className="
                  inline-flex items-center gap-2
                  mt-3 px-5 py-2
                  rounded-full
                  text-sm font-semibold
                  bg-white/25 backdrop-blur
                "
            >
              Peserta Magang Aktif
            </span>
          </div>
        </div>
      </div>

      {/* ================= COUNTDOWN ================= */}
      <div className="px-2 sm:px-0">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Sisa Waktu Magang
              </p>
              <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white">
                {sisaHari !== null ? `${sisaHari} Hari` : "-"}
              </h3>
            </div>

            <div className="text-right shrink-0">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Berakhir pada
              </p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {peserta.tanggalSelesaiMagang}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="
                    h-full
                    bg-linear-to-r
                    from-[#FEF3C7]
                    via-[#FACC15]
                    to-[#B45309]
                    dark:from-indigo-500 dark:via-purple-500 dark:to-fuchsia-500
                    transition-all duration-500
                  "
                style={{
                  width: `${progressMagang}%`,
                }}
              />
            </div>

            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Mulai</span>
              <span>Selesai</span>
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400">
            Tetap semangat & konsisten 🚀
          </p>
        </div>
      </div>

      {/* ================= STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Status Magang"
          value={pendaftaran.status}
          accent="gold"
        />

        <StatCard title="Posisi" value={peserta.posisi} accent="maroon" />

        <StatCard
          title="Periode"
          value={
            <>
              <div>
                {peserta.tanggalMulaiMagang} – {peserta.tanggalSelesaiMagang}
              </div>
              {durasiText && (
                <div className="text-xs opacity-70">{durasiText}</div>
              )}
            </>
          }
          accent="amber"
        />

        <StatCard
          title="Mentor"
          value={
            <div className="flex gap-3">
              <div
                className="
                  flex h-9 w-9 items-center justify-center
                  rounded-full
                  bg-[#FDE68A] text-[#7F1D1D]
                  dark:bg-indigo-900/60 dark:text-indigo-200
                  font-bold text-xs
                "
              >
                {getInitial(mentor.nama)}
              </div>
              <div>
                <div className="font-semibold">{mentor.nama}</div>
                <div className="text-xs opacity-70">{mentor.email}</div>
              </div>
            </div>
          }
          accent="rose"
        />
      </div>

      {/* ================= DETAIL ACCORDION ================= */}
      <div
        className="
          overflow-hidden rounded-3xl
          border border-white/40
          bg-white/70 dark:bg-slate-900/70
          backdrop-blur-xl
          shadow-2xl
        "
      >
        <button
          onClick={() => setOpen((v) => !v)}
          className="
              w-full flex items-center justify-between
              px-8 py-6
              hover:bg-white/40 dark:hover:bg-white/5
              transition
            "
        >
          <div>
            <h2 className="text-xl font-bold">📂 Detail Informasi Peserta</h2>
            <p className="text-sm opacity-70">
              Data diri, alamat, dokumen, dan catatan admin
            </p>
          </div>

          <span
            className={`text-2xl transition-transform ${
              open ? "rotate-180" : ""
            }`}
          >
            ⌄
          </span>
        </button>

        {open && (
          <div className="px-8 pb-10 space-y-12">
            <Section title="🏷️ Informasi Magang">
              <Grid>
                <Item label="Kategori Magang" value={pendaftaran.kategori} />
              </Grid>
            </Section>

            <Section title="👤 Data Diri">
              <Grid>
                <Item label="Nama Lengkap" value={peserta.nama} />
                <Item label="Jenis Kelamin" value={peserta.jenisKelamin} />
                <Item label="Tempat Lahir" value={peserta.tempatLahir} />
                <Item label="Tanggal Lahir" value={peserta.tanggalLahir} />
                <Item label="Email" value={peserta.email} />
                <Item label="WhatsApp" value={peserta.wa} />
              </Grid>
            </Section>

            <Section title="📍 Alamat">
              <Grid>
                <Item label="Provinsi" value={peserta.provinsi} />
                <Item label="Kota" value={peserta.kota} />
                <Item label="Kecamatan" value={peserta.kecamatan} />
                <Item label="Kelurahan" value={peserta.kelurahan} />
              </Grid>

              <div
                className="
                  mt-4 rounded-xl p-4
                  bg-slate-50 dark:bg-slate-800
                "
              >
                <p className="text-xs opacity-60">Alamat Lengkap</p>
                <p className="font-medium">{peserta.alamatLengkap}</p>
              </div>
            </Section>

            <Section title="📎 Dokumen">
              <Grid>
                <FileItem
                  label="Surat Pengantar"
                  file={pendaftaran.suratPengantar}
                  baseUrl={FILE_BASE_URL}
                />
                <FileItem
                  label="Surat Balasan"
                  file={pendaftaran.suratBalasan}
                  baseUrl={FILE_BASE_URL}
                />
              </Grid>
            </Section>

            <Section title="📝 Catatan Admin">
              <div
                className="
                  rounded-xl p-5
                  bg-yellow-50 text-yellow-800
                  dark:bg-yellow-900/30 dark:text-yellow-200
                  border-l-4 border-yellow-400
                "
              >
                {pendaftaran.jawabanAdmin || "Belum ada catatan dari admin"}
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= UI COMPONENTS ================= */

function StatCard({ title, value, accent }: any) {
  const accentMap: any = {
    gold: "bg-[#FACC15]",
    amber: "bg-[#F59E0B]",
    maroon: "bg-[#7F1D1D]",
    rose: "bg-[#BE123C]",
  };

  return (
    <div className="
      relative overflow-hidden
      rounded-2xl p-6
      bg-white dark:bg-slate-900
      border border-slate-200 dark:border-slate-700
      shadow-lg
      transition hover:-translate-y-1 hover:shadow-2xl
    ">
      <div
        className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30 ${accentMap[accent]}`}
      />

      <div className="relative z-10 space-y-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <div className="text-lg font-bold text-slate-900 dark:text-white">
          {value}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="space-y-6">
      {/* TITLE */}
      <div
        className="
            flex items-center gap-3
            px-5 py-3
            rounded-2xl
            bg-linear-to-r from-[#FFF7ED] to-[#FDE68A]
            text-[#7F1D1D]
            dark:from-indigo-900/40 dark:to-purple-900/30
            dark:text-indigo-200
            text-base font-semibold
            shadow-sm
          "
      >
        {title}
      </div>

      {/* CONTENT */}
      {children}
    </div>
  );
}

function Grid({ children }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  );
}

function Item({ label, value }: any) {
  return (
    <div
      className="
        rounded-xl p-4
        bg-slate-50 dark:bg-slate-800
      "
    >
      <p className="text-xs opacity-60">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  );
}

function hitungSisaHari(selesai?: string) {
  if (!selesai) return null;

  // WAKTU WIB
  const todayWIB = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );

  const endWIB = new Date(
    new Date(selesai).toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );

  const diff = Math.ceil(
    (endWIB.getTime() - todayWIB.getTime()) / (1000 * 60 * 60 * 24),
  );

  return diff >= 0 ? diff : 0;
}

function hitungProgressMagang(mulai?: string, selesai?: string): number {
  if (!mulai || !selesai) return 0;

  const start = new Date(
    new Date(mulai).toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );

  const end = new Date(
    new Date(selesai).toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );

  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );

  if (end <= start) return 0;

  const totalHari = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

  const sisaHari = Math.max(
    0,
    Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );

  return Math.min(100, Math.max(0, ((totalHari - sisaHari) / totalHari) * 100));
}

function FileItem({
  label,
  file,
  baseUrl,
}: {
  label: string;
  file?: string;
  baseUrl: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="max-w-45 truncate text-sm font-medium">
          {file || "Tidak tersedia"}
        </p>
      </div>

      {file && (
        <a
          href={`${baseUrl}/uploads/${file}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-[#B91C1C] hover:text-[#7F1D1D] hover:underline"
        >
          Lihat
        </a>
      )}
    </div>
  );
}
