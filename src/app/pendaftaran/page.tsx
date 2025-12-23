"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  HiUser,
  HiMail,
  HiPhone,
  HiBriefcase,
  HiUpload,
  HiLocationMarker,
} from "react-icons/hi";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const waRegex = /^08[0-9]{8,11}$/;


/* ================== KONSTANTA ================== */
const POSISI_MAGANG = [
  "IT / Programmer",
  "Desain Grafis",
  "Administrasi",
  "Humas",
  "Analis Data",
];

type Wilayah = {
  id: string;
  name: string;
};

type Peserta = {
  nama: string;
  posisi: string;
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

export default function PendaftaranPage() {
  const kosong: Peserta = {
    nama: "",
    posisi: "",
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
  };

  const [kategori, setKategori] = useState<"sendiri" | "bersama">("sendiri");
  const [jumlah, setJumlah] = useState(1);
  const [peserta, setPeserta] = useState<Peserta[]>([kosong]);
  const [surat, setSurat] = useState<File | null>(null);

  const [provinsi, setProvinsi] = useState<Wilayah[]>([]);
  const [kota, setKota] = useState<Wilayah[]>([]);
  const [kecamatan, setKecamatan] = useState<Wilayah[]>([]);
  const [kelurahan, setKelurahan] = useState<Wilayah[]>([]);

  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  /* ================== LOAD PROVINSI ================== */
  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then((res) => res.json())
      .then(setProvinsi);
  }, []);

  /* ================== UPDATE DATA ================== */
  const update = async (
    i: number,
    key: keyof Peserta,
    value: string,
    id?: string
  ) => {
    const data = [...peserta];
    (data[i] as any)[key] = value;
    if (id) (data[i] as any)[`${key}Id`] = id;

    if (key === "provinsi") {
      data[i].kota = "";
      data[i].kecamatan = "";
      data[i].kelurahan = "";

      const res = await fetch(
        `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${id}.json`
      );
      setKota(await res.json());
      setKecamatan([]);
      setKelurahan([]);
    }

    if (key === "kota") {
      data[i].kecamatan = "";
      data[i].kelurahan = "";

      const res = await fetch(
        `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${id}.json`
      );
      setKecamatan(await res.json());
      setKelurahan([]);
    }

    if (key === "kecamatan") {
      data[i].kelurahan = "";

      const res = await fetch(
        `https://www.emsifa.com/api-wilayah-indonesia/api/villages/${id}.json`
      );
      setKelurahan(await res.json());
    }

    setPeserta(data);
  };

  const ubahJumlah = (n: number) => {
    setJumlah(n);
    setPeserta(Array.from({ length: n }).map((_, i) => peserta[i] || kosong));
  };

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};

    peserta.forEach((p, i) => {
      if (!p.nama) newErrors[`nama-${i}`] = true;
      if (!p.posisi) newErrors[`posisi-${i}`] = true;
      if (!p.tempatLahir) newErrors[`tempatLahir-${i}`] = true;
      if (!p.tanggalLahir) newErrors[`tanggalLahir-${i}`] = true;
      if (!p.jenisKelamin) newErrors[`jenisKelamin-${i}`] = true;

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
      }

      if (!p.wa) {
        newErrors[`wa-${i}`] = true;
      } else if (!waRegex.test(p.wa)) {
        newErrors[`wa-${i}`] = true;
        toast.error(
          `❌ Nomor WhatsApp Peserta ${i + 1} harus diawali 08 & valid`
        );
      }
    });

    if (!surat) newErrors["surat"] = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  /* ================== SUBMIT ================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.warning("❗ Mohon lengkapi semua kolom");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("kategori", kategori);
      formData.append("jumlahPeserta", jumlah.toString());
      formData.append("peserta", JSON.stringify(peserta));
      formData.append("surat", surat!);

      const res = await fetch("http://localhost:5000/api/pendaftaran", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("🔥 Pendaftaran berhasil dikirim!");
        setPeserta([kosong]);
        setSurat(null);
        setJumlah(1);
        setKategori("sendiri");
      } else {
        toast.error(data.message || "❌ Gagal mengirim pendaftaran");
      }
    } catch {
      toast.error("⚠️ Terjadi kesalahan server");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 tracking-tight">
            Form Pendaftaran Magang
          </h1>

          <p className="text-gray-600 mt-3 text-lg">
            Silakan lengkapi data di bawah ini dengan informasi yang benar dan dapat
            dipertanggungjawabkan.
          </p>

          <p className="text-sm text-gray-500 mt-2 max-w-2xl mx-auto">
            Pastikan seluruh kolom wajib <span className="text-red-500">*</span> telah diisi.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-10 bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl p-10"
        >
          {/* INFORMASI PERMOHONAN */}
          <div className="bg-white rounded-2xl shadow-md p-8 space-y-6">
            <h2 className="text-lg font-semibold text-blue-800">
              Informasi Permohonan
            </h2>

            <p className="text-sm text-gray-500">
              Pilih kategori pendaftaran dan jumlah peserta yang akan mengikuti program magang.
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
                    onChange={(e) => setKategori(e.target.value as any)}
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
            <div
              key={i}
              className="bg-white rounded-2xl shadow-md p-8 space-y-4"
            >
              <h2 className="text-xl font-bold text-blue-800">
                Data Peserta {i + 1}
              </h2>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>

                <div className={`form-field ${errors[`nama-${i}`] ? "form-error" : ""}`}>
                  <HiUser className="form-icon" />
                  <input
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

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Posisi Magang <span className="text-red-500">*</span>
                </label>

                <div className={`form-field ${errors[`posisi-${i}`] ? "form-error" : ""}`}>
                  <HiBriefcase className="form-icon" />
                  <select
                    onChange={(e) => {
                      update(i, "posisi", e.target.value);
                      setErrors((prev) => ({ ...prev, [`posisi-${i}`]: false }));
                    }}
                  >
                    <option value="">Pilih Posisi Magang</option>
                    {POSISI_MAGANG.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Tempat Lahir */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Tempat Lahir <span className="text-red-500">*</span>
                  </label>

                  <div className={`form-field ${errors[`tempatLahir-${i}`] ? "form-error" : ""}`}>
                    <HiLocationMarker className="form-icon" />
                    <input
                      placeholder="Tempat lahir"
                      onChange={(e) => {
                        update(i, "tempatLahir", e.target.value);
                        setErrors((p) => ({ ...p, [`tempatLahir-${i}`]: false }));
                      }}
                    />
                  </div>
                </div>

                {/* Tanggal Lahir */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Tanggal Lahir <span className="text-red-500">*</span>
                  </label>

                  <div className={`form-field ${errors[`tanggalLahir-${i}`] ? "form-error" : ""}`}>
                    <input
                      type="date"
                      onChange={(e) => {
                        update(i, "tanggalLahir", e.target.value);
                        setErrors((p) => ({ ...p, [`tanggalLahir-${i}`]: false }));
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Jenis Kelamin <span className="text-red-500">*</span>
                </label>

                <div className={`form-field ${errors[`jenisKelamin-${i}`] ? "form-error" : ""}`}>
                  <select
                    onChange={(e) => {
                      update(i, "jenisKelamin", e.target.value);
                      setErrors((p) => ({ ...p, [`jenisKelamin-${i}`]: false }));
                    }}
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>

              {/* WILAYAH */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Provinsi */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Provinsi <span className="text-red-500">*</span>
                  </label>

                  <div className={`form-field ${errors[`provinsi-${i}`] ? "form-error" : ""}`}>
                    <select
                      onChange={(e) => {
                        const o = provinsi.find((x) => x.id === e.target.value);
                        if (o) update(i, "provinsi", o.name, o.id);
                        setErrors((p) => ({ ...p, [`provinsi-${i}`]: false }));
                      }}
                    >
                      <option value="">Pilih Provinsi</option>
                      {provinsi.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Kota */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Kota / Kabupaten <span className="text-red-500">*</span>
                  </label>

                  <div className={`form-field ${errors[`kota-${i}`] ? "form-error" : ""}`}>
                    <select
                      onChange={(e) => {
                        const o = kota.find((x) => x.id === e.target.value);
                        if (o) update(i, "kota", o.name, o.id);
                        setErrors((p) => ({ ...p, [`kota-${i}`]: false }));
                      }}
                    >
                      <option value="">Pilih Kota / Kabupaten</option>
                      {kota.map((k) => (
                        <option key={k.id} value={k.id}>{k.name}</option>
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

                  <div className={`form-field ${errors[`kecamatan-${i}`] ? "form-error" : ""}`}>
                    <select
                      onChange={(e) => {
                        const o = kecamatan.find((x) => x.id === e.target.value);
                        if (o) update(i, "kecamatan", o.name, o.id);
                        setErrors((p) => ({ ...p, [`kecamatan-${i}`]: false }));
                      }}
                    >
                      <option value="">Pilih Kecamatan</option>
                      {kecamatan.map((k) => (
                        <option key={k.id} value={k.id}>{k.name}</option>
                      ))}
                    </select>
                  </div>

                  {errors[`kecamatan-${i}`] && (
                    <p className="text-xs text-red-500 mt-1">Kecamatan wajib dipilih</p>
                  )}
                </div>

                {/* Kelurahan */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Kelurahan <span className="text-red-500">*</span>
                  </label>

                  <div className={`form-field ${errors[`kelurahan-${i}`] ? "form-error" : ""}`}>
                    <select
                      onChange={(e) => {
                        update(i, "kelurahan", e.target.value);
                        setErrors((p) => ({ ...p, [`kelurahan-${i}`]: false }));
                      }}
                    >
                      <option value="">Pilih Kelurahan</option>
                      {kelurahan.map((k) => (
                        <option key={k.id} value={k.name}>{k.name}</option>
                      ))}
                    </select>
                  </div>

                  {errors[`kelurahan-${i}`] && (
                    <p className="text-xs text-red-500 mt-1">Kelurahan wajib dipilih</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Alamat Lengkap <span className="text-red-500">*</span>
                </label>

                <div className={`form-field ${errors[`alamat-${i}`] ? "form-error" : ""}`}>
                  <textarea
                    rows={3}
                    placeholder="Alamat lengkap sesuai domisili"
                    onChange={(e) => {
                      update(i, "alamatLengkap", e.target.value);
                      setErrors((p) => ({ ...p, [`alamat-${i}`]: false }));
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Email <span className="text-red-500">*</span>
                </label>

                <div className={`form-field ${errors[`email-${i}`] ? "form-error" : ""}`}>
                  <HiMail className="form-icon" />
                  <input
                    placeholder="contoh@email.com"
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

                <div className={`form-field ${errors[`wa-${i}`] ? "form-error" : ""}`}>
                  <HiPhone className="form-icon" />
                  <input
                    placeholder="08xxxxxxxxxx"
                    onChange={(e) => {
                      update(i, "wa", e.target.value);
                      setErrors((prev) => ({ ...prev, [`wa-${i}`]: false }));
                    }}
                  />
                </div>

                <p className="text-xs text-gray-400 mt-1">
                  Contoh: 081234567890
                </p>
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
                ${errors["surat"] ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-blue-400"}
              `}
            >
              <span className="text-gray-600">
                {surat ? surat.name : "Klik untuk upload surat pengantar"}
              </span>
              <span className="text-sm text-blue-600 font-medium">Browse</span>

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
            disabled={loading}
            className="w-full py-4 rounded-xl text-white font-semibold text-lg
              bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-500
              hover:scale-[1.02] transition disabled:opacity-60"
          >
            {loading ? "Mengirim..." : "Kirim Pendaftaran"}
          </button>
        </form>
      </div>
    </div>
  );
}