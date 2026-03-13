// app/pendaftaran/page.tsx
"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import {
  HiUser,
  HiMail,
  HiPhone,
  HiBriefcase,
  HiUpload,
  HiUsers,
  HiLocationMarker,
  HiArrowLeft,
  HiClipboardList,
  HiCalendar,
  HiDocument,
} from "react-icons/hi";
import { fetchFormasi, IFormasi } from "@/services/formasiService";
import { useSearchParams } from "next/navigation";
import CalendarPopup from "@/components/calendar/CalendarPopup";
import { FaUserCheck } from "react-icons/fa";

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

// Komponen utama yang menggunakan useSearchParams
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
  const [loadingFormasi, setLoadingFormasi] = useState(true);
  const [warningKelompok, setWarningKelompok] = useState<string | null>(null);
  const [slotWarning, setSlotWarning] = useState<string | null>(null);
  const [slotPenuh, setSlotPenuh] = useState(false);

  /* ================== LOAD PROVINSI ================== */
  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then((res) => res.json())
      .then(setProvinsi);
  }, []);

  /* ==================  Slot Predisi maganng ================== */
  useEffect(() => {
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
          `❌ Posisi ${p.posisi} pada tanggal ${p.tanggalMulaiMagang} hingga ${p.tanggalSelesaiMagang} sudah penuh`,
        );
      } else if (cek.aktif > 0) {
        setSlotPenuh(false);

        setSlotWarning(
          `⚠️ Sudah ada ${cek.aktif} orang magang pada tanggal tersebut`,
        );
      } else {
        setSlotPenuh(false);
        setSlotWarning(null);
      }
    });
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

  const isValidNamaInstansi = (
    jenis: "Universitas" | "SMK" | "Instansi",
    text: string,
  ) => {
    const trimmed = text.trim();

    if (jenis === "Universitas") {
      return trimmed
        .split(" ")
        .every(
          (word) =>
            word[0] === word[0]?.toUpperCase() &&
            word.slice(1) === word.slice(1)?.toLowerCase(),
        );
    }

    if (jenis === "SMK") {
      const parts = trimmed.split(" ");

      if (parts.length < 2) return false;
      if (parts[0] !== "SMK") return false;

      return parts
        .slice(1)
        .every(
          (word) =>
            word[0] === word[0]?.toUpperCase() &&
            word.slice(1) === word.slice(1)?.toLowerCase(),
        );
    }

    return false;
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
          `❌ Tanggal mulai magang tidak boleh sebelum hari ini (Peserta ${i + 1})`,
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
          `❌ Tanggal selesai harus setelah tanggal mulai (Peserta ${i + 1})`,
        );
        hasSpecificError = true;
      }

      if (!p.tempatLahir) newErrors[`tempatLahir-${i}`] = true;
      if (!p.tanggalLahir) newErrors[`tanggalLahir-${i}`] = true;
      if (!p.jenisKelamin) newErrors[`jenisKelamin-${i}`] = true;

      if (!p.asalJenis) newErrors[`asalJenis-${i}`] = true;
      if (!p.asalNama) newErrors[`asalNama-${i}`] = true;
      if (p.asalNama === "LAINNYA") {
        if (!p.asalNamaLainnya) {
          newErrors[`asalNamaLainnya-${i}`] = true;
        } else if (
          p.asalJenis &&
          !isValidNamaInstansi(p.asalJenis, p.asalNamaLainnya)
        ) {
          newErrors[`asalNamaLainnya-${i}`] = true;

          toast.error(
            p.asalJenis === "Universitas"
              ? "❌ Nama Universitas harus ditulis dengan huruf kapital di awal setiap kata.\n\nContoh: Universitas Indonesia"
              : "❌ Penulisan SMK harus diawali dengan 'SMK' (huruf besar), dan kata setelahnya menggunakan huruf kapital.\n\nContoh: SMK Negeri 1",
            { autoClose: 4500 },
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
              `❌ Nama jurusan harus ditulis dengan huruf kapital di awal setiap kata.\n\nContoh: Teknik Informatika (S1)`,
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
        toast.error(`❌ Email Peserta ${i + 1} tidak valid`);
        hasSpecificError = true;
      }

      if (!p.wa) {
        newErrors[`wa-${i}`] = true;
      } else if (!waRegex.test(p.wa)) {
        newErrors[`wa-${i}`] = true;
        toast.error(
          `❌ Nomor WhatsApp Peserta ${i + 1} harus diawali 08 & valid`,
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

    // tampilkan warning umum jika ada field kosong
    if (Object.keys(newErrors).length > 0) {
      if (!hasSpecificError) {
        toast.warning("❗ Mohon lengkapi semua kolom yang wajib diisi");
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

    const toastId = toast.loading("⏳ Mengirim data pendaftaran...");

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

      const result = await res.json();

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
          render: "❌ Gagal mengirim pendaftaran",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch {
      toast.update(toastId, {
        render: "⚠️ Terjadi kesalahan server",
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

  const getSisaKuota = (posisi: string) => {
    const f = formasiList.find((x) => x.title === posisi);
    return f ? f.sisaKuota : 0;
  };

  const today = new Date().toISOString().split("T")[0];

  function simulasiKuotaBulanan(formasi: IFormasi) {
    const kuota = formasi.kuota;

    const mulaiList = formasi.tanggalMulaiMagang || [];
    const selesaiList = formasi.tanggalSelesaiMagang || [];

    const hasil: {
      bulan: string;
      aktif: number;
      sisaKuota: number;
    }[] = [];

    const sekarang = new Date();

    for (let i = 0; i < 4; i++) {
      const bulanStart = new Date(
        sekarang.getFullYear(),
        sekarang.getMonth() + i,
        1,
      );

      const bulanEnd = new Date(
        sekarang.getFullYear(),
        sekarang.getMonth() + i + 1,
        0,
      );

      const aktif = mulaiList.reduce((acc, mulai, idx) => {
        const start = new Date(mulai);
        const end = new Date(selesaiList[idx]);

        const overlap = start <= bulanEnd && end >= bulanStart;

        return overlap ? acc + 1 : acc;
      }, 0);

      hasil.push({
        bulan: bulanStart.toLocaleDateString("id-ID", {
          month: "long",
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

    return {
      aktif,
      sisa,
    };
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
        badge: "bg-red-500 text-white",
        card: "border-red-300 bg-red-50",
        text: "text-red-600",
        progress: "bg-red-500",
      };
    }

    if (sisa <= Math.ceil(total * 0.3)) {
      return {
        label: "Hampir Penuh",
        badge: "bg-yellow-400 text-black",
        card: "border-yellow-300 bg-yellow-50",
        text: "text-yellow-600",
        progress: "bg-yellow-500",
      };
    }

    return {
      label: "Tersedia",
      badge: "bg-green-500 text-white",
      card: "border-green-300 bg-green-50",
      text: "text-green-600",
      progress: "bg-green-500",
    };
  }

  function getStatusKuotaPrediksi(sisa: number, total: number) {
    if (sisa <= 0) {
      return "bg-red-500";
    }

    if (sisa <= Math.ceil(total * 0.3)) {
      return "bg-yellow-500";
    }

    return "bg-green-500";
  }

  return (
    <>
      {/* BACK TO HOME BUTTON */}
      <div className="mb-8">
        <Link
          href="/"
          className="
              inline-flex items-center gap-3
              px-5 py-2.5
              rounded-xl  
              bg-white/80 backdrop-blur
              border border-gray-200
              text-gray-700 font-medium
              shadow-sm
              hover:bg-white 
              hover:border-[#F59E0B]
              hover:text-[#7F1D1D]
              hover:shadow-md
              transition-all duration-200
            "
        >
          <span
            className="
              flex items-center justify-center
              w-8 h-8
              rounded-lg
              bg-[#FEF3C7] text-[#7F1D1D]
            "
          >
            <HiArrowLeft className="text-lg" />
          </span>

          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* HEADER */}
      <div className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#7F1D1D] tracking-tight">
          Form Pendaftaran Magang
        </h1>

        <p className="text-gray-600 mt-3 text-lg">
          Silakan lengkapi data di bawah ini dengan informasi yang benar dan
          dapat dipertanggungjawabkan.
        </p>

        <p className="text-sm text-gray-500 mt-2 max-w-2xl mx-auto">
          Pastikan seluruh kolom wajib <span className="text-red-500">*</span>{" "}
          telah diisi.
        </p>
      </div>

      {/* ================= CEK RIWAYAT & DOWNLOAD TEMPLATE ================= */}
      <div className="max-w-4xl mx-auto mb-10 md:mb-12 space-y-4 md:space-y-6">
        {/* CARD UTAMA RIWAYAT */}
        <Link
          href="/pendaftaran/riwayat"
          className="
            block rounded-3xl
            bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
            text-white
            p-5 sm:p-6 md:p-8
            shadow-xl
            hover:scale-[1.01]
            transition
          "
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-start gap-3 sm:gap-4">
              <div
                className="
                  w-12 h-12 sm:w-14 sm:h-14
                  rounded-2xl
                  bg-white/20
                  flex items-center justify-center
                  backdrop-blur
                "
              >
                <HiClipboardList className="text-2xl sm:text-3xl" />
              </div>

              <div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold leading-tight">
                  Cek Riwayat Pendaftaran Anda
                </h3>
                <p className="text-white/90 mt-1 text-sm sm:text-base">
                  Lihat status pengajuan magang dan hasil seleksi di sini.
                </p>
              </div>
            </div>

            <div className="w-full md:w-auto">
              <span
                className="
                  inline-flex items-center justify-center
                  w-full md:w-auto
                  bg-white text-[#7F1D1D]
                  px-5 py-3
                  rounded-xl
                  font-semibold
                  shadow
                "
              >
                Lihat Riwayat
              </span>
            </div>
          </div>
        </Link>

        {/* CARD SEKUNDER: TEMPLATE */}
        <div
          className="
            bg-white/80 backdrop-blur
            rounded-2xl shadow-md
            px-5 py-5 sm:px-6
            flex flex-col md:flex-row
            md:items-center md:justify-between
            gap-4
            border border-gray-200
          "
        >
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">
              Contoh Surat Pengantar
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Tersedia sebagai referensi, penggunaan bersifat opsional.
            </p>
          </div>

          <a
            href="https://docs.google.com/document/d/1JiVL8Sg6XiHHs8RBlX5pZZ9zFQTBNWepQfTSwcsa1YU/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex items-center justify-center gap-2
              w-full md:w-auto
              px-5 py-2.5
              rounded-xl
              text-sm font-semibold
              bg-linear-to-r from-[#F59E0B] to-[#FACC15]
              text-white
              hover:brightness-110
              transition
            "
          >
            <HiDocument className="text-lg" />
            Buka Template
          </a>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-10 bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl p-10"
      >
        {/* INFORMASI PERMOHONAN */}
        <div className="bg-white rounded-2xl shadow-md p-8 space-y-6">
          <h2 className="text-lg font-semibold text-[#7F1D1D]">
            Informasi Permohonan
          </h2>

          <p className="text-sm text-gray-500">
            Pilih kategori pendaftaran dan jumlah peserta yang akan mengikuti
            program magang.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Kategori Pemohon */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Kategori Pemohon <span className="text-red-500">*</span>
              </label>

              <div className="form-field">
                <select
                  value={kategori}
                  onChange={(e) => {
                    const value = e.target.value as "sendiri" | "bersama";

                    setKategori(value);

                    if (value === "sendiri") {
                      ubahJumlah(1);
                    } else {
                      ubahJumlah(2);
                    }
                  }}
                >
                  <option value="sendiri">Sendiri</option>
                  <option value="bersama">Bersama (Kelompok)</option>
                </select>
              </div>
            </div>

            {/* Jumlah Peserta */}
            {kategori === "bersama" && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Jumlah Peserta <span className="text-red-500">*</span>
                </label>

                <div className="form-field">
                  <select
                    value={jumlah}
                    onChange={(e) => ubahJumlah(Number(e.target.value))}
                  >
                    {[2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} Orang
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  Maksimal 5 peserta dalam satu pendaftaran
                </p>
              </div>
            )}
          </div>
        </div>

        {/* PESERTA */}
        {peserta.map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-md p-8 space-y-4">
            <h2 className="text-xl font-bold text-[#7F1D1D]">
              Data Peserta {i + 1}
            </h2>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>

              <div
                className={`form-field ${
                  errors[`nama-${i}`] ? "form-error" : ""
                }`}
              >
                <HiUser className="form-icon" />
                <input
                  value={peserta[i].nama}
                  placeholder="Masukkan nama lengkap"
                  onChange={(e) => {
                    update(i, "nama", e.target.value);
                    setErrors((prev) => ({ ...prev, [`nama-${i}`]: false }));
                  }}
                />
              </div>

              {errors[`nama-${i}`] && (
                <p className="text-xs text-red-500 mt-1">
                  Nama lengkap wajib diisi
                </p>
              )}
            </div>

            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Posisi Magang <span className="text-red-500">*</span>
            </label>

            {/* TAMBAHAN: petunjuk klik card */}
            <p className="text-xs text-gray-500 mb-3 flex items-center gap-2">
              <HiCalendar className="text-gray-400" />
              Klik card posisi untuk melihat jadwal ketersediaan magang pada kalender
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {formasiList.map((item) => {
                const kuota = item.kuota;

                const kuotaRealtime = hitungKuotaBulanIni(item);

                const aktif = kuotaRealtime.aktif;
                const sisa = kuotaRealtime.sisa;

                const prediksi = simulasiKuotaBulanan(item);

                const penuh = false;
                const status = getStatusKuota(sisa, kuota);

                const selected = peserta[i].posisi === item.title;

                return (
                  <div
                    key={item._id}
                    onClick={() => {
                      if (penuh) {
                        toast.error("❌ Kuota formasi ini sudah penuh");
                        return;
                      }

                      setSelectedFormasi(item);
                      setCalendarOpen(true);
                    }}
                    className={`
                      relative group
                      rounded-3xl
                      shadow-lg
                      p-6
                      cursor-pointer
                      transition-all
                      hover:-translate-y-2
                      hover:shadow-xl
                      border
                      hover:border-[#7F1D1D]

                      ${selected ? "ring-2 ring-[#7F1D1D]" : ""}

                      ${status.card}
                    `}
                  >

                    {/* HEADER */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-bold text-[#7F1D1D] leading-snug">{item.title}</h3>

                      <span
                        className={`text-[11px] px-3 py-1 rounded-full font-semibold whitespace-nowrap ${status.badge}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    {/* KUOTA */}

                    <div className="text-center mb-4">
                      <p className="text-xs text-gray-600 text-center mb-2 tracking-wide">
                        SISA KUOTA BULAN{" "}
                        {new Date()
                          .toLocaleDateString("id-ID", { month: "long" })
                          .toUpperCase()}
                      </p>

                      <p
                        className={`text-5xl font-extrabold
                        ${status.text}`}
                      >
                        {sisa}
                      </p>

                      <p className="text-sm text-gray-500">orang</p>
                    </div>

                    {/* INFO */}

                    <div className="text-sm space-y-2 mb-4 text-black">
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1 text-black">
                          <HiUsers className="text-yellow-500" />
                          Total Kuota
                        </span>

                        <span className="font-semibold">{kuota}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="flex items-center gap-1 text-black">
                          <FaUserCheck className="text-blue-500" />
                          Sudah Magang
                        </span>

                        <span className="font-semibold">{aktif}</span>
                      </div>
                    </div>

                    {/* PREDIKSI */}

                    <div className={`rounded-xl p-3 text-black border ${status.card}`}>
                      <p className="text-sm font-bold text-[#7F1D1D] mb-2">
                        Prediksi Kuota
                      </p>

                      {prediksi.slice(0, 4).map((p, idx) => {
                        return (
                          <div key={idx} className="mb-2">
                            <div className="flex justify-between text-xs">
                              <span>{p.bulan}</span>
                              <span className="font-semibold text-black">
                                {p.sisaKuota} Slot
                              </span>
                            </div>

                            <div className="w-full bg-gray-200 h-2 rounded-full mt-1">
                              <div
                                className={`${getStatusKuotaPrediksi(p.sisaKuota, item.kuota)} h-2 rounded-full`}
                                style={{
                                  width: `${(p.aktif / item.kuota) * 100}%`,
                                }}
                              />
                            </div>

                            <div className="text-xs text-black">
                              {p.aktif} terisi • {p.sisaKuota} tersedia
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-center gap-1 text-[11px] text-gray-500 mb-2">
                      <HiCalendar className="text-gray-400" />
                      <span>Lihat jadwal magang di kalender</span>
                    </div>

                    {/* TAMBAHAN: jika kuota penuh */}
                    {sisa === 0 && (
                      <div className="text-xs text-red-600 text-center mb-2 font-medium">
                        Kuota bulan ini penuh • Cek tanggal lain di kalender
                      </div>
                    )}

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();

                          if (penuh) {
                            toast.error("❌ Kuota formasi ini sudah penuh");
                            return;
                          }

                          update(i, "posisi", item.title);
                        }}
                        className={`
    w-full py-2.5 rounded-xl text-sm font-semibold transition
    ${
      penuh
        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
        : selected
          ? "bg-green-600 text-white"
          : "bg-linear-to-r from-[#F59E0B] to-[#FACC15] text-white hover:brightness-110"
    }
  `}
                      >
                        {penuh
                          ? "Kuota Penuh"
                          : selected
                            ? "Posisi Dipilih"
                            : "Pilih Posisi"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Notifikasi Waring tanggal magang */}

            {slotWarning && (
              <div
                className={`mb-3 p-3 rounded-lg text-sm font-medium
    ${
      slotPenuh
        ? "bg-red-100 text-red-700 border border-red-300"
        : "bg-yellow-100 text-yellow-700 border border-yellow-300"
    }`}
              >
                {slotWarning}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Tanggal Mulai Magang */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Tanggal Mulai Magang <span className="text-red-500">*</span>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2
                                text-[#B91C1C] hover:text-[#7F1D1D]
                                p-1 rounded-md hover:bg-[#FEF3C7] transition"
                  >
                    <HiCalendar />
                  </button>
                </div>
              </div>

              {/* Tanggal Perkiraan Selesai */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Tanggal Perkiraan Selesai{" "}
                  <span className="text-red-500">*</span>
                </label>

                <div
                  className={`form-field pr-10 relative ${
                    errors[`tanggalSelesaiMagang-${i}`] ? "form-error" : ""
                  }`}
                >
                  <input
                    type="date"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2
                                text-[#B91C1C] hover:text-[#7F1D1D]
                                p-1 rounded-md hover:bg-[#FEF3C7] transition"
                  >
                    <HiCalendar />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Tempat Lahir */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Tempat Lahir <span className="text-red-500">*</span>
                </label>

                <div
                  className={`form-field ${
                    errors[`tempatLahir-${i}`] ? "form-error" : ""
                  }`}
                >
                  <HiLocationMarker className="form-icon" />
                  <input
                    value={peserta[i].tempatLahir}
                    placeholder="Tempat lahir"
                    onChange={(e) => {
                      update(i, "tempatLahir", e.target.value);
                      setErrors((p) => ({
                        ...p,
                        [`tempatLahir-${i}`]: false,
                      }));
                    }}
                  />
                </div>
              </div>

              {/* Tanggal Lahir */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Tanggal Lahir <span className="text-red-500">*</span>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2
                                text-[#B91C1C] hover:text-[#7F1D1D]
                                p-1 rounded-md hover:bg-[#FEF3C7] transition"
                  >
                    <HiCalendar />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Jenis Kelamin <span className="text-red-500">*</span>
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
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
            </div>

            {/* JENIS ASAL */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Asal Instansi <span className="text-red-500">*</span>
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
                  <option value="">Pilih Instansi</option>
                  <option value="Universitas">Universitas</option>
                  <option value="SMK">SMK</option>
                  <option value="Instansi">Instansi</option>
                </select>
              </div>

              {errors[`asalJenis-${i}`] && (
                <p className="text-xs text-red-500 mt-1">
                  Asal instansi wajib dipilih
                </p>
              )}
            </div>

            {/* ================= NAMA INSTANSI ================= */}

            {/* INSTANSI PEMERINTAH */}
            {peserta[i].asalJenis === "Instansi" && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Nama Instansi Pemerintah{" "}
                  <span className="text-red-500">*</span>
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
                  <p className="text-xs text-red-500 mt-1">
                    Nama instansi wajib diisi
                  </p>
                )}
              </div>
            )}

            {/* UNIVERSITAS / SMK */}
            {peserta[i].asalJenis && peserta[i].asalJenis !== "Instansi" && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Nama {peserta[i].asalJenis}{" "}
                  <span className="text-red-500">*</span>
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
                    <option value="">Pilih {peserta[i].asalJenis}</option>

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
                  <p className="text-xs text-red-500 mt-1">
                    Nama {peserta[i].asalJenis} wajib dipilih
                  </p>
                )}
              </div>
            )}

            {peserta[i].asalNama === "LAINNYA" && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Nama {peserta[i].asalJenis}{" "}
                  <span className="text-red-500">*</span>
                </label>

                <div
                  className={`form-field ${
                    errors[`asalNamaLainnya-${i}`] ? "form-error" : ""
                  }`}
                >
                  <input
                    value={peserta[i].asalNamaLainnya}
                    placeholder={`Masukkan nama ${peserta[i].asalJenis}`}
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

                {errors[`asalNamaLainnya-${i}`] && (
                  <p className="text-xs text-red-500 mt-1">
                    Gunakan huruf kapital di awal setiap kata
                  </p>
                )}

                <p className="text-xs text-gray-400 mt-1">
                  Contoh penulisan yang benar: <b>Universitas Indonesia</b>
                </p>
              </div>
            )}

            {/* ================= JURUSAN ================= */}
            {peserta[i].asalJenis !== "Instansi" && peserta[i].asalNama && (
              <>
                {/* ===== SELECT JURUSAN ===== */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Jurusan <span className="text-red-500">*</span>
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
                        setErrors((p) => ({ ...p, [`jurusan-${i}`]: false }));
                      }}
                    >
                      <option value="">Pilih Jurusan</option>

                      {(peserta[i].asalJenis === "Universitas"
                        ? JURUSAN_BY_UNIVERSITAS[peserta[i].asalNama] || [
                            "LAINNYA",
                          ]
                        : JURUSAN_SMK[peserta[i].asalNama] || ["LAINNYA"]
                      ).map((j) => (
                        <option key={j} value={j}>
                          {j}
                        </option>
                      ))}
                    </select>
                  </div>

                  {errors[`jurusan-${i}`] && (
                    <p className="text-xs text-red-500 mt-1">
                      Jurusan wajib dipilih
                    </p>
                  )}
                </div>

                {/* ===== INPUT JURUSAN LAINNYA ===== */}
                {peserta[i].jurusan === "LAINNYA" && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Nama Jurusan <span className="text-red-500">*</span>
                    </label>

                    <div
                      className={`form-field ${
                        errors[`jurusanLainnya-${i}`] ? "form-error" : ""
                      }`}
                    >
                      <input
                        value={peserta[i].jurusanLainnya}
                        placeholder="Masukkan nama jurusan"
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

                    {errors[`jurusanLainnya-${i}`] && (
                      <p className="text-xs text-red-500 mt-1">
                        Gunakan huruf kapital di awal setiap kata
                      </p>
                    )}

                    <p className="text-xs text-gray-400 mt-1">
                      Contoh penulisan yang benar:{" "}
                      <b>Teknik Informatika (S1)</b>
                    </p>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Alamat Lengkap <span className="text-red-500">*</span>
              </label>

              <div
                className={`form-field ${
                  errors[`alamat-${i}`] ? "form-error" : ""
                }`}
              >
                <textarea
                  rows={3}
                  placeholder="Alamat lengkap sesuai domisili"
                  value={peserta[i].alamatLengkap}
                  onChange={(e) => {
                    update(i, "alamatLengkap", e.target.value);
                    setErrors((p) => ({ ...p, [`alamat-${i}`]: false }));
                  }}
                />
              </div>
            </div>

            {/* WILAYAH */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Provinsi */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Provinsi <span className="text-red-500">*</span>
                </label>

                <div
                  className={`form-field ${
                    errors[`provinsi-${i}`] ? "form-error" : ""
                  }`}
                >
                  <select
                    value={peserta[i].provinsiId}
                    onChange={(e) => {
                      const o = provinsi.find((x) => x.id === e.target.value);
                      if (o) update(i, "provinsi", o.name, o.id);
                      setErrors((p) => ({ ...p, [`provinsi-${i}`]: false }));
                    }}
                  >
                    <option value="">Pilih Provinsi</option>
                    {provinsi.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kota */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Kota / Kabupaten <span className="text-red-500">*</span>
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
                      setErrors((p) => ({ ...p, [`kota-${i}`]: false }));
                    }}
                  >
                    <option value="">Pilih Kota / Kabupaten</option>
                    {wilayah[i]?.kota.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Kecamatan */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Kecamatan <span className="text-red-500">*</span>
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
                      setErrors((p) => ({ ...p, [`kecamatan-${i}`]: false }));
                    }}
                  >
                    <option value="">Pilih Kecamatan</option>
                    {wilayah[i]?.kecamatan.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name}
                      </option>
                    ))}
                  </select>
                </div>

                {errors[`kecamatan-${i}`] && (
                  <p className="text-xs text-red-500 mt-1">
                    Kecamatan wajib dipilih
                  </p>
                )}
              </div>

              {/* Kelurahan */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Kelurahan <span className="text-red-500">*</span>
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
                      setErrors((p) => ({ ...p, [`kelurahan-${i}`]: false }));
                    }}
                  >
                    <option value="">Pilih Kelurahan</option>
                    {wilayah[i]?.kelurahan.map((k) => (
                      <option key={k.id} value={k.name}>
                        {k.name}
                      </option>
                    ))}
                  </select>
                </div>

                {errors[`kelurahan-${i}`] && (
                  <p className="text-xs text-red-500 mt-1">
                    Kelurahan wajib dipilih
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Email <span className="text-red-500">*</span>
              </label>

              <div
                className={`form-field ${
                  errors[`email-${i}`] ? "form-error" : ""
                }`}
              >
                <HiMail className="form-icon" />
                <input
                  value={peserta[i].email}
                  placeholder="contoh@gmail.com"
                  onChange={(e) => {
                    update(i, "email", e.target.value);
                    setErrors((prev) => ({ ...prev, [`email-${i}`]: false }));
                  }}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                No WhatsApp <span className="text-red-500">*</span>
              </label>

              <div
                className={`form-field ${
                  errors[`wa-${i}`] ? "form-error" : ""
                }`}
              >
                <HiPhone className="form-icon" />
                <input
                  value={peserta[i].wa}
                  placeholder="08xxxxxxxxxx"
                  onChange={(e) => {
                    update(i, "wa", e.target.value);
                    setErrors((prev) => ({ ...prev, [`wa-${i}`]: false }));
                  }}
                />
              </div>

              <p className="text-xs text-gray-400 mt-1">Contoh: 081234567890</p>
            </div>
          </div>
        ))}

        {/* UPLOAD */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <HiUpload />
            Surat Pengantar <span className="text-red-500">*</span>
          </label>

          <label
            className={`flex items-center justify-between px-4 py-4 border-2 border-dashed rounded-xl cursor-pointer
                ${
                  errors["surat"]
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300 hover:border-[#F59E0B]"
                }
              `}
          >
            <span className="text-gray-600">
              {surat ? surat.name : "Klik untuk upload surat pengantar"}
            </span>
            <span className="text-sm text-[#7F1D1D] font-medium">Browse</span>

            <input
              type="file"
              hidden
              onChange={(e) => {
                setSurat(e.target.files?.[0] || null);
                setErrors((prev) => ({ ...prev, surat: false }));
              }}
            />
          </label>

          {errors["surat"] && (
            <p className="text-sm text-red-500 mt-1">
              Surat pengantar wajib diupload
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || slotPenuh}
          className="w-full py-4 rounded-xl text-white font-semibold text-lg
              bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
              hover:scale-[1.02] transition disabled:opacity-60"
        >
          {loading ? "Mengirim..." : "Kirim Pendaftaran"}
        </button>
        {slotPenuh && (
          <p className="text-center text-red-600 text-sm mt-3 font-medium">
            Pendaftaran tidak dapat dilakukan karena kuota magang pada tanggal
            tersebut sudah penuh.
          </p>
        )}
      </form>

      {/* ================= MODAL KONFIRMASI ================= */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-scaleIn">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Konfirmasi Pendaftaran
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Apakah Anda yakin semua data yang diinput sudah benar?
              <br />
              <span className="text-gray-500">
                Data tidak dapat diubah setelah dikirim.
              </span>
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="
                    px-4 py-2
                    rounded-lg
                    border border-gray-300
                    bg-white
                    text-gray-700 font-medium
                    hover:bg-gray-100
                    hover:text-gray-900
                    transition
                  "
              >
                Cek Ulang
              </button>
              <button
                onClick={submitConfirmed}
                className="px-5 py-2 rounded-lg bg-linear-to-r from-[#7F1D1D] to-[#B91C1C] text-white font-semibold hover:opacity-90"
              >
                Ya, Kirim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL SUKSES ================= */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* BACKDROP */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSuccess(false)}
          />

          {/* CARD */}
          <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-scaleIn text-center">
            {/* ICON */}
            <div
              className="mx-auto mb-4 w-20 h-20 rounded-full
                            bg-linear-to-br from-[#F59E0B] to-[#FACC15]
                            flex items-center justify-center shadow-lg"
            >
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            {/* TITLE */}
            <h3 className="text-2xl font-extrabold text-gray-800 mb-2">
              Pendaftaran Berhasil 🎉
            </h3>

            {/* DESC */}
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              Data pendaftaran magang Anda telah berhasil dikirim.
              <br />
              Silakan menunggu proses verifikasi dari admin.
            </p>

            {/* ACTION */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowSuccess(false)}
                className="
                  w-full py-3 rounded-xl
                  bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                  text-white font-semibold
                  hover:scale-[1.02] transition
                "
              >
                OK, Mengerti
              </button>

              <Link
                href="/pendaftaran/riwayat"
                className="text-sm text-[#7F1D1D] hover:underline"
              >
                Lihat Riwayat Pendaftaran
              </Link>
            </div>
          </div>
        </div>
      )}
      <CalendarPopup
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        formasi={selectedFormasi}
      />
    </>
  );
}

// Loading fallback untuk Suspense
function PendaftaranLoading() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#FFF7ED] via-[#FEF3C7] to-[#FFFFFF] py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white/80">
            <span className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse"></span>
            <span className="w-32 h-4 bg-gray-200 rounded animate-pulse"></span>
          </div>
        </div>

        <div className="text-center mb-14">
          <div className="w-96 h-12 bg-gray-200 rounded-lg animate-pulse mx-auto mb-3"></div>
          <div className="w-64 h-4 bg-gray-200 rounded animate-pulse mx-auto"></div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl p-10">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-gray-200 rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Komponen utama yang diekspor
export default function PendaftaranPage() {
  return (
    <Suspense fallback={<PendaftaranLoading />}>
      <div className="min-h-screen bg-linear-to-br from-[#FFF7ED] via-[#FEF3C7] to-[#FFFFFF] py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <PendaftaranForm />
        </div>
      </div>
    </Suspense>
  );
}
