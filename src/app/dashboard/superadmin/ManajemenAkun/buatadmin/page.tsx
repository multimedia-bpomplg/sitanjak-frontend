"use client";

import ProcessPopup from "@/components/ui/ProcessPopup";
import { useEffect, useState } from "react";
import { showToast } from "@/components/ui/toastDashboard";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { useSearchParams } from "next/navigation";
import {
  HiUser,
  HiUsers,
  HiCheck,
  HiX,
  HiSearch,
} from "react-icons/hi";

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
  const [search, setSearch] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

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
          item.periode || new Date(item.createdAt).getFullYear().toString(),
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
      showToast.error(error.message || "Terjadi kesalahan server");
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
    const loadingToast = showToast.loading("Menonaktifkan akun admin...");

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
        throw new Error(result.message || "Gagal menonaktifkan akun admin");
      }

      setData((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: "Nonaktif" } : a))
      );

      setSelected((prev) => (prev ? { ...prev, status: "Nonaktif" } : prev));

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
    const loadingToast = showToast.loading("Mengaktifkan akun admin...");

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
        throw new Error(result.message || "Gagal mengaktifkan akun admin");
      }

      setData((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: "Aktif" } : a))
      );

      setSelected((prev) => (prev ? { ...prev, status: "Aktif" } : prev));

      showToast.updateSuccess(loadingToast, "Akun admin berhasil diaktifkan");

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

  const searchParams = useSearchParams();

  useEffect(() => {
    const email = searchParams.get("email");
    const name = searchParams.get("name");

    if (email && name) {
      setForm({
        name,
        email,
        password: "",
      });

      setOpen(true); // 🔥 BUKA MODAL OTOMATIS
    }
  }, [searchParams]);

  const filteredData = data.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.periode.toLowerCase().includes(q)
    );
  });

  const totalPage = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  /* ================= RENDER ================= */
  return (
    <div
      className="
      min-h-screen p-4 sm:p-6
      bg-linear-to-br
      from-slate-50 via-white to-indigo-50
      dark:from-[#020617] dark:via-[#020617] dark:to-[#1E1B4B]
      text-slate-800 dark:text-slate-100
      transition-colors
    "
    >
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="
            text-3xl lg:text-4xl 
            font-extrabold 
            leading-tight
            bg-clip-text text-transparent 
            bg-linear-to-r 
            from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
            dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400
          ">
            Manajemen Akun Admin
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Kelola akun admin sistem secara aman
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="
            inline-flex items-center gap-3
            px-5 py-2.5 rounded-xl
            bg-linear-to-r
            from-[#F59E0B] via-[#B91C1C] to-[#7F1D1D]
            dark:from-indigo-600 dark:via-violet-600 dark:to-indigo-700
            text-white font-semibold
            shadow-lg shadow-[#B91C1C]/30 dark:shadow-indigo-600/30
            hover:opacity-90
            hover:scale-[1.02]
            transition
          "
        >
          <span
            className="
              w-6 h-6 flex items-center justify-center
              rounded-full
              bg-white/90 text-[#7F1D1D]
              dark:bg-indigo-950 dark:text-indigo-300
              font-bold text-lg
            "
          >
            +
          </span>

          <span>Buat Akun Admin</span>
        </button>
      </div>

      {/* SUMMARY */}
      <div className="
        grid
        grid-cols-1
        sm:grid-cols-2
        xl:grid-cols-3
        gap-8
        mb-8
      ">
        <StatCard 
          title="Total Admin" 
          value={totalAdmin}
          icon={<HiUsers className="w-7 h-7" />}
          note="Jumlah seluruh admin"
          color="amber"
        />
        <StatCard
          title="Admin Aktif" 
          value={adminAktif} 
          icon={<HiCheck className="w-7 h-7" />}
          note="Admin yang masih aktif"
          color="emerald" 
        />
        <StatCard 
          title="Admin Nonaktif" 
          value={adminNonaktif}
          icon={<HiX className="w-7 h-7" />}
          note="Admin tidak aktif"
          color="indigo" 
        />
      </div>

      {/* SEARCH BAR */}
      <div className="mb-6">
        <div className="relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7F1D1D] dark:text-indigo-400 w-5 h-5 z-10" />
          <input
            type="text"
            placeholder="Cari admin berdasarkan nama atau email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // reset ke halaman 1 saat search
            }}
            className="
              w-full pl-11 pr-10 py-3
              rounded-2xl
              bg-white/90 dark:bg-white/5
              backdrop-blur
              border border-[#F59E0B]/40 dark:border-indigo-500/40
              text-slate-700 dark:text-slate-100
              placeholder:text-slate-400
              focus:outline-none focus:ring-2
              focus:ring-[#B91C1C]/60 dark:focus:ring-indigo-500/60
              transition
            "
          />
        </div>
      </div>

      {/* TABLE */}
      <div
        className="
          rounded-2xl
          bg-white/90 dark:bg-white/5
          backdrop-blur
          border border-slate-200 dark:border-indigo-500/30
          shadow-lg
          overflow-hidden
        "
      >
        <div className="overflow-x-auto">
          <table className="min-w-180 w-full text-sm sm:text-base">
            {/* ================= HEAD ================= */}
            <thead>
              <tr
                className="
                  bg-slate-50 dark:bg-indigo-500/10
                  border-b border-slate-200 dark:border-indigo-500/30
                "
              >
                <th className="w-[6%] py-4 px-4 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                  No
                </th>
                <th className="w-[32%] py-4 px-4 text-left text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                  Nama
                </th>
                <th className="w-[28%] py-4 px-4 text-left text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                  Email
                </th>
                <th className="w-[20%] py-4 px-4 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                  Periode
                </th>
                <th className="w-[14%] py-4 px-4 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                  Status
                </th>
              </tr>
            </thead>

            {/* ================= BODY ================= */}
            <tbody className="divide-y divide-slate-100 dark:divide-indigo-500/20">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-14 text-center text-slate-500 dark:text-slate-400"
                  >
                    Belum ada akun admin
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr
                    key={item._id}
                    className="
                      hover:bg-[#FEF3C7]/40
                      dark:hover:bg-indigo-500/10
                      transition
                    "
                  >
                    <td className="py-4 px-4 text-center align-middle font-medium text-slate-500">{index + 1}</td>

                    <td className="py-4 px-4 text-left align-middle">
                      <div
                        onClick={() => {
                          setSelected(item);
                          setOpenAksi(true);
                        }}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <div
                          className="
                            shrink-0 w-10 h-10 min-w-10 min-h-10
                            rounded-full
                            bg-linear-to-br from-[#7F1D1D] to-[#F59E0B]
                            dark:from-indigo-600 dark:to-violet-500
                            flex items-center justify-center
                            text-white shadow
                            group-hover:scale-110 transition
                          "
                        >
                          <HiUser className="w-5 h-5" />
                        </div>

                        <div className="text-left">
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {item.name}
                          </p>
                          <p className="text-xs text-[#7F1D1D]">
                            Klik untuk lihat detail
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-left align-middle text-slate-600 dark:text-slate-300">
                      {item.email}
                    </td>

                    <td className="py-4 px-4 text-center align-middle">
                      <span
                        className="
                          inline-flex items-center
                          px-3 py-1.5 rounded-full
                          text-xs font-medium
                          bg-blue-50 text-blue-700
                          dark:bg-indigo-500/20 dark:text-indigo-200
                        "
                      >
                        {item.periode}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span
                        className={`
                          inline-flex items-center justify-center
                          px-3 py-1.5 rounded-full
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

        {/* ================= PAGINATION ================= */}
        {totalPage > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 py-6">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="
                px-4 py-2
                rounded-lg
                text-sm font-medium
                border
                border-slate-300 dark:border-indigo-500/30
                bg-white dark:bg-indigo-950
                text-slate-700 dark:text-indigo-200
                hover:bg-[#FFF1F2] dark:hover:bg-indigo-900/40
                disabled:opacity-40 disabled:cursor-not-allowed
                transition
              "
            >
              Prev
            </button>

            {Array.from({ length: totalPage }).map((_, i) => {
              const active = page === i + 1;
              return (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`
                    min-w-9 h-9
                    rounded-lg
                    text-sm font-semibold
                    transition
                    ${
                      active
                        ? `
                          bg-[#B91C1C] text-white shadow
                          dark:bg-indigo-600 dark:text-white
                        `
                        : `
                          bg-white dark:bg-indigo-950
                          text-[#7F1D1D] dark:text-indigo-200
                          border border-slate-300 dark:border-indigo-500/30
                          hover:bg-[#FFF1F2] dark:hover:bg-indigo-900/40
                        `
                    }
                  `}
                >
                  {i + 1}
                </button>
              );
            })}

            <button
              disabled={page === totalPage}
              onClick={() => setPage((p) => p + 1)}
              className="
                px-4 py-2
                rounded-lg
                text-sm font-medium
                border
                border-slate-300 dark:border-indigo-500/30
                bg-white dark:bg-indigo-950
                text-slate-700 dark:text-indigo-200
                hover:bg-[#FFF1F2] dark:hover:bg-indigo-900/40
                disabled:opacity-40 disabled:cursor-not-allowed
                transition
              "
            >
              Next
            </button>
          </div>
        )}
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

type StatCardColor = "indigo" | "emerald" | "amber" | "slate";

type StatCardProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  note: string;
  color: StatCardColor;
};

function StatCard({
  title,
  value,
  icon,
  note,
  color,
}: StatCardProps) {
  const iconColorMap: Record<StatCardColor, string> = {
    indigo: "bg-[#B91C1C]/90 dark:bg-indigo-600",
    emerald: "bg-emerald-500 dark:bg-emerald-600",
    amber: "bg-amber-500 dark:bg-violet-500",
    slate: "bg-slate-500 dark:bg-indigo-700",
  };

  const textColorMap: Record<StatCardColor, string> = {
    indigo: "text-[#7F1D1D] dark:text-white",
    emerald: "text-[#7F1D1D] dark:text-white",
    amber: "text-[#7F1D1D] dark:text-white",
    slate: "text-[#7F1D1D] dark:text-white",
  };

  return (
    <div
      className="
        group relative
        rounded-2xl
        border border-[#FCA5A5]/40 dark:border-indigo-500/30
        bg-linear-to-br
        from-[#FFFDF8] via-[#FFF4EC] to-white
        dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
        p-6
        shadow-sm hover:shadow-xl
        transition
      "
    >
      {/* TOP */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#7F1D1D] dark:text-indigo-300">
            {title}
          </p>
          <p className={`text-4xl font-extrabold mt-1 ${textColorMap[color]}`}>
            {value}
          </p>
        </div>

        <div
          className={`
            w-14 h-14 rounded-2xl
            text-white
            flex items-center justify-center
            shadow
            group-hover:scale-110 transition
            ${iconColorMap[color]}
          `}
        >
          {icon}
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-4 pt-4 border-t border-[#FCA5A5]/40 dark:border-indigo-500/30">
        <p className="text-xs text-slate-600 dark:text-slate-300">
          {note}
        </p>
      </div>
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
          bg-linear-to-r
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
          bg-linear-to-r
          from-[#F59E0B] via-[#B91C1C] to-[#7F1D1D]
          dark:from-indigo-600 dark:via-violet-600 dark:to-indigo-800
          shadow-lg shadow-[#B91C1C]/30
          dark:shadow-indigo-600/30
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
