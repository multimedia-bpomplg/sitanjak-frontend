// app/pendaftaran/page.tsx
"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { Plus_Jakarta_Sans } from "next/font/google";
import Navbar from "@/components/layouts/Navbar";
import {
  HiUser,
  HiMail,
  HiPhone,
  HiUpload,
  HiUsers,
  HiLocationMarker,
  HiArrowLeft,
  HiClipboardList,
  HiCalendar,
  HiDocument,
  HiCheckCircle,
  HiOutlineOfficeBuilding,
  HiOutlineBeaker,
  HiOutlineShieldCheck,
  HiOutlineSearchCircle,
  HiOutlineSpeakerphone,
  HiOutlineClipboardList,
  HiOutlineCalendar,
  HiOutlineExclamationCircle,
} from "react-icons/hi";
import { fetchFormasi, IFormasi } from "@/services/formasiService";
import { useSearchParams } from "next/navigation";
import CalendarPopup from "@/components/calendar/CalendarPopup";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const waRegex = /^08[0-9]{8,11}$/;

// ==================== POSISI MAGANG YANG BARU ====================
const POSISI_MAGANG = [
  "Fungsi Penindakan",
  "Fungsi Pengujian",
  "Fungsi Pemeriksaan (Inspeksi dan sertifikasi)",
  "Fungsi Informasi dan Komunikasi",
  "Bagian Tata Usaha",
];

// Helper icon per fungsi
const getFormasiIcon = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes("pengujian")) return HiOutlineBeaker;
  if (lower.includes("pemeriksaan") || lower.includes("inspeksi"))
    return HiOutlineShieldCheck;
  if (lower.includes("penindakan")) return HiOutlineSearchCircle;
  if (lower.includes("informasi") || lower.includes("komunikasi"))
    return HiOutlineSpeakerphone;
  if (lower.includes("tata usaha")) return HiOutlineClipboardList;
  return HiOutlineOfficeBuilding;
};

// ==================== ASAL INSTANSI UNIVERSITAS ====================
const UNIVERSITAS_LIST = [
  "UNSRI/Universitas Sriwijaya",
  "UIN Raden Fatah Palembang",
  "Universitas Bina Darma",
  "MDP/Universitas Multi Data Palembang",
  "UIGM/Universitas Indo Global Mandiri",
  "Polsri/Politeknik Negeri Sriwijaya",
  "ITERA/INSTITUT TEKNOLOGI SUMATERA",
  "LAINNYA",
];

// ==================== ASAL INSTANSI SMK ====================
const SMK_LIST = [
  "SMK 1 Pemulutan",
  "SMK 1 Palembang",
  "SMK 8 Kota Palembang",
  "LAINNYA",
];

// ==================== JURUSAN UNTUK SETIAP UNIVERSITAS ====================
const JURUSAN_BY_UNIVERSITAS: Record<string, string[]> = {
  "UNSRI/Universitas Sriwijaya": [
    "Kimia (S1)",
    "Biologi (S1)",
    "Farmasi (S1)",
    "Ilmu Hukum (S1)",
    "Kesehatan Masyarakat (S1)",
    "Sistem Informasi (S1)",
    "Teknik Informatika (S1)",
    "LAINNYA",
  ],
  "UIN Raden Fatah Palembang": [
    "Kimia (S1)",
    "Biologi (S1)",
    "Pendidikan Kimia (S1)",
    "Pendidikan Biologi (S1)",
    "Sistem Informasi (S1)",
    "Psikologi Islam (S1)",
    "Ilmu Komunikasi (S1)",
    "LAINNYA",
  ],
  "Universitas Bina Darma": [
    "Sistem Informasi (S1)",
    "Teknik Informatika (S1)",
    "Teknik Elektro (S1)",
    "Teknik Industri (S1)",
    "Manajemen (S1)",
    "Akuntansi (S1)",
    "Ilmu Komunikasi (S1)",
    "Psikologi (S1)",
    "Manajemen Informatika (D3)",
    "Teknik Komputer (D3)",
    "Administrasi Bisnis (D3)",
    "LAINNYA",
  ],
  "MDP/Universitas Multi Data Palembang": [
    "Sistem Informasi (S1)",
    "Informatika (S1)",
    "Manajemen Informatika (D3)",
    "Teknik Elektro (S1)",
    "Desain Komunikasi Visual (S1)",
    "Manajemen (S1)",
    "Akuntansi (S1)",
    "LAINNYA",
  ],
  "UIGM/Universitas Indo Global Mandiri": [
    "Kimia (S1)",
    "Biologi (S1)",
    "Kedokteran (S1)",
    "Keselamatan dan Kesehatan Kerja / K3 (D4)",
    "Teknik Informatika (S1)",
    "Sistem Informasi (S1)",
    "Sistem Komputer (S1)",
    "Manajemen (S1)",
    "Akuntansi (S1)",
    "Manajemen Bisnis (S1)",
    "Hukum Bisnis (S1)",
    "Ekonomi Bisnis (S1)",
    "LAINNYA",
  ],
  "Polsri/Politeknik Negeri Sriwijaya": [
    "Teknik Kimia (D3)",
    "Teknologi Kimia Industri (D4 / Sarjana Terapan)",
    "Teknologi Pangan (D3)",
    "Teknologi Rekayasa Pangan (D4 / Sarjana Terapan)",
    "Teknologi Akuakultur (D4 / Sarjana Terapan)",
    "Teknik Komputer (D3)",
    "Manajemen Informatika (D3)",
    "Manajemen Informatika (D4 / Sarjana Terapan)",
    "Teknologi Informatika Multimedia Digital (D4 / Sarjana Terapan)",
    "Akuntansi (D3)",
    "Akuntansi Sektor Publik (D4 / Sarjana Terapan)",
    "Administrasi Bisnis (D3)",
    "Manajemen Bisnis (D4 / Sarjana Terapan)",
    "Bisnis Digital (D4 / Sarjana Terapan)",
    "LAINNYA",
  ],
  "ITERA/INSTITUT TEKNOLOGI SUMATERA": [
    "Kimia (S1)",
    "Biologi (S1)",
    "Farmasi (S1)",
    "Teknologi Pangan (S1)",
    "Teknologi Industri Pertanian (S1)",
    "Teknik Kimia (S1)",
    "Rekayasa Kosmetik (S1)",
    "Teknik Biomedik (S1)",
    "Teknik Informatika (S1)",
    "Sains Data (S1)",
    "Teknik Lingkungan (S1)",
    "Teknik Biosistem (S1)",
    "Sains Lingkungan Kelautan (S1)",
    "Teknik Fisika (S1)",
    "Teknik Material (S1)",
    "Rekayasa Instrumentasi dan Automasi (S1)",
    "LAINNYA",
  ],
  LAINNYA: ["LAINNYA"],
};

// ==================== JURUSAN UNTUK SMK ====================
const JURUSAN_SMK: Record<string, string[]> = {
  "SMK 1 Pemulutan": ["Administrasi", "Perkantoran", "Akuntansi", "LAINNYA"],
  "SMK 1 Palembang": ["Administrasi", "Perkantoran", "Akuntansi", "LAINNYA"],
  "SMK 8 Kota Palembang": [
    "Administrasi",
    "Perkantoran",
    "Akuntansi",
    "LAINNYA",
  ],
  LAINNYA: ["LAINNYA"],
};

type Wilayah = {
  id: string;
  name: string;
};

