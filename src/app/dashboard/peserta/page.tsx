"use client";

import { useEffect, useState, useCallback, useMemo } from "react"; // 🔥 TAMBAH useMemo
import MagangPopup from "@/components/ui/MagangPopup";
import {
  FiFileText,
  FiEye,
  FiClock,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiUserCheck,
  FiHome,
  FiGlobe,
  FiMap,
  FiNavigation,
  FiUsers,
} from "react-icons/fi";
import AnnouncementBox from "@/components/AnnouncementBox";

/* ================= TYPES ================= */

type Peserta = {
  idPeserta?: string; // 🔥 FIELD BARU (OPSIONAL)
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
  mentor?: Mentor;
  mentorNama?: string;
  mentorEmail?: string;
  mentorPosisi?: string;
};

type SuratSelesai = {
  email: string;
  nama: string;
  file: string;
  tanggalKirim: string;
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

function hitungSisaHari(selesai?: string) {
  if (!selesai) return null;
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

/* ================= MAIN ================= */

export default function PesertaDashboard() {
  // ================ SEMUA HOOKS DI ATAS ================
  const [pendaftaran, setPendaftaran] = useState<Pendaftaran | null>(null);
  const [open, setOpen] = useState(false);
  const [suratSelesai, setSuratSelesai] = useState<SuratSelesai | null>(null);
  const [emailLogin, setEmailLogin] = useState<string | null>(null);

  const FILE_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

  // 🔥 AMBIL EMAIL DARI TOKEN
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setEmailLogin(payload.email);
      }
    } catch (err) {
      console.error("Gagal parse token", err);
    }
  }, []);

  // 🔥 FETCH DATA PENDAFTARAN
  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !emailLogin) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pendaftaran/cek?email=${emailLogin}`,
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
  }, [emailLogin]);

  useEffect(() => {
    if (emailLogin) {
      fetchData();
    }
  }, [emailLogin, fetchData]);

  // 🔥 FETCH SURAT SELESAI
  const fetchSuratSelesai = useCallback(async (email: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/surat-selesai/cek?email=${email}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.ok) {
        const data = await res.json();

        if (data) {
          setSuratSelesai(data);
        } else {
          setSuratSelesai(null);
        }
      }
    } catch (err) {
      console.log("Surat selesai belum tersedia");
    }
  }, []);

  // 🔥 GUNAKAN useMemo UNTUK COMPUTED VALUES (TIDAK BOLEH DI BODY KOMPONEN)
  const peserta = useMemo(() => {
    if (!pendaftaran || !emailLogin) return null;
    return pendaftaran.peserta.find(
      (p) => p.email.toLowerCase() === emailLogin?.toLowerCase(),
    );
  }, [pendaftaran, emailLogin]);

  // 🔥 GUNAKAN useEffect UNTUK FETCH SURAT (DI ATAS, SEBELUM CONDITIONAL RETURN)
  useEffect(() => {
    if (peserta?.email) {
      fetchSuratSelesai(peserta.email);
    }
  }, [peserta?.email, fetchSuratSelesai]);

  // 🔥 RESOLVE MENTOR - GUNAKAN useMemo
  const mentor = useMemo(() => {
    return {
      nama: peserta?.mentor?.name || peserta?.mentorNama || "Belum Ditentukan",
      email: peserta?.mentor?.email || peserta?.mentorEmail || "-",
      posisi: peserta?.mentor?.posisiMentor || peserta?.mentorPosisi || "-",
    };
  }, [peserta]);

  // 🔥 DURASI - GUNAKAN useMemo
  const durasi = useMemo(() => {
    return hitungDurasi(
      peserta?.tanggalMulaiMagang,
      peserta?.tanggalSelesaiMagang,
    );
  }, [peserta?.tanggalMulaiMagang, peserta?.tanggalSelesaiMagang]);

  const durasiText = durasi
    ? `(${durasi.bulan} bulan${durasi.hari ? ` ${durasi.hari} hari` : ""})`
    : "";

  // 🔥 SISA HARI - GUNAKAN useMemo
  const sisaHari = useMemo(() => {
    return hitungSisaHari(peserta?.tanggalSelesaiMagang);
  }, [peserta?.tanggalSelesaiMagang]);

  // 🔥 PROGRESS MAGANG - GUNAKAN useMemo
  const progressMagang = useMemo(() => {
    return hitungProgressMagang(
      peserta?.tanggalMulaiMagang,
      peserta?.tanggalSelesaiMagang,
    );
  }, [peserta?.tanggalMulaiMagang, peserta?.tanggalSelesaiMagang]);

  // ================ CONDITIONAL RENDER (SETELAH SEMUA HOOKS) ================
  if (!pendaftaran) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="animate-pulse text-slate-400">
          Memuat dashboard peserta...
        </span>
      </div>
    );
  }

  if (!peserta) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="text-slate-400">
          Data peserta untuk akun ini tidak ditemukan
        </span>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <>
      <MagangPopup
        nama={peserta.nama}
        tanggalMulai={peserta.tanggalMulaiMagang}
        tanggalSelesai={peserta.tanggalSelesaiMagang}
      />

      <div className="space-y-10">
        <AnnouncementBox type="peserta" />

        {/* HERO SECTION */}
        <div
          className="
              relative overflow-hidden
              rounded-[2.25rem]
              bg-linear-to-r
              from-[#7F1D1D] via-[#991B1B] to-[#D97706]
              dark:from-indigo-600 dark:via-purple-600 dark:to-fuchsia-600
              px-10 py-12
              shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)]
              text-white
            "
        >
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-24 w-md h-112 bg-black/10 rounded-full blur-3xl" />

          <div className="relative flex flex-col sm:flex-row items-center gap-8">
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
              {getInitial(peserta.nama)}
            </div>

            <div className="text-center sm:text-left space-y-2">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Halo, {peserta.nama}{" "}
                <span className="inline-block ml-1">👋</span>
              </h1>
              <p className="text-white/85 text-base md:text-lg">
                {peserta.email}
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

        {/* COUNTDOWN SECTION */}
        <div className="px-2 sm:px-0">
          <div className="max-w-6xl mx-auto space-y-4">
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

            <div className="space-y-2">
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="
                      h-full
                      bg-linear-to-r
                      from-[#FEF3C7] via-[#FACC15] to-[#B45309]
                      dark:from-indigo-500 dark:via-purple-500 dark:to-fuchsia-500
                      transition-all duration-500
                    "
                  style={{ width: `${progressMagang}%` }}
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

        {/* STAT CARDS */}
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

        {/* DETAIL ACCORDION */}
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
              className={`text-2xl transition-transform ${open ? "rotate-180" : ""}`}
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
                      mt-4
                      rounded-2xl
                      border
                      border-slate-200 dark:border-slate-700
                      bg-linear-to-br
                      from-slate-50 to-white
                      dark:from-slate-900 dark:to-slate-800
                      p-5
                      flex items-start gap-4
                      shadow-sm
                    "
                >
                  {/* Icon */}
                  <div
                    className="
                        w-12 h-12
                        rounded-xl
                        flex items-center justify-center
                        text-xl
                        bg-linear-to-br
                        from-[#FEE2E2] to-[#FEF3C7]
                        text-[#B91C1C]
                        dark:from-indigo-600/20 dark:to-violet-600/20
                        dark:text-indigo-300
                        shrink-0
                      "
                  >
                    <FiMapPin />
                  </div>

                  {/* Text */}
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Alamat Lengkap
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                      {peserta.alamatLengkap || "-"}
                    </p>
                  </div>
                </div>
              </Section>

              <Section title="📎 Dokumen">
                <DocumentFlow
                  pengantar={pendaftaran.suratPengantar}
                  balasan={pendaftaran.suratBalasan}
                  selesai={suratSelesai?.file}
                  baseUrl={FILE_BASE_URL}
                />
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
    </>
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
    <div
      className="
          relative overflow-hidden
          rounded-2xl p-6
          bg-white dark:bg-slate-900
          border border-slate-200 dark:border-slate-700
          shadow-lg
          transition hover:-translate-y-1 hover:shadow-2xl
        "
    >
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
  const iconMap: any = {
    "Nama Lengkap": <FiUser />,
    "Jenis Kelamin": <FiUserCheck />,
    Email: <FiMail />,
    WhatsApp: <FiPhone />,
    "Tempat Lahir": <FiMapPin />,
    "Tanggal Lahir": <FiCalendar />,

    "Kategori Magang": <FiUsers />,

    Provinsi: <FiGlobe />,
    Kota: <FiMap />,
    Kecamatan: <FiNavigation />,
    Kelurahan: <FiHome />,
  };

  return (
    <div
      className="
          group
          relative
          rounded-2xl
          p-4 sm:p-5
          border
          bg-white/80 dark:bg-slate-900/60
          border-slate-200 dark:border-slate-700
          shadow-sm hover:shadow-lg
          transition-all
          flex items-start gap-3
        "
    >
      {/* Icon */}
      <div
        className="
            w-10 h-10
            rounded-xl
            flex items-center justify-center
            text-lg
            bg-linear-to-br
            from-[#FEE2E2] to-[#FEF3C7]
            text-[#B91C1C]
            dark:from-indigo-600/20 dark:to-violet-600/20
            dark:text-indigo-300
            shrink-0
          "
      >
        {iconMap[label] || <FiUser />}
      </div>

      {/* Text */}
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 wrap-break-word">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

function DocumentFlow({
  pengantar,
  balasan,
  selesai,
  baseUrl,
}: {
  pengantar?: string;
  balasan?: string;
  selesai?: string;
  baseUrl: string;
}) {
  const steps = [
    {
      label: "Surat Pengantar",
      file: pengantar,
      step: 1,
    },
    {
      label: "Surat Balasan",
      file: balasan,
      step: 2,
    },
    {
      label: "Surat Selesai Magang",
      file: selesai,
      step: 3,
      isFinal: true,
    },
  ];

  return (
    <div className="relative">
      {/* Desktop connector line */}
      <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-700" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step, i) => (
          <div key={i} className="relative">
            <FlowCard
              label={step.label}
              file={step.file}
              step={step.step}
              baseUrl={baseUrl}
              isFinal={step.isFinal}
            />

            {/* Mobile connector */}
            {i < steps.length - 1 && (
              <div className="md:hidden flex justify-center my-2">
                <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FlowCard({
  label,
  file,
  step,
  baseUrl,
  isFinal = false,
}: {
  label: string;
  file?: string;
  step: number;
  baseUrl: string;
  isFinal?: boolean;
}) {
  const isAvailable = Boolean(file);

  return (
    <div
      className={`
          relative
          rounded-2xl
          p-5
          border
          flex flex-col gap-4
          transition
          shadow-sm hover:shadow-xl
          ${
            isAvailable
              ? isFinal
                ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700"
                : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700"
              : "bg-slate-50 border-slate-200 dark:bg-slate-800/60 dark:border-slate-700 opacity-80"
          }
        `}
    >
      {/* Step number */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0">
        <div
          className={`
              w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow
              ${
                isAvailable
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-300 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
              }
            `}
        >
          {isAvailable ? "✓" : step}
        </div>
      </div>

      {/* Content */}
      <div className="flex items-start gap-3 mt-2">
        <div
          className={`
              w-12 h-12 rounded-xl flex items-center justify-center text-xl mt-1
              ${
                isAvailable
                  ? isFinal
                    ? `
                      bg-emerald-100 text-emerald-600
                      dark:bg-emerald-500/20 dark:text-emerald-300
                    `
                    : `
                      bg-linear-to-br
                      from-[#FEE2E2] to-[#FEF3C7]
                      text-[#B91C1C]
                      dark:from-indigo-600/20 dark:to-violet-600/20
                      dark:text-indigo-300
                    `
                  : `
                    bg-slate-200 text-slate-400
                    dark:bg-slate-700 dark:text-slate-500
                  `
              }
            `}
        >
          {isAvailable ? <FiFileText /> : <FiClock />}
        </div>

        <div className="flex-1 min-w-0 mt-1">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {label}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {file || "Belum tersedia"}
          </p>
        </div>
      </div>

      {/* Action */}
      {isAvailable ? (
        <a
          href={`${baseUrl}/uploads/${file}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`
              mt-2
              inline-flex items-center justify-center gap-2
              w-full
              px-4 py-2.5
              rounded-xl
              text-sm font-semibold
              text-white
              transition
              ${
                isFinal
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : `
                    bg-linear-to-r
                    from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                    hover:from-[#991B1B] hover:via-[#DC2626] hover:to-[#FBBF24]
                    dark:from-indigo-600 dark:to-violet-500
                    dark:hover:from-indigo-500 dark:hover:to-violet-400
                  `
              }
            `}
        >
          <FiEye className="w-4 h-4" />
          Lihat Dokumen
        </a>
      ) : (
        <div className="text-center text-xs text-slate-400 mt-2">
          Menunggu dokumen
        </div>
      )}
    </div>
  );
}
