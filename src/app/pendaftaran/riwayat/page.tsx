// app/pendaftaran/riwayat/page.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import Navbar from "@/components/layouts/Navbar";
import {
  HiMail,
  HiSearch,
  HiUserGroup,
  HiPhone,
  HiBriefcase,
  HiLocationMarker,
  HiOfficeBuilding,
  HiCheckCircle,
  HiClock,
  HiXCircle,
  HiDocumentText,
  HiInformationCircle,
  HiCalendar,
  HiArrowRight,
  HiDownload,
  HiChatAlt2,
} from "react-icons/hi";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default function RiwayatPendaftaran() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  const FILE_BASE_URL = `${BASE_URL}/api/uploads`;

  const [popup, setPopup] = useState<{
    show: boolean;
    type: "error" | "warning" | "success";
    message: string;
  }>({
    show: false,
    type: "success",
    message: "",
  });

  const handleSearch = async () => {
    if (!email) {
      setPopup({
        show: true,
        type: "warning",
        message: "Silakan masukkan alamat email pendaftaran terlebih dahulu.",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setPopup({
        show: true,
        type: "warning",
        message: "Format email tidak valid. Contoh yang benar: nama@gmail.com",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${API_URL}/pendaftaran/cek?email=${encodeURIComponent(email)}`,
        {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            Accept: "application/json",
            "X-Timestamp": Date.now().toString(),
          },
          cache: "no-store",
        },
      );

      const data = await res.json();

      if (res.ok) {
        setResult(data);
        setPopup({
          show: true,
          type: "success",
          message: "Data riwayat pendaftaran berhasil ditemukan.",
        });
      } else {
        setResult(null);
        setPopup({
          show: true,
          type: "error",
          message: data.message || "Data pendaftaran tidak ditemukan dengan email tersebut.",
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      setPopup({
        show: true,
        type: "error",
        message: "Terjadi gangguan saat mencari data. Silakan coba beberapa saat lagi.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Disetujui":
        return {
          pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: <HiCheckCircle className="text-emerald-600 text-base" />,
          label: "Disetujui",
          desc: "Selamat! Permohonan magang Anda telah diterima dan disetujui.",
        };
      case "Ditolak":
        return {
          pill: "bg-rose-50 text-rose-700 border-rose-200",
          icon: <HiXCircle className="text-rose-600 text-base" />,
          label: "Ditolak",
          desc: "Mohon maaf, permohonan magang Anda saat ini belum dapat diterima.",
        };
      case "Sedang Diproses":
        return {
          pill: "bg-amber-50 text-amber-700 border-amber-200",
          icon: <HiClock className="text-amber-600 text-base" />,
          label: "Sedang Diproses",
          desc: "Permohonan magang Anda sedang dalam tahap penelaahan berkas oleh admin.",
        };
      default:
        return {
          pill: "bg-blue-50 text-[#0088FF] border-blue-200",
          icon: <HiInformationCircle className="text-[#0088FF] text-base" />,
          label: status || "Menunggu Verifikasi",
          desc: "Menunggu proses verifikasi administrasi oleh BBPOM di Palembang.",
        };
    }
  };

  const Popup = ({
    type,
    message,
    onClose,
  }: {
    type: "error" | "warning" | "success";
    message: string;
    onClose: () => void;
  }) => {
    useEffect(() => {
      if (type === "success") {
        const timer = setTimeout(() => {
          onClose();
        }, 2200);

        return () => clearTimeout(timer);
      }
    }, [type, onClose]);

    const config = {
      success: {
        title: "Pencarian Berhasil 🎉",
        icon: <HiCheckCircle className="text-3xl text-white" />,
        bg: "from-[#0088FF] to-[#38BDF8]",
        text: "text-slate-600",
      },
      warning: {
        title: "Perhatian",
        icon: <HiInformationCircle className="text-3xl text-white" />,
        bg: "from-amber-400 to-amber-500",
        text: "text-slate-600",
      },
      error: {
        title: "Data Tidak Ditemukan",
        icon: <HiXCircle className="text-3xl text-white" />,
        bg: "from-rose-500 to-rose-600",
        text: "text-slate-600",
      },
    };

    const c = config[type];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          onClick={type !== "success" ? onClose : undefined}
        />

        <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 sm:p-7 text-center animate-scaleIn border border-slate-100">
          <div
            className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${c.bg} flex items-center justify-center shadow-lg mb-4`}
          >
            {c.icon}
          </div>

          <h3 className="text-lg font-bold text-[#0B1B3D]">
            {c.title}
          </h3>

          <p className={`mt-2 text-sm ${c.text} leading-relaxed`}>{message}</p>

          {type !== "success" ? (
            <button
              onClick={onClose}
              className="mt-6 w-full py-2.5 rounded-xl font-semibold text-white bg-[#0088FF] hover:bg-[#0073E6] shadow-md shadow-blue-500/20 transition-all text-sm"
            >
              Mengerti
            </button>
          ) : (
            <p className="mt-4 text-xs text-slate-400">
              Jendela akan tertutup otomatis...
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div
        className={`min-h-screen bg-[#F8FAFC] relative overflow-hidden pt-28 md:pt-36 pb-16 px-4 sm:px-6 lg:px-8 ${plusJakarta.className}`}
      >
        {/* Ambient Top Glow Ornaments */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#EBF5FF]/70 via-[#F8FAFC]/40 to-transparent pointer-events-none -z-10" />
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-[#0088FF]/5 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute -top-32 right-1/4 w-96 h-96 bg-[#38BDF8]/5 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto">
          {/* HEADER SECTION */}
          <div className="text-center mb-10 md:mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-[#0088FF] text-xs font-semibold tracking-wide uppercase mb-3.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#0088FF] animate-pulse" />
              Pelacakan Berkas Online
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#0B1B3D] tracking-tight leading-tight">
              Riwayat & Status <span className="text-[#0088FF]">Pendaftaran Magang</span>
            </h1>
            <p className="text-slate-600 mt-3 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Masukkan alamat email yang Anda gunakan saat mengajukan pendaftaran magang untuk memantau status verifikasi dan hasil seleksi berkas.
            </p>
          </div>

          {/* SEARCH CARD */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 sm:p-8 mb-8">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
              Cari Berdasarkan Alamat Email Terdaftar
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <HiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                <input
                  type="email"
                  placeholder="Masukkan email Anda (contoh: nama@gmail.com)"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-[#0088FF] focus:ring-2 focus:ring-blue-100 outline-none text-sm sm:text-base transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
              </div>

              <button
                onClick={handleSearch}
                disabled={loading}
                className={`flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#0088FF] hover:bg-[#0073E6] text-white font-semibold shadow-md shadow-blue-500/20 transition-all text-sm sm:text-base shrink-0 active:scale-98 ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Mencari...</span>
                  </>
                ) : (
                  <>
                    <HiSearch className="text-lg" />
                    <span>Cari Riwayat</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-2">
              <span>Pastikan email yang dimasukkan sama persis dengan yang diisi pada formulir.</span>
              <Link
                href="/pendaftaran"
                className="text-[#0088FF] font-semibold hover:underline inline-flex items-center gap-1 shrink-0"
              >
                <span>Belum mendaftar? Ajukan Sekarang</span>
                <HiArrowRight />
              </Link>
            </div>
          </div>

          {/* ================= RESULT DATA ================= */}
          {result && (
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-6 sm:p-10 space-y-8 animate-fadeIn">
              {/* SECTION A: STATUS PERMOHONAN */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1B3D]">
                      Status Permohonan Magang
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Kategori: <span className="font-semibold text-slate-700 capitalize">{result.kategori || "Individu"}</span> • Jumlah Peserta: <span className="font-semibold text-slate-700">{result.peserta?.length || 1} Orang</span>
                    </p>
                  </div>

                  {(() => {
                    const badge = getStatusBadge(result.status);
                    return (
                      <div className="self-start sm:self-auto">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${badge.pill}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Status Description Alert */}
                <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-600 flex items-start gap-2.5">
                  <HiInformationCircle className="text-[#0088FF] text-lg shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">
                      Informasi Perkembangan Seleksi:
                    </p>
                    <p className="mt-0.5">{getStatusBadge(result.status).desc}</p>
                  </div>
                </div>

                {/* Catatan / Jawaban Admin */}
                {result.jawabanAdmin && (
                  <div className="mt-4 bg-blue-50/60 border border-blue-200/70 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#0B1B3D] mb-1.5">
                      <HiChatAlt2 className="text-[#0088FF] text-lg" />
                      <span>Catatan dari Admin Verifikator BBPOM:</span>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed pl-6">
                      {result.jawabanAdmin}
                    </p>
                  </div>
                )}

                {/* DOKUMEN LAMPIRAN */}
                <div className="mt-6 flex flex-wrap gap-3">
                  {result.suratPengantar && (
                    <a
                      href={`${FILE_BASE_URL}/${result.suratPengantar}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs sm:text-sm shadow-2xs hover:border-[#0088FF] hover:text-[#0088FF] transition-colors"
                    >
                      <HiDocumentText className="text-base text-[#0088FF]" />
                      <span>Lihat Surat Pengantar Saya</span>
                    </a>
                  )}

                  {/* SURAT BALASAN RESMI */}
                  {result.suratBalasan ? (
                    <a
                      href={`${FILE_BASE_URL}/${result.suratBalasan}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors"
                    >
                      <HiDownload className="text-base" />
                      <span>Unduh Surat Balasan Resmi BBPOM</span>
                    </a>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-medium text-xs sm:text-sm cursor-not-allowed">
                      <HiClock className="text-base" />
                      <span>Surat Balasan Belum Diterbitkan</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION B: DATA PESERTA */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0088FF] flex items-center justify-center text-lg">
                    <HiUserGroup />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#0B1B3D]">
                      Daftar Data Peserta Magang
                    </h3>
                    <p className="text-xs text-slate-500">
                      Rincian data peserta yang tercatat pada permohonan magang ini.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {result.peserta?.map((p: any, i: number) => (
                    <div
                      key={i}
                      className="relative rounded-2xl p-5 sm:p-6 bg-slate-50/50 border border-slate-200/80 hover:border-[#0088FF]/30 transition-all space-y-4"
                    >
                      {/* Top Bar: Avatar, Nama, Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0088FF] to-[#38BDF8] text-white font-bold text-base flex items-center justify-center shadow-xs shrink-0">
                            {p.nama?.charAt(0).toUpperCase() || (i + 1)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm sm:text-base leading-snug">
                              {p.nama}
                            </h4>
                            <p className="text-xs text-[#0088FF] font-semibold mt-0.5">
                              {p.posisi}
                            </p>
                          </div>
                        </div>

                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0088FF] font-bold border border-blue-100 shrink-0">
                          Peserta {i + 1}
                        </span>
                      </div>

                      {/* Detail Data */}
                      <div className="space-y-2.5 text-xs sm:text-sm text-slate-600 pt-2 border-t border-slate-200/60">
                        {/* Periode Magang jika ada */}
                        {(p.tanggalMulaiMagang || p.tanggalSelesaiMagang) && (
                          <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                            <HiCalendar className="text-[#0088FF] text-base shrink-0" />
                            <span>
                              {p.tanggalMulaiMagang || "-"} s/d {p.tanggalSelesaiMagang || "-"}
                            </span>
                          </div>
                        )}

                        {/* Asal Kampus / Sekolah */}
                        {p.asal && (
                          <div className="flex items-start gap-2.5">
                            <HiOfficeBuilding className="text-slate-400 text-base shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-slate-700">
                                {p.asal.nama}
                              </p>
                              {p.asal.jurusan && (
                                <p className="text-xs text-slate-500">
                                  Jurusan: {p.asal.jurusan}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Email */}
                        <div className="flex items-center gap-2.5">
                          <HiMail className="text-slate-400 text-base shrink-0" />
                          <span className="truncate">{p.email}</span>
                        </div>

                        {/* WhatsApp */}
                        <div className="flex items-center gap-2.5">
                          <HiPhone className="text-emerald-500 text-base shrink-0" />
                          <span>{p.wa}</span>
                        </div>

                        {/* Domisili / Alamat */}
                        <div className="flex items-start gap-2.5">
                          <HiLocationMarker className="text-rose-400 text-base shrink-0 mt-0.5" />
                          <div>
                            <p className="leading-snug">{p.alamatLengkap}</p>
                            {(p.kelurahan || p.kecamatan || p.kota) && (
                              <p className="text-xs text-slate-400 mt-0.5">
                                {[p.kelurahan, p.kecamatan, p.kota, p.provinsi]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* POPUP FEEDBACK */}
          {popup.show && (
            <Popup
              type={popup.type}
              message={popup.message}
              onClose={() => setPopup({ ...popup, show: false })}
            />
          )}
        </div>
      </div>
    </>
  );
}
