"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Building2,
  CheckCircle2,
  ClipboardList,
  Compass,
  Edit3,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";
import {
  DEFAULT_PROFIL_LANDING,
  PROFIL_ICON_OPTIONS,
  type ProfilHighlightItem,
  type ProfilLandingContent,
} from "@/lib/profilLanding";

type EditorTab = "profil" | "visi" | "tugas";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

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

function StringListCrudSection({
  title,
  itemLabel,
  placeholder,
  items,
  onChange,
}: {
  title: string;
  itemLabel: string;
  placeholder: string;
  items: string[];
  onChange: (next: string[]) => void;
}) {
  const [newText, setNewText] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const handleAdd = () => {
    const trimmed = newText.trim();
    if (!trimmed) {
      showToast.error(`Isi ${itemLabel.toLowerCase()} tidak boleh kosong`);
      return;
    }
    onChange([...items, trimmed]);
    setNewText("");
  };

  const handleStartEdit = (idx: number) => {
    setEditingIndex(idx);
    setEditingText(items[idx] || "");
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const trimmed = editingText.trim();
    if (!trimmed) {
      showToast.error(`Isi ${itemLabel.toLowerCase()} tidak boleh kosong`);
      return;
    }
    const next = [...items];
    next[editingIndex] = trimmed;
    onChange(next);
    setEditingIndex(null);
    setEditingText("");
  };

  const handleMove = (idx: number, direction: -1 | 1) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved);
    onChange(next);
    if (editingIndex === idx) setEditingIndex(targetIdx);
  };

  const handleDelete = (idx: number) => {
    if (items.length <= 1) {
      showToast.error(`Minimal harus ada 1 poin ${itemLabel.toLowerCase()}`);
      return;
    }
    onChange(items.filter((_, i) => i !== idx));
    if (editingIndex === idx) {
      setEditingIndex(null);
      setEditingText("");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total {items.length} poin {itemLabel.toLowerCase()}
          </p>
        </div>
      </div>

      {/* Tambah item baru */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0284c7] hover:bg-sky-700 transition cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah {itemLabel}
        </button>
      </div>

      {/* Daftar item */}
      <div className="space-y-2">
        {items.map((text, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3 flex items-start gap-3"
          >
            <span className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950/70 text-[#0284c7] dark:text-sky-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              {idx + 1}
            </span>

            <div className="flex-1 min-w-0">
              {editingIndex === idx ? (
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-[#0284c7] text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Simpan Poin
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingIndex(null);
                        setEditingText("");
                      }}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {text}
                </p>
              )}
            </div>

            {editingIndex !== idx && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, -1)}
                  title="Naikkan urutan"
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 transition"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === items.length - 1}
                  onClick={() => handleMove(idx, 1)}
                  title="Turunkan urutan"
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 transition"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleStartEdit(idx)}
                  title="Edit poin"
                  className="p-1.5 rounded-lg text-[#0284c7] hover:bg-sky-50 dark:hover:bg-sky-950/60 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(idx)}
                  title="Hapus poin"
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfilLandingEditPage() {
  const [content, setContent] = useState<ProfilLandingContent>(
    DEFAULT_PROFIL_LANDING,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>("profil");

  // Modal Tambah/Edit Poin Keunggulan Profil
  const [highlightModal, setHighlightModal] = useState<{
    index: number | null;
    item: ProfilHighlightItem;
  } | null>(null);

  const loadData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`${API_BASE}/profil-setting`);
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success && json?.data) {
        setContent({
          ...DEFAULT_PROFIL_LANDING,
          ...json.data,
        });
      }
    } catch {
      showToast.error("Gagal memuat pengaturan profil landing page");
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
      !content.overlineTag.trim() ||
      !content.headingLine1.trim() ||
      !content.headingHighlight.trim() ||
      !content.profilDescription.trim()
    ) {
      setActiveTab("profil");
      showToast.error("Judul dan deskripsi bagian Profil wajib diisi");
      return;
    }

    if (content.profilHighlights.length === 0) {
      setActiveTab("profil");
      showToast.error("Minimal harus ada 1 poin keunggulan Profil");
      return;
    }

    if (!content.visi.trim() || content.misiList.length === 0) {
      setActiveTab("visi");
      showToast.error("Visi dan minimal 1 poin Misi wajib diisi");
      return;
    }

    if (
      !content.dasarHukumRegulasi.trim() ||
      !content.dasarHukumTentang.trim() ||
      !content.tugasPokok.trim() ||
      content.fungsiUtamaList.length === 0
    ) {
      setActiveTab("tugas");
      showToast.error(
        "Dasar hukum, Tugas Pokok, dan minimal 1 poin Fungsi Utama wajib diisi",
      );
      return;
    }

    const toastId = showToast.loading("Menyimpan konten Profil Landing Page...");
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/profil-setting`, {
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
          ...DEFAULT_PROFIL_LANDING,
          ...json.data,
        });
      }

      showToast.updateSuccess(
        toastId,
        json?.message || "Konten Profil Landing Page berhasil diperbarui",
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
    const toastId = showToast.loading("Mengembalikan ke konten default...");
    try {
      setResetting(true);
      const res = await fetch(`${API_BASE}/profil-setting`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || "Gagal mereset konten profil");
      }

      setContent({
        ...DEFAULT_PROFIL_LANDING,
        ...(json?.data || {}),
      });
      setConfirmReset(false);
      showToast.updateSuccess(
        toastId,
        json?.message || "Konten Profil berhasil dikembalikan ke default",
      );
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal mereset konten profil",
      );
    } finally {
      setResetting(false);
    }
  };

  const handleSaveHighlightModal = () => {
    if (!highlightModal) return;
    const title = highlightModal.item.title.trim();
    const desc = highlightModal.item.desc.trim();
    const iconKey = highlightModal.item.iconKey || "shield";

    if (!title || !desc) {
      showToast.error("Judul dan deskripsi keunggulan wajib diisi");
      return;
    }

    const next = [...content.profilHighlights];
    if (highlightModal.index === null) {
      next.push({ title, desc, iconKey });
    } else {
      next[highlightModal.index] = { title, desc, iconKey };
    }

    setContent((prev) => ({ ...prev, profilHighlights: next }));
    setHighlightModal(null);
  };

  const handleMoveHighlight = (idx: number, direction: -1 | 1) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= content.profilHighlights.length) return;
    const next = [...content.profilHighlights];
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved);
    setContent((prev) => ({ ...prev, profilHighlights: next }));
  };

  const handleDeleteHighlight = (idx: number) => {
    if (content.profilHighlights.length <= 1) {
      showToast.error("Minimal harus ada 1 poin keunggulan Profil");
      return;
    }
    setContent((prev) => ({
      ...prev,
      profilHighlights: prev.profilHighlights.filter((_, i) => i !== idx),
    }));
  };

  if (loading) {
    return (
      <TablePageSkeleton
        title="Kelola Profil & Visi Misi Landing Page"
        subtitle="Memuat konfigurasi konten profil instansi..."
        columnsCount={3}
        rowsCount={6}
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
              Kelola Profil Landing Page
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
            Kelola isi tab Profil, Visi &amp; Misi, serta Tugas &amp; Fungsi
            pada halaman utama website.
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

      {/* ================= TAB NAVIGASI ================= */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "profil", label: "Tab Profil", icon: Building2 },
            { key: "visi", label: "Tab Visi & Misi", icon: Compass },
            {
              key: "tugas",
              label: "Tab Tugas & Fungsi",
              icon: ClipboardList,
            },
          ] as Array<{
            key: EditorTab;
            label: string;
            icon: typeof Building2;
          }>
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                active
                  ? "bg-[#0284c7] text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ================= KONTEN TAB: PROFIL ================= */}
      {activeTab === "profil" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Judul &amp; Deskripsi Utama Profil
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Label Atas (Overline)
                </label>
                <input
                  type="text"
                  value={content.overlineTag}
                  onChange={(e) =>
                    setContent({ ...content, overlineTag: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Judul Baris Pertama
                </label>
                <input
                  type="text"
                  value={content.headingLine1}
                  onChange={(e) =>
                    setContent({ ...content, headingLine1: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Judul Sorotan (Warna Biru)
                </label>
                <input
                  type="text"
                  value={content.headingHighlight}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      headingHighlight: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Deskripsi Tab Profil
              </label>
              <textarea
                rows={4}
                value={content.profilDescription}
                onChange={(e) =>
                  setContent({ ...content, profilDescription: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Kata <strong className="text-[#0284c7]">SI TANJAK</strong> di
                dalam paragraf otomatis ditampilkan berwarna biru tebal.
              </p>
            </div>
          </div>

          {/* CRUD Poin Keunggulan */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Daftar Poin Keunggulan Profil
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Menampilkan poin-poin ikon di bawah deskripsi tab Profil
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setHighlightModal({
                    index: null,
                    item: { title: "", desc: "", iconKey: "shield" },
                  })
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#0284c7] hover:bg-sky-700 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Keunggulan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {content.profilHighlights.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-sky-100 text-[#0284c7] dark:bg-sky-950/70 dark:text-sky-300">
                        {PROFIL_ICON_OPTIONS.find((o) => o.key === item.iconKey)
                          ?.label || item.iconKey}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveHighlight(idx, -1)}
                      title="Naikkan urutan"
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 transition"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === content.profilHighlights.length - 1}
                      onClick={() => handleMoveHighlight(idx, 1)}
                      title="Turunkan urutan"
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 transition"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setHighlightModal({ index: idx, item: { ...item } })
                      }
                      title="Edit poin"
                      className="p-1.5 rounded-lg text-[#0284c7] hover:bg-sky-50 dark:hover:bg-sky-950/60 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteHighlight(idx)}
                      title="Hapus poin"
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= KONTEN TAB: VISI & MISI ================= */}
      {activeTab === "visi" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Visi Badan POM
            </h2>
            <textarea
              rows={3}
              value={content.visi}
              onChange={(e) => setContent({ ...content, visi: e.target.value })}
              placeholder="Tuliskan visi resmi..."
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
            />
          </div>

          <StringListCrudSection
            title="Misi Badan POM"
            itemLabel="Misi"
            placeholder="Tambahkan poin misi baru lalu klik Tambah Misi..."
            items={content.misiList}
            onChange={(next) => setContent({ ...content, misiList: next })}
          />
        </div>
      )}

      {/* ================= KONTEN TAB: TUGAS & FUNGSI ================= */}
      {activeTab === "tugas" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Dasar Hukum &amp; Tugas Pokok
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Nomor / Nama Peraturan (Tebal)
                </label>
                <input
                  type="text"
                  value={content.dasarHukumRegulasi}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      dasarHukumRegulasi: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Keterangan Peraturan
                </label>
                <input
                  type="text"
                  value={content.dasarHukumTentang}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      dasarHukumTentang: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Tugas Pokok
              </label>
              <textarea
                rows={3}
                value={content.tugasPokok}
                onChange={(e) =>
                  setContent({ ...content, tugasPokok: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
              />
            </div>
          </div>

          <StringListCrudSection
            title="Fungsi Utama"
            itemLabel="Fungsi"
            placeholder="Tambahkan poin fungsi baru lalu klik Tambah Fungsi..."
            items={content.fungsiUtamaList}
            onChange={(next) =>
              setContent({ ...content, fungsiUtamaList: next })
            }
          />
        </div>
      )}

      {/* ================= MODAL TAMBAH/EDIT KEUNGGULAN PROFIL ================= */}
      {highlightModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setHighlightModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-linear-to-r from-[#0284c7] via-sky-600 to-blue-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <h2 className="text-base font-extrabold">
                  {highlightModal.index === null
                    ? "Tambah Poin Keunggulan"
                    : "Edit Poin Keunggulan"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setHighlightModal(null)}
                className="p-1.5 rounded-lg hover:bg-white/15 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Ikon Tampilan
                </label>
                <select
                  value={highlightModal.item.iconKey}
                  onChange={(e) =>
                    setHighlightModal({
                      ...highlightModal,
                      item: { ...highlightModal.item, iconKey: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                >
                  {PROFIL_ICON_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Judul Poin
                </label>
                <input
                  type="text"
                  value={highlightModal.item.title}
                  onChange={(e) =>
                    setHighlightModal({
                      ...highlightModal,
                      item: { ...highlightModal.item, title: e.target.value },
                    })
                  }
                  placeholder="Contoh: Pengawasan Terpadu"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Deskripsi Singkat
                </label>
                <textarea
                  rows={3}
                  value={highlightModal.item.desc}
                  onChange={(e) =>
                    setHighlightModal({
                      ...highlightModal,
                      item: { ...highlightModal.item, desc: e.target.value },
                    })
                  }
                  placeholder="Penjelasan singkat poin keunggulan..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setHighlightModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveHighlightModal}
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
                  Reset Konten Profil ke Default?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Semua perubahan kustom pada tab Profil, Visi &amp; Misi, dan
                  Tugas &amp; Fungsi akan dihapus dan dikembalikan ke teks
                  bawaan awal.
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
