"use client";

import { useEffect, useState } from "react";

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
  const [success, setSuccess] = useState(false);

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

  /* ================== SUBMIT ================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surat) return alert("Surat pengantar wajib diupload");

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("kategori", kategori);
      formData.append("jumlahPeserta", jumlah.toString());
      formData.append("peserta", JSON.stringify(peserta));
      formData.append("surat", surat);

      const res = await fetch("http://localhost:5000/api/pendaftaran", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setPeserta([kosong]);
        setSurat(null);
        setJumlah(1);
        setKategori("sendiri");
      } else {
        alert(data.message || "Gagal mengirim pendaftaran");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat mengirim data!");
    }

    setLoading(false);
    setTimeout(() => setSuccess(false), 4000);
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* TOAST */}
      {success && (
        <div className="fixed top-5 right-5 bg-green-600 text-white px-6 py-4 rounded-xl shadow-lg animate-slide-in z-50">
          ✅ Pendaftaran berhasil dikirim
        </div>
      )}

      <div className="max-w-6xl mx-auto p-10">
        <h1 className="text-3xl font-bold text-center mb-10">
          Form Pendaftaran Magang BPOM
        </h1>

        <form className="space-y-10" onSubmit={handleSubmit}>
          {/* KATEGORI */}
          <div>
            <label className="label">Kategori Pemohon</label>
            <select
              className="input w-60"
              onChange={(e) => setKategori(e.target.value as any)}
            >
              <option value="sendiri">Sendiri</option>
              <option value="bersama">Bersama (Max 5)</option>
            </select>
          </div>

          {kategori === "bersama" && (
            <div>
              <label className="label">Jumlah Peserta</label>
              <select
                className="input w-40"
                onChange={(e) => ubahJumlah(Number(e.target.value))}
              >
                {[2, 3, 4, 5].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>
          )}

          {peserta.map((_, i) => (
            <div key={i} className="border rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-lg">Data Peserta {i + 1}</h2>

              <input
                className="input"
                placeholder="Nama Lengkap"
                onChange={(e) => update(i, "nama", e.target.value)}
              />

              <select
                className="input"
                onChange={(e) => update(i, "posisi", e.target.value)}
              >
                <option value="">-- Posisi Magang --</option>
                {POSISI_MAGANG.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>

              <div className="grid md:grid-cols-2 gap-4">
                <input
                  className="input"
                  placeholder="Tempat Lahir"
                  onChange={(e) => update(i, "tempatLahir", e.target.value)}
                />
                <input
                  type="date"
                  className="input"
                  onChange={(e) => update(i, "tanggalLahir", e.target.value)}
                />
              </div>

              <select
                className="input"
                onChange={(e) => update(i, "jenisKelamin", e.target.value)}
              >
                <option value="">-- Jenis Kelamin --</option>
                <option>Laki-laki</option>
                <option>Perempuan</option>
              </select>

              {/* WILAYAH */}
              <select
                className="input"
                onChange={(e) => {
                  const o = provinsi.find((x) => x.id === e.target.value);
                  if (o) update(i, "provinsi", o.name, o.id);
                }}
              >
                <option value="">-- Provinsi --</option>
                {provinsi.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                className="input"
                onChange={(e) => {
                  const o = kota.find((x) => x.id === e.target.value);
                  if (o) update(i, "kota", o.name, o.id);
                }}
              >
                <option value="">-- Kota / Kabupaten --</option>
                {kota.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>

              <select
                className="input"
                onChange={(e) => {
                  const o = kecamatan.find((x) => x.id === e.target.value);
                  if (o) update(i, "kecamatan", o.name, o.id);
                }}
              >
                <option value="">-- Kecamatan --</option>
                {kecamatan.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>

              <select
                className="input"
                onChange={(e) => update(i, "kelurahan", e.target.value)}
              >
                <option value="">-- Kelurahan --</option>
                {kelurahan.map((k) => (
                  <option key={k.id}>{k.name}</option>
                ))}
              </select>

              <textarea
                className="input h-24"
                placeholder="Alamat Lengkap"
                onChange={(e) => update(i, "alamatLengkap", e.target.value)}
              />

              <input
                className="input"
                placeholder="Email"
                onChange={(e) => update(i, "email", e.target.value)}
              />
              <input
                className="input"
                placeholder="No WhatsApp"
                onChange={(e) => update(i, "wa", e.target.value)}
              />
            </div>
          ))}

          {/* SURAT */}
          <div className="border p-6 rounded-xl">
            <label className="label">Upload Surat Pengantar</label>
            <input
              type="file"
              className="input"
              onChange={(e) => setSurat(e.target.files?.[0] || null)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white py-3 rounded-lg font-semibold"
          >
            {loading ? "Mengirim..." : "Kirim Pendaftaran"}
          </button>
        </form>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
        }
        .label {
          font-weight: 600;
          margin-bottom: 6px;
          display: block;
        }
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
