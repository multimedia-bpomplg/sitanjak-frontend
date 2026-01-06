"use client";

import ProcessPopup from "@/components/ui/ProcessPopup";
import { useEffect, useState } from "react";
import { showToast } from "@/components/ui/toastDashboard";
import { useConfirm } from "@/components/ui/ConfirmProvider";

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

  const [loadingPopup, setLoadingPopup] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const confirm = useConfirm();

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

      if (!res.ok) {
        throw new Error(result.message || "Gagal memuat data admin");
      }

      const mapped: AdminAkun[] = result.map((item: any) => ({
        _id: item._id,
        name: item.name,
        email: item.email,
        status: item.status || "Aktif",
        periode: 
          item.periode ||
          new Date(item.createdAt).getFullYear().toString(),
      }));

      setData(mapped);
    } catch (error: any) {
      showToast.error(error.message || "Terjadi kesalahan saat memuat data");
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
      showToast.error("Semua field wajib diisi");
      return;
    }

    setLoadingPopup(true);

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

      // ✅ INI TEMPAT YANG BENAR UNTUK if (!res.ok)
      if (!res.ok) {
        throw new Error(result.message || "Gagal membuat akun admin");
      }

      showToast.success("Akun admin berhasil dibuat");

      setOpen(false);
      setForm({ name: "", email: "", password: "" });
      fetchAdmin();

    } catch (error: any) {
      // ✅ SEMUA ERROR MASUK SINI
      showToast.error(
        error.message || "Terjadi kesalahan server"
      );
    } finally {
      // ✅ PASTI DIJALANKAN (SUKSES / ERROR)
      setLoadingPopup(false); // 🔥 HIDE POPUP
    }
  };

  /* ================= NONAKTIFKAN ADMIN ================= */
  const handleNonaktifkan = (id: string) => {
    confirm({
      title: "Nonaktifkan Akun",
      message: "Yakin ingin menonaktifkan akun admin ini?",
      onConfirm: () => prosesNonaktifkan(id),
    });
  };

  const prosesNonaktifkan = async (id: string) => {
    const loadingToast = showToast.loading(
      "Menonaktifkan akun admin..."
    );

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/admin/${id}/nonaktif`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.message || "Gagal menonaktifkan akun admin"
        );
      }

      setData((prev) =>
        prev.map((a) =>
          a._id === id ? { ...a, status: "Nonaktif" } : a
        )
      );

      setSelected((prev) =>
        prev ? { ...prev, status: "Nonaktif" } : prev
      );

      showToast.updateSuccess(
        loadingToast,
        "Akun admin berhasil dinonaktifkan"
      );

      setOpenAksi(false);
    } catch (error: any) {
      showToast.updateError(
        loadingToast,
        error.message || "Terjadi kesalahan server"
      );
    }
  };

  /* ================= AKTIFKAN ADMIN ================= */
  const handleAktifkan = (id: string) => {
    confirm({
      title: "Aktifkan Akun",
      message: "Yakin ingin mengaktifkan kembali akun admin ini?",
      onConfirm: () => prosesAktifkan(id),
    });
  };

  const prosesAktifkan = async (id: string) => {
    const loadingToast = showToast.loading(
      "Mengaktifkan akun admin..."
    );

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/admin/${id}/aktif`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.message || "Gagal mengaktifkan akun admin"
        );
      }

      setData((prev) =>
        prev.map((a) =>
          a._id === id ? { ...a, status: "Aktif" } : a
        )
      );

      setSelected((prev) =>
        prev ? { ...prev, status: "Aktif" } : prev
      );

      showToast.updateSuccess(
        loadingToast,
        "Akun admin berhasil diaktifkan"
      );

      setOpenAksi(false);
    } catch (error: any) {
      showToast.updateError(
        loadingToast,
        error.message || "Terjadi kesalahan server"
      );
    }
  };

  /* ================= SUMMARY ================= */
  const totalAdmin = data.length;
  const adminAktif = data.filter((a) => a.status === "Aktif").length;
  const adminNonaktif = data.filter((a) => a.status === "Nonaktif").length;

  /* ================= RENDER ================= */
  return (
    <div className="
      min-h-screen p-6
      bg-gradient-to-br
      from-slate-50 via-white to-indigo-50
      dark:from-[#020617] dark:via-[#020617] dark:to-[#1E1B4B]
      text-slate-800 dark:text-slate-100
      transition-colors
    ">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Manajemen Akun Admin
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola akun admin sistem secara aman
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="
            inline-flex items-center gap-3
            px-5 py-2.5 rounded-xl

            bg-gradient-to-r
            from-blue-600 via-cyan-600 to-emerald-500
            dark:from-indigo-600 dark:via-blue-600 dark:to-sky-500

            text-white font-semibold
            hover:opacity-90 transition
            shadow-lg shadow-indigo-600/20
          "
        >
          <span
            className="
              flex items-center justify-center
              w-6 h-6 rounded-full
              bg-white/90 text-blue-700
              dark:bg-slate-900 dark:text-sky-400
              font-bold text-lg
            "
          >
            +
          </span>

          <span>Buat Akun Admin</span>
        </button>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Summary title="Jumlah Admin" value={totalAdmin} />
        <Summary title="Admin Aktif" value={adminAktif} color="green" />
        <Summary title="Admin Nonaktif" value={adminNonaktif} color="red" />
      </div>

      {/* TABLE */}
      <div className="
        rounded-2xl overflow-hidden
        bg-white/80 dark:bg-slate-900/80
        backdrop-blur
        shadow-xl
        border border-slate-200 dark:border-slate-800
      ">
        <table className="w-full text-sm">
          <thead
            className="
              bg-slate-100 dark:bg-slate-800
              text-slate-600 dark:text-slate-300
              text-xs uppercase tracking-wider
            "
          >
            <tr>
              <th className="px-6 py-4 text-center">No</th>
              <th className="px-6 py-4 text-left">Nama</th>
              <th className="px-6 py-4 text-left">Email</th>
              <th className="px-6 py-4 text-center">Periode</th>
              <th className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-500 dark:text-slate-400">
                  Belum ada akun admin
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={item._id}
                  className="
                    border-t border-slate-200 dark:border-slate-800
                    hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10
                    transition
                  "
                >
                  <td className="px-6 py-4 text-center">{index + 1}</td>

                  <td
                    className="
                      px-6 py-4
                      font-medium
                      text-indigo-600 dark:text-indigo-400
                      hover:underline cursor-pointer
                    "
                    onClick={() => {
                      setSelected(item);
                      setOpenAksi(true);
                    }}
                  >
                    {item.name}
                  </td>

                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {item.email}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {item.periode}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span
                      className={`
                        inline-flex items-center justify-center
                        px-3 py-1 rounded-full
                        text-xs font-semibold
                        ${
                          item.status === "Aktif"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                        }
                      `}
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

          <PasswordInput value={form.password} onGenerate={generatePassword} />

          <ModalAction
            onCancel={() => setOpen(false)}
            onSubmit={handleCreate}
            submitText="Buat Akun"
          />
        </Modal>
      )}

      {/* MODAL DETAIL */}
      {openAksi && selected && (
        <Modal title="Detail Akun Admin" onClose={() => setOpenAksi(false)}>
          <Detail label="Nama" value={selected.name} />
          <Detail label="Email" value={selected.email} />
          <Detail label="Periode" value={selected.periode} />

          {/* STATUS */}
          <div
            className="
              rounded-xl
              p-4
              bg-slate-50 dark:bg-slate-800/60
              border border-slate-200 dark:border-slate-700
            "
          >
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Status
            </p>

            <p
              className={`mt-1 text-base font-semibold ${
                selected.status === "Aktif"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {selected.status}
            </p>
          </div>

          {/* ACTION BUTTON */}
          <div className="flex justify-end gap-3 pt-4">
            {selected.status === "Aktif" ? (
              <button
                onClick={() => handleNonaktifkan(selected._id)}
                className="
                  px-5 py-2.5 rounded-xl
                  bg-red-600 text-white
                  hover:opacity-90 transition
                "
              >
                Nonaktifkan Akun
              </button>
            ) : (
              <button
                onClick={() => handleAktifkan(selected._id)}
                className="
                  px-5 py-2.5 rounded-xl
                  bg-emerald-600 text-white
                  hover:opacity-90 transition
                "
              >
                Aktifkan Akun
              </button>
            )}
          </div>
        </Modal>
      )}

      <ProcessPopup
        open={loadingPopup}
        title="Membuat Akun Admin"
        message="Sedang menyimpan data ke sistem, mohon tunggu..."
      />
    </div>
  );
}

/* ================= COMPONENT ================= Dayat Kopling */

function Summary({ title, value, color }: any) {
  const colorMap = {
    green: "text-emerald-500",
    red: "text-rose-500",
    default: "text-blue-400",
  };

  return (
    <div className="
      rounded-2xl p-5
      bg-white/80 dark:bg-slate-900/80
      backdrop-blur
      shadow-lg
      border border-slate-200 dark:border-slate-800
    ">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <h2 className={`text-3xl font-bold mt-1 ${colorMap[color || "default"]}`}>
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
    <div className="
      fixed inset-0 z-50
      bg-black/40 backdrop-blur-sm
      flex items-center justify-center
      px-4
    ">
      <div className="
        relative w-full max-w-md
        rounded-3xl
        bg-white/95 dark:bg-slate-900/95
        shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)]
        border border-slate-200 dark:border-slate-800
        overflow-hidden
      ">
        {/* HEADER */}
        <div className="
          flex items-center justify-between
          px-6 py-4
          border-b border-slate-200 dark:border-slate-800
          bg-gradient-to-r
          from-indigo-50 to-blue-50
          dark:from-indigo-500/10 dark:to-blue-500/10
        ">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="
              w-9 h-9 flex items-center justify-center
              rounded-full
              text-slate-500 dark:text-slate-300
              hover:bg-slate-200 dark:hover:bg-slate-800
              transition
            "
          >
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="px-6 py-5 space-y-4">
          {children}
        </div>
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
    <div>
      <label className="block mb-1 text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full px-4 py-2.5 rounded-xl
          bg-white dark:bg-slate-800
          text-slate-800 dark:text-slate-100
          border border-slate-300 dark:border-slate-700
          focus:ring-2 focus:ring-indigo-500
          outline-none transition
        "
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
    <div>
      <label className="block mb-1 text-sm font-medium text-slate-600 dark:text-slate-300">
        Password
      </label>

      <div className="flex gap-2">
        <input
          readOnly
          value={value}
          className="
            flex-1 px-4 py-2.5 rounded-xl
            bg-white dark:bg-slate-800
            text-slate-800 dark:text-slate-100
            border border-slate-300 dark:border-slate-700
          "
        />
        <button
          onClick={onGenerate}
          className="
            px-4 py-2.5 rounded-xl
            bg-slate-200 dark:bg-slate-700
            text-slate-700 dark:text-slate-200
            font-medium
            hover:opacity-90
            transition
          "
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
    <div className="flex justify-end gap-3 pt-4">
      <button
        onClick={onCancel}
        className="
          px-4 py-2 rounded-xl
          text-slate-600 dark:text-slate-300
          hover:bg-slate-100 dark:hover:bg-slate-800
          transition
        "
      >
        Batal
      </button>

      <button
        onClick={onSubmit}
        className="
          px-6 py-2.5 rounded-xl
          font-semibold text-white
          bg-gradient-to-r
          from-blue-600 via-cyan-600 to-emerald-500
          dark:from-indigo-600 dark:via-blue-600 dark:to-sky-500
          shadow-lg shadow-indigo-600/25
          hover:opacity-90
          transition
        "
      >
        {submitText}
      </button>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="
      rounded-xl
      p-4
      bg-slate-50 dark:bg-slate-800/60
      border border-slate-200 dark:border-slate-700
    ">
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}