"use client";

import { useEffect, useState } from "react";
import {
  HiX,
  HiDocumentText,
  HiUser,
  HiMail,
  HiPhone,
  HiIdentification,
  HiLocationMarker,
  HiCalendar,
  HiBriefcase,
  HiCheckCircle,
  HiXCircle,
} from "react-icons/hi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import AlertPopup from "@/components/ui/AlertPopup";

/* ===================== TYPE ===================== */
type Peserta = {
  nama: string;
  email: string;
  wa: string;
  posisi: string;

  // ✅ ASAL (TAMBAHAN)
  asal?: {
    jenis: "Universitas" | "SMK";
    nama: string;
  };

  mentor?: {
    _id: string;
    name: string;
    email: string;
    posisiMentor: string;
  };

  jurusan?: string; // ⬅️ TAMBAHKAN

  tanggalMulaiMagang: string;
  tanggalSelesaiMagang: string;

  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;

  provinsi: string;
  kota: string;
  kecamatan: string;
  kelurahan: string;
  alamatLengkap: string;
  isTerdaftar: boolean;
};

type Pendaftaran = {
  _id: string;
  kategori: "sendiri" | "bersama";
  jumlahPeserta: number;
  peserta: Peserta[];

  mentor?: {
    _id: string;
    name: string;
    email: string;
    posisiMentor: string;
  };

  suratPengantar: string;
  status: "Menunggu" | "Sedang Diproses" | "Disetujui" | "Ditolak";
  jawabanAdmin?: string;
  createdAt: string;
};

type Mentor = {
  _id: string;
  name: string;
  email: string;
  posisiMentor: string;
};

const POSISI_MAGANG = [
  "IT / Programmer",
  "Administrasi",
  "Desain Grafis",
  "Humas",
  "Analis Data",
];

/* ================== HITUNG DURASI MAGANG ================== */
const hitungDurasiMagang = (mulai: string, selesai: string) => {
  if (!mulai || !selesai) return null;

  const start = new Date(mulai);
  const end = new Date(selesai);

  if (end < start) return null;

  const diffTime = end.getTime() - start.getTime();
  const totalHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const bulan = Math.floor(totalHari / 30);
  const sisaHari = totalHari % 30;

  return {
    totalHari,
    bulan,
    sisaHari,
  };
};

