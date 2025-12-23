"use client";

import { useEffect, useState } from "react";

/* ===================== TYPE ===================== */
type Peserta = {
  nama: string;
  email: string;
  wa: string;
  posisi: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  provinsi: string;
  kota: string;
  kecamatan: string;
  kelurahan: string;
  alamatLengkap: string;
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

  /* ===================== UPDATE STATUS ===================== */
  const updateStatus = async (status: "Disetujui" | "Ditolak") => {
    if (!alasan.trim()) return alert("Alasan wajib diisi");

    await fetch(`http://localhost:5000/api/pendaftaran/${selected?._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        jawabanAdmin: alasan,
      }),
    });

    alert("Status diperbarui");
    closeModal();
    loadData();
  };

  /* ===================== SUMMARY ===================== */
  const totalPendaftar = data.length;
  const disetujui = data.filter((d) => d.status === "Disetujui").length;
  const ditolak = data.filter((d) => d.status === "Ditolak").length;

  return (
    <div className="space-y-6">
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
              <th className="px-4 py-3 text-center">Aksi</th>
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
              data.map((item, i) => (
                <tr key={item._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{i + 1}</td>

                  <td className="px-4 py-3 font-medium">
                    {item.peserta[0]?.nama}
                  </td>

                  <td className="px-4 py-3">{item.peserta[0]?.email}</td>

                  <td className="px-4 py-3">{item.peserta[0]?.posisi}</td>

                  <td className="px-4 py-3">
                    {item.kategori === "bersama" ? "Bersama" : "Sendiri"}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>

                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setSelected(item)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ===================== MODAL DETAIL ===================== */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white w-full max-w-4xl p-6 rounded-lg overflow-y-auto max-h-[90vh]"
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

            {/* ===== SURAT PENGANTAR ===== */}
            <div className="mb-4">
              <a
                href={`http://localhost:5000/uploads/${selected.suratPengantar}`}
                target="_blank"
                className="text-sm text-blue-600 underline"
              >
                📎 Lihat Surat Pengantar
              </a>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {selected.peserta.map((p, i) => (
                <div key={i} className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold mb-2">Peserta {i + 1}</h3>

                  <Detail label="Nama Lengkap" value={p.nama} />
                  <Detail label="Posisi Magang" value={p.posisi} />
                  <Detail label="Tempat Lahir" value={p.tempatLahir} />
                  <Detail label="Tanggal Lahir" value={p.tanggalLahir} />
                  <Detail label="Jenis Kelamin" value={p.jenisKelamin} />
                  <Detail label="Email" value={p.email} />
                  <Detail label="No WhatsApp" value={p.wa} />
                  <Detail label="Provinsi" value={p.provinsi} />
                  <Detail label="Kota / Kabupaten" value={p.kota} />
                  <Detail label="Kecamatan" value={p.kecamatan} />
                  <Detail label="Kelurahan" value={p.kelurahan} />
                  <Detail label="Alamat Lengkap" value={p.alamatLengkap} />
                </div>
              ))}
            </div>

            <textarea
              className="w-full border rounded p-2 mt-4"
              placeholder="Alasan persetujuan / penolakan"
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Tutup
              </button>

              <button
                onClick={() => updateStatus("Ditolak")}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Tolak
              </button>

              <button
                onClick={() => updateStatus("Disetujui")}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Setujui
              </button>
            </div>
          </div>
        </div>
      )}
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
