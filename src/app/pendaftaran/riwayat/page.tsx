"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  HiMail, 
  HiSearch, 
  HiUserGroup, 
  HiPhone, 
  HiBriefcase, 
  HiLocationMarker, 
  HiArrowLeft,
  HiOfficeBuilding, 
} from "react-icons/hi";

export default function RiwayatPendaftaran() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
        message: "Masukkan email terlebih dahulu",
      });
      return;
    }

    if (!email.endsWith("@gmail.com")) {
      setPopup({
        show: true,
        type: "warning",
        message: "Email harus Gmail. Contoh: nama@gmail.com",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:5000/api/pendaftaran/cek?email=${email}`
      );

      const data = await res.json();

      if (res.ok) {
        setResult(data);
        setPopup({
          show: true,
          type: "success",
          message: "Data pendaftaran berhasil ditemukan",
        });
      } else {
        setResult(null);
        setPopup({
          show: true,
          type: "error",
          message: data.message || "Data tidak ditemukan",
        });
      }
    } catch {
      setPopup({
        show: true,
        type: "error",
        message: "Terjadi kesalahan saat mencari data",
      });
    }

    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Disetujui":
        return "bg-green-100 text-green-800";
      case "Ditolak":
        return "bg-red-100 text-red-800";
      case "Sedang Diproses":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
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
    /* ================= AUTO CLOSE FOR SUCCESS ================= */
    useEffect(() => {
      if (type === "success") {
        const timer = setTimeout(() => {
          onClose();
        }, 2000); 

        return () => clearTimeout(timer);
      }
    }, [type, onClose]);

    /* ================= CONFIG ================= */
    const config = {
      success: {
        title: "Berhasil 🎉",
        icon: "✓",
        bg: "from-green-500 to-emerald-500",
        ring: "ring-green-400",
        text: "text-green-700",
      },
      warning: {
        title: "Perhatian",
        icon: "!",
        bg: "from-yellow-400 to-orange-400",
        ring: "ring-yellow-400",
        text: "text-yellow-700",
      },
      error: {
        title: "Gagal",
        icon: "✕",
        bg: "from-red-500 to-pink-500",
        ring: "ring-red-400",
        text: "text-red-700",
      },
    };

    const c = config[type];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* BACKDROP */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={type !== "success" ? onClose : undefined}
        />

        {/* CARD */}
        <div
          className="
            relative w-full max-w-sm mx-4
            rounded-3xl bg-white/95 backdrop-blur
            shadow-2xl
            px-6 pt-14 pb-6
            animate-[scaleIn_0.25s_ease-out]
          "
        >
          {/* ICON */}
          <div
            className={`
              absolute -top-8 left-1/2 -translate-x-1/2
              w-16 h-16 rounded-full
              bg-gradient-to-br ${c.bg}
              flex items-center justify-center
              text-white text-3xl font-bold
              ring-4 ${c.ring}
              shadow-lg
            `}
          >
            {c.icon}
          </div>

          {/* CONTENT */}
          <h3 className="text-xl font-extrabold text-gray-800 text-center">
            {c.title}
          </h3>

          <p className={`mt-2 text-center text-sm ${c.text}`}>
            {message}
          </p>

          {/* ACTION (HANYA ERROR & WARNING) */}
          {type !== "success" && (
            <button
              onClick={onClose}
              className="
                mt-6 w-full py-3 rounded-xl
                font-semibold text-white
                bg-gradient-to-r from-gray-800 to-gray-900
                hover:scale-[1.02] transition
              "
            >
              OK
            </button>
          )}

          {/* SUCCESS FOOTNOTE */}
          {type === "success" && (
            <p className="mt-4 text-xs text-center text-gray-400">
              Popup akan tertutup otomatis
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 py-16 px-4">
      {/* BUTTON KEMBALI */}
      <div className="mb-10 max-w-4xl mx-auto">
        <Link
          href="/"
          className="
            inline-flex items-center gap-3
            px-4 py-2
            rounded-xl
            bg-white/80 backdrop-blur
            border border-gray-200
            text-gray-700 font-medium
            shadow-sm
            hover:bg-white hover:border-blue-300
            hover:text-blue-700
            hover:shadow-md
            transition-all duration-200
          "
        >
          <span
            className="
              flex items-center justify-center
              w-8 h-8
              rounded-lg
              bg-blue-50
              text-blue-600
            "
          >
            <HiArrowLeft className="text-lg" />
          </span>

          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 tracking-tight">
            Riwayat Pendaftaran Magang
          </h1>
          <p className="text-gray-600 mt-3 text-lg">
            Masukkan email yang digunakan saat pendaftaran untuk melihat status
          </p>
        </div>

        {/* SEARCH CARD */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 mb-10">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <HiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 text-xl" />
              <input
                type="email"
                placeholder="nama@gmail.com"
                className="
                  w-full pl-12 pr-4 py-3 rounded-xl
                  border border-gray-300
                  text-gray-800
                  placeholder:text-gray-400
                  focus:ring-2 focus:ring-blue-500
                  outline-none
                "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              onClick={handleSearch}
              className="
                flex items-center justify-center gap-2
                px-6 py-3 rounded-xl
                bg-blue-600 text-white font-semibold
                hover:bg-blue-700
                transition
              "
            >
              <HiSearch className="text-lg" />
              {loading ? "Mencari..." : "Cari Data"}
            </button>
          </div>
        </div>

        {/* RESULT */}
        {result && (
          <div className="bg-white rounded-3xl shadow-xl p-8 space-y-10">

            {/* ================= INFO PENDAFTARAN ================= */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Informasi Pendaftaran
                </h2>

                <span
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(
                    result.status
                  )}`}
                >
                  {result.status}
                </span>
              </div>

              {result.jawabanAdmin && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-sm font-semibold text-blue-800 mb-1">
                    💬 Jawaban Admin
                  </p>
                  <p className="text-blue-700 text-sm">
                    {result.jawabanAdmin}
                  </p>
                </div>
              )}

              {result.suratPengantar && (
                <a
                  href={`http://localhost:5000/uploads/${result.suratPengantar}`}
                  target="_blank"
                  className="
                    inline-flex items-center gap-2
                    px-5 py-2.5 rounded-xl
                    bg-blue-100 text-blue-700 font-semibold
                    hover:bg-blue-200 transition
                  "
                >
                  📄 Lihat Surat Pengantar
                </a>
              )}
            </div>

            {/* DIVIDER */}
            <hr className="border-gray-200" />

            {/* ================= DATA PESERTA ================= */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <HiUserGroup className="text-2xl text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-800">
                  Data Peserta
                </h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {result.peserta.map((p: any, i: number) => (
                  <div
                    key={i}
                    className="
                      relative
                      rounded-3xl p-6
                      bg-gradient-to-br from-gray-50 via-white to-gray-100
                      border border-gray-200
                      shadow-sm hover:shadow-lg
                      transition-all duration-300
                    "
                  >
                    {/* BADGE PESERTA (KANAN ATAS) */}
                    <span
                      className="
                        absolute top-5 right-5
                        text-xs px-3 py-1 rounded-full
                        bg-blue-100 text-blue-700 font-semibold
                      "
                    >
                      Peserta {i + 1}
                    </span>

                    {/* HEADER */}
                    <div className="flex items-center gap-4 mb-6">
                      {/* AVATAR */}
                      <div
                        className="
                          w-12 h-12 rounded-full
                          bg-gradient-to-br from-blue-600 to-cyan-500
                          text-white font-bold text-lg
                          flex items-center justify-center
                          shadow
                        "
                      >
                        {p.nama?.charAt(0).toUpperCase()}
                      </div>

                      {/* NAMA */}
                      <p className="font-bold text-gray-800 text-lg leading-tight">
                        {p.nama}
                      </p>
                    </div>

                    {/* BODY */}
                    <div className="space-y-3 text-sm text-gray-700">
                      <div className="flex items-center gap-3">
                        <HiMail className="text-blue-600" />
                        <span>{p.email}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <HiPhone className="text-green-600" />
                        <span>{p.wa}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <HiBriefcase className="text-purple-600" />
                        <span>{p.posisi}</span>
                      </div>

                      <div className="flex items-start gap-3">
                        <HiLocationMarker className="text-orange-600 mt-0.5" />
                        <span>
                          {p.alamatLengkap}
                          <br />
                          <span className="text-xs text-gray-500">
                            {p.kelurahan}, {p.kecamatan}, {p.kota}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <HiOfficeBuilding className="text-indigo-600" />
                        <span>{p.provinsi}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {popup.show && (
          <Popup
            type={popup.type}
            message={popup.message}
            onClose={() => setPopup({ ...popup, show: false })}
          />
        )}
      </div>
    </div>
  );
}