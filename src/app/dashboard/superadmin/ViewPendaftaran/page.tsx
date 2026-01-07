"use client";

import { useEffect, useState } from "react";

/* ===================== TYPE ===================== */
type Peserta = {
  nama: string;
  email: string;
  wa: string;
  posisi: string;

  // ✅ TAMBAHAN (TANGGAL MAGANG)
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
  suratPengantar: string;
  status: "Menunggu" | "Sedang Diproses" | "Disetujui" | "Ditolak";
  jawabanAdmin?: string;
  createdAt: string;
};

type AkunPeserta = {
  email: string;
};

/* ===================== PAGE ===================== */
export default function ViewPendaftaranPage() {
  const [data, setData] = useState<Pendaftaran[]>([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<Pendaftaran | null>(null);
  const [alasan, setAlasan] = useState("");

  const closeModal = () => {
    setSelected(null);
    setAlasan("");
  };

  /* ===================== LOAD DATA ===================== */
  const loadData = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/pendaftaran");
      const json = await res.json();
      setData(json);
    } catch {
      alert("Gagal mengambil data");
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
        }
      );

      const result = await res.json();
      setAkunPeserta(result);
    } catch (error) {
      console.error("Gagal mengambil data akun peserta");
    }
  };

  useEffect(() => {
    // load awal
    fetchAkunPeserta();

    // refresh saat balik dari halaman lain
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
    if (!alasan.trim()) {
      alert("Alasan wajib diisi");
      return;
    }

    // ❗ Wajib upload surat jika disetujui
    if (status === "Disetujui" && !suratBalasan) {
      alert("Surat balasan wajib diupload jika disetujui");
      return;
    }

    const formData = new FormData();
    formData.append("status", status);
    formData.append("jawabanAdmin", alasan);

    if (suratBalasan) {
      formData.append("suratBalasan", suratBalasan);
    }

    await fetch(`http://localhost:5000/api/pendaftaran/${selected?._id}`, {
      method: "PUT",
      body: formData,
    });

    alert("Status dan surat balasan berhasil dikirim");
    closeModal();
    loadData();
  };

  /* ===================== SUMMARY ===================== */
  const totalPendaftar = data.length;
  const disetujui = data.filter((d) => d.status === "Disetujui").length;
  const ditolak = data.filter((d) => d.status === "Ditolak").length;

  const showValue = (value?: string) => {
    if (!value || value.trim() === "") return "-";
    return value;
  };

  const LIMIT = 20;
  const [page, setPage] = useState(1);

  const totalPage = Math.ceil(data.length / LIMIT);

  const paginatedData = data.slice((page - 1) * LIMIT, page * LIMIT);

  const [suratBalasan, setSuratBalasan] = useState<File | null>(null);

  const [akunPeserta, setAkunPeserta] = useState<AkunPeserta[]>([]);

  const isAkunTerdaftar = (email?: string) => {
    if (!email) return false;

    return akunPeserta.some(
      (akun) => akun.email.toLowerCase() === email.toLowerCase()
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 text-gray-800 dark:text-gray-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Data Pendaftaran</h1>

        {/* ===================== SUMMARY CARD ===================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard title="Jumlah Pendaftar" value={totalPendaftar} />
          <SummaryCard title="Disetujui" value={disetujui} />
          <SummaryCard title="Ditolak" value={ditolak} />
        </div>

        {/* ===================== TABLE ===================== */}
        <div className="bg-white border rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3 text-left">Nama Perwakilan</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Posisi</th>
                <th className="px-4 py-3 text-left">Sendiri / Bersama</th>
                <th className="px-4 py-3 text-left">Status</th>
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
                  <tr key={item._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">{i + 1}</td>
                    <td
                      className="
    px-4 py-3
    font-medium
    text-blue-600
    underline
    cursor-pointer
    hover:text-blue-800
  "
                      onClick={() => setSelected(item)}
                    >
                      {item.peserta[0]?.nama}
                    </td>

                    <td className="px-4 py-3">
                      {showValue(item.peserta[0]?.email)}
                    </td>

                    <td className="px-4 py-3">{item.peserta[0]?.posisi}</td>
                    <td className="px-4 py-3">
                      {item.kategori === "bersama" ? "Bersama" : "Sendiri"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* ===================== MODAL DETAIL ===================== */}
        {selected && (
          <div className="fixed inset-0 bg-black/40 z-50" onClick={closeModal}>
            <div
              className="
      bg-white
      w-full h-full
      overflow-y-auto
      p-6
    "
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Detail Pendaftaran</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-red-600 text-xl font-bold"
                >
                  ✕
                </button>
              </div>

              {/* ===================== SURAT PENGANTAR ===================== */}
              <div className="mb-6">
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
                  <div>
                    <p className="text-sm text-gray-500">Surat Pengantar</p>
                    <p className="text-base font-semibold text-gray-800">
                      File Surat Pengantar Magang
                    </p>
                  </div>

                  <a
                    href={`http://localhost:5000/uploads/${selected.suratPengantar}`}
                    target="_blank"
                    className="
        inline-flex items-center gap-2
        px-4 py-2
        rounded-lg
        bg-blue-600 text-white
        text-sm font-semibold
        hover:bg-blue-700
        transition
      "
                  >
                    📎 Lihat Surat
                  </a>
                </div>
              </div>

              {/* ===================== DATA PESERTA ===================== */}
              <div className="grid md:grid-cols-2 gap-6">
                {selected.peserta.map((p, i) => (
                  <div
                    key={i}
                    className="
        bg-white
        border border-gray-200
        rounded-2xl
        shadow-sm
        p-6
      "
                  >
                    {/* HEADER PESERTA */}
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-blue-700">
                        Peserta {i + 1}
                      </h3>

                      <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                        {p.posisi}
                      </span>
                    </div>

                    {/* INFORMASI UTAMA */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <DetailItem label="Nama Lengkap" value={p.nama} />
                      <DetailItem
                        label="Jenis Kelamin"
                        value={p.jenisKelamin}
                      />

                      <DetailItem
                        label="Tanggal Mulai Magang"
                        value={p.tanggalMulaiMagang}
                      />
                      <DetailItem
                        label="Tanggal Selesai Magang"
                        value={p.tanggalSelesaiMagang}
                      />

                      <DetailItem label="Tempat Lahir" value={p.tempatLahir} />
                      <DetailItem
                        label="Tanggal Lahir"
                        value={p.tanggalLahir}
                      />

                      <DetailItem label="Email" value={p.email} />
                      <DetailItem label="No WhatsApp" value={p.wa} />
                    </div>

                    {/* ALAMAT */}
                    <div className="mt-4 border-t pt-4">
                      <p className="text-xs text-gray-500 mb-1">
                        Alamat Lengkap
                      </p>
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {p.alamatLengkap}
                      </p>

                      <p className="text-xs text-gray-500 mt-2">
                        {p.kelurahan}, {p.kecamatan}, {p.kota}, {p.provinsi}
                      </p>
                    </div>

                    {/* STATUS AKUN */}
                    <div className="mt-4 flex items-center justify-between bg-gray-50 border rounded-xl px-4 py-3">
                      <div>
                        <p className="text-xs text-gray-500">Status Akun</p>

                        <span
                          className={`inline-block mt-1 text-xs font-semibold px-3 py-1 rounded-full ${
                            isAkunTerdaftar(p.email)
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
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
    bg-blue-600
    text-white
    font-medium
    hover:bg-blue-700
    transition
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
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Surat Balasan (PDF)
                </label>

                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) =>
                      setSuratBalasan(e.target.files?.[0] || null)
                    }
                    className="
        block w-full text-sm text-gray-600
        file:mr-4 file:py-2 file:px-4
        file:rounded-lg file:border-0
        file:text-sm file:font-semibold
        file:bg-blue-50 file:text-blue-700
        hover:file:bg-blue-100
      "
                  />

                  {suratBalasan && (
                    <span className="text-xs text-green-600 font-medium">
                      ✔ {suratBalasan.name}
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-400 mt-1">
                  Unggah surat balasan resmi (format PDF)
                </p>
              </div>

              {/* ===================== ALASAN ADMIN ===================== */}
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Alasan Persetujuan / Penolakan
                </label>

                <textarea
                  rows={4}
                  className="
      w-full
      rounded-xl
      border border-gray-300
      bg-white
      px-4 py-3
      text-sm text-gray-800
      placeholder-gray-400
      shadow-sm
      focus:border-blue-500
      focus:ring-2
      focus:ring-blue-200
      transition
    "
                  placeholder="Tuliskan alasan persetujuan atau penolakan pendaftaran..."
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                />
              </div>

              {/* ===================== ACTION BUTTON ===================== */}
              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="
      inline-flex items-center justify-center
      px-5 py-2.5
      rounded-xl
      bg-gray-100 text-gray-700
      font-medium
      hover:bg-gray-200
      transition
    "
                >
                  Tutup
                </button>

                <button
                  onClick={() => updateStatus("Ditolak")}
                  className="
      inline-flex items-center justify-center
      px-5 py-2.5
      rounded-xl
      bg-red-600 text-white
      font-semibold
      hover:bg-red-700
      transition
    "
                >
                  Tolak
                </button>

                <button
                  onClick={() => updateStatus("Disetujui")}
                  className="
      inline-flex items-center justify-center
      px-5 py-2.5
      rounded-xl
      bg-green-600 text-white
      font-semibold
      hover:bg-green-700
      transition
    "
                >
                  Setujui
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================== COMPONENT ===================== */

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-3xl font-bold">{value}</h2>
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
  const color =
    status === "Disetujui"
      ? "bg-green-100 text-green-700"
      : status === "Ditolak"
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <span className={`px-3 py-1 rounded-full text-xs ${color}`}>{status}</span>
  );
}
function DetailItem({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">{value || "-"}</p>
    </div>
  );
}
