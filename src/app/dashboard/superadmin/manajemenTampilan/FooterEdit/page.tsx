"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Building2,
  CheckCircle2,
  Edit3,
  Globe,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  FaFacebookF,
  FaGlobe,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";
import {
  DEFAULT_FOOTER_LANDING,
  FOOTER_SOCIAL_PLATFORMS,
  type FooterLandingContent,
  type FooterSocialLinkItem,
} from "@/lib/footerLanding";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function renderSocialPreviewIcon(platform?: string) {
  switch (platform) {
    case "facebook":
      return <FaFacebookF className="w-4 h-4" />;
    case "instagram":
      return <FaInstagram className="w-4 h-4" />;
    case "youtube":
      return <FaYoutube className="w-4 h-4" />;
    case "whatsapp":
      return <FaWhatsapp className="w-4 h-4" />;
    case "tiktok":
      return <FaTiktok className="w-4 h-4" />;
    case "linkedin":
      return <FaLinkedinIn className="w-4 h-4" />;
    default:
      return <FaGlobe className="w-4 h-4" />;
  }
}

function formatUpdatedAt(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FooterEditSuperadminPage() {
  const [content, setContent] = useState<FooterLandingContent>(
    DEFAULT_FOOTER_LANDING,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const [socialModal, setSocialModal] = useState<{
    index: number | null;
    item: FooterSocialLinkItem;
  } | null>(null);

  const loadData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`${API_BASE}/footer-setting`);
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success && json?.data) {
        setContent({
          ...DEFAULT_FOOTER_LANDING,
          ...json.data,
        });
      }
    } catch {
      showToast.error("Gagal memuat pengaturan footer & kontak");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveAll = async () => {
    if (
      !content.institutionName.trim() ||
      !content.address.trim() ||
      !content.phone.trim() ||
      !content.email.trim()
    ) {
      showToast.error(
        "Nama instansi, alamat, nomor telepon, dan email wajib diisi",
      );
      return;
    }

    const toastId = showToast.loading("Menyimpan pengaturan Footer & Kontak...");
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/footer-setting`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(content),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || "Gagal menyimpan perubahan");
      }

      if (json?.data) {
        setContent({
          ...DEFAULT_FOOTER_LANDING,
          ...json.data,
        });
      }

      window.dispatchEvent(new Event("footer-updated"));
      showToast.updateSuccess(
        toastId,
        json?.message || "Konten Footer & Kontak berhasil diperbarui",
      );
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal menyimpan perubahan",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = async () => {
    const toastId = showToast.loading("Mengembalikan Footer ke default...");
    try {
      setResetting(true);
      const res = await fetch(`${API_BASE}/footer-setting`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || "Gagal mereset konten footer");
      }

      setContent({
        ...DEFAULT_FOOTER_LANDING,
        ...(json?.data || {}),
      });
      setConfirmReset(false);
      window.dispatchEvent(new Event("footer-updated"));
      showToast.updateSuccess(
        toastId,
        json?.message || "Konten Footer dikembalikan ke pengaturan default",
      );
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal mereset konten footer",
      );
    } finally {
      setResetting(false);
    }
  };

  const handleSaveSocialModal = () => {
    if (!socialModal) return;
    const platform = socialModal.item.platform || "globe";
    const label = socialModal.item.label.trim();
    const href = socialModal.item.href.trim();

    if (!label || !href) {
      showToast.error("Label dan URL tautan wajib diisi");
      return;
    }

    const next = [...content.socialLinks];
    if (socialModal.index === null) {
      next.push({ platform, label, href });
    } else {
      next[socialModal.index] = { platform, label, href };
    }

    setContent((prev) => ({ ...prev, socialLinks: next }));
    setSocialModal(null);
  };

  const handleMoveSocial = (idx: number, direction: -1 | 1) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= content.socialLinks.length) return;
    const next = [...content.socialLinks];
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved);
    setContent((prev) => ({ ...prev, socialLinks: next }));
  };

  const handleDeleteSocial = (idx: number) => {
    setContent((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== idx),
    }));
  };

  if (loading) {
    return (
      <TablePageSkeleton
        title="Kelola Footer & Kontak"
        subtitle="Memuat data instansi, kontak, dan tautan media sosial..."
        columnsCount={3}
        rowsCount={5}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Kelola Footer &amp; Kontak Instansi
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                content.isCustom
                  ? "bg-sky-50 text-[#0284c7] border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800"
                  : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
              }`}
            >
              {content.isCustom ? "Kustom Aktif" : "Default Bawaan"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Atur nama instansi, alamat, telepon, email, serta ikon tautan media
            sosial pada bagian Footer.
            {content.updatedAt && (
              <span className="ml-1 text-slate-400">
                (Diperbarui {formatUpdatedAt(content.updatedAt)}
                {content.updatedBy?.name ? ` oleh ${content.updatedBy.name}` : ""}
                )
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing || saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Segarkan
          </button>

          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            disabled={saving || resetting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 transition cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset ke Default
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-linear-to-r from-[#0284c7] to-blue-700 hover:from-[#0369a1] hover:to-blue-800 shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>

      {/* ================= PRATINJAU KARTU FOOTER ================= */}
      <div className="rounded-2xl bg-linear-to-br from-[#071531] via-[#0B1B3D] to-[#08306B] text-white p-5 sm:p-6 border border-sky-400/20 shadow-md">
        <p className="text-[11px] font-bold uppercase tracking-wider text-sky-300 mb-3">
          Pratinjau Tampilan Footer
        </p>
        <div className="flex flex-col items-start sm:items-end text-left sm:text-right">
          <div>
            <h3 className="text-sm font-bold text-white">
              {content.institutionName || "-"}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {content.address || "-"}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 border border-white/10">
              <Phone className="w-3.5 h-3.5 text-sky-400" />
              {content.phone || "-"}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 border border-white/10">
              <Mail className="w-3.5 h-3.5 text-sky-400" />
              {content.email || "-"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {content.socialLinks.map((soc, idx) => (
              <span
                key={idx}
                title={`${soc.label} (${soc.href})`}
                className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white"
              >
                {renderSocialPreviewIcon(soc.platform)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ================= FORM INSTANSI & KONTAK ================= */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Informasi Instansi &amp; Kontak
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Nama Instansi
            </label>
            <input
              type="text"
              value={content.institutionName}
              onChange={(e) =>
                setContent({ ...content, institutionName: e.target.value })
              }
              placeholder="Balai Besar POM di Palembang"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Alamat Instansi
            </label>
            <input
              type="text"
              value={content.address}
              onChange={(e) =>
                setContent({ ...content, address: e.target.value })
              }
              placeholder="Jl. Pangeran Ratu, 5 Ulu, Kota Palembang 30254"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              <Phone className="w-3.5 h-3.5" />
              Nomor Telepon
            </label>
            <input
              type="text"
              value={content.phone}
              onChange={(e) =>
                setContent({ ...content, phone: e.target.value })
              }
              placeholder="(0711) 510195"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              <Mail className="w-3.5 h-3.5" />
              Email Resmi
            </label>
            <input
              type="email"
              value={content.email}
              onChange={(e) =>
                setContent({ ...content, email: e.target.value })
              }
              placeholder="bpom_palembang@pom.go.id"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
            />
          </div>
        </div>
      </div>

      {/* ================= CRUD MEDIA SOSIAL & TAUTAN ================= */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Daftar Tautan Website &amp; Media Sosial
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tambah, edit, urutkan, atau hapus ikon tautan pada Footer
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setSocialModal({
                index: null,
                item: { platform: "globe", label: "", href: "" },
              })
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#0284c7] hover:bg-sky-700 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Tautan
          </button>
        </div>

        {content.socialLinks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-8 text-center text-xs text-slate-400">
            Belum ada tautan media sosial. Klik &ldquo;Tambah Tautan&rdquo;
            untuk menambahkan.
          </div>
        ) : (
          <div className="space-y-2.5">
            {content.socialLinks.map((soc, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#0284c7] text-white flex items-center justify-center shrink-0">
                    {renderSocialPreviewIcon(soc.platform)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {soc.label}
                      </p>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-sky-100 text-[#0284c7] dark:bg-sky-950/60 dark:text-sky-300">
                        {FOOTER_SOCIAL_PLATFORMS.find(
                          (p) => p.key === soc.platform,
                        )?.label || soc.platform}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {soc.href}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveSocial(idx, -1)}
                    title="Naikkan urutan"
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 transition"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === content.socialLinks.length - 1}
                    onClick={() => handleMoveSocial(idx, 1)}
                    title="Turunkan urutan"
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 transition"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSocialModal({ index: idx, item: { ...soc } })
                    }
                    title="Edit tautan"
                    className="p-1.5 rounded-lg text-[#0284c7] hover:bg-sky-50 dark:hover:bg-sky-950/60 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSocial(idx)}
                    title="Hapus tautan"
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= MODAL TAMBAH/EDIT TAUTAN SOSIAL ================= */}
      {socialModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setSocialModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-linear-to-r from-[#0284c7] via-sky-600 to-blue-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <h2 className="text-base font-extrabold">
                  {socialModal.index === null
                    ? "Tambah Tautan Sosial"
                    : "Edit Tautan Sosial"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSocialModal(null)}
                className="p-1.5 rounded-lg hover:bg-white/15 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Platform / Ikon
                </label>
                <select
                  value={socialModal.item.platform}
                  onChange={(e) =>
                    setSocialModal({
                      ...socialModal,
                      item: {
                        ...socialModal.item,
                        platform: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                >
                  {FOOTER_SOCIAL_PLATFORMS.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Label Tooltip / Deskripsi
                </label>
                <input
                  type="text"
                  value={socialModal.item.label}
                  onChange={(e) =>
                    setSocialModal({
                      ...socialModal,
                      item: { ...socialModal.item, label: e.target.value },
                    })
                  }
                  placeholder="Contoh: Instagram @bpom.palembang"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  URL Tujuan
                </label>
                <input
                  type="url"
                  value={socialModal.item.href}
                  onChange={(e) =>
                    setSocialModal({
                      ...socialModal,
                      item: { ...socialModal.item, href: e.target.value },
                    })
                  }
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSocialModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveSocialModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0284c7] hover:bg-sky-700 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= KONFIRMASI RESET DEFAULT ================= */}
      {confirmReset && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs"
          onClick={() => !resetting && setConfirmReset(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Reset Konten Footer ke Default?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Nama instansi, alamat, nomor telepon, email, dan daftar media
                  sosial akan dikembalikan ke data bawaan awal.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={resetting}
                onClick={() => setConfirmReset(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={handleResetDefault}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition cursor-pointer disabled:opacity-50"
              >
                {resetting ? "Mereset..." : "Ya, Reset Default"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
