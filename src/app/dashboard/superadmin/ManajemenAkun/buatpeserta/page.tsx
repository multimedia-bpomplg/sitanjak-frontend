"use client";

import { useState, useEffect } from "react";

/* ================= TYPE ================= */
type PesertaAkun = {
  _id: string;
  name: string;
  email: string;
  status: "Aktif" | "Nonaktif";
  periode: string;
};

/* ================= PAGE ================= */
export default function BuatAkunPesertaPage() {
  const [data, setData] = useState<PesertaAkun[]>([]);
  const [open, setOpen] = useState(false);

  /* ===== MODAL AKSI ===== */
  const [openAksi, setOpenAksi] = useState(false);
  const [selected, setSelected] = useState<PesertaAkun | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  /* ================= FETCH DATA ================= */
  const fetchPeserta = async () => {
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

      const mapped: PesertaAkun[] = result.map((item: any) => ({
        _id: item._id,
        name: item.name,
        email: item.email,
        status: item.status || "Aktif",
        periode: item.periode || new Date(item.createdAt).getFullYear().toString(),
      }));

      setData(mapped);
    } catch (error) {
      console.error("[FETCH PESERTA]", error);
    }
  };

  useEffect(() => {
    fetchPeserta();
  }, []);

  /* ================= GENERATE PASSWORD ================= */
  const generatePassword = () => {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const all = upper + lower + numbers;

    let password =
      upper[Math.floor(Math.random() * upper.length)] +
      lower[Math.floor(Math.random() * lower.length)] +
      numbers[Math.floor(Math.random() * numbers.length)];

    for (let i = password.length; i < 10; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }

    setForm({ ...form, password });
  };

  /* ================= CREATE AKUN ================= */
  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      alert("Semua field wajib diisi");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/buat-peserta`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(form),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "Gagal membuat akun");
        return;
      }

      alert("Akun peserta berhasil dibuat");
      setOpen(false);
      setForm({ name: "", email: "", password: "" });
      fetchPeserta();
    } catch (error) {
      alert("Terjadi kesalahan server");
    }
  };

  /* ================= NONAKTIFKAN AKUN ================= */
  const handleNonaktifkan = async (id: string) => {
    if (!confirm("Yakin nonaktifkan akun ini?")) return;

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/peserta/${id}/nonaktif`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setOpenAksi(false);
      fetchPeserta();
    } catch (error) {
      alert("Gagal menonaktifkan akun");
    }
  };

  /* ================= AKTIFKAN AKUN ================= */
const handleAktifkan = async (id: string) => {
  if (!confirm("Yakin aktifkan kembali akun ini?")) return;

  try {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/superadmin/peserta/${id}/aktif`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    setOpenAksi(false);
    fetchPeserta();
  } catch (error) {
    alert("Gagal mengaktifkan akun");
  }
};

const totalPeserta = data.length;
const pesertaAktif = data.filter((p) => p.status === "Aktif").length;
const pesertaNonaktif = data.filter((p) => p.status === "Nonaktif").length;



  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Akun Peserta</h1>
          <p className="text-sm text-gray-500">
            Kelola akun peserta magang
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold"
        >
          + Buat Akun Peserta
        </button>
      </div>

      {/* SUMMARY BOX */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
  <div className="bg-white rounded-xl shadow p-4">
    <p className="text-sm text-gray-500">Jumlah Peserta</p>
    <h2 className="text-2xl font-bold">{totalPeserta}</h2>
  </div>

  <div className="bg-white rounded-xl shadow p-4">
    <p className="text-sm text-gray-500">Peserta Aktif</p>
    <h2 className="text-2xl font-bold text-green-600">
      {pesertaAktif}
    </h2>
  </div>

  <div className="bg-white rounded-xl shadow p-4">
    <p className="text-sm text-gray-500">Peserta Tidak Aktif</p>
    <h2 className="text-2xl font-bold text-red-600">
      {pesertaNonaktif}
    </h2>
  </div>
</div>


      {/* TABLE (UI TIDAK DIUBAH) */}
      <div className="bg-white rounded-xl shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3">No</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Periode</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  Belum ada akun peserta
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={item._id} className="border-t">
                  <td className="px-4 py-3 text-center">{index + 1}</td>

                  <td
                    className="px-4 py-3 text-blue-600 underline cursor-pointer"
                    onClick={() => {
                      setSelected(item);
                      setOpenAksi(true);
                    }}
                  >
                    {item.name}
                  </td>

                  <td className="px-4 py-3">{item.email}</td>
                  <td className="px-4 py-3 text-center">{item.periode}</td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-medium ${
                        item.status === "Aktif"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL BUAT AKUN (ASLI – TIDAK DIUBAH) */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Buat Akun Peserta</h2>

            <input
              placeholder="Nama"
              className="w-full mb-3 p-2 border rounded"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <input
              placeholder="Email"
              className="w-full mb-3 p-2 border rounded"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />

            <div className="flex gap-2 mb-4">
              <input
                value={form.password}
                placeholder="Password"
                className="flex-1 p-2 border rounded"
                readOnly
              />
              <button
                onClick={generatePassword}
                className="px-3 py-2 bg-gray-200 rounded"
              >
                Generate
              </button>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)}>Batal</button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Buat Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AKSI (BARU) */}
      {openAksi && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Detail Akun Peserta</h2>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Nama</p>
                <p className="font-medium">{selected.name}</p>
              </div>

              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{selected.email}</p>
              </div>

              <div>
                <p className="text-gray-500">Periode Magang</p>
                <p className="font-medium">{selected.periode}</p>
              </div>

              <div>
                <p className="text-gray-500">Status</p>
                <p
                  className={`font-semibold ${
                    selected.status === "Aktif"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {selected.status}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setOpenAksi(false)}
                className="px-4 py-2 border rounded"
              >
                Tutup
              </button>

             {selected.status === "Aktif" ? (
  <button
    onClick={() => handleNonaktifkan(selected._id)}
    className="px-4 py-2 bg-red-600 text-white rounded"
  >
    Nonaktifkan Akun
  </button>
) : (
  <button
    onClick={() => handleAktifkan(selected._id)}
    className="px-4 py-2 bg-green-600 text-white rounded"
  >
    Aktifkan Akun
  </button>
)}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