/* ===================== PAGE ===================== */
export default function ViewPendaftaranPage() {
  const [data, setData] = useState<Pendaftaran[]>([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<Pendaftaran | null>(null);
  const [alasan, setAlasan] = useState("");

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState<string | undefined>();
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<
    "success" | "error" | "warning" | "info"
  >("info");
  const [editPosisiIndex, setEditPosisiIndex] = useState<number | null>(null);
  const [posisiBaru, setPosisiBaru] = useState("");
  const [mentorList, setMentorList] = useState<Mentor[]>([]);
  const [mentorModal, setMentorModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<string>("");
  const hasMentor = Boolean(selected?.mentor?.name && selected?.mentor?.email);
  const [selectedPesertaEmail, setSelectedPesertaEmail] = useState<string>("");

  const showAlert = (
    type: "success" | "error" | "warning" | "info",
    message: string,
    title?: string,
  ) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOpen(true);
  };

  const closeModal = () => {
    setSelected(null);
    setAlasan("");
  };

  const isAktif = selected?.status === "Disetujui";

  /* ===================== LOAD DATA ===================== */
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pendaftaran`);
      const json = await res.json();
      setData(json);
    } catch {
      showAlert("error", "Gagal memuat data", "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ===================== LOAD AKUN PESERTA ===================== */
  const fetchAkunPeserta = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/peserta`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const result = await res.json();
      setAkunPeserta(result);
    } catch (error) {
      console.error("Gagal mengambil data akun peserta");
    }
  };

  useEffect(() => {
    fetchAkunPeserta();

    const handleFocus = () => {
      fetchAkunPeserta();
    };

    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);

  /* ===================== UPDATE STATUS ===================== */
  const updateStatus = async (status: "Disetujui" | "Ditolak") => {
    if (!selected?._id) {
      showAlert("error", "Data pendaftaran tidak valid", "Kesalahan");
      return;
    }

    if (!alasan.trim()) {
      showAlert(
        "warning",
        "Silakan isi alasan sebelum melanjutkan proses.",
        "Alasan Wajib Diisi",
      );
      return;
    }

    // ❗ Wajib upload surat jika disetujui
    if (status === "Disetujui" && !suratBalasan) {
      showAlert(
        "warning",
        "Surat balasan wajib diunggah sebelum pendaftaran disetujui.",
        "Dokumen Belum Lengkap",
      );
      return;
    }

    try {
      const formData = new FormData();
      formData.append("status", status);
      formData.append("jawabanAdmin", alasan);
      if (suratBalasan) formData.append("suratBalasan", suratBalasan);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pendaftaran/${selected._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        },
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Gagal memperbarui status");
      }

      showAlert(
        "success",
        "Status pendaftaran dan surat balasan berhasil diproses.",
        "Berhasil",
      );

      // 🔥 PENTING: reload data DULU
      await loadData();

      // 🔥 BARU tutup modal
      closeModal();
    } catch (error: any) {
      showAlert("error", error.message || "Terjadi kesalahan", "Gagal");
    }
  };

  /* ===================== SUMMARY ===================== */
  const totalPendaftar = data.length;
  const disetujui = data.filter((d) => d.status === "Disetujui").length;
  const ditolak = data.filter((d) => d.status === "Ditolak").length;

  const showValue = (value?: string) => {
    if (!value || value.trim() === "") return "-";
    return value;
  };

  const [suratBalasan, setSuratBalasan] = useState<File | null>(null);

  const [akunPeserta, setAkunPeserta] = useState<AkunPeserta[]>([]);

  const isAkunTerdaftar = (email?: string) => {
    if (!email) return false;

    return akunPeserta.some(
      (akun) => akun.email.toLowerCase() === email.toLowerCase(),
    );
  };

  /* ===================== SEARCH ===================== */
  const [search, setSearch] = useState("");

  /* ===================== PAGINATION ===================== */
  const LIMIT = 10;
  const [page, setPage] = useState(1);

  /* ===================== FILTER DATA (SEARCH NAMA) ===================== */
  const filteredData = data.filter((item) =>
    item.peserta?.[0]?.nama?.toLowerCase().includes(search.toLowerCase()),
  );

  /* ===================== PAGINATED DATA ===================== */
  const totalPage = Math.ceil(filteredData.length / LIMIT);

  const paginatedData = filteredData.slice((page - 1) * LIMIT, page * LIMIT);

  /* ===================== DOWNLOAD EXCEL (RAPI) ===================== */
  const downloadExcel = () => {
    if (data.length === 0) {
      showAlert(
        "error",
        "Tidak ada data pendaftaran yang dapat diunduh.",
        "Data Kosong",
      );
      return;
    }

    const excelData = data.flatMap((pendaftaran, index) =>
      pendaftaran.peserta.map((p) => ({
        No: index + 1,
        "Nama Lengkap": p.nama,
        Email: p.email,
        "No WhatsApp": p.wa,
        "Posisi Magang": p.posisi,
        "Kategori Pendaftaran": pendaftaran.kategori,
        "Status Pendaftaran": pendaftaran.status,
        "Mulai Magang": p.tanggalMulaiMagang,
        "Selesai Magang": p.tanggalSelesaiMagang,
        "Tempat Lahir": p.tempatLahir,
        "Tanggal Lahir": p.tanggalLahir,
        "Jenis Kelamin": p.jenisKelamin,
        Provinsi: p.provinsi,
        Kota: p.kota,
        Kecamatan: p.kecamatan,
        Kelurahan: p.kelurahan,
        "Alamat Lengkap": p.alamatLengkap,
        "Tanggal Daftar": new Date(pendaftaran.createdAt).toLocaleDateString(),
      })),
    );

    // Buat worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    /* ===================== STYLE HEADER ===================== */
    const headerStyle = {
      font: { bold: true },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
    };

    const range = XLSX.utils.decode_range(worksheet["!ref"]!);

    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = headerStyle;
      }
    }

    /* ===================== COLUMN WIDTH (RAPI) ===================== */
    worksheet["!cols"] = [
      { wch: 5 }, // No
      { wch: 25 }, // Nama
      { wch: 30 }, // Email
      { wch: 18 }, // WA
      { wch: 20 }, // Posisi
      { wch: 18 }, // Kategori
      { wch: 18 }, // Status
      { wch: 15 }, // Mulai
      { wch: 15 }, // Selesai
      { wch: 20 }, // Tempat lahir
      { wch: 15 }, // Tgl lahir
      { wch: 15 }, // Gender
      { wch: 18 }, // Provinsi
      { wch: 18 }, // Kota
      { wch: 18 }, // Kecamatan
      { wch: 18 }, // Kelurahan
      { wch: 40 }, // Alamat
      { wch: 18 }, // Tgl daftar
    ];

    /* ===================== WRAP TEXT UNTUK ISI ===================== */
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (worksheet[addr]) {
          worksheet[addr].s = {
            alignment: { vertical: "top", wrapText: true },
          };
        }
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pendaftaran");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      cellStyles: true,
    });

    const file = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(file, `data-pendaftaran-${Date.now()}.xlsx`);
  };

  const simpanPosisi = async (index: number) => {
    if (!selected?._id || !posisiBaru) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/pendaftaran/${selected._id}/posisi`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            indexPeserta: index,
            posisi: posisiBaru,
          }),
        },
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Gagal memperbarui posisi");
      }

      // 🔥 update local state (tanpa reload)
      const updated: Pendaftaran = {
        ...selected,
        peserta: selected.peserta.map((p, i) =>
          i === index ? { ...p, posisi: posisiBaru } : p,
        ),
      };

      setSelected(updated);

      setEditPosisiIndex(null);
      showAlert("success", "Posisi magang berhasil diperbarui");
    } catch (err: any) {
      showAlert("error", err.message || "Gagal mengubah posisi");
    }
  };

  const fetchMentor = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/mentor`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Gagal memuat data mentor");
      }

      // ✅ HANYA MENTOR AKTIF
      setMentorList(result.filter((m: any) => m.status === "Aktif"));
    } catch (err: any) {
      showAlert("error", err.message || "Gagal memuat mentor");
    }
  };

  useEffect(() => {
    if (mentorModal) {
      fetchMentor();
    }
  }, [mentorModal]);

  return (
    <div
      className="
            min-h-screen p-4 sm:p-6
            bg-gradient-to-br
            from-slate-50 via-white to-indigo-50
            dark:from-[#020617] dark:via-[#020617] dark:to-[#1E1B4B]
            text-slate-800 dark:text-slate-100
            transition-colors
          "
    >
      <h1 className="text-3xl font-bold tracking-tight mb-8">
        Data Pendaftaran
      </h1>

      {/* ===================== SUMMARY CARD ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <SummaryCard title="Jumlah Pendaftar" value={totalPendaftar} />
        <SummaryCard title="Disetujui" value={disetujui} color="green" />
        <SummaryCard title="Ditolak" value={ditolak} color="red" />
      </div>

      {/* ===================== SEARCH & EXPORT ===================== */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* SEARCH */}
        <div
          className="
                  relative
                  w-full sm:max-w-sm
                "
        >
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            🔍
          </span>

          <input
            type="text"
            placeholder="Cari nama peserta..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="
                    w-full
                    pl-10 pr-4 py-2.5
                    rounded-xl
                    border border-slate-300 dark:border-slate-700
                    bg-white dark:bg-slate-800
                    text-sm
                    text-slate-700 dark:text-slate-100
                    placeholder:text-slate-400
                    focus:outline-none
                    focus:ring-2 focus:ring-[#B91C1C]/70 dark:focus:ring-indigo-500/70
                    transition
                  "
          />
        </div>

        {/* DOWNLOAD */}
        <button
          onClick={downloadExcel}
          className="
                  inline-flex items-center justify-center gap-2
                  px-5 py-2.5
                  rounded-xl
                  text-sm font-semibold
                  text-white
                  bg-gradient-to-r from-emerald-500 to-green-600
                  hover:opacity-90
                  shadow-md hover:shadow-lg
                  transition
                  w-full sm:w-auto
                "
        >
          <HiDocumentText className="text-lg" />
          Download Excel
        </button>
      </div>

      {/* ===================== TABLE ===================== */}
      <div
        className="
              rounded-2xl
              bg-white/80 dark:bg-slate-900/80
              backdrop-blur
              shadow-xl
              border border-slate-200 dark:border-slate-800
            "
      >
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
            <thead
              className="
                    bg-slate-100 dark:bg-slate-800
                    text-slate-600 dark:text-slate-300
                    text-xs uppercase tracking-wider
                  "
            >
              <tr>
                <th className="px-6 py-4 text-center">No</th>
                <th className="px-6 py-4 text-left">Nama Perwakilan</th>
                <th className="px-6 py-4 text-left">Email</th>
                <th className="px-6 py-4 text-center">Posisi</th>
                <th className="px-6 py-4 text-center">Kategori</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center">
                    Memuat data...
                  </td>
                </tr>
              )}

              {!loading &&
                paginatedData.map((item, i) => (
                  <tr
                    key={item._id}
                    className="
                            border-t border-slate-200 dark:border-slate-800
                          hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10
                            transition
                          "
                  >
                    <td className="px-6 py-4 text-center">{i + 1}</td>
                    <td
                      className="
                              px-6 py-4 font-medium
                              text-indigo-600 dark:text-indigo-400
                              hover:underline cursor-pointer
                            "
                      onClick={() => setSelected(item)}
                    >
                      {item.peserta[0]?.nama}
                    </td>

                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {showValue(item.peserta[0]?.email)}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {item.peserta[0]?.posisi}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.kategori === "bersama" ? "Bersama" : "Sendiri"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {/* ===================== PAGINATION BUTTON ===================== */}
          {totalPage > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 py-5">
              {/* PREV */}
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="
                        px-4 py-2
                        rounded-lg
                        text-sm font-medium
                        border
                        border-slate-300 dark:border-slate-600
                        bg-white dark:bg-slate-900
                        text-[#7F1D1D]  dark:text-indigo-200
                        hover:bg-[#FFF1F2] dark:hover:bg-indigo-900/30
                        disabled:opacity-40 disabled:cursor-not-allowed
                        transition
                      "
              >
                Prev
              </button>

              {/* PAGE NUMBER */}
              {Array.from({ length: totalPage }).map((_, i) => {
                const active = page === i + 1;

                return (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`
                            min-w-[38px] h-[38px]
                            rounded-lg
                            text-sm font-semibold
                            transition
                            ${
                              active
                                ? "bg-[#B91C1C] text-white shadow dark:bg-indigo-600"
                                : `
                                  bg-white dark:bg-slate-900
                                  text-[#7F1D1D] dark:text-indigo-200
                                  border border-slate-300 dark:border-slate-600
                                  hover:bg-[#FFF1F2] dark:hover:bg-indigo-900/30
                                `
                            }
                          `}
                  >
                    {i + 1}
                  </button>
                );
              })}

              {/* NEXT */}
              <button
                disabled={page === totalPage}
                onClick={() => setPage((p) => p + 1)}
                className="
                        px-4 py-2
                        rounded-lg
                        text-sm font-medium
                        border
                        border-slate-300 dark:border-slate-600
                        bg-white dark:bg-slate-900
                        text-[#7F1D1D]  dark:text-indigo-200
                        hover:bg-[#FFF1F2] dark:hover:bg-indigo-900/30
                        disabled:opacity-40 disabled:cursor-not-allowed
                        transition
                      "
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===================== MODAL DETAIL ===================== */}
      {selected && (
        <div className="fixed inset-y-0 right-0 left-0 lg:left-72 z-40 flex">
          {/* OVERLAY (AREA CONTENT SAJA) */}
          <div
            className="absolute inset-y-0 right-0 left-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* MODAL CONTAINER */}
          <div
            className="
                    relative
                    w-full h-full
                    bg-gradient-to-br
                    from-white via-[#FFF5F5] to-[#FDECEC]
                    dark:from-[#0B0614] dark:via-[#120A24] dark:to-[#1E0F3D]
                    flex flex-col
                  "
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div
              className="
                      sticky top-0 z-50
                      flex items-center justify-between
                      px-6 py-4

                      /* ===== BACKGROUND ===== */
                      bg-gradient-to-r
                      from-[#FCA5A5] via-[#FDE8E8] to-white
                      dark:from-indigo-900 dark:via-violet-800 dark:to-purple-800

                      /* ===== BORDER & SHADOW ===== */
                      border-b border-blue-200 dark:border-indigo-800/40
                      shadow-lg

                      /* ===== TEXT ===== */
                      text-blue-950 dark:text-indigo-50
                    "
            >
              {/* LEFT */}
              <div className="flex items-center gap-4">
                <div
                  className="
                          w-11 h-11
                          rounded-xl
                          bg-white/80 dark:bg-white/10
                          flex items-center justify-center
                          shadow
                        "
                >
                  <HiDocumentText className="text-2xl text-[#B91C1C] dark:text-indigo-300" />
                </div>

                <div className="leading-tight">
                  <p className="text-xs font-medium text-blue-900/70 dark:text-indigo-200/80">
                    Detail
                  </p>
                  <h2 className="text-lg font-semibold tracking-tight text-blue-950 dark:text-white">
                    Pendaftaran Magang
                  </h2>
                </div>
              </div>

              {/* CLOSE BUTTON */}
              <button
                onClick={closeModal}
                className="
                        w-10 h-10
                        flex items-center justify-center
                        rounded-full
                        text-blue-900 dark:text-indigo-200
                        hover:bg-white/70 dark:hover:bg-white/10
                        transition
                      "
              >
                <HiX className="text-xl" />
              </button>
            </div>

            {/* ================= CONTENT ================= */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* ================= SURAT PENGANTAR ================= */}
              <div
                className="
                        rounded-2xl
                        p-5
                        bg-gradient-to-br
                        from-[#FFF1F2] to-[#FFE4E6]
                        dark:from-indigo-500/10 dark:to-violet-500/10
                        border-[#FCA5A5] dark:border-indigo-700/40
                        flex flex-col sm:flex-row sm:items-center sm:justify-between
                        gap-4
                      "
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#B91C1C] dark:bg-indigo-700 text-white flex items-center justify-center">
                    <HiDocumentText className="text-xl" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Surat Pengantar
                    </p>
                    <p className="font-semibold text-slate-800 dark:text-white">
                      File Surat Pengantar Magang
                    </p>
                  </div>
                </div>

                <a
                  href={`http://localhost:5000/uploads/${selected.suratPengantar}`}
                  target="_blank"
                  className="
                          inline-flex items-center gap-2
                          px-5 py-2.5
                          rounded-xl
                          text-sm font-semibold
                          text-white
                          transition
                          bg-[#B91C1C] hover:bg-[#991B1B]
                          dark:bg-indigo-600 dark:hover:bg-indigo-700
                        "
                >
                  <HiDocumentText />
                  Lihat Surat
                </a>
              </div>

              {/* ===================== DATA PESERTA ===================== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {selected.peserta.map((p, i) => (
                  <div
                    key={i}
                    className="
                            rounded-2xl
                            bg-white/90
                            dark:bg-[#140B2D]/80
                            border-[#FCA5A5]
                            dark:border-indigo-700/40
                            p-6
                            shadow-sm
                          "
                  >
                    {/* HEADER PESERTA */}
                    <div
                      className="
                      mb-4
                      flex flex-col gap-3
                      sm:flex-row sm:items-center sm:justify-between
                    "
                    >
                      <div
                        className="
                        flex flex-col gap-2 w-full
                        sm:flex-row sm:w-auto sm:items-center
                      "
                      >
                        <HiUser className="text-[#B91C1C] dark:text-indigo-400" />
                        <h3 className="text-lg font-semibold text-[#B91C1C] dark:text-indigo-400">
                          Peserta {i + 1}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        {editPosisiIndex === i ? (
                          <>
                            <select
                              value={posisiBaru}
                              onChange={(e) => setPosisiBaru(e.target.value)}
                              className="
                                w-full sm:w-auto
                                text-xs
                                px-3 py-2
                                rounded-lg
                                border
                                border-slate-300 dark:border-slate-600
                                bg-white dark:bg-slate-800
                              "
                            >
                              <option value="">Pilih Posisi</option>
                              {POSISI_MAGANG.map((pos) => (
                                <option key={pos} value={pos}>
                                  {pos}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() => simpanPosisi(i)}
                              className="
                                w-full sm:w-auto
                                text-xs
                                px-3 py-2
                                rounded-lg
                                bg-emerald-600 hover:bg-emerald-700
                                text-white
                                transition
                              "
                            >
                              Simpan
                            </button>

                            <button
                              onClick={() => setEditPosisiIndex(null)}
                              className="
                                w-full sm:w-auto
                                text-xs
                                px-3 py-2
                                rounded-lg
                                bg-slate-300 hover:bg-slate-400
                                dark:bg-slate-600
                                transition
                              "
                            >
                              Batal
                            </button>
                          </>
                        ) : (
                          <>
                            <span
                              className="
                                text-xs font-semibold
                                px-3 py-1 rounded-full
                                bg-[#FEE2E2] text-[#7F1D1D]
                                dark:bg-indigo-500/20 dark:text-indigo-300
                                flex items-center gap-1
                              "
                            >
                              <HiBriefcase />
                              {p.posisi}
                            </span>

                            <button
                              onClick={() => {
                                setEditPosisiIndex(i);
                                setPosisiBaru(p.posisi);
                              }}
                              className={`
                                w-full sm:w-auto
                                text-xs px-3 py-2
                                rounded-lg
                                text-white
                                transition
                                bg-[#B91C1C] hover:bg-[#991B1B]
                                ${
                                  p.mentor
                                    ? "bg-amber-600 hover:bg-amber-700"
                                    : "bg-[#B91C1C] hover:bg-[#991B1B]"
                                }
                                w-full sm:w-auto
                              `}
                            >
                              Ubah
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* INFORMASI */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <DetailItem
                        label="Nama Lengkap"
                        value={p.nama}
                        icon={<HiUser />}
                      />

                      <DetailItem
                        label="Jenis Kelamin"
                        value={p.jenisKelamin}
                        icon={<HiIdentification />}
                      />

                      <DetailItem
                        label="Mulai Magang"
                        value={p.tanggalMulaiMagang}
                        icon={<HiCalendar />}
                      />

                      <DetailItem
                        label="Selesai Magang"
                        value={p.tanggalSelesaiMagang}
                        icon={<HiCalendar />}
                      />

                      <DetailItem
                        label="Tempat Lahir"
                        value={p.tempatLahir}
                        icon={<HiLocationMarker />}
                      />

                      <DetailItem
                        label="Tanggal Lahir"
                        value={p.tanggalLahir}
                        icon={<HiCalendar />}
                      />

                      <DetailItem
                        label="Email"
                        value={p.email}
                        icon={<HiMail />}
                      />

                      <DetailItem
                        label="Asal"
                        value={
                          p.asal ? `${p.asal.jenis} – ${p.asal.nama}` : "-"
                        }
                        icon={<HiIdentification />}
                      />

                      <DetailItem
                        label="Jurusan"
                        value={p.jurusan}
                        icon={<HiBriefcase />}
                      />

                      <DetailItem
                        label="No WhatsApp"
                        value={p.wa}
                        icon={<HiPhone />}
                      />

                      {/* ===== DURASI MAGANG (KANAN SAJA) ===== */}
                      {(() => {
                        const durasi = hitungDurasiMagang(
                          p.tanggalMulaiMagang,
                          p.tanggalSelesaiMagang,
                        );

                        if (!durasi) return null;

                        return (
                          <div
                            className="
                              flex items-center gap-2
                              px-3 py-1.5
                              rounded-xl
                              bg-[#FFF1F2] dark:bg-indigo-500/10
                              border border-[#FCA5A5] dark:border-indigo-500/30
                            "
                          >
                            {/* LINGKARAN BIRU */}
                            <div
                              className="
                                w-8 h-8
                                rounded-full
                                bg-[#B91C1C]
                                text-white
                                flex items-center justify-center
                                text-xs font-bold
                                shadow
                              "
                            >
                              {durasi.bulan}
                            </div>

                            {/* TEXT */}
                            <div className="leading-tight">
                              <p className="text-[11px] font-semibold text-[#7F1D1D] dark:text-indigo-300">
                                Durasi Magang
                              </p>
                              <p className="text-[10px] text-blue-600 dark:text-indigo-300">
                                {durasi.bulan} bulan
                                {durasi.sisaHari > 0 &&
                                  ` ${durasi.sisaHari} hari`}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* ALAMAT */}
                    <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        Alamat Lengkap
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-200">
                        {p.alamatLengkap}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {p.kelurahan}, {p.kecamatan}, {p.kota}, {p.provinsi}
                      </p>
                    </div>

                    {/* ===================== MENTOR PER PESERTA ===================== */}
                    <div
                      className="
    mt-4
    flex items-center justify-between
    rounded-xl
    bg-slate-50 dark:bg-slate-900/60
    border border-slate-200 dark:border-slate-700
    px-4 py-3
  "
                    >
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Mentor Peserta
                        </p>

                        {p.mentor ? (
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">
                              {p.mentor.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {p.mentor.email}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">
                            Belum ada mentor
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setMentorModal(true);
                          setSelectedMentor("");
                          setSelectedPesertaEmail(p.email); // 🔑 PENTING
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg text-white transition
      ${
        p.mentor
          ? "bg-amber-600 hover:bg-amber-700"
          : "bg-blue-600 hover:bg-blue-700"
      }
    `}
                      >
                        {p.mentor ? "Ganti Mentor" : "Tambahkan Mentor"}
                      </button>

                      {mentorModal && (
                        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
                          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold mb-4">
                              Pilih Mentor
                            </h3>

                            <select
                              value={selectedMentor}
                              onChange={(e) =>
                                setSelectedMentor(e.target.value)
                              }
                              className="w-full border rounded-lg px-3 py-2 mb-4"
                            >
                              <option value="">-- Pilih Mentor --</option>
                              {mentorList.map((m) => (
                                <option key={m._id} value={m._id}>
                                  {m.name} ({m.posisiMentor})
                                </option>
                              ))}
                            </select>

                            <div className="flex justify-end gap-2">
                              <button onClick={() => setMentorModal(false)}>
                                Batal
                              </button>
                              <button
                                onClick={async () => {
                                  if (
                                    !selected ||
                                    !selectedMentor ||
                                    !selectedPesertaEmail
                                  ) {
                                    showAlert(
                                      "warning",
                                      "Data mentor atau peserta belum lengkap",
                                    );
                                    return;
                                  }

                                  try {
                                    const res = await fetch(
                                      `${process.env.NEXT_PUBLIC_API_URL}/pendaftaran/${selected._id}/mentor-peserta`,
                                      {
                                        method: "PUT",
                                        headers: {
                                          "Content-Type": "application/json",
                                          Authorization: `Bearer ${localStorage.getItem(
                                            "token",
                                          )}`,
                                        },
                                        body: JSON.stringify({
                                          email: selectedPesertaEmail, // ✅ KUNCI UTAMA
                                          mentorId: selectedMentor,
                                        }),
                                      },
                                    );

                                    const result = await res.json();

                                    if (!res.ok) {
                                      throw new Error(
                                        result.message ||
                                          "Gagal menyimpan mentor",
                                      );
                                    }

                                    // ✅ UPDATE STATE DARI RESPONSE BACKEND
                                    setSelected(result.data);

                                    setMentorModal(false);
                                    setSelectedMentor("");
                                    setSelectedPesertaEmail("");

                                    showAlert(
                                      "success",
                                      "Mentor peserta berhasil disimpan",
                                    );
                                  } catch (err: any) {
                                    showAlert(
                                      "error",
                                      err.message || "Terjadi kesalahan",
                                    );
                                  }
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"
                              >
                                Simpan
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ===================== STATUS AKUN ===================== */}
                    <div
                      className="
          mt-3
          flex items-center justify-between
          rounded-xl
          bg-slate-50 dark:bg-slate-900/60
          border border-slate-200 dark:border-slate-700
          px-4 py-3
        "
                    >
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Status Akun
                        </p>

                        <span
                          className={`inline-flex items-center gap-1 mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            isAkunTerdaftar(p.email)
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                              : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {isAkunTerdaftar(p.email) ? (
                            <HiCheckCircle />
                          ) : (
                            <HiXCircle />
                          )}
                          {isAkunTerdaftar(p.email)
                            ? "Terdaftar"
                            : "Tidak Terdaftar"}
                        </span>
                      </div>

                      {!isAkunTerdaftar(p.email) && (
                        <button
                          onClick={() => {
                            window.location.href =
                              `/dashboard/superadmin/ManajemenAkun/buatpeserta` +
                              `?email=${encodeURIComponent(p.email)}` +
                              `&name=${encodeURIComponent(p.nama)}`;
                          }}
                          className="
              text-xs
              px-3 py-1.5
              rounded-lg
              font-medium
              transition
              bg-blue-600 hover:bg-blue-700
              text-white
              dark:bg-indigo-600 dark:hover:bg-indigo-700
            "
                        >
                          Buatkan Akun
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* ===================== SURAT BALASAN (PDF) ===================== */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Surat Balasan (PDF)
                </label>

                {isAktif ? (
                  selected?.suratBalasan ? (
                    /* ===== MODE AKTIF + FILE ADA ===== */
                    <div
                      className="
                flex items-center justify-between
                rounded-2xl
                p-5
                bg-emerald-50 dark:bg-emerald-500/10
                border border-emerald-200 dark:border-emerald-500/30
              "
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                          <HiDocumentText className="text-xl" />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                            Surat Balasan Tersedia
                          </p>
                          <p className="text-xs text-emerald-600/80 dark:text-emerald-300/70">
                            File PDF resmi
                          </p>
                        </div>
                      </div>

                      <a
                        href={`http://localhost:5000/uploads/${selected.suratBalasan}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                  inline-flex items-center gap-2
                  px-4 py-2
                  rounded-xl
                  bg-emerald-600 hover:bg-emerald-700
                  text-white text-sm font-semibold
                "
                      >
                        <HiDocumentText />
                        Download
                      </a>
                    </div>
                  ) : (
                    /* ===== MODE AKTIF + FILE BELUM ADA ===== */
                    <div
                      className="
                rounded-2xl
                p-5
                bg-yellow-50 dark:bg-yellow-500/10
                border border-yellow-200 dark:border-yellow-500/30
                text-sm text-yellow-700 dark:text-yellow-300
              "
                    >
                      Surat balasan belum tersedia
                    </div>
                  )
                ) : (
                  /* ===== MODE BELUM AKTIF (UPLOAD – UI AWAL) ===== */
                  <>
                    <label
                      className="
                        flex flex-col items-center justify-center
                        w-full
                        min-h-[140px]
                        rounded-2xl
                        border-2 border-dashed
                        border-[#FCA5A5]
                        dark:border-indigo-500/50
                        bg-[#FFF1F2]
                        dark:bg-indigo-500/10
                        cursor-pointer
                        transition
                        hover:bg-indigo-100/60 dark:hover:bg-indigo-500/10
                      "
                    >
                      <HiDocumentText className="text-4xl text-[#B91C1C] dark:text-indigo-400 mb-2" />

                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Klik untuk upload surat balasan
                      </p>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Format PDF • Maksimal 5MB
                      </p>

                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) =>
                          setSuratBalasan(e.target.files?.[0] || null)
                        }
                        className="hidden"
                      />
                    </label>

                    {suratBalasan && (
                      <div
                        className="
                  mt-3
                  flex items-center gap-2
                  px-4 py-2
                  rounded-xl
                  bg-blue-50 dark:bg-blue-500/10
                  border border-blue-200 dark:border-blue-500/30
                  text-blue-700 dark:text-blue-300
                  text-sm font-medium
                "
                      >
                        <HiCheckCircle className="text-lg" />
                        {suratBalasan.name}
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-1">
                      Unggah surat balasan resmi (format PDF)
                    </p>
                  </>
                )}
              </div>

              {/* ===================== ALASAN ADMIN ===================== */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Alasan Persetujuan / Penolakan
                </label>

                <textarea
                  rows={4}
                  value={alasan || selected?.jawabanAdmin || ""}
                  disabled={isAktif}
                  onChange={(e) => setAlasan(e.target.value)}
                  placeholder={
                    isAktif
                      ? "Alasan persetujuan sudah ditetapkan"
                      : "Tuliskan alasan persetujuan atau penolakan pendaftaran..."
                  }
                  className={`
            w-full rounded-xl
            border border-slate-300 dark:border-slate-700
            px-4 py-3 text-sm
            focus:ring-2 focus:ring-indigo-500
            outline-none
            ${
              isAktif
                ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                : "bg-white dark:bg-slate-800"
            }
          `}
                />
              </div>
            </div>

            {/* ===================== ACTION BUTTON ===================== */}
            {!isAktif && (
              <div
                className="
            sticky bottom-0
            px-6 py-4
            bg-white/90 dark:bg-[#0B0614]/95
            backdrop-blur
            border-t border-blue-200 dark:border-indigo-800
            flex flex-col sm:flex-row justify-end gap-3
          "
              >
                <button
                  onClick={() => updateStatus("Ditolak")}
                  className="
              inline-flex items-center justify-center gap-2
              px-5 py-2.5 rounded-xl
              bg-gradient-to-r from-rose-500 to-red-600
              text-white font-semibold
              hover:opacity-90
            "
                >
                  <HiXCircle />
                  Tolak
                </button>

                <button
                  onClick={() => updateStatus("Disetujui")}
                  className="
              inline-flex items-center justify-center gap-2
              px-5 py-2.5 rounded-xl
              bg-gradient-to-r from-emerald-500 to-green-600
              text-white font-semibold
              hover:opacity-90
            "
                >
                  <HiCheckCircle />
                  Setujui
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <AlertPopup
        open={alertOpen}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertOpen(false)}
      />
    </div>
  );
}

/* ===================== COMPONENT ===================== */

function SummaryCard({ title, value, color }: any) {
  const colorMap = {
    green: "text-emerald-500",
    red: "text-rose-500",
    default: "text-blue-400",
  };

  return (
    <div
      className="
            rounded-2xl p-5
            bg-white/80 dark:bg-slate-900/80
            backdrop-blur
            shadow-lg
            border border-slate-200 dark:border-slate-800
          "
    >
      <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
      <h2 className={`text-3xl font-bold mt-1 ${colorMap[color || "default"]}`}>
        {value}
      </h2>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <p className="text-sm">
      <b>{label}:</b> {value || "-"}
    </p>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`
              inline-flex items-center justify-center
              px-3 py-1 rounded-full
              text-xs font-semibold
              ${
                status === "Disetujui"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                  : status === "Ditolak"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300"
              }
            `}
    >
      {status}
    </span>
  );
}

function DetailItem({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 text-[#B91C1C] dark:text-indigo-400">{icon}</div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="font-medium text-slate-800 dark:text-white">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}