type Peserta = {
  nama: string;
  posisi: string;

  asalJenis: "Universitas" | "SMK" | "Instansi" | "";
  asalNama: string;
  asalNamaLainnya: string;
  jurusan: string;
  jurusanLainnya: string;

  tanggalMulaiMagang: string;
  tanggalSelesaiMagang: string;

  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;

  provinsi: string;
  provinsiId: string;
  kota: string;
  kotaId: string;
  kecamatan: string;
  kecamatanId: string;
  kelurahan: string;

  alamatLengkap: string;
  email: string;
  wa: string;
};

/* ================== FACTORY ================== */
const buatPesertaKosong = (): Peserta => ({
  nama: "",
  posisi: "",

  asalJenis: "",
  asalNama: "",
  asalNamaLainnya: "",
  jurusan: "",
  jurusanLainnya: "",

  tanggalMulaiMagang: "",
  tanggalSelesaiMagang: "",
  tempatLahir: "",
  tanggalLahir: "",
  jenisKelamin: "",

  provinsi: "",
  provinsiId: "",
  kota: "",
  kotaId: "",
  kecamatan: "",
  kecamatanId: "",
  kelurahan: "",
  alamatLengkap: "",
  email: "",
  wa: "",
});

// Komponen utama form
function PendaftaranForm() {
  const dateRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [kategori, setKategori] = useState<"sendiri" | "bersama">("sendiri");
  const [jumlah, setJumlah] = useState(1);
  const [peserta, setPeserta] = useState<Peserta[]>([buatPesertaKosong()]);
  const [surat, setSurat] = useState<File | null>(null);

  const [provinsi, setProvinsi] = useState<Wilayah[]>([]);
  const [wilayah, setWilayah] = useState<
    {
      kota: Wilayah[];
      kecamatan: Wilayah[];
      kelurahan: Wilayah[];
    }[]
  >([{ kota: [], kecamatan: [], kelurahan: [] }]);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedFormasi, setSelectedFormasi] = useState<IFormasi | null>(null);
  const [formasiList, setFormasiList] = useState<IFormasi[]>([]);
  const [, setLoadingFormasi] = useState(true);
  const [slotWarning, setSlotWarning] = useState<string | null>(null);
  const [slotPenuh, setSlotPenuh] = useState(false);

  /* ================== LOAD PROVINSI ================== */
  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then((res) => res.json())
      .then(setProvinsi);
  }, []);

  /* ================== Slot Prediksi Magang ================== */
  useEffect(() => {
    let warningFound = false;
    peserta.forEach((p) => {
      if (!p.posisi || !p.tanggalMulaiMagang || !p.tanggalSelesaiMagang) return;

      const formasi = formasiList.find((f) => f.title === p.posisi);
      if (!formasi) return;

      const cek = cekSlotMagang(
        formasi,
        p.tanggalMulaiMagang,
        p.tanggalSelesaiMagang,
      );

      if (cek.penuh) {
        setSlotPenuh(true);
        setSlotWarning(
          `Posisi ${p.posisi} pada tanggal ${p.tanggalMulaiMagang} hingga ${p.tanggalSelesaiMagang} sudah penuh.`,
        );
        warningFound = true;
      } else if (cek.aktif > 0) {
        setSlotPenuh(false);
        setSlotWarning(
          `Informasi: Sudah ada ${cek.aktif} orang magang yang terjadwal pada rentang tanggal tersebut.`,
        );
        warningFound = true;
      }
    });

    if (!warningFound) {
      setSlotPenuh(false);
      setSlotWarning(null);
    }
  }, [peserta, formasiList]);

  /* ================== UPDATE DATA ================== */
  const update = async (
    i: number,
    key: keyof Peserta,
    value: string,
    id?: string,
  ) => {
    setPeserta((prev) => {
      const data = [...prev];

      if (key === "provinsi" && id) {
        data[i] = {
          ...data[i],
          provinsi: value,
          provinsiId: id,
          kota: "",
          kotaId: "",
          kecamatan: "",
          kecamatanId: "",
          kelurahan: "",
        };
      } else if (key === "kota" && id) {
        data[i] = { ...data[i], kota: value, kotaId: id };
      } else if (key === "kecamatan" && id) {
        data[i] = { ...data[i], kecamatan: value, kecamatanId: id };
      } else {
        data[i] = { ...data[i], [key]: value };
      }

      return data;
    });

    if (key === "provinsi" && id) {
      const res = await fetch(
        `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${id}.json`,
      );
      const kotaData = await res.json();

      setWilayah((prev) => {
        const data = [...prev];
        data[i] = { kota: kotaData, kecamatan: [], kelurahan: [] };
        return data;
      });
    }

    if (key === "kota" && id) {
      const res = await fetch(
        `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${id}.json`,
      );
      const kecamatanData = await res.json();

      setWilayah((prev) => {
        const data = [...prev];
        data[i] = { ...data[i], kecamatan: kecamatanData, kelurahan: [] };
        return data;
      });
    }

    if (key === "kecamatan" && id) {
      const res = await fetch(
        `https://www.emsifa.com/api-wilayah-indonesia/api/villages/${id}.json`,
      );
      const kelurahanData = await res.json();

      setWilayah((prev) => {
        const data = [...prev];
        data[i] = { ...data[i], kelurahan: kelurahanData };
        return data;
      });
    }
  };

  const ubahJumlah = (n: number) => {
    setJumlah(n);

    setPeserta((prev) =>
      Array.from({ length: n }).map((_, i) => prev[i] ?? buatPesertaKosong()),
    );

    setWilayah((prev) =>
      Array.from({ length: n }).map(
        (_, i) => prev[i] ?? { kota: [], kecamatan: [], kelurahan: [] },
      ),
    );
  };

  const isCapitalizeEachWord = (text: string) => {
    const words = text.trim().split(" ");

    return words.every((word) => {
      if (!word) return false;

      // izinkan kata dalam tanda kurung seperti (S1), (D3)
      if (/^\([A-Za-z0-9]+\)$/.test(word)) {
        return true;
      }

      return (
        word[0] === word[0].toUpperCase() &&
        word.slice(1) === word.slice(1).toLowerCase()
      );
    });
  };

  /* ================== VALIDASI ================== */
  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};
    let hasSpecificError = false;

    peserta.forEach((p, i) => {
      if (!p.nama) newErrors[`nama-${i}`] = true;
      if (!p.posisi) newErrors[`posisi-${i}`] = true;

      if (!p.tanggalMulaiMagang) newErrors[`tanggalMulaiMagang-${i}`] = true;
      const todayStr = new Date().toISOString().split("T")[0];
      if (p.tanggalMulaiMagang && p.tanggalMulaiMagang < todayStr) {
        newErrors[`tanggalMulaiMagang-${i}`] = true;
        toast.error(
          `Tanggal mulai magang tidak boleh sebelum hari ini (Peserta ${i + 1})`,
        );
        hasSpecificError = true;
      }

      if (!p.tanggalSelesaiMagang)
        newErrors[`tanggalSelesaiMagang-${i}`] = true;

      if (
        p.tanggalMulaiMagang &&
        p.tanggalSelesaiMagang &&
        p.tanggalSelesaiMagang < p.tanggalMulaiMagang
      ) {
        newErrors[`tanggalSelesaiMagang-${i}`] = true;
        toast.error(
          `Tanggal selesai magang harus setelah tanggal mulai (Peserta ${i + 1})`,
        );
        hasSpecificError = true;
      }

      if (!p.tempatLahir) newErrors[`tempatLahir-${i}`] = true;
      if (!p.tanggalLahir) newErrors[`tanggalLahir-${i}`] = true;
      if (!p.jenisKelamin) newErrors[`jenisKelamin-${i}`] = true;

      if (!p.asalJenis) newErrors[`asalJenis-${i}`] = true;

      if (!p.asalNama) {
        newErrors[`asalNama-${i}`] = true;
      }

      if (p.asalNama === "LAINNYA") {
        if (!p.asalNamaLainnya) {
          newErrors[`asalNamaLainnya-${i}`] = true;
        } else if (!isCapitalizeEachWord(p.asalNamaLainnya)) {
          newErrors[`asalNamaLainnya-${i}`] = true;
          toast.error(
            `Nama instansi harus ditulis dengan huruf kapital di awal setiap kata.\n\nContoh: Universitas Indonesia`,
            { autoClose: 4000 },
          );
          hasSpecificError = true;
        }
      }

      // jurusan hanya wajib jika bukan Instansi
      if (p.asalJenis !== "Instansi") {
        if (!p.jurusan) {
          newErrors[`jurusan-${i}`] = true;
        }

        if (p.jurusan === "LAINNYA") {
          if (!p.jurusanLainnya) {
            newErrors[`jurusanLainnya-${i}`] = true;
          } else if (!isCapitalizeEachWord(p.jurusanLainnya)) {
            newErrors[`jurusanLainnya-${i}`] = true;
            toast.error(
              `Nama jurusan harus ditulis dengan huruf kapital di awal setiap kata.\n\nContoh: Teknik Informatika (S1)`,
              { autoClose: 4000 },
            );
            hasSpecificError = true;
          }
        }
      }

      if (!p.provinsi) newErrors[`provinsi-${i}`] = true;
      if (!p.kota) newErrors[`kota-${i}`] = true;
      if (!p.kecamatan) newErrors[`kecamatan-${i}`] = true;
      if (!p.kelurahan) newErrors[`kelurahan-${i}`] = true;

      if (!p.alamatLengkap) newErrors[`alamat-${i}`] = true;

      if (!p.email) {
        newErrors[`email-${i}`] = true;
      } else if (!emailRegex.test(p.email)) {
        newErrors[`email-${i}`] = true;
        toast.error(`Email Peserta ${i + 1} tidak valid`);
        hasSpecificError = true;
      }

      if (!p.wa) {
        newErrors[`wa-${i}`] = true;
      } else if (!waRegex.test(p.wa)) {
        newErrors[`wa-${i}`] = true;
        toast.error(
          `Nomor WhatsApp Peserta ${i + 1} harus diawali 08 & valid`,
        );
        hasSpecificError = true;
      }
    });

    if (!surat) newErrors["surat"] = true;

    setErrors(newErrors);

    const firstErrorKey = Object.keys(newErrors)[0];
    if (firstErrorKey) {
      const el = document.querySelector(`[name="${firstErrorKey}"]`);
      if (el instanceof HTMLElement) el.focus();
    }

    if (Object.keys(newErrors).length > 0) {
      if (!hasSpecificError) {
        toast.warning("Mohon lengkapi semua kolom yang wajib diisi");
      }
      return false;
    }

    return true;
  };

  /* ================== SUBMIT ================== */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setShowConfirm(true);
  };

  const normalizePeserta = (data: Peserta[]): Peserta[] => {
    return data.map((p) => ({
      ...p,
      asalNama:
        p.asalNama === "LAINNYA" ? p.asalNamaLainnya.trim() : p.asalNama,
      jurusan:
        p.asalJenis === "Instansi"
          ? ""
          : p.jurusan === "LAINNYA"
            ? p.jurusanLainnya.trim()
            : p.jurusan,
    }));
  };

  const submitConfirmed = async () => {
    if (pendingSubmit) return;

    setPendingSubmit(true);
    setLoading(true);
    setShowConfirm(false);

    const toastId = toast.loading("Mengirim data pendaftaran...");

    try {
      const formData = new FormData();
      formData.append("kategori", kategori);
      formData.append("jumlahPeserta", jumlah.toString());
      const pesertaFinal = normalizePeserta(peserta);
      formData.append("peserta", JSON.stringify(pesertaFinal));
      formData.append("suratPengantar", surat!);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pendaftaran`,
        {
          method: "POST",
          body: formData,
        },
      );

      await res.json();

      if (res.ok) {
        toast.dismiss(toastId);
        setShowSuccess(true);
        setPeserta([buatPesertaKosong()]);
        setJumlah(1);
        setKategori("sendiri");
        setSurat(null);
        setErrors({});
      } else {
        toast.update(toastId, {
          render: "Gagal mengirim pendaftaran",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch {
      toast.update(toastId, {
        render: "Terjadi kesalahan server",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }

    setLoading(false);
    setPendingSubmit(false);
  };

  const searchParams = useSearchParams();

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

  useEffect(() => {
    const formasi = searchParams.get("formasi");

    if (formasi) {
      setPeserta((prev) =>
        prev.map((p) => ({
          ...p,
          posisi: formasi,
        })),
      );
    }
  }, [searchParams]);

  const today = new Date().toISOString().split("T")[0];

  function simulasiKuotaBulanan(formasi: IFormasi) {
    const kuota = formasi.kuota;
    const mulaiList = formasi.tanggalMulaiMagang || [];
    const selesaiList = formasi.tanggalSelesaiMagang || [];

    const hasil: {
      bulan: string;
      bulanSingkat: string;
      aktif: number;
      sisaKuota: number;
    }[] = [];

    const sekarang = new Date();

    for (let idx = 0; idx < 4; idx++) {
      const bulanStart = new Date(
        sekarang.getFullYear(),
        sekarang.getMonth() + idx,
        1,
      );

      const bulanEnd = new Date(
        sekarang.getFullYear(),
        sekarang.getMonth() + idx + 1,
        0,
      );

      const aktif = mulaiList.reduce((acc, mulai, mIdx) => {
        const start = new Date(mulai);
        const end = new Date(selesaiList[mIdx]);
        const overlap = start <= bulanEnd && end >= bulanStart;
        return overlap ? acc + 1 : acc;
      }, 0);

      hasil.push({
        bulan: bulanStart.toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric",
        }),
        bulanSingkat: bulanStart.toLocaleDateString("id-ID", {
          month: "short",
          year: "numeric",
        }),
        aktif,
        sisaKuota: Math.max(0, kuota - aktif),
      });
    }

    return hasil;
  }

  function hitungKuotaBulanIni(formasi: IFormasi) {
    const kuota = formasi.kuota;
    const mulaiList = formasi.tanggalMulaiMagang || [];
    const selesaiList = formasi.tanggalSelesaiMagang || [];

    const now = new Date();
    const bulanStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const bulanEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let aktif = 0;

    mulaiList.forEach((mulai, idx) => {
      const start = new Date(mulai);
      const end = new Date(selesaiList[idx]);
      const overlap = start <= bulanEnd && end >= bulanStart;
      if (overlap) aktif++;
    });

    const sisa = Math.max(0, kuota - aktif);
    return { aktif, sisa };
  }

  function cekSlotMagang(formasi: IFormasi, mulai: string, selesai: string) {
    if (!mulai || !selesai) return { penuh: false, aktif: 0 };

    const kuota = formasi.kuota;
    const mulaiList = formasi.tanggalMulaiMagang || [];
    const selesaiList = formasi.tanggalSelesaiMagang || [];

    let aktif = 0;

    mulaiList.forEach((m, idx) => {
      const start = new Date(m);
      const end = new Date(selesaiList[idx]);
      const newStart = new Date(mulai);
      const newEnd = new Date(selesai);

      const overlap = newStart <= end && newEnd >= start;
      if (overlap) aktif++;
    });

    return {
      aktif,
      penuh: aktif >= kuota,
    };
  }

  function getStatusKuota(sisa: number, total: number) {
    if (sisa <= 0) {
      return {
        label: "Kuota Penuh",
        badge: "bg-rose-50 text-rose-700 border border-rose-200",
        card: "border-rose-200 bg-rose-50/20",
        text: "text-rose-600",
        progress: "bg-rose-500",
      };
    }

    if (sisa <= Math.ceil(total * 0.3)) {
      return {
        label: "Hampir Penuh",
        badge: "bg-amber-50 text-amber-700 border border-amber-200",
        card: "border-amber-200 bg-amber-50/20",
        text: "text-amber-600",
        progress: "bg-amber-500",
      };
    }

    return {
      label: "Tersedia",
      badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      card: "border-slate-200 bg-white",
      text: "text-emerald-600",
      progress: "bg-[#0088FF]",
    };
  }

  return (
    <>
      <Navbar />
      <div className={`min-h-screen bg-[#F8FAFC] relative overflow-hidden pt-28 md:pt-36 pb-12 md:pb-20 px-4 sm:px-6 lg:px-8 ${plusJakarta.className}`}>
        {/* Ambient Glow Ornaments */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#EBF5FF]/70 via-[#F8FAFC]/40 to-transparent pointer-events-none -z-10" />
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-[#0088FF]/5 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute -top-32 right-1/4 w-96 h-96 bg-[#38BDF8]/5 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto">
          {/* HEADER SECTION */}
          <div className="text-center mb-10 md:mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-[#0088FF] text-xs font-semibold tracking-wide uppercase mb-3.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#0088FF] animate-pulse" />
              Portal Pendaftaran Resmi
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#0B1B3D] tracking-tight leading-tight">
              Formulir Pendaftaran Magang{" "}
              <span className="text-[#0088FF]">BBPOM di Palembang</span>
            </h1>
            <p className="text-slate-600 mt-3 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Silakan lengkapi seluruh isian data di bawah ini dengan informasi yang benar, akurat, dan dapat dipertanggungjawabkan.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Seluruh kolom bertanda bintang (<span className="text-rose-500 font-bold">*</span>) wajib diisi.
            </p>
          </div>

          {/* ================= CEK RIWAYAT BANNER ================= */}
          <div className="mb-10">
            <Link
              href="/pendaftaran/riwayat"
              className="relative group block overflow-hidden rounded-2xl bg-gradient-to-r from-[#071531] via-[#0B1B3D] to-[#08306B] border border-blue-900/40 p-6 sm:p-7 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#0088FF]/10 rounded-full blur-2xl group-hover:bg-[#0088FF]/20 transition-all pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-blue-300 shrink-0 backdrop-blur-sm group-hover:scale-105 transition-transform">
                    <HiClipboardList className="text-2xl" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        Cek Riwayat Pendaftaran Anda
                      </h3>
                      <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                        Tracking
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm mt-1">
                      Sudah pernah mendaftar? Pantau proses verifikasi dan hasil seleksi pengajuan magang Anda di sini.
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className="inline-flex items-center justify-center gap-2 w-full md:w-auto bg-[#0088FF] hover:bg-[#0073E6] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-colors group-hover:translate-x-0.5">
                    <span>Lihat Riwayat</span>
                    <HiArrowLeft className="rotate-180 text-sm" />
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* ================= FORM PENDAFTARAN UTAMA ================= */}
          <form onSubmit={handleSubmit} noValidate className="space-y-8">
            {/* 1. INFORMASI PERMOHONAN */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#0B1B3D] flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-[#0088FF] text-sm font-extrabold">
                      1
                    </span>
                    Tipe Permohonan Magang
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Tentukan kategori pendaftaran magang Anda (mandiri atau kelompok).
                  </p>
                </div>
              </div>

              {/* Pilihan Kategori Berbasis Kartu Radio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setKategori("sendiri");
                    ubahJumlah(1);
                  }}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    kategori === "sendiri"
                      ? "border-[#0088FF] bg-blue-50/30 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                          kategori === "sendiri"
                            ? "bg-[#0088FF] text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <HiUser />
                      </div>
                      <span className="font-bold text-slate-800 text-sm sm:text-base">
                        Individu / Sendiri
                      </span>
                    </div>
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        kategori === "sendiri"
                          ? "border-[#0088FF]"
                          : "border-slate-300"
                      }`}
                    >
                      {kategori === "sendiri" && (
                        <span className="w-2 h-2 rounded-full bg-[#0088FF]" />
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 pl-10">
                    Pendaftaran untuk 1 orang peserta perseorangan secara mandiri.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setKategori("bersama");
                    ubahJumlah(2);
                  }}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    kategori === "bersama"
                      ? "border-[#0088FF] bg-blue-50/30 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                          kategori === "bersama"
                            ? "bg-[#0088FF] text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <HiUsers />
                      </div>
                      <span className="font-bold text-slate-800 text-sm sm:text-base">
                        Kelompok / Bersama
                      </span>
                    </div>
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        kategori === "bersama"
                          ? "border-[#0088FF]"
                          : "border-slate-300"
                      }`}
                    >
                      {kategori === "bersama" && (
                        <span className="w-2 h-2 rounded-full bg-[#0088FF]" />
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 pl-10">
                    Pendaftaran kolektif dari kampus/instansi yang sama (2 - 5 orang).
                  </p>
                </button>
              </div>

              {/* Selector Jumlah Peserta jika bersama */}
              {kategori === "bersama" && (
                <div className="pt-4 border-t border-slate-100">
                  <label className="text-xs font-semibold text-slate-700 mb-2 block uppercase tracking-wider">
                    Pilih Jumlah Anggota Kelompok <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {[2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => ubahJumlah(n)}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                          jumlah === n
                            ? "bg-[#0088FF] text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {n} Orang Peserta
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Maksimal 5 peserta dalam satu pengajuan kelompok. Lengkapi data seluruh anggota di bawah.
                  </p>
                </div>
              )}
            </div>

            {/* 2. DATA PESERTA (PESERTA 1..N) */}
            {peserta.map((_, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 sm:p-8 space-y-8"
              >
                {/* Header Peserta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0088FF] flex items-center justify-center font-bold text-base border border-blue-100">
                      {i + 1}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#0B1B3D]">
                        {i === 0 && kategori === "bersama"
                          ? "Data Peserta 1 (Ketua Kelompok)"
                          : `Data Peserta ${i + 1}`}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {i === 0
                          ? "Ketua kelompok atau peserta utama yang mewakili permohonan magang."
                          : `Anggota kelompok peserta ke-${i + 1}.`}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 self-start sm:self-auto">
                    Peserta {i + 1} dari {peserta.length}
                  </span>
                </div>

                {/* SUB-SEKSI A: POSISI MAGANG */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-bold text-slate-800">
                      Pilihan Posisi / Bidang Magang <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs text-[#0088FF] font-medium flex items-center gap-1">
                      <HiCalendar className="text-sm" /> Klik kartu untuk cek kalender
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Pilih unit kerja atau fungsi yang Anda minati di BBPOM Palembang. Kuota disesuaikan secara realtime.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {formasiList.map((item) => {
                      const kuota = item.kuota;
                      const kuotaRealtime = hitungKuotaBulanIni(item);
                      const aktif = kuotaRealtime.aktif;
                      const sisa = kuotaRealtime.sisa;
                      const status = getStatusKuota(sisa, kuota);
                      const isSelected = peserta[i].posisi === item.title;
                      const Icon = getFormasiIcon(item.title);

                      return (
                        <div
                          key={item._id}
                          onClick={() => {
                            setSelectedFormasi(item);
                            setCalendarOpen(true);
                          }}
                          className={`group relative rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "border-[#0088FF] bg-blue-50/30 ring-2 ring-[#0088FF] shadow-sm"
                              : "border-slate-200 hover:border-slate-300 bg-white hover:shadow-sm"
                          }`}
                        >
                          <div>
                            {/* Header Kartu: Ikon & Badge */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                                  isSelected
                                    ? "bg-[#0088FF] text-white"
                                    : "bg-blue-50 text-[#0088FF]"
                                }`}
                              >
                                <Icon />
                              </div>
                              <span
                                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${status.badge}`}
                              >
                                {status.label}
                              </span>
                            </div>

                            {/* Nama Posisi */}
                            <h3 className="font-bold text-slate-800 text-sm leading-snug mb-2 group-hover:text-[#0088FF] transition-colors">
                              {item.title}
                            </h3>

                            {/* Sisa Kuota Bar */}
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 mb-3">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">Sisa Kuota:</span>
                                <span className="font-bold text-slate-800">
                                  <span
                                    className={`text-base font-extrabold ${
                                      sisa === 0
                                        ? "text-rose-600"
                                        : "text-[#0088FF]"
                                    }`}
                                  >
                                    {sisa}
                                  </span>
                                  <span className="text-slate-400 font-normal">
                                    {" "}
                                    / {kuota} kursi
                                  </span>
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    sisa === 0
                                      ? "bg-rose-500"
                                      : sisa <= 2
                                        ? "bg-amber-500"
                                        : "bg-[#0088FF]"
                                  }`}
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      kuota > 0 ? (aktif / kuota) * 100 : 0,
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>

                            {/* ESTIMASI KUOTA 4 BULAN KE DEPAN (2x2 GRID) */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-[#0B1B3D]">
                                  <HiOutlineCalendar className="text-[#0088FF] text-sm" />
                                  Estimasi Kuota 4 Bulan Ke Depan
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                {simulasiKuotaBulanan(item).map((p, idx) => {
                                  const empty = p.sisaKuota;
                                  const pFull = empty === 0;
                                  const pWarn = !pFull && empty <= 2;

                                  return (
                                    <div
                                      key={idx}
                                      className="bg-white border border-slate-200/80 rounded-xl px-2.5 py-1.5 flex items-center justify-between shadow-2xs"
                                    >
                                      <span className="text-[11px] font-semibold text-[#475569] truncate">
                                        {p.bulanSingkat || p.bulan}
                                      </span>

                                      <span
                                        className={`text-[10.5px] font-extrabold px-2 py-0.5 rounded-md shrink-0 ${
                                          pFull
                                            ? "bg-rose-50 text-rose-600"
                                            : pWarn
                                              ? "bg-amber-50 text-amber-600"
                                              : "bg-[#EBF5FF] text-[#0088FF]"
                                        }`}
                                      >
                                        {pFull ? "Penuh" : `${empty} Kursi`}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                update(i, "posisi", item.title);
                                setErrors((p) => ({
                                  ...p,
                                  [`posisi-${i}`]: false,
                                }));
                              }}
                              className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${
                                isSelected
                                  ? "bg-[#0088FF] text-white shadow-xs"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              }`}
                            >
                              {isSelected ? "✓ Posisi Terpilih" : "Pilih Posisi Ini"}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFormasi(item);
                                setCalendarOpen(true);
                              }}
                              className="w-full py-1 text-[11px] text-slate-500 hover:text-[#0088FF] flex items-center justify-center gap-1 transition-colors"
                            >
                              <HiOutlineCalendar className="text-xs" />
                              <span>Lihat Kalender Jadwal</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {errors[`posisi-${i}`] && (
                    <p className="text-xs text-rose-500 mt-2 font-medium">
                      * Posisi magang wajib dipilih untuk Peserta {i + 1}
                    </p>
                  )}
                </div>

                {/* SUB-SEKSI B: PERIODE MAGANG */}
                <div className="pt-2 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 mb-1">
                    Periode Pelaksanaan Magang <span className="text-rose-500">*</span>
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Tentukan tanggal perkiraan mulai dan selesai magang.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tanggal Mulai */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                        Tanggal Mulai Magang <span className="text-rose-500">*</span>
                      </label>
                      <div
                        className={`form-field pr-10 relative ${
                          errors[`tanggalMulaiMagang-${i}`] ? "form-error" : ""
                        }`}
                      >
                        <input
                          type="date"
                          min={today}
                          ref={(el) => {
                            dateRefs.current[`mulai-${i}`] = el;
                          }}
                          value={peserta[i].tanggalMulaiMagang}
                          onChange={(e) => {
                            update(i, "tanggalMulaiMagang", e.target.value);
                            setErrors((p) => ({
                              ...p,
                              [`tanggalMulaiMagang-${i}`]: false,
                            }));
                          }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            dateRefs.current[`mulai-${i}`]?.showPicker?.() ||
                            dateRefs.current[`mulai-${i}`]?.focus()
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0088FF] hover:text-[#0073E6] p-1.5 rounded-lg hover:bg-blue-50 transition"
                        >
                          <HiCalendar className="text-lg" />
                        </button>
                      </div>
                      {errors[`tanggalMulaiMagang-${i}`] && (
                        <p className="text-xs text-rose-500 mt-1">
                          Tanggal mulai wajib diisi (minimal hari ini)
                        </p>
                      )}
                    </div>

                    {/* Tanggal Selesai */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                        Tanggal Perkiraan Selesai <span className="text-rose-500">*</span>
                      </label>
                      <div
                        className={`form-field pr-10 relative ${
                          errors[`tanggalSelesaiMagang-${i}`] ? "form-error" : ""
                        }`}
                      >
                        <input
                          type="date"
                          min={peserta[i].tanggalMulaiMagang || today}
                          ref={(el) => {
                            dateRefs.current[`selesai-${i}`] = el;
                          }}
                          value={peserta[i].tanggalSelesaiMagang}
                          onChange={(e) => {
                            update(i, "tanggalSelesaiMagang", e.target.value);
                            setErrors((p) => ({
                              ...p,
                              [`tanggalSelesaiMagang-${i}`]: false,
                            }));
                          }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            dateRefs.current[`selesai-${i}`]?.showPicker?.() ||
                            dateRefs.current[`selesai-${i}`]?.focus()
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0088FF] hover:text-[#0073E6] p-1.5 rounded-lg hover:bg-blue-50 transition"
                        >
                          <HiCalendar className="text-lg" />
                        </button>
                      </div>
                      {errors[`tanggalSelesaiMagang-${i}`] && (
                        <p className="text-xs text-rose-500 mt-1">
                          Tanggal selesai harus setelah tanggal mulai magang
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Slot Warning Alert */}
                  {slotWarning && (
                    <div
                      className={`mt-4 p-3.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2.5 ${
                        slotPenuh
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      <HiOutlineExclamationCircle className="text-base shrink-0" />
                      <span>{slotWarning}</span>
                    </div>
                  )}
                </div>

                {/* SUB-SEKSI C: IDENTITAS DIRI */}
                <div className="pt-2 border-t border-slate-100 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">
                    Identitas Diri Peserta
                  </h3>

                  {/* Nama Lengkap */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                      Nama Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <div
                      className={`form-field ${
                        errors[`nama-${i}`] ? "form-error" : ""
                      }`}
                    >
                      <HiUser className="form-icon" />
                      <input
                        value={peserta[i].nama}
                        placeholder="Masukkan nama lengkap sesuai KTP / KTM"
                        onChange={(e) => {
                          update(i, "nama", e.target.value);
                          setErrors((prev) => ({
                            ...prev,
                            [`nama-${i}`]: false,
                          }));
                        }}
                      />
                    </div>
                    {errors[`nama-${i}`] && (
                      <p className="text-xs text-rose-500 mt-1">
                        Nama lengkap wajib diisi
                      </p>
                    )}
                  </div>

                  {/* Tempat & Tanggal Lahir */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                        Tempat Lahir <span className="text-rose-500">*</span>
                      </label>
                      <div
                        className={`form-field ${
                          errors[`tempatLahir-${i}`] ? "form-error" : ""
                        }`}
                      >
                        <HiLocationMarker className="form-icon" />
                        <input
                          value={peserta[i].tempatLahir}
                          placeholder="Kota tempat lahir"
                          onChange={(e) => {
                            update(i, "tempatLahir", e.target.value);
                            setErrors((p) => ({
                              ...p,
                              [`tempatLahir-${i}`]: false,
                            }));
                          }}
                        />
                      </div>
                      {errors[`tempatLahir-${i}`] && (
                        <p className="text-xs text-rose-500 mt-1">
                          Tempat lahir wajib diisi
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                        Tanggal Lahir <span className="text-rose-500">*</span>
                      </label>
                      <div
                        className={`form-field pr-10 relative ${
                          errors[`tanggalLahir-${i}`] ? "form-error" : ""
                        }`}
                      >
                        <input
                          type="date"
                          ref={(el) => {
                            dateRefs.current[`lahir-${i}`] = el;
                          }}
                          value={peserta[i].tanggalLahir}
                          onChange={(e) => {
                            update(i, "tanggalLahir", e.target.value);
                            setErrors((p) => ({
                              ...p,
                              [`tanggalLahir-${i}`]: false,
                            }));
                          }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            dateRefs.current[`lahir-${i}`]?.showPicker?.() ||
                            dateRefs.current[`lahir-${i}`]?.focus()
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0088FF] hover:text-[#0073E6] p-1.5 rounded-lg hover:bg-blue-50 transition"
                        >
                          <HiCalendar className="text-lg" />
                        </button>
                      </div>
                      {errors[`tanggalLahir-${i}`] && (
                        <p className="text-xs text-rose-500 mt-1">
                          Tanggal lahir wajib diisi
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Jenis Kelamin */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                      Jenis Kelamin <span className="text-rose-500">*</span>
                    </label>
                    <div
                      className={`form-field ${
                        errors[`jenisKelamin-${i}`] ? "form-error" : ""
                      }`}
                    >
                      <select
                        value={peserta[i].jenisKelamin}
                        onChange={(e) => {
                          update(i, "jenisKelamin", e.target.value);
                          setErrors((p) => ({
                            ...p,
                            [`jenisKelamin-${i}`]: false,
                          }));
                        }}
                      >
                        <option value="">-- Pilih Jenis Kelamin --</option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    {errors[`jenisKelamin-${i}`] && (
                      <p className="text-xs text-rose-500 mt-1">
                        Jenis kelamin wajib dipilih
                      </p>
                    )}
                  </div>
                </div>

                {/* SUB-SEKSI D: ASAL PENDIDIKAN / INSTANSI */}
                <div className="pt-2 border-t border-slate-100 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">
                    Asal Instansi & Pendidikan
                  </h3>

                  {/* Kategori Instansi */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                      Jenis Instansi Asal <span className="text-rose-500">*</span>
                    </label>
                    <div
                      className={`form-field ${
                        errors[`asalJenis-${i}`] ? "form-error" : ""
                      }`}
                    >
                      <select
                        value={peserta[i].asalJenis}
                        onChange={(e) => {
                          const jenis = e.target.value as
                            | "Universitas"
                            | "SMK"
                            | "Instansi"
                            | "";

                          update(i, "asalJenis", jenis);
                          update(i, "asalNama", "");
                          update(i, "asalNamaLainnya", "");

                          if (jenis === "Instansi") {
                            update(i, "jurusan", "");
                            update(i, "jurusanLainnya", "");
                          }

                          setErrors((p) => ({
                            ...p,
                            [`asalJenis-${i}`]: false,
                          }));
                        }}
                      >
                        <option value="">-- Pilih Jenis Instansi --</option>
                        <option value="Universitas">
                          Universitas / Perguruan Tinggi
                        </option>
                        <option value="SMK">
                          Sekolah Menengah Kejuruan (SMK)
                        </option>
                        <option value="Instansi">
                          Instansi Pemerintah / Lembaga Lainnya
                        </option>
                      </select>
                    </div>
                    {errors[`asalJenis-${i}`] && (
                      <p className="text-xs text-rose-500 mt-1">
                        Jenis instansi asal wajib dipilih
                      </p>
                    )}
                  </div>

                  {/* Nama Instansi Pemerintah */}
                  {peserta[i].asalJenis === "Instansi" && (
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                        Nama Instansi Pemerintah / Lembaga{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <div
                        className={`form-field ${
                          errors[`asalNama-${i}`] ? "form-error" : ""
                        }`}
                      >
                        <input
                          value={peserta[i].asalNama}
                          placeholder="Contoh: Dinas Kesehatan Provinsi Sumatera Selatan"
                          onChange={(e) => {
                            update(i, "asalNama", e.target.value);
                            setErrors((p) => ({
                              ...p,
                              [`asalNama-${i}`]: false,
                            }));
                          }}
                        />
                      </div>
                      {errors[`asalNama-${i}`] && (
                        <p className="text-xs text-rose-500 mt-1">
                          Nama instansi wajib diisi
                        </p>
                      )}
                    </div>
                  )}

                  {/* Dropdown Universitas / SMK */}
                  {peserta[i].asalJenis &&
                    peserta[i].asalJenis !== "Instansi" && (
                      <div>
                        <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                          Nama {peserta[i].asalJenis}{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <div
                          className={`form-field ${
                            errors[`asalNama-${i}`] ? "form-error" : ""
                          }`}
                        >
                          <select
                            value={peserta[i].asalNama}
                            onChange={(e) => {
                              update(i, "asalNama", e.target.value);
                              update(i, "asalNamaLainnya", "");
                              setErrors((p) => ({
                                ...p,
                                [`asalNama-${i}`]: false,
                              }));
                            }}
                          >
                            <option value="">
                              -- Pilih {peserta[i].asalJenis} --
                            </option>
                            {(peserta[i].asalJenis === "Universitas"
                              ? UNIVERSITAS_LIST
                              : SMK_LIST
                            ).map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                        </div>
                        {errors[`asalNama-${i}`] && (
                          <p className="text-xs text-rose-500 mt-1">
                            Nama {peserta[i].asalJenis} wajib dipilih
                          </p>
                        )}
                      </div>
                    )}

                  {/* Input Custom jika LAINNYA */}
                  {peserta[i].asalNama === "LAINNYA" && (
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                        Tuliskan Nama Lengkap {peserta[i].asalJenis}{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <div
                        className={`form-field ${
                          errors[`asalNamaLainnya-${i}`] ? "form-error" : ""
                        }`}
                      >
                        <input
                          value={peserta[i].asalNamaLainnya}
                          placeholder={`Masukkan nama ${peserta[i].asalJenis} Anda`}
                          onChange={(e) => {
                            const val = e.target.value;
                            update(i, "asalNamaLainnya", val);
                            if (isCapitalizeEachWord(val)) {
                              setErrors((p) => ({
                                ...p,
                                [`asalNamaLainnya-${i}`]: false,
                              }));
                            }
                          }}
                        />
                      </div>
                      {errors[`asalNamaLainnya-${i}`] ? (
                        <p className="text-xs text-rose-500 mt-1">
                          Gunakan huruf kapital di awal setiap kata
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-1">
                          Contoh format: <b>Universitas Indonesia</b> atau{" "}
                          <b>SMK Negeri 1 Palembang</b>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Pilihan Jurusan */}
                  {peserta[i].asalJenis !== "Instansi" &&
                    peserta[i].asalNama && (
                      <>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                            Jurusan / Program Studi{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <div
                            className={`form-field ${
                              errors[`jurusan-${i}`] ? "form-error" : ""
                            }`}
                          >
                            <select
                              value={peserta[i].jurusan}
                              onChange={(e) => {
                                update(i, "jurusan", e.target.value);
                                update(i, "jurusanLainnya", "");
                                setErrors((p) => ({
                                  ...p,
                                  [`jurusan-${i}`]: false,
                                }));
                              }}
                            >
                              <option value="">-- Pilih Jurusan --</option>
                              {(peserta[i].asalJenis === "Universitas"
                                ? JURUSAN_BY_UNIVERSITAS[
                                    peserta[i].asalNama
                                  ] || ["LAINNYA"]
                                : JURUSAN_SMK[peserta[i].asalNama] || [
                                    "LAINNYA",
                                  ]
                              ).map((j) => (
                                <option key={j} value={j}>
                                  {j}
                                </option>
                              ))}
                            </select>
                          </div>
                          {errors[`jurusan-${i}`] && (
                            <p className="text-xs text-rose-500 mt-1">
                              Jurusan wajib dipilih
                            </p>
                          )}
                        </div>

                        {/* Input Jurusan jika LAINNYA */}
                        {peserta[i].jurusan === "LAINNYA" && (
                          <div>
                            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                              Tuliskan Nama Jurusan{" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <div
                              className={`form-field ${
                                errors[`jurusanLainnya-${i}`]
                                  ? "form-error"
                                  : ""
                              }`}
                            >
                              <input
                                value={peserta[i].jurusanLainnya}
                                placeholder="Masukkan nama jurusan Anda"
                                onChange={(e) => {
                                  const val = e.target.value;
                                  update(i, "jurusanLainnya", val);
                                  if (isCapitalizeEachWord(val)) {
                                    setErrors((p) => ({
                                      ...p,
                                      [`jurusanLainnya-${i}`]: false,
                                    }));
                                  }
                                }}
                              />
                            </div>
                            {errors[`jurusanLainnya-${i}`] ? (
                              <p className="text-xs text-rose-500 mt-1">
                                Gunakan huruf kapital di awal setiap kata
                              </p>
                            ) : (
                              <p className="text-xs text-slate-400 mt-1">
                                Contoh penulisan: <b>Teknik Informatika (S1)</b>
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                </div>

                {/* SUB-SEKSI E: DOMISILI & ALAMAT */}
                <div className="pt-2 border-t border-slate-100 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">
                    Alamat & Domisili
                  </h3>

                  {/* Provinsi & Kota */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                        Provinsi <span className="text-rose-500">*</span>
                      </label>
                      <div
                        className={`form-field ${
                          errors[`provinsi-${i}`] ? "form-error" : ""
                        }`}
                      >
                        <select
                          value={peserta[i].provinsiId}
                          onChange={(e) => {
                            const o = provinsi.find(
                              (x) => x.id === e.target.value,
                            );
                            if (o) update(i, "provinsi", o.name, o.id);
                            setErrors((p) => ({
                              ...p,
                              [`provinsi-${i}`]: false,
                            }));
                          }}
                        >
                          <option value="">-- Pilih Provinsi --</option>
                          {provinsi.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors[`provinsi-${i}`] && (
                        <p className="text-xs text-rose-500 mt-1">
                          Provinsi wajib dipilih
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                        Kota / Kabupaten <span className="text-rose-500">*</span>
                      </label>
                      <div
                        className={`form-field ${
                          errors[`kota-${i}`] ? "form-error" : ""
                        }`}
                      >
                        <select
                          value={peserta[i].kotaId}
                          onChange={(e) => {
                            const o = wilayah[i]?.kota.find(
                              (x) => x.id === e.target.value,
                            );
                            if (o) update(i, "kota", o.name, o.id);
                            setErrors((p) => ({
                              ...p,
                              [`kota-${i}`]: false,
                            }));
                          }}
                          disabled={!peserta[i].provinsiId}
                        >
                          <option value="">-- Pilih Kota / Kabupaten --</option>
                          {wilayah[i]?.kota.map((k) => (
                            <option key={k.id} value={k.id}>
                              {k.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors[`kota-${i}`] && (
                        <p className="text-xs text-rose-500 mt-1">
                          Kota/Kabupaten wajib dipilih
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Kecamatan & Kelurahan */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                        Kecamatan <span className="text-rose-500">*</span>
                      </label>
                      <div
                        className={`form-field ${
                          errors[`kecamatan-${i}`] ? "form-error" : ""
                        }`}
                      >
                        <select
                          value={peserta[i].kecamatanId}
                          onChange={(e) => {
                            const o = wilayah[i]?.kecamatan.find(
                              (x) => x.id === e.target.value,
                            );
                            if (o) update(i, "kecamatan", o.name, o.id);
                            setErrors((p) => ({
                              ...p,
                              [`kecamatan-${i}`]: false,
                            }));
                          }}
                          disabled={!peserta[i].kotaId}
                        >
                          <option value="">-- Pilih Kecamatan --</option>
                          {wilayah[i]?.kecamatan.map((k) => (
                            <option key={k.id} value={k.id}>
                              {k.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors[`kecamatan-${i}`] && (
                        <p className="text-xs text-rose-500 mt-1">
                          Kecamatan wajib dipilih
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                        Kelurahan / Desa <span className="text-rose-500">*</span>
                      </label>
                      <div
                        className={`form-field ${
                          errors[`kelurahan-${i}`] ? "form-error" : ""
                        }`}
                      >
                        <select
                          value={peserta[i].kelurahan}
                          onChange={(e) => {
                            update(i, "kelurahan", e.target.value);
                            setErrors((p) => ({
                              ...p,
                              [`kelurahan-${i}`]: false,
                            }));
                          }}
                          disabled={!peserta[i].kecamatanId}
                        >
                          <option value="">-- Pilih Kelurahan --</option>
                          {wilayah[i]?.kelurahan.map((k) => (
                            <option key={k.id} value={k.name}>
                              {k.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors[`kelurahan-${i}`] && (
                        <p className="text-xs text-rose-500 mt-1">
                          Kelurahan wajib dipilih
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Alamat Lengkap */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                      Alamat Lengkap Domisili{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div
                      className={`form-field ${
                        errors[`alamat-${i}`] ? "form-error" : ""
                      }`}
                    >
                      <textarea
                        rows={3}
                        placeholder="Tuliskan nama jalan, RT/RW, nomor rumah, dan keterangan lainnya"
                        value={peserta[i].alamatLengkap}
                        onChange={(e) => {
                          update(i, "alamatLengkap", e.target.value);
                          setErrors((p) => ({
                            ...p,
                            [`alamat-${i}`]: false,
                          }));
                        }}
                      />
                    </div>
                    {errors[`alamat-${i}`] && (
                      <p className="text-xs text-rose-500 mt-1">
                        Alamat lengkap wajib diisi
                      </p>
                    )}
                  </div>
                </div>

                {/* SUB-SEKSI F: KONTAK PESERTA */}
                <div className="pt-2 border-t border-slate-100 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">
                    Kontak & Informasi Komunikasi
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                        Alamat Email Aktif <span className="text-rose-500">*</span>
                      </label>
                      <div
                        className={`form-field ${
                          errors[`email-${i}`] ? "form-error" : ""
                        }`}
                      >
                        <HiMail className="form-icon" />
                        <input
                          type="email"
                          value={peserta[i].email}
                          placeholder="contoh@domain.com"
                          onChange={(e) => {
                            update(i, "email", e.target.value);
                            setErrors((prev) => ({
                              ...prev,
                              [`email-${i}`]: false,
                            }));
                          }}
                        />
                      </div>
                      {errors[`email-${i}`] && (
                        <p className="text-xs text-rose-500 mt-1">
                          Format email tidak valid atau belum diisi
                        </p>
                      )}
                    </div>

                    {/* No WhatsApp */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                        Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
                      </label>
                      <div
                        className={`form-field ${
                          errors[`wa-${i}`] ? "form-error" : ""
                        }`}
                      >
                        <HiPhone className="form-icon" />
                        <input
                          type="tel"
                          value={peserta[i].wa}
                          placeholder="Contoh: 081234567890"
                          onChange={(e) => {
                            update(i, "wa", e.target.value);
                            setErrors((prev) => ({
                              ...prev,
                              [`wa-${i}`]: false,
                            }));
                          }}
                        />
                      </div>
                      {errors[`wa-${i}`] ? (
                        <p className="text-xs text-rose-500 mt-1">
                          Nomor WA harus valid & diawali dengan 08
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-1">
                          Pastikan nomor terhubung dengan WhatsApp aktif.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* 3. UPLOAD SURAT PENGANTAR */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#0B1B3D] flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-[#0088FF] text-sm font-extrabold">
                      {kategori === "bersama" ? peserta.length + 1 : 2}
                    </span>
                    Upload Surat Pengantar Magang
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Lampirkan surat permohonan resmi bertanda tangan dari pihak kampus/sekolah/instansi asal.
                  </p>
                </div>
              </div>

              <div>
                <label
                  className={`relative group flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 sm:p-8 cursor-pointer transition-all ${
                    errors["surat"]
                      ? "border-rose-400 bg-rose-50/50"
                      : surat
                        ? "border-emerald-400 bg-emerald-50/30"
                        : "border-slate-300 hover:border-[#0088FF] bg-slate-50/60 hover:bg-blue-50/20"
                  }`}
                >
                  <input
                    type="file"
                    accept="application/pdf"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const isPDF =
                        file.type === "application/pdf" ||
                        file.name.toLowerCase().endsWith(".pdf");

                      if (!isPDF) {
                        toast.error("Hanya file PDF yang diperbolehkan!", {
                          autoClose: 3000,
                        });
                        e.target.value = "";
                        setSurat(null);
                        return;
                      }

                      const maxSize = 1 * 1024 * 1024;
                      if (file.size > maxSize) {
                        toast.error("Ukuran file maksimal 1 MB!", {
                          autoClose: 3000,
                        });
                        e.target.value = "";
                        setSurat(null);
                        return;
                      }

                      setSurat(file);
                      setErrors((prev) => ({ ...prev, surat: false }));
                      toast.success("File surat berhasil dipilih", {
                        autoClose: 2000,
                      });
                    }}
                  />

                  {surat ? (
                    <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl shrink-0">
                        <HiDocument />
                      </div>
                      <div>
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <p className="font-bold text-slate-800 text-sm sm:text-base break-all">
                            {surat.name}
                          </p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            PDF
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {(surat.size / 1024).toFixed(1)} KB • Klik untuk mengganti dokumen
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0088FF] mx-auto flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        <HiUpload />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">
                          <span className="text-[#0088FF] hover:underline">
                            Pilih file PDF
                          </span>{" "}
                          atau seret file ke area ini
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Format dokumen wajib <b>PDF</b> dengan ukuran maksimal <b>1 MB</b>
                        </p>
                      </div>
                    </div>
                  )}
                </label>

                {errors["surat"] && (
                  <p className="text-xs text-rose-500 mt-2 font-medium">
                    * Surat pengantar resmi wajib diunggah
                  </p>
                )}
              </div>
            </div>

            {/* 4. TOMBOL SUBMIT */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || slotPenuh}
                className="w-full py-4 px-6 rounded-xl text-white font-bold text-base sm:text-lg bg-[#0088FF] hover:bg-[#0073E6] shadow-lg shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sedang Mengirim Pendaftaran...</span>
                  </>
                ) : (
                  <>
                    <span>Kirim Formulir Pendaftaran</span>
                    <HiArrowLeft className="rotate-180 text-xl" />
                  </>
                )}
              </button>

              {slotPenuh && (
                <div className="mt-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm text-center font-medium">
                  Pendaftaran tidak dapat dikirim karena kuota magang pada tanggal yang Anda pilih telah penuh. Silakan sesuaikan tanggal magang pada form di atas.
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* ================= MODAL KONFIRMASI ================= */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md animate-scaleIn border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0088FF] flex items-center justify-center text-2xl mb-4">
              <HiClipboardList />
            </div>
            <h3 className="text-xl font-bold text-[#0B1B3D] mb-2">
              Konfirmasi Pengiriman Formulir
            </h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Apakah Anda yakin seluruh data yang telah diinput sudah benar dan sesuai?
              <span className="block mt-2 text-xs text-slate-400">
                * Data yang telah terkirim tidak dapat diubah secara langsung dan akan diproses ke tahap seleksi admin.
              </span>
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
              >
                Cek Kembali
              </button>
              <button
                type="button"
                onClick={submitConfirmed}
                className="px-5 py-2.5 rounded-xl bg-[#0088FF] hover:bg-[#0073E6] text-white text-sm font-semibold shadow-md transition"
              >
                Ya, Kirim Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL SUKSES ================= */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowSuccess(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md animate-scaleIn text-center border border-slate-100">
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0088FF] to-[#38BDF8] flex items-center justify-center shadow-lg shadow-blue-500/30 text-white text-3xl">
              <HiCheckCircle />
            </div>

            <h3 className="text-2xl font-extrabold text-[#0B1B3D] mb-2 tracking-tight">
              Pendaftaran Berhasil Dikirim! 🎉
            </h3>

            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              Terima kasih, data permohonan magang Anda telah berhasil kami terima. Silakan menunggu proses verifikasi dan seleksi dari tim admin BBPOM di Palembang.
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/pendaftaran/riwayat"
                className="w-full py-3.5 rounded-xl bg-[#0088FF] hover:bg-[#0073E6] text-white font-semibold text-sm shadow-md transition-colors"
              >
                Cek Riwayat Pendaftaran
              </Link>
              <button
                type="button"
                onClick={() => setShowSuccess(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP KALENDER KETERSEDIAAN */}
      <CalendarPopup
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        formasi={selectedFormasi}
      />
    </>
  );
}

// Loading Fallback untuk Suspense
function PendaftaranLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-28 md:pt-36 pb-16 px-4">
      <Navbar />
      <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
        <div className="w-44 h-10 bg-slate-200 rounded-xl" />
        <div className="text-center space-y-3">
          <div className="w-32 h-6 bg-slate-200 rounded-full mx-auto" />
          <div className="w-3/4 max-w-md h-10 bg-slate-200 rounded-xl mx-auto" />
          <div className="w-1/2 h-4 bg-slate-200 rounded-lg mx-auto" />
        </div>
        <div className="h-28 bg-slate-200 rounded-2xl" />
        <div className="bg-white rounded-2xl p-8 border border-slate-200 space-y-6">
          <div className="w-48 h-6 bg-slate-200 rounded" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-slate-100 rounded-xl" />
            <div className="h-20 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Komponen Halaman Pendaftaran Utama
export default function PendaftaranPage() {
  return (
    <Suspense fallback={<PendaftaranLoading />}>
      <PendaftaranForm />
    </Suspense>
  );
}
