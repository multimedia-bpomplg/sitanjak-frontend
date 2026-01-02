"use client";

import { useEffect, useState } from "react";

/* ================= TYPE ================= */
type AdminAkun = {
  _id: string;
  name: string;
  email: string;
  status: "Aktif" | "Nonaktif";
  periode: string;
};

/* ================= PAGE ================= */
export default function BuatAkunAdminPage() {
  const [data, setData] = useState<AdminAkun[]>([]);
  const [open, setOpen] = useState(false);

  /* MODAL DETAIL */
  const [openAksi, setOpenAksi] = useState(false);
  const [selected, setSelected] = useState<AdminAkun | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  /* ================= FETCH ADMIN ================= */
  const fetchAdmin = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/admin`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const result = await res.json();

      const mapped: AdminAkun[] = result.map((item: any) => ({
        _id: item._id,
        name: item.name,
        email: item.email,
        status: item.status || "Aktif",
        periode: new Date(item.createdAt).getFullYear().toString(),
      }));

      setData(mapped);
    } catch (error) {
      console.error("[FETCH ADMIN]", error);
    }
  };

  useEffect(() => {
    fetchAdmin();
  }, []);

  /* ================= GENERATE PASSWORD ================= */
  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let pass = "";

    for (let i = 0; i < 10; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }

    setForm({ ...form, password: pass });
  };

  /* ================= CREATE ADMIN ================= */
  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      alert("Semua field wajib diisi");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/buat-admin`,
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
        alert(result.message || "Gagal membuat akun admin");
        return;
      }

      alert("Akun admin berhasil dibuat");
      setOpen(false);
      setForm({ name: "", email: "", password: "" });
      fetchAdmin();
    } catch {
      alert("Terjadi kesalahan server");
    }
  };

  /* ================= SUMMARY ================= */
  const totalAdmin = data.length;
  const adminAktif = data.filter((a) => a.status === "Aktif").length;
  const adminNonaktif = data.filter((a) => a.status === "Nonaktif").length;

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Akun Admin</h1>
          <p className="text-sm text-gray-500">
            Kelola akun admin sistem
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold"
        >
          + Buat Akun Admin
        </button>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Summary title="Jumlah Admin" value={totalAdmin} />
        <Summary title="Admin Aktif" value={adminAktif} color="green" />
        <Summary title="Admin Nonaktif" value={adminNonaktif} color="red" />
      </div>

      {/* TABLE */}
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
                <td
                  colSpan={5}
                  className="py-8 text-center text-gray-400"
                >
                  Belum ada akun admin
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={item._id} className="border-t">
                  <td className="px-4 py-3 text-center">
                    {index + 1}
                  </td>

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
                  <td className="px-4 py-3 text-center">
                    {item.periode}
                  </td>

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

      {/* MODAL BUAT ADMIN */}
      {open && (
        <Modal title="Buat Akun Admin" onClose={() => setOpen(false)}>
          <Input
            label="Nama Admin"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
          />

          <Input
            label="Email Admin"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
          />

          <PasswordInput
            value={form.password}
            onGenerate={generatePassword}
          />

          <ModalAction
            onCancel={() => setOpen(false)}
            onSubmit={handleCreate}
            submitText="Buat Akun"
          />
        </Modal>
      )}

      {/* MODAL DETAIL */}
      {openAksi && selected && (
        <Modal
          title="Detail Akun Admin"
          onClose={() => setOpenAksi(false)}
        >
          <Detail label="Nama" value={selected.name} />
          <Detail label="Email" value={selected.email} />
          <Detail label="Periode" value={selected.periode} />

          <div className="flex justify-end mt-6">
            <button
              onClick={() => setOpenAksi(false)}
              className="px-4 py-2 border rounded"
            >
              Tutup
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ================= COMPONENT ================= */

function Summary({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color?: "green" | "red";
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <h2
        className={`text-2xl font-bold ${
          color === "green"
            ? "text-green-600"
            : color === "red"
            ? "text-red-600"
            : ""
        }`}
      >
        {value}
      </h2>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-4">{title}</h2>
        {children}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-4">
      <label className="text-sm text-gray-500">{label}</label>
      <input
        className="w-full mt-1 p-2 border rounded"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function PasswordInput({
  value,
  onGenerate,
}: {
  value: string;
  onGenerate: () => void;
}) {
  return (
    <div className="mb-4">
      <label className="text-sm text-gray-500">Password</label>
      <div className="flex gap-2 mt-1">
        <input
          className="flex-1 p-2 border rounded"
          value={value}
          readOnly
        />
        <button
          onClick={onGenerate}
          className="px-3 py-2 bg-gray-200 rounded"
        >
          Generate
        </button>
      </div>
    </div>
  );
}

function ModalAction({
  onCancel,
  onSubmit,
  submitText,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitText: string;
}) {
  return (
    <div className="flex justify-end gap-2">
      <button onClick={onCancel}>Batal</button>
      <button
        onClick={onSubmit}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {submitText}
      </button>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="mb-3">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
