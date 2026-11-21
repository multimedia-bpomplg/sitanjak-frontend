"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  Mail,
  Phone,
  BookOpen,
  Bell,
  LogOut,
  ChevronRight,
  KeyRound,
  FileText,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { showToast } from "@/components/ui/toastDashboard";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { PesertaDashboardSkeleton } from "@/components/dashboard/skeletons";
import { isPkpaPeserta } from "@/lib/pesertaKategori";
import { InstallAppCard } from "@/components/peserta/InstallAppCard";
import { clearAuthSession } from "@/lib/authSession";
import {
  getDevicePushStatus,
  subscribeDevicePush,
  unsubscribeDevicePush,
} from "@/lib/pushNotification";

type Peserta = {
  idPeserta?: string;
  nama: string;
  email: string;
  wa: string;
  posisi: string;
  jurusan?: string;
  kategoriMagang?: "PKPA" | "Reguler";
  tanggalMulaiMagang: string;
  tanggalSelesaiMagang: string;
  kota?: string;
  mentor?: {
    name: string;
    email: string;
    posisiMentor: string;
  };
  mentorNama?: string;
  mentorEmail?: string;
  mentorPosisi?: string;
};

type Pendaftaran = {
  status: string;
  kategori: string;
  suratPengantar?: string;
  suratBalasan?: string;
  jawabanAdmin?: string;
  peserta: Peserta[];
};

type SuratSelesai = {
  email: string;
  nama: string;
  file: string;
  tanggalKirim: string;
};

const GUIDE_URL =
  "https://docs.google.com/document/d/1kBAVAJvKjtcx0jiZq1xnZ0nlhiGMcVJtobQeX6nQwWU/edit?usp=sharing";

