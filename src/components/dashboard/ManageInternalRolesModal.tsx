"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Shield,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";
import { showToast } from "@/components/ui/toastDashboard";
import { persistAuthCookies } from "@/lib/authSession";
import { fetchFormasi } from "@/services/formasiService";

export type InternalRoleName = "superadmin" | "admin" | "mentor";

export interface ManageRolesTarget {
  _id: string;
  name: string;
  email: string;
  roles: string[];
  posisiMentor?: string;
  nip?: string;
  wa?: string;
}

const DEFAULT_POSISI_MENTOR_OPTIONS = [
  "Fungsi Penindakan",
  "Fungsi Pengujian",
  "Fungsi Pemeriksaan (Inspeksi dan sertifikasi)",
  "Fungsi Informasi dan Komunikasi",
  "Bagian Tata Usaha",
];

const INTERNAL_ROLE_OPTIONS: Array<{
  key: InternalRoleName;
  label: string;
  description: string;
  icon: typeof Shield;
}> = [
  {
    key: "superadmin",
    label: "Superadmin",
    description:
      "Akses penuh pengaturan sistem, kuota, akun admin/mentor/superadmin, dan seluruh data magang.",
    icon: Shield,
  },
  {
    key: "admin",
    label: "Admin",
    description:
      "Mengelola pendaftaran, data peserta, kuota formasi, logbook, absensi, dan laporan akhir.",
    icon: ShieldCheck,
  },
  {
    key: "mentor",
    label: "Mentor Pembimbing",
    description:
      "Membimbing peserta magang, menyetujui logbook, absensi, evaluasi, dan penilaian akhir.",
    icon: UserCheck,
  },
];

type Props = {
  target: ManageRolesTarget;
  onClose: () => void;
  onSaved: (updated: {
    _id: string;
    roles: string[];
    posisiMentor?: string;
    nip?: string;
    wa?: string;
  }) => void;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function ManageInternalRolesModal({
  target,
  onClose,
  onSaved,
}: Props) {
  const [selectedRoles, setSelectedRoles] = useState<InternalRoleName[]>(() => {
    const valid = target.roles.filter((r): r is InternalRoleName =>
      ["superadmin", "admin", "mentor"].includes(r),
    );
    return valid.length > 0 ? valid : ["mentor"];
  });

  const [posisiMentor, setPosisiMentor] = useState(
    target.posisiMentor && target.posisiMentor !== "-"
      ? target.posisiMentor
      : "",
  );
  const [nip, setNip] = useState(
    target.nip && target.nip !== "-" ? target.nip : "",
  );
  const [wa, setWa] = useState(
    target.wa && target.wa !== "-" ? target.wa : "",
  );
  const [posisiOptions, setPosisiOptions] = useState<string[]>(
    DEFAULT_POSISI_MENTOR_OPTIONS,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFormasi()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          const titles = list.map((f) => f.title).filter(Boolean);
          setPosisiOptions(
            Array.from(new Set([...DEFAULT_POSISI_MENTOR_OPTIONS, ...titles])),
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

  const toggleRole = (roleKey: InternalRoleName) => {
    setSelectedRoles((prev) =>
      prev.includes(roleKey)
        ? prev.filter((r) => r !== roleKey)
        : [...prev, roleKey],
    );
  };

  const hasMentorRole = selectedRoles.includes("mentor");

  const handleSave = async () => {
    if (selectedRoles.length === 0) {
      showToast.error("Minimal pilih satu peran internal");
      return;
    }

    if (hasMentorRole && !posisiMentor.trim()) {
      showToast.error(
        "Posisi / Fungsi Pembimbing wajib diisi jika peran Mentor dipilih",
      );
      return;
    }

    const toastId = showToast.loading("Menyimpan peran akun...");
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/superadmin/users/${target._id}/roles`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          roles: selectedRoles,
          ...(hasMentorRole
            ? {
                posisiMentor: posisiMentor.trim(),
                nip: nip.trim(),
                wa: wa.trim(),
              }
            : {}),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || "Gagal memperbarui peran akun");
      }

      if (json?.newToken && Array.isArray(json?.user?.roles)) {
        localStorage.setItem("token", json.newToken);
        localStorage.setItem("roles", JSON.stringify(json.user.roles));
        persistAuthCookies(json.newToken, json.user.roles);
        window.dispatchEvent(new Event("auth-session-updated"));
      }

      showToast.updateSuccess(
        toastId,
        json?.message || "Peran akun berhasil diperbarui",
      );

      onSaved({
        _id: target._id,
        roles: Array.isArray(json?.user?.roles)
          ? json.user.roles
          : selectedRoles,
        posisiMentor: json?.user?.posisiMentor ?? posisiMentor.trim(),
        nip: json?.user?.nip ?? nip.trim(),
        wa: json?.user?.wa ?? wa.trim(),
      });
      onClose();
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal memperbarui peran akun",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs"
      onClick={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-linear-to-r from-[#0284c7] via-sky-600 to-blue-700 text-white flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-extrabold truncate">
              Kelola Peran Akun (Multi-Role)
            </h2>
            <p className="text-xs text-sky-100 truncate">
              {target.name} • {target.email}
            </p>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/15 transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="rounded-xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/70 p-3 text-xs text-sky-800 dark:text-sky-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#0284c7] dark:text-sky-400" />
            <span>
              Satu akun bisa memiliki lebih dari satu peran internal. Jika
              memiliki beberapa peran, opsi pindah halaman akan muncul di menu
              profil pojok kanan atas.
            </span>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pilih Peran Aktif
            </p>

            {INTERNAL_ROLE_OPTIONS.map((opt) => {
              const checked = selectedRoles.includes(opt.key);
              const Icon = opt.icon;
              return (
                <label
                  key={opt.key}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition cursor-pointer ${
                    checked
                      ? "bg-sky-50/70 dark:bg-sky-950/40 border-[#0284c7] dark:border-sky-500"
                      : "bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleRole(opt.key)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0284c7] focus:ring-[#0284c7]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`w-4 h-4 ${
                          checked ? "text-[#0284c7]" : "text-slate-400"
                        }`}
                      />
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {opt.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {opt.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {hasMentorRole && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Data Profil Mentor
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Posisi / Fungsi Pembimbing{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={posisiMentor}
                  onChange={(e) => setPosisiMentor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                >
                  <option value="">-- Pilih Posisi Fungsi --</option>
                  {posisiOptions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NIP Mentor (Opsional)
                  </label>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) =>
                      setNip(e.target.value.replace(/[^0-9\s-]/g, ""))
                    }
                    placeholder="Contoh: 198501012010011001"
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor WhatsApp (Opsional)
                  </label>
                  <input
                    type="tel"
                    value={wa}
                    onChange={(e) =>
                      setWa(e.target.value.replace(/[^0-9+]/g, ""))
                    }
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5 shrink-0">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-linear-to-r from-[#0284c7] to-blue-700 hover:from-[#0369a1] hover:to-blue-800 shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {saving ? "Menyimpan..." : "Simpan Peran"}
          </button>
        </div>
      </div>
    </div>
  );
}
