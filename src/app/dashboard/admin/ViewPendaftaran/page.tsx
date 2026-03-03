"use client";

import { useEffect, useState } from "react";
import {
  HiX,
  HiDocumentText,
  HiUser,
  HiUsers,
  HiMail,
  HiPhone,
  HiIdentification,
  HiLocationMarker,
  HiCalendar,
  HiBriefcase,
  HiCheckCircle,
  HiClock,
  HiXCircle,
} from "react-icons/hi";
import {
  UserCheck,
  XCircle,
  Search,
  Filter,
  ChevronDown,
  Users,
  Check,
  Mail,
  Briefcase,
  X,
  CheckCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import AlertPopup from "@/components/ui/AlertPopup";
import { fetchFormasi, IFormasi } from "@/services/formasiService";

/* ===================== TYPE ===================== */
type Peserta = {
  nama: string;
  email: string;
  wa: string;
  posisi: string;
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
  jurusan?: string;
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

  statusMagang?: "Menunggu" | "Sedang Magang" | "Selesai Magang";
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
  suratBalasan?: string;
};

type Mentor = {
  _id: string;
  name: string;
  email: string;
  posisiMentor: string;
  status: "Aktif" | "Nonaktif";
};

type AkunPeserta = {
  _id: string;
  name: string;
  email: string;
  status: string;
};

const POSISI_MAGANG = [
  "Fungsi Penindakan",
  "Fungsi Pengujian",
  "Fungsi Pemeriksaan (Inspeksi dan sertifikasi)",
  "Fungsi Informasi dan Komunikasi",
  "Bagian Tata Usaha",
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

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
  return { totalHari, bulan, sisaHari };
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
  const [selectedPesertaEmail, setSelectedPesertaEmail] = useState<string>("");
  const [suratBalasan, setSuratBalasan] = useState<File | null>(null);
  const [akunPeserta, setAkunPeserta] = useState<AkunPeserta[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const LIMIT = 10;
  const [mentorSearch, setMentorSearch] = useState("");
  const [filterPosisiMentor, setFilterPosisiMentor] = useState("");

  // ✅ State konfirmasi action
  const [confirmAction, setConfirmAction] = useState<{
    show: boolean;
    type: "setuju" | "tolak";
    title: string;
    message: string;
  }>({
    show: false,
    type: "setuju",
    title: "",
    message: "",
  });

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
    setSuratBalasan(null);
    setEditPosisiIndex(null);
    setMentorModal(false);

    // hapus hash dari URL
    window.history.replaceState(null, "", window.location.pathname);
  };

  const isAktif = selected?.status === "Disetujui";

  /* ===================== LOAD DATA ===================== */
  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showAlert(
          "error",
          "Token tidak ditemukan, silakan login ulang",
          "Error",
        );
        return;
      }

      const res = await fetch(`${API_BASE}/admin/pendaftaran`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 403) {
        showAlert(
          "error",
          "Anda tidak memiliki akses ke data pendaftaran",
          "Akses Ditolak",
        );
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();
      setData(json);
    } catch (error: any) {
      showAlert("error", error.message || "Gagal memuat data", "Error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAkunPeserta = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/admin/peserta`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const result = await res.json();
        setAkunPeserta(result);
      }
    } catch (error) {
      console.error("Gagal mengambil data akun peserta");
    }
  };

  const fetchMentor = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/admin/mentor`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const result = await res.json();
        setMentorList(result.filter((m: Mentor) => m.status === "Aktif"));
      }
    } catch (err: any) {
      showAlert("error", err.message || "Gagal memuat mentor");
    }
  };

  useEffect(() => {
    loadData();
    fetchAkunPeserta();
  }, []);

  useEffect(() => {
    if (!data.length) return;

    const hash = window.location.hash.replace("#", "");
    if (!hash) return;

    const found = data.find((item) => item._id === hash);

    if (found) {
      setSelected(found);
    }
  }, [data]);

  useEffect(() => {
    if (mentorModal) {
      fetchMentor();
    }
  }, [mentorModal]);

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

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/admin/pendaftaran/${selected._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Gagal memperbarui status");
      }

      showAlert(
        "success",
        "Status pendaftaran dan surat balasan berhasil diproses.",
        "Berhasil",
      );
      await loadData();
      closeModal();
    } catch (error: any) {
      showAlert("error", error.message || "Terjadi kesalahan", "Gagal");
    }
  };

  /* ===================== SIMPAN POSISI ===================== */
  const simpanPosisi = async (index: number) => {
    if (!selected?._id || !posisiBaru) return;

    // ✅ CEK SLOT
    if (getSisaKuota(posisiBaru) <= 0) {
      showAlert("error", "Kuota formasi sudah habis");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/admin/pendaftaran/${selected._id}/posisi`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
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

      const updated: Pendaftaran = {
        ...selected,
        peserta: selected.peserta.map((p, i) =>
          i === index ? { ...p, posisi: posisiBaru } : p,
        ),
      };

      setSelected(updated);
      setEditPosisiIndex(null);
      await loadData();

      // refresh kuota
      const data = await fetchFormasi();
      setFormasiList(data);

      showAlert("success", "Posisi magang berhasil diperbarui");
    } catch (err: any) {
      showAlert("error", err.message || "Gagal mengubah posisi");
    }
  };

  /* ===================== SIMPAN MENTOR ===================== */
  const simpanMentor = async () => {
    if (!selected || !selectedMentor || !selectedPesertaEmail) {
      showAlert("warning", "Data mentor atau peserta belum lengkap");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/admin/pendaftaran/${selected._id}/mentor-peserta`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: selectedPesertaEmail,
            mentorId: selectedMentor,
          }),
        },
      );

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Anda tidak memiliki izin untuk mengatur mentor");
        }
        throw new Error(result.message || "Gagal menyimpan mentor");
      }

      setSelected(result.data);
      setMentorModal(false);
      setSelectedMentor("");
      setSelectedPesertaEmail("");
      showAlert("success", "Mentor peserta berhasil disimpan");
    } catch (err: any) {
      showAlert("error", err.message || "Terjadi kesalahan");
    }
  };

  /* ===================== FUNGSI LAINNYA ===================== */
  const isAkunTerdaftar = (email?: string) => {
    if (!email) return false;
    return akunPeserta.some(
      (akun) => akun.email.toLowerCase() === email.toLowerCase(),
    );
  };

  const filteredData = data.filter((item) =>
    item.peserta?.[0]?.nama?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPage = Math.ceil(filteredData.length / LIMIT);
  const paginatedData = filteredData.slice((page - 1) * LIMIT, page * LIMIT);

  const totalPendaftar = data.length;
  const disetujui = data.filter((d) => d.status === "Disetujui").length;
  const ditolak = data.filter((d) => d.status === "Ditolak").length;

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

    const worksheet = XLSX.utils.json_to_sheet(excelData);
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

    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 30 },
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 40 },
      { wch: 18 },
    ];

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

  const [formasiList, setFormasiList] = useState<IFormasi[]>([]);
  const [loadingFormasi, setLoadingFormasi] = useState(true);

  useEffect(() => {
    const loadFormasi = async () => {
      try {
        const data = await fetchFormasi();
        setFormasiList(data);
      } catch (err) {
        console.error("Gagal load formasi:", err);
      } finally {
        setLoadingFormasi(false);
      }
    };

    loadFormasi();
  }, []);

  const getSisaKuota = (posisi: string) => {
    const f = formasiList.find((x) => x.title === posisi);
    return f ? f.sisaKuota : 0;
  };

  const uniquePosisiMentor = [
    ...new Set(mentorList.map((m) => m.posisiMentor)),
  ];

  const filteredMentor = mentorList.filter((m) => {
    const matchSearch = m.name
      .toLowerCase()
      .includes(mentorSearch.toLowerCase());

    const matchPosisi = filterPosisiMentor
      ? m.posisiMentor === filterPosisiMentor
      : true;

    return matchSearch && matchPosisi;
  });

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-linear-to-br from-slate-50 via-white to-indigo-50 dark:from-[#020617] dark:via-[#020617] dark:to-[#1E1B4B] text-slate-800 dark:text-slate-100 transition-colors">
      <h1 className="flex items-center gap-3 tracking-tight mb-10">
        <span
          className="
              text-2xl sm:text-3xl lg:text-4xl
              font-extrabold leading-tight
              bg-clip-text text-transparent
              bg-linear-to-r
              from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
              dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400
            "
        >
          Data Pendaftaran
        </span>
      </h1>

      {/* SUMMARY CARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <SummaryCard
          title="Jumlah Pendaftar"
          value={totalPendaftar}
          icon={<HiUsers className="w-7 h-7" />}
        />
        <SummaryCard
          title="Disetujui"
          value={disetujui}
          color="green"
          icon={<HiCheckCircle className="w-7 h-7" />}
        />
        <SummaryCard
          title="Ditolak"
          value={ditolak}
          color="red"
          icon={<HiXCircle className="w-7 h-7" />}
        />
      </div>

      {/* SEARCH & EXPORT */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
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
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B91C1C]/70 dark:focus:ring-indigo-500/70 transition"
          />
        </div>
        <button
          onClick={downloadExcel}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-linear-to-r from-emerald-500 to-green-600 hover:opacity-90 shadow-md hover:shadow-lg transition w-full sm:w-auto"
        >
          <HiDocumentText className="text-lg" />
          Download Excel
        </button>
      </div>

      {/* TABLE */}
      {!loading && paginatedData.length === 0 ? (
        <div className="rounded-3xl bg-white/80 dark:bg-white/5 backdrop-blur border border-[#F59E0B]/30 dark:border-indigo-500/30 shadow-xl p-12 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 rounded-full bg-linear-to-br from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B] dark:from-indigo-600 dark:to-violet-500 flex items-center justify-center shadow-lg animate-pulse">
            <HiUser className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-[#7F1D1D] dark:text-indigo-300 mb-2">
            Data tidak ditemukan
          </h3>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Tidak ada data yang dapat ditampilkan saat ini.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/90 dark:bg-white/5 backdrop-blur border border-slate-200 dark:border-indigo-500/30 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-180 w-full text-sm sm:text-base">
              <thead>
                <tr className="bg-slate-50 dark:bg-indigo-500/10 border-b border-slate-200 dark:border-indigo-500/30">
                  <th className="w-[6%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                    No
                  </th>
                  <th className="w-[24%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                    Peserta
                  </th>
                  <th className="w-[24%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                    Email
                  </th>
                  <th className="w-[16%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                    Posisi
                  </th>
                  <th className="w-[14%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                    Kategori
                  </th>
                  <th className="w-[16%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                    Status Pendaftaran
                  </th>

                  <th className="w-[16%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                    Status Magang
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-indigo-500/20">
                {paginatedData.map((item, i) => (
                  <tr
                    key={item._id}
                    className="hover:bg-[#FEF3C7]/40 dark:hover:bg-indigo-500/10 transition"
                  >
                    <td className="py-4 px-6 text-center font-medium text-slate-500">
                      {i + 1}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center">
                        <div
                          onClick={() => setSelected(item)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <div
                            className="
                              shrink-0 w-10 h-10 min-w-10 min-h-10
                              rounded-full
                              bg-linear-to-br from-[#7F1D1D] to-[#F59E0B]
                              dark:from-indigo-600 dark:to-violet-500
                              flex items-center justify-center
                              text-white shadow
                              group-hover:scale-110 transition
                            "
                          >
                            <HiUser className="w-5 h-5" />
                          </div>

                          <div className="text-left">
                            <p className="font-medium text-slate-800 dark:text-slate-100">
                              {item.peserta[0]?.nama}
                            </p>
                            <p className="text-xs text-[#7F1D1D]">
                              Klik untuk lihat detail
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center items-center gap-2 text-slate-600 dark:text-slate-300">
                        <HiMail className="w-4 h-4" />
                        <span className="truncate max-w-52">
                          {item.peserta[0]?.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                        {item.peserta[0]?.posisi}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`
                          px-3 py-1.5
                          rounded-full
                          text-xs font-semibold
                          border
                          ${
                            item.kategori === "bersama"
                              ? "bg-[#7F1D1D]/10 text-[#7F1D1D] border-[#7F1D1D]/20"
                              : "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]"
                          }
                        `}
                      >
                        {item.kategori === "bersama" ? "Bersama" : "Sendiri"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <StatusMagangBadge
                        status={getStatusMagang(
                          item.status,
                          item.peserta[0]?.tanggalMulaiMagang,
                          item.peserta[0]?.tanggalSelesaiMagang,
                        )}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPage > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 py-5">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-indigo-500/30 bg-white dark:bg-indigo-950 text-slate-700 dark:text-indigo-200 hover:bg-[#FFF1F2] dark:hover:bg-indigo-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Prev
              </button>
              {Array.from({ length: totalPage }).map((_, i) => {
                const active = page === i + 1;
                return (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`min-w-9.5 h-9.5 rounded-lg text-sm font-semibold transition ${active ? "bg-[#B91C1C] text-white shadow dark:bg-indigo-600 dark:text-white" : "bg-white dark:bg-indigo-950 text-[#7F1D1D] dark:text-indigo-200 border border-slate-300 dark:border-indigo-500/30 hover:bg-[#FFF1F2] dark:hover:bg-indigo-900/40"}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
              <button
                disabled={page === totalPage}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-indigo-500/30 bg-white dark:bg-indigo-950 text-slate-700 dark:text-indigo-200 hover:bg-[#FFF1F2] dark:hover:bg-indigo-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL DETAIL */}
      {selected && (
        <div className="fixed inset-y-0 right-0 left-0 lg:left-72 z-40 flex">
          <div
            className="absolute inset-y-0 right-0 left-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div
            className="relative w-full h-full bg-linear-to-br from-white via-[#FFF5F5] to-[#FDECEC] dark:from-[#0B0614] dark:via-[#120A24] dark:to-[#1E0F3D] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-linear-to-r from-[#FCA5A5] via-[#FDE8E8] to-white dark:from-indigo-900 dark:via-violet-800 dark:to-purple-800 border-b border-blue-200 dark:border-indigo-800/40 shadow-lg text-blue-950 dark:text-indigo-50">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/80 dark:bg-white/10 flex items-center justify-center shadow">
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
              <button
                onClick={closeModal}
                className="w-10 h-10 flex items-center justify-center rounded-full text-blue-900 dark:text-indigo-200 hover:bg-white/70 dark:hover:bg-white/10 transition"
              >
                <HiX className="text-xl" />
              </button>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* SURAT PENGANTAR */}
              <div className="rounded-2xl p-5 bg-linear-to-br from-[#FFF1F2] to-[#FFE4E6] dark:from-indigo-500/10 dark:to-violet-500/10 border-[#FCA5A5] dark:border-indigo-700/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                  href={`${API_BASE}/uploads/${selected.suratPengantar}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition bg-[#B91C1C] hover:bg-[#991B1B] dark:bg-indigo-600 dark:hover:bg-indigo-700"
                >
                  <HiDocumentText />
                  Lihat Surat
                </a>
              </div>

              {/* DATA PESERTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {selected.peserta.map((p, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-white/90 dark:bg-[#140B2D]/80 border-[#FCA5A5] dark:border-indigo-700/40 p-6 shadow-sm"
                  >
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-col gap-2 w-full sm:flex-row sm:w-auto sm:items-center">
                        <HiUser className="text-[#B91C1C] dark:text-indigo-400" />
                        <h3 className="text-lg font-semibold text-[#B91C1C] dark:text-indigo-400">
                          Peserta {i + 1}
                        </h3>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                        {editPosisiIndex === i ? (
                          <>
                            <select
                              value={posisiBaru}
                              onChange={(e) => {
                                const val = e.target.value;

                                // ❌ Cegah kalau penuh
                                if (getSisaKuota(val) <= 0) {
                                  showAlert(
                                    "warning",
                                    "Kuota formasi ini sudah penuh",
                                  );
                                  return;
                                }

                                setPosisiBaru(val);
                              }}
                              disabled={loadingFormasi}
                              className="w-full sm:w-56 text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                            >
                              <option value="">Pilih Posisi</option>
                              {formasiList.map((f) => (
                                <option
                                  key={f._id}
                                  value={f.title}
                                  disabled={f.sisaKuota === 0}
                                >
                                  {f.title} ({f.sisaKuota} slot)
                                  {f.sisaKuota === 0 ? " - PENUH" : ""}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => simpanPosisi(i)}
                              className="w-full sm:w-auto text-xs px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition"
                            >
                              Simpan
                            </button>
                            <button
                              onClick={() => setEditPosisiIndex(null)}
                              className="w-full sm:w-auto text-xs px-3 py-2 rounded-lg bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 transition"
                            >
                              Batal
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FEE2E2] text-[#7F1D1D] dark:bg-indigo-500/20 dark:text-indigo-300 flex items-center gap-1">
                              <HiBriefcase />
                              {p.posisi}
                            </span>
                            <button
                              onClick={() => {
                                setEditPosisiIndex(i);
                                setPosisiBaru(p.posisi);
                              }}
                              className={`w-full sm:w-auto text-xs px-3 py-2 rounded-lg text-white transition ${p.mentor ? "bg-amber-600 hover:bg-amber-700" : "bg-[#B91C1C] hover:bg-[#991B1B]"}`}
                            >
                              Ubah
                            </button>
                          </>
                        )}
                      </div>
                    </div>

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
                      {(() => {
                        const durasi = hitungDurasiMagang(
                          p.tanggalMulaiMagang,
                          p.tanggalSelesaiMagang,
                        );
                        if (!durasi) return null;
                        return (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFF1F2] dark:bg-indigo-500/10 border border-[#FCA5A5] dark:border-indigo-500/30">
                            <div className="w-8 h-8 rounded-full bg-[#B91C1C] text-white flex items-center justify-center text-xs font-bold shadow">
                              {durasi.bulan}
                            </div>
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

                    {/* MENTOR PER PESERTA */}
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 px-4 py-3">
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
                          setSelectedPesertaEmail(p.email);
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg text-white transition ${p.mentor ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"}`}
                      >
                        {p.mentor ? "Ganti Mentor" : "Tambahkan Mentor"}
                      </button>
                    </div>

                    {/* STATUS AKUN */}
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 px-4 py-3">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Status Akun
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 mt-1 px-3 py-1 rounded-full text-xs font-semibold ${isAkunTerdaftar(p.email) ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}
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
                            // Simpan URL saat ini sebagai returnTo
                            const returnUrl = encodeURIComponent(
                              window.location.pathname + window.location.hash,
                            );
                            window.location.href = `/dashboard/admin/ManajemenAkun/buatpeserta?email=${encodeURIComponent(p.email)}&name=${encodeURIComponent(p.nama)}&returnTo=${returnUrl}`;
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium transition bg-blue-600 hover:bg-blue-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700"
                        >
                          Buatkan Akun
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* MENTOR MODAL */}
              {mentorModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                    {/* HEADER */}
                    <div className="bg-gradient-to-r from-[#7F1D1D] to-[#B91C1C] dark:from-indigo-700 dark:to-indigo-900 px-6 py-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/20 rounded-xl">
                            <UserCheck className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              Pilih Mentor Pembimbing
                            </h3>
                            <p className="text-sm text-white/80">
                              Pilih mentor yang akan membimbing peserta
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setMentorModal(false)}
                          className="p-2 hover:bg-white/10 rounded-xl"
                        >
                          <XCircle className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    </div>

                    {/* BODY */}
                    <div className="p-6">
                      {/* SEARCH */}
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Cari nama mentor..."
                          value={mentorSearch}
                          onChange={(e) => setMentorSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                        />
                      </div>

                      {/* LIST */}
                      <div className="max-h-80 overflow-y-auto space-y-3">
                        {filteredMentor.map((m) => (
                          <div
                            key={m._id}
                            onClick={() => setSelectedMentor(m._id)}
                            className={`rounded-2xl p-4 border-2 cursor-pointer transition ${
                              selectedMentor === m._id
                                ? "border-[#B91C1C] bg-[#FEE2E2]/40"
                                : "border-slate-200 hover:border-[#B91C1C]/30"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-semibold">{m.name}</h4>
                                <p className="text-xs text-slate-500">
                                  {m.email}
                                </p>
                                <p className="text-xs text-[#B91C1C] font-medium">
                                  {m.posisiMentor}
                                </p>
                              </div>

                              {selectedMentor === m._id && (
                                <CheckCircle className="text-emerald-600" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* ACTION */}
                      <div className="flex justify-end gap-3 mt-6">
                        <button
                          onClick={() => setMentorModal(false)}
                          className="px-4 py-2 rounded-lg bg-slate-200"
                        >
                          Batal
                        </button>
                        <button
                          disabled={!selectedMentor}
                          onClick={simpanMentor}
                          className="px-6 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-40"
                        >
                          Simpan Mentor
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SURAT BALASAN */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Surat Balasan (PDF)
                </label>
                {isAktif ? (
                  selected?.suratBalasan ? (
                    <div className="flex items-center justify-between rounded-2xl p-5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
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
                        href={`${API_BASE}/uploads/${selected.suratBalasan}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                      >
                        <HiDocumentText /> Download
                      </a>
                    </div>
                  ) : (
                    <div className="rounded-2xl p-5 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 text-sm text-yellow-700 dark:text-yellow-300">
                      Surat balasan belum tersedia
                    </div>
                  )
                ) : (
                  <>
                    <label className="flex flex-col items-center justify-center w-full min-h-35 rounded-2xl border-2 border-dashed border-[#FCA5A5] dark:border-indigo-500/50 bg-[#FFF1F2] dark:bg-indigo-500/10 cursor-pointer transition hover:bg-indigo-100/60 dark:hover:bg-indigo-500/10">
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
                      <div className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
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

              {/* ALASAN ADMIN */}
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
                  className={`w-full rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${isAktif ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed" : "bg-white dark:bg-slate-800"}`}
                />
              </div>
            </div>

            {/* ACTION BUTTON DENGAN KONFIRMASI */}
            {!isAktif && (
              <div className="sticky bottom-0 px-6 py-4 bg-white/90 dark:bg-[#0B0614]/95 backdrop-blur border-t border-blue-200 dark:border-indigo-800 flex flex-col sm:flex-row justify-end gap-3">
                {/* Tolak */}
                <button
                  onClick={() => {
                    const nama = selected?.peserta[0]?.nama;

                    setConfirmAction({
                      show: true,
                      type: "tolak",
                      title: "Konfirmasi Penolakan",
                      message: `Apakah anda yakin menolak ${nama}?`,
                    });
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-rose-500 to-red-600 text-white font-semibold hover:opacity-90"
                >
                  <HiXCircle /> Tolak
                </button>

                {/* Setuju */}
                <button
                  onClick={() => {
                    const jumlah =
                      selected?.jumlahPeserta || selected?.peserta.length || 0;

                    // Hitung durasi dari peserta pertama (asumsi sama semua)
                    const durasi = hitungDurasiMagang(
                      selected?.peserta[0]?.tanggalMulaiMagang || "",
                      selected?.peserta[0]?.tanggalSelesaiMagang || "",
                    );

                    const bulan = durasi ? durasi.bulan : 0;

                    const message = `
                      Apakah anda yakin untuk menyetujui Peserta magang ${jumlah} orang peserta?

                      Masa magang: ${bulan} Bulan

                      di BBPOM Kota Palembang

                      Data tidak dapat diubah setelah diproses.
                          `;

                    setConfirmAction({
                      show: true,
                      type: "setuju",
                      title: "Konfirmasi Persetujuan",
                      message,
                    });
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-emerald-500 to-green-600 text-white font-semibold hover:opacity-90"
                >
                  <HiCheckCircle /> Setujui
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI */}
      {confirmAction.show && (
        <div className="fixed inset-0 z-100 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirmAction({ ...confirmAction, show: false })}
          />

          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-2">{confirmAction.title}</h3>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              {confirmAction.message}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setConfirmAction({ ...confirmAction, show: false })
                }
                className="px-4 py-2 rounded-lg border"
              >
                Batal
              </button>

              <button
                onClick={() => {
                  setConfirmAction({ ...confirmAction, show: false });

                  updateStatus(
                    confirmAction.type === "setuju" ? "Disetujui" : "Ditolak",
                  );
                }}
                className={`px-5 py-2 rounded-lg text-white font-semibold ${
                  confirmAction.type === "setuju"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                Ya, {confirmAction.type === "setuju" ? "Setujui" : "Tolak"}
              </button>
            </div>
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

/* ================= COMPONENT ================= */
function SummaryCard({
  title,
  value,
  color = "default",
  icon,
}: {
  title: string;
  value: number | string;
  color?: "default" | "green" | "red";
  icon?: React.ReactNode;
}) {
  const colorMap = {
    default: {
      text: "text-[#7F1D1D] dark:text-white",
      badge: "bg-[#B91C1C]/90 dark:bg-indigo-600",
      border: "border-[#FCA5A5]/40 dark:border-indigo-500/30",
    },
    green: {
      text: "text-emerald-600 dark:text-emerald-400",
      badge: "bg-emerald-500",
      border: "border-emerald-200 dark:border-emerald-500/30",
    },
    red: {
      text: "text-rose-600 dark:text-rose-400",
      badge: "bg-rose-500",
      border: "border-rose-200 dark:border-rose-500/30",
    },
  };
  const c = colorMap[color];
  return (
    <div
      className={`group relative rounded-2xl ${c.border} bg-linear-to-br from-[#FFFDF8] via-[#FFF4EC] to-white dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800 p-6 shadow-sm hover:shadow-xl transition`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">
            {title}
          </p>
          <p className={`text-4xl font-extrabold mt-1 ${c.text}`}>{value}</p>
        </div>
        <div
          className={`w-14 h-14 rounded-2xl ${c.badge} text-white flex items-center justify-center shadow group-hover:scale-110 transition`}
        >
          {icon}
        </div>
      </div>
      <div className={`mt-4 pt-4 border-t ${c.border}`}>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Ringkasan data {title.toLowerCase()}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${status === "Disetujui" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : status === "Ditolak" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300"}`}
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
    <div className="flex items-start gap-2 min-w-0">
      <div className="mt-0.5 text-[#B91C1C] dark:text-indigo-400 shrink-0">
        {icon}
      </div>
      <div className="min-w-0 w-full">
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>

        <p className="font-medium text-slate-800 dark:text-white wrap-break-word">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

/* ================== STATUS MAGANG BADGE ================== */

function getStatusMagang(
  statusPendaftaran: string,
  mulai?: string,
  selesai?: string,
) {
  if (statusPendaftaran === "Ditolak") {
    return "Tidak Magang";
  }

  if (statusPendaftaran !== "Disetujui") {
    return "Menunggu";
  }

  if (!mulai || !selesai) {
    return "Menunggu";
  }

  const today = new Date();
  const start = new Date(mulai);
  const end = new Date(selesai);

  if (today < start) {
    return "Belum Waktu Magang"; // ✅ BARU
  }

  if (today >= start && today <= end) {
    return "Sedang Magang";
  }

  if (today > end) {
    return "Selesai Magang";
  }

  return "Menunggu";
}

function StatusMagangBadge({ status }: { status: string }) {
  if (status === "Tidak Magang") {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
        Tidak Magang
      </span>
    );
  }

  if (status === "Belum Waktu Magang") {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
        Belum Waktu Magang
      </span>
    );
  }

  if (status === "Sedang Magang") {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
        Sedang Magang
      </span>
    );
  }

  if (status === "Selesai Magang") {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
        Selesai
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
      Menunggu
    </span>
  );
}