const getInitial = (nama = "-") =>
  nama
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function formatPeriodDate(dateStr?: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function AkunPesertaPage() {
  const router = useRouter();
  const confirm = useConfirm();

  const [pendaftaran, setPendaftaran] = useState<Pendaftaran | null>(null);
  const [suratSelesai, setSuratSelesai] = useState<SuratSelesai | null>(null);
  const [sertifikat, setSertifikat] = useState<SuratSelesai | null>(null);
  const [canDownloadCompletionDocs, setCanDownloadCompletionDocs] = useState(false);
  const [emailLogin, setEmailLogin] = useState<string | null>(null);
  const [tokenMagangMeta, setTokenMagangMeta] = useState<{
    jurusan?: string;
    kategoriMagang?: string;
  } | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);

  // Accordion states
  const [openPasswordForm, setOpenPasswordForm] = useState(false);
  const [openDokumen, setOpenDokumen] = useState(false);

  // Notification toggle state
  const [deviceNotif, setDeviceNotif] = useState(false);
  const [togglingNotif, setTogglingNotif] = useState(false);
  const [guideHref, setGuideHref] = useState(GUIDE_URL);

  // Password form states
  const [passwordLama, setPasswordLama] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const FILE_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

  useEffect(() => {
    try {
      getDevicePushStatus()
        .then((subscribed) => {
          setDeviceNotif(subscribed);
          localStorage.setItem("peserta_device_notif", subscribed ? "1" : "0");
        })
        .catch(() => {});

      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setEmailLogin(payload.email);
        setTokenMagangMeta({
          jurusan: payload.jurusan,
          kategoriMagang: payload.kategoriMagang,
        });

        if (FILE_BASE_URL) {
          fetch(`${FILE_BASE_URL}/panduan`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => (r.ok ? r.json() : null))
            .then((json) => {
              const doc = json?.data?.peserta;
              if (doc?.fileUrl) {
                setGuideHref(`${FILE_BASE_URL}${doc.fileUrl}`);
              }
            })
            .catch(() => {});
        }
      }
    } catch (err) {
      console.error("Gagal parse token", err);
    }
  }, [FILE_BASE_URL]);

  const fetchAccountData = useCallback(async () => {
    if (!emailLogin) return;
    setLoadingPage(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      const [pendRes, selesaiRes, sertifikatRes, lapRes, fbRes] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/pendaftaran/cek?email=${encodeURIComponent(emailLogin)}`,
          { headers },
        ).catch(() => null),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/surat-selesai/cek?email=${encodeURIComponent(emailLogin)}`,
          { headers },
        ).catch(() => null),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/sertifikat/cek?email=${encodeURIComponent(emailLogin)}`,
          { headers },
        ).catch(() => null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir`, {
          headers,
        }).catch(() => null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/feedback/riwayat`, {
          headers,
        }).catch(() => null),
      ]);

      if (pendRes && pendRes.ok) {
        const data = await pendRes.json();
        setPendaftaran(data);
      }
      if (selesaiRes && selesaiRes.ok) {
        const sData = await selesaiRes.json();
        if (sData) setSuratSelesai(sData);
      }
      if (sertifikatRes && sertifikatRes.ok) {
        const cData = await sertifikatRes.json();
        if (cData) setSertifikat(cData);
      }
      const lapJson = lapRes && lapRes.ok ? await lapRes.json().catch(() => null) : null;
      const fbJson = fbRes && fbRes.ok ? await fbRes.json().catch(() => []) : [];
      setCanDownloadCompletionDocs(
        lapJson?.status === "Disetujui" &&
          Array.isArray(fbJson) &&
          fbJson.length > 0,
      );
    } catch (err) {
      console.error("Gagal memuat data akun peserta", err);
    } finally {
      setLoadingPage(false);
    }
  }, [emailLogin]);

  useEffect(() => {
    if (emailLogin) {
      fetchAccountData();
    }
  }, [emailLogin, fetchAccountData]);

  const peserta = useMemo(() => {
    if (!pendaftaran || !emailLogin) return null;
    return pendaftaran.peserta.find(
      (p) => p.email.toLowerCase() === emailLogin.toLowerCase(),
    );
  }, [pendaftaran, emailLogin]);

  const mentorName = useMemo(() => {
    return (
      peserta?.mentor?.name || peserta?.mentorNama || "Belum Ditentukan"
    );
  }, [peserta]);

  const isPkpa = useMemo(
    () => isPkpaPeserta(peserta) || isPkpaPeserta(tokenMagangMeta),
    [peserta, tokenMagangMeta],
  );

  const handleToggleNotif = async () => {
    if (togglingNotif) return;
    const nextState = !deviceNotif;
    setTogglingNotif(true);

    try {
      if (nextState) {
        await subscribeDevicePush();
        setDeviceNotif(true);
        localStorage.setItem("peserta_device_notif", "1");
        showToast.success(
          "Notifikasi perangkat aktif. Pemberitahuan akan masuk langsung ke HP Anda.",
        );
      } else {
        await unsubscribeDevicePush();
        setDeviceNotif(false);
        localStorage.setItem("peserta_device_notif", "0");
        showToast.success("Notifikasi perangkat dinonaktifkan");
      }
    } catch (err: unknown) {
      setDeviceNotif(false);
      localStorage.setItem("peserta_device_notif", "0");
      showToast.error(
        err instanceof Error
          ? err.message
          : "Gagal mengubah pengaturan notifikasi perangkat",
      );
    } finally {
      setTogglingNotif(false);
    }
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordLama || !passwordBaru || !konfirmasi) {
      showToast.error("Semua field wajib diisi");
      return;
    }

    if (passwordBaru !== konfirmasi) {
      showToast.error("Konfirmasi password tidak cocok");
      return;
    }

    if (passwordBaru.length < 8) {
      showToast.error("Password minimal 8 karakter");
      return;
    }

    setSubmittingPassword(true);
    const toastId = showToast.loading("Menyimpan password...");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast.updateError(
          toastId,
          "Sesi login habis. Silakan login ulang.",
        );
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/peserta/ganti-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            passwordLama,
            passwordBaru,
            konfirmasiPassword: konfirmasi,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error(
            "Sesi login Anda telah berakhir. Silakan login ulang.",
          );
        }
        throw new Error(data?.message || "Gagal mengganti password");
      }

      showToast.updateSuccess(
        toastId,
        "Password berhasil diganti. Silakan login ulang.",
      );

      setPasswordLama("");
      setPasswordBaru("");
      setKonfirmasi("");
      clearAuthSession();

      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 1500);
    } catch (err: unknown) {
      showToast.updateError(
        toastId,
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengganti password",
      );
    } finally {
      setSubmittingPassword(false);
    }
  };

  const handleLogout = () => {
    confirm({
      title: "Keluar dari Akun",
      message: "Apakah Anda yakin ingin keluar dari akun Peserta Magang?",
      confirmText: "Ya, Keluar",
      onConfirm: async () => {
        await unsubscribeDevicePush();
        clearAuthSession();
        localStorage.removeItem("peserta_device_notif");
        router.replace("/auth/login");
      },
    });
  };

  if (loadingPage) {
    return <PesertaDashboardSkeleton />;
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ================= 1. HEADER ================= */}
      <div className="pt-1">
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Akun Peserta
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
          Kelola informasi akun, program magang, dan keamanan akun Anda.
        </p>
      </div>

      {/* ================= 2. CARD PROFIL PESERTA ================= */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0747a8] border border-blue-800/70 p-5 sm:p-6 shadow-lg shadow-slate-900/15 text-white">
        {/* Aksen garis lingkaran tipis tanpa gradasi biru muda */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -bottom-14 w-44 h-44 rounded-full border border-white/10"
        />

        {/* Icon lencana emas di pojok kanan atas */}
        <div
          aria-hidden="true"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 border border-amber-300/60 flex items-center justify-center shadow-md"
        >
          <Award className="w-5 h-5 sm:w-6 sm:h-6 text-[#FCD34D] drop-shadow-xs" />
        </div>

        <div className="relative z-10 flex items-center gap-4 sm:gap-5">
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-linear-to-br from-[#FDE68A] via-[#F59E0B] to-[#D97706] border-2 border-amber-200/80 text-[#0B2A6B] font-extrabold text-xl sm:text-2xl flex items-center justify-center shrink-0 shadow-md">
            {getInitial(peserta?.nama || "P")}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap pr-12 sm:pr-14">
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight truncate">
                {peserta?.nama || "Peserta Magang"}
              </h2>
              {isPkpa && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-white/20 text-white border border-white/30 shrink-0">
                  PKPA
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-sky-100 mt-0.5">
              Peserta Magang
            </p>

            <div className="mt-3 pt-3 border-t border-white/15 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-5 text-sm text-white/95">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="w-4 h-4 text-sky-200 shrink-0" />
                <span className="truncate font-medium">
                  {peserta?.email || emailLogin || "-"}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Phone className="w-4 h-4 text-sky-200 shrink-0" />
                <span className="font-medium">{peserta?.wa || "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 3. CARD INFORMASI MAGANG ================= */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between gap-2 pb-3 sm:pb-3.5 border-b border-slate-100 dark:border-slate-700/70">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Informasi Magang
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            {isPkpa && (
              <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800">
                PKPA
              </span>
            )}
            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/70 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60">
              Aktif
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700/70 text-sm">
          <div className="py-3 sm:py-3.5 flex items-center justify-between gap-4">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">
              Perusahaan
            </span>
            <span className="font-bold text-slate-900 dark:text-white text-right">
              Balai Besar POM di Palembang
            </span>
          </div>

          <div className="py-3 sm:py-3.5 flex items-center justify-between gap-4">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">
              Posisi
            </span>
            <span className="font-bold text-slate-900 dark:text-white text-right">
              {peserta?.posisi || "-"}
            </span>
          </div>

          <div className="py-3 sm:py-3.5 flex items-center justify-between gap-4">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">
              Mentor Pembimbing
            </span>
            <span className="font-bold text-slate-900 dark:text-white text-right">
              {mentorName}
            </span>
          </div>

          <div className="py-3 sm:py-3.5 flex items-center justify-between gap-4">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">
              Lokasi Posisi
            </span>
            <span className="font-bold text-slate-900 dark:text-white text-right uppercase">
              KOTA PALEMBANG
            </span>
          </div>

          <div className="pt-3 sm:pt-3.5 flex items-center justify-between gap-4">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">
              Periode Magang
            </span>
            <span className="font-bold text-slate-900 dark:text-white text-right">
              {formatPeriodDate(peserta?.tanggalMulaiMagang)} -{" "}
              {formatPeriodDate(peserta?.tanggalSelesaiMagang)}
            </span>
          </div>
        </div>
      </div>

      {/* ================= 4. CARD DOKUMEN MAGANG ================= */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setOpenDokumen((v) => !v)}
          className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition"
        >
          <div className="flex items-center gap-3 sm:gap-3.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                Dokumen Resmi Magang
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Surat pengantar, surat balasan BBPOM, dan surat selesai.
              </p>
            </div>
          </div>
          <ChevronRight
            className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-400 transition-transform duration-200 ${
              openDokumen ? "rotate-90" : ""
            }`}
          />
        </button>

        {openDokumen && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2.5 border-t border-slate-100 dark:border-slate-700/70 space-y-2 bg-slate-50/40 dark:bg-slate-800/40">
            {[
              {
                label: "Surat Pengantar",
                file: pendaftaran?.suratPengantar,
                locked: false,
                protectedEndpoint: "",
              },
              {
                label: "Surat Balasan Resmi BBPOM",
                file: pendaftaran?.suratBalasan,
                locked: false,
                protectedEndpoint: "",
              },
              {
                label: "Surat Selesai Magang",
                file: suratSelesai?.file,
                locked: !canDownloadCompletionDocs,
                protectedEndpoint: `${FILE_BASE_URL}/surat-selesai/download?inline=1`,
              },
              {
                label: "Sertifikat Magang",
                file: sertifikat?.file,
                locked: !canDownloadCompletionDocs,
                protectedEndpoint: `${FILE_BASE_URL}/sertifikat/download?inline=1`,
              },
            ].map((doc, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-3.5 py-2.5 sm:py-3 flex items-center justify-between gap-2 text-sm"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {doc.label}
                </span>
                {doc.locked ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Selesaikan Laporan &amp; Survei</span>
                  </span>
                ) : doc.file ? (
                  doc.protectedEndpoint ? (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem("token") || "";
                          const res = await fetch(doc.protectedEndpoint!, {
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          if (!res.ok) {
                            const e = await res.json().catch(() => ({}));
                            throw new Error(e?.message || `Gagal membuka ${doc.label}`);
                          }
                          const blob = await res.blob();
                          const url = window.URL.createObjectURL(blob);
                          window.open(url, "_blank", "noopener,noreferrer");
                        } catch (err: unknown) {
                          showToast.error(
                            err instanceof Error
                              ? err.message
                              : `${doc.label} belum bisa diunduh`,
                          );
                        }
                      }}
                      className="inline-flex items-center gap-1 font-bold text-[#1D64F2] hover:underline"
                    >
                      <span>Lihat File</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <a
                      href={`${FILE_BASE_URL}/uploads/${doc.file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-[#1D64F2] hover:underline"
                    >
                      <span>Lihat File</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )
                ) : (
                  <span className="text-xs text-slate-400">
                    Belum tersedia
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= 5. CARD GANTI PASSWORD ================= */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setOpenPasswordForm((v) => !v)}
          className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition"
        >
          <div className="flex items-center gap-3 sm:gap-3.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                Ganti Password
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Perbarui kata sandi keamanan akun Anda.
              </p>
            </div>
          </div>
          <ChevronRight
            className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-400 transition-transform duration-200 ${
              openPasswordForm ? "rotate-90" : ""
            }`}
          />
        </button>

        {openPasswordForm && (
          <form
            onSubmit={handleSubmitPassword}
            className="px-4 sm:px-5 pb-4 sm:pb-5 pt-3 border-t border-slate-100 dark:border-slate-700/70 space-y-3 sm:space-y-3.5 bg-slate-50/40 dark:bg-slate-800/40"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Password Lama
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? "text" : "password"}
                  value={passwordLama}
                  onChange={(e) => setPasswordLama(e.target.value)}
                  placeholder="Masukkan password lama"
                  className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2 sm:py-2.5 pr-9 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#1D64F2]"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showOldPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Password Baru
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordBaru}
                  onChange={(e) => setPasswordBaru(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2 sm:py-2.5 pr-9 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#1D64F2]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={konfirmasi}
                  onChange={(e) => setKonfirmasi(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2 sm:py-2.5 pr-9 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#1D64F2]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingPassword}
              className="w-full py-2.5 sm:py-3 rounded-xl bg-[#1D64F2] hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition disabled:opacity-50"
            >
              {submittingPassword ? "Menyimpan..." : "Simpan Password Baru"}
            </button>
          </form>
        )}
      </div>

      {/* ================= 6. CARD PANDUAN PENGGUNA ================= */}
      <a
        href={guideHref}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-5 flex items-center justify-between gap-3 shadow-2xs hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition"
      >
        <div className="flex items-center gap-3 sm:gap-3.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-900 dark:text-white">
              Panduan Pengguna
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pelajari penggunaan SI TANJAK untuk Peserta.
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" />
      </a>

      {/* ================= 7. CARD INSTALL APLIKASI (PWA) ================= */}
      <InstallAppCard />

      {/* ================= 8. CARD NOTIFIKASI PERANGKAT ================= */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-5 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-slate-900 dark:text-white">
              Notifikasi perangkat
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
              Aktifkan agar pemberitahuan penting tetap masuk walau aplikasi
              sedang ditutup.
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={deviceNotif}
          disabled={togglingNotif}
          onClick={handleToggleNotif}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out disabled:opacity-60 ${
            deviceNotif ? "bg-[#1D64F2]" : "bg-slate-300 dark:bg-slate-600"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              deviceNotif ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* ================= 8. TOMBOL KELUAR DARI AKUN ================= */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full rounded-2xl bg-white dark:bg-slate-800/90 hover:bg-red-50/70 dark:hover:bg-red-950/30 border border-slate-200/80 dark:border-slate-700/80 py-3.5 sm:py-4 px-4 flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-bold text-base shadow-2xs transition"
      >
        <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
        <span>Keluar dari akun</span>
      </button>
    </div>
  );
}
