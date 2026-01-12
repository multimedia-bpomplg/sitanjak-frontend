"use client";

import ProcessPopup from "@/components/ui/ProcessPopup";
import { useState, useEffect } from "react";
import { showToast } from "@/components/ui/toastDashboard";
import { useConfirm } from "@/components/ui/ConfirmProvider";

/* ================= TYPE ================= */
type MentorAkun = {
  _id: string;
  name: string;
  email: string;
  status: "Aktif" | "Nonaktif";
  periode: string;
};

/* ================= PAGE ================= */
export default function BuatAkunMentorPage() {
  const [data, setData] = useState<MentorAkun[]>([]);
  const [open, setOpen] = useState(false);

  /* ===== MODAL AKSI ===== */
  const [openAksi, setOpenAksi] = useState(false);
  const [selected, setSelected] = useState<MentorAkun | null>(null);

  const [loadingPopup, setLoadingPopup] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const confirm = useConfirm();

  /* ================= FETCH DATA ================= */
  const fetchMentor = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/mentor`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Gagal memuat data mentor");
      }

      const mapped: MentorAkun[] = result.map((item: any) => ({
        _id: item._id,
        name: item.name,
        email: item.email,
        status: item.status || "Aktif",
        periode:
          item.periode || new Date(item.createdAt).getFullYear().toString(),
      }));

      setData(mapped);
    } catch (error: any) {
      showToast.error(error.message || "Terjadi kesalahan saat memuat data");
    }
  };

  useEffect(() => {
    fetchMentor();
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
      showToast.error("Semua field wajib diisi");
      return;
    }

    setLoadingPopup(true); // 🔥 SHOW POPUP

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/mentor/buat-mentor`,
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
        throw new Error(result.message || "Gagal membuat akun mentor");
      }

      showToast.success("Akun mentor berhasil dibuat");

      setOpen(false);
      setForm({ name: "", email: "", password: "" });
      fetchMentor();
    } catch (error: any) {
      // ✅ SEMUA ERROR MASUK SINI
      showToast.error(error.message || "Terjadi kesalahan server");
    } finally {
      // ✅ PASTI DIJALANKAN (SUKSES / ERROR)
      setLoadingPopup(false); // 🔥 HIDE POPUP
    }
  };

  /* ================= NONAKTIFKAN ================= */
  const handleNonaktifkan = (id: string) => {
    confirm({
      title: "Nonaktifkan Akun",
      message: "Yakin ingin menonaktifkan akun mentor ini?",
      onConfirm: () => prosesNonaktifkan(id),
    });
  };

  const prosesNonaktifkan = async (id: string) => {
    const loadingToast = showToast.loading("Menonaktifkan akun mentor...");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/mentor/${id}/nonaktif`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Gagal menonaktifkan akun mentor");
      }

      setData((prev) =>
        prev.map((m) => (m._id === id ? { ...m, status: "Nonaktif" } : m))
      );

      setSelected((prev) => (prev ? { ...prev, status: "Nonaktif" } : prev));

      showToast.updateSuccess(
        loadingToast,
        "Akun mentor berhasil dinonaktifkan"
      );

      setOpenAksi(false);
    } catch (error: any) {
      showToast.updateError(
        loadingToast,
        error.message || "Terjadi kesalahan server"
      );
    }
  };

  /* ================= AKTIFKAN ================= */
  const handleAktifkan = (id: string) => {
    confirm({
      title: "Aktifkan Akun",
      message: "Yakin ingin mengaktifkan kembali akun mentor ini?",
      onConfirm: () => prosesAktifkan(id),
    });
  };

  const prosesAktifkan = async (id: string) => {
    const loadingToast = showToast.loading("Mengaktifkan akun mentor...");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/mentor/${id}/aktif`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Gagal mengaktifkan akun mentor");
      }

      setData((prev) =>
        prev.map((m) => (m._id === id ? { ...m, status: "Aktif" } : m))
      );

      setSelected((prev) => (prev ? { ...prev, status: "Aktif" } : prev));

      showToast.updateSuccess(loadingToast, "Akun mentor berhasil diaktifkan");

      setOpenAksi(false);
    } catch (error: any) {
      showToast.updateError(
        loadingToast,
        error.message || "Terjadi kesalahan server"
      );
    }
  };

  /* ================= SUMMARY ================= */
  const totalMentor = data.length;
  const mentorAktif = data.filter((m) => m.status === "Aktif").length;
  const mentorNonaktif = data.filter((m) => m.status === "Nonaktif").length;

  /* ================= RENDER ================= */
  return (
    <div
      className="
      min-h-screen p-4 sm:p-6
      bg-gradient-to-br
      from-slate-50 via-white to-indigo-50
      dark:from-[#020617] dark:via-[#020617] dark:to-[#1E1B4B]
      text-slate-800 dark:text-slate-100
      transition-colors
    "
    >
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Manajemen Akun Mentor
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola akun mentor magang
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
            shadow-lg shadow-indigo-600/20
            hover:opacity-90 transition
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
          <span>Buat Akun Mentor</span>
        </button>
      </div>

      {/* SUMMARY BOX */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Summary title="Jumlah Mentor" value={totalMentor} />
        <Summary title="Mentor Aktif" value={mentorAktif} color="green" />
        <Summary
          title="Mentor Tidak Aktif"
          value={mentorNonaktif}
          color="red"
        />
      </div>

      {/* TABLE */}
      <div
        className="
        rounded-2xl
        bg-white/80 dark:bg-slate-900/80
        backdrop-blur
        shadow-xl
        border border-slate-200 dark:border-slate-800
      "
      >
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
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
                  <td
                    colSpan={5}
                    className="py-10 text-center text-slate-500 dark:text-slate-400"
                  >
                    Belum ada akun mentor
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
                        px-6 py-4 font-medium
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

                    <td className="px-6 py-4 text-center">{item.periode}</td>

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
      </div>

      {/* MODAL BUAT AKUN */}
      {open && (
        <Modal title="Buat Akun Mentor" onClose={() => setOpen(false)}>
          <Input
            label="Nama Mentor"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
          />

          <Input
            label="Email Mentor"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
          />

          <PasswordInput value={form.password} onGenerate={generatePassword} />

          <ModalAction
            onCancel={() => setOpen(false)}
            onSubmit={handleCreate}
            submitText="Buat Akun Mentor"
          />
        </Modal>
      )}

      {/* MODAL AKSI */}
      {openAksi && selected && (
        <Modal title="Detail Akun Mentor" onClose={() => setOpenAksi(false)}>
          <Detail label="Nama" value={selected.name} />
          <Detail label="Email" value={selected.email} />
          <Detail label="Periode" value={selected.periode} />
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
        title="Membuat Akun Mentor"
        message="Sedang menyimpan data ke sistem, mohon tunggu..."
      />
    </div>
  );
}

function Summary({ title, value, color }: any) {
  const colorMap = {
    green: "text-emerald-500",
    red: "text-rose-500",
    default: "text-blue-400",
  };

  return (
    <div
      className="
      rounded-2xl p-5
      bg-white/80 dark:bg-slate-900/80
      backdrop-blur
      shadow-lg
      border border-slate-200 dark:border-slate-800
    "
    >
      <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
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
    <div
      className="
      fixed inset-0 z-50
      bg-black/40 backdrop-blur-sm
      flex items-center justify-center
      px-4
    "
    >
      <div
        className="
        relative w-full max-w-md
        rounded-3xl
        bg-white/95 dark:bg-slate-900/95
        shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)]
        border border-slate-200 dark:border-slate-800
        overflow-hidden
      "
      >
        {/* HEADER */}
        <div
          className="
          flex items-center justify-between
          px-6 py-4
          border-b border-slate-200 dark:border-slate-800
          bg-gradient-to-r
          from-indigo-50 to-blue-50
          dark:from-indigo-500/10 dark:to-blue-500/10
        "
        >
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
        <div className="px-6 py-5 space-y-4">{children}</div>
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

      <div className="flex flex-col sm:flex-row gap-2">
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
    <div
      className="
      rounded-xl
      p-4
      bg-slate-50 dark:bg-slate-800/60
      border border-slate-200 dark:border-slate-700
    "
    >
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}
