"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  Edit3,
  Eye,
  FileCheck2,
  FileText,
  GraduationCap,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import {
  fetchFormasi,
  IFormasi,
  validasiApprovalFormasi,
} from "@/services/formasiService";
import PaginationFooter from "@/components/dashboard/PaginationFooter";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";
import PendaftaranFilterToolbar, {
  extractPendaftaranDates,
  extractPendaftaranYears,
  INITIAL_PENDAFTARAN_EXTRA_FILTERS,
  matchesPendaftaranExtraFilters,
  type PendaftaranExtraFilterState,
} from "@/components/pendaftaran/PendaftaranFilterToolbar";
import { showToast } from "@/components/ui/toastDashboard";
import { isMatchingMentorFormasi } from "@/lib/formasiMentor";
import { getJwtUserSummary } from "@/lib/pesertaFilter";
import { isPkpaPeserta } from "@/lib/pesertaKategori";
import {
  buildPendaftaranFilterSummary,
  buildPendaftaranPdfRows,
  downloadPendaftaranPdf,
} from "@/lib/pendaftaranPdf";

/* ================= TYPES ================= */

type PendaftaranStatus =
  | "Menunggu"
  | "Sedang Diproses"
  | "Disetujui"
  | "Ditolak";

type StatusFilter = "Semua" | PendaftaranStatus;

type MentorInfo = {
  _id: string;
  name: string;
  email: string;
  posisiMentor?: string;
  status?: string;
};

type PesertaItem = {
  nama: string;
  posisi: string;
  jurusan?: string;
  asal?: {
    jenis?: string;
    nama?: string;
  };
  tanggalMulaiMagang: string;
  tanggalSelesaiMagang: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  jenisKelamin?: string;
  provinsi?: string;
  kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  alamatLengkap?: string;
  email: string;
  wa: string;
  statusMagang?: string;
  mentor?: MentorInfo | string | null;
};

type Pendaftaran = {
  _id: string;
  kategori: "sendiri" | "bersama" | string;
  jumlahPeserta: number;
  status: PendaftaranStatus;
  jawabanAdmin?: string;
  suratPengantar?: string;
  suratBalasan?: string;
  createdAt: string;
  peserta: PesertaItem[];
};

type AkunPeserta = {
  _id: string;
  name: string;
  email: string;
  status?: string;
};

type ConfirmAction = {
  status: "Sedang Diproses" | "Disetujui" | "Ditolak";
  title: string;
  message: string;
};

/* ================= CONSTANTS & HELPERS ================= */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const ITEMS_PER_PAGE = 10;
const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5MB

function getTodayWibIso(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

function getStatusMagangByDate(
  mulai?: string,
  selesai?: string,
): "Belum Waktu Magang" | "Sedang Magang" | "Selesai" | "Menunggu" {
  if (!mulai || !selesai) return "Menunggu";
  const todayIso = getTodayWibIso();
  if (todayIso < mulai) return "Belum Waktu Magang";
  if (todayIso <= selesai) return "Sedang Magang";
  return "Selesai";
}

function getStatusPendaftaranBadge(status: PendaftaranStatus) {
  switch (status) {
    case "Disetujui":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
    case "Ditolak":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800";
    case "Sedang Diproses":
      return "bg-sky-50 text-[#0284c7] border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
  }
}

function getStatusMagangBadge(status?: string) {
  switch (status) {
    case "Sedang Magang":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
    case "Belum Waktu Magang":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
    case "Selesai":
      return "bg-sky-50 text-[#0284c7] border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }
}

function formatTanggalShort(iso?: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getMentorObject(
  mentor: PesertaItem["mentor"],
  mentors: MentorInfo[],
): MentorInfo | null {
  if (!mentor) return null;
  if (typeof mentor === "object" && "name" in mentor) return mentor;
  if (typeof mentor === "string") {
    return mentors.find((m) => m._id === mentor) || null;
  }
  return null;
}

function generateAccountPassword(length = 10): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const all = upper + lower + digits;

  let pwd =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    digits[Math.floor(Math.random() * digits.length)];

  while (pwd.length < length) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  return pwd;
}

/* ================= COMPONENT ================= */

export default function ViewPendaftaranSuperadminPage() {
  const [data, setData] = useState<Pendaftaran[]>([]);
  const [mentors, setMentors] = useState<MentorInfo[]>([]);
  const [akunPeserta, setAkunPeserta] = useState<AkunPeserta[]>([]);
  const [formasiList, setFormasiList] = useState<IFormasi[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Semua");
  const [extraFilters, setExtraFilters] = useState<PendaftaranExtraFilterState>(
    INITIAL_PENDAFTARAN_EXTRA_FILTERS,
  );
  const [currentPage, setCurrentPage] = useState(1);

  /* ---------- Detail & Status Action ---------- */
  const [selected, setSelected] = useState<Pendaftaran | null>(null);
  const [alasan, setAlasan] = useState("");
  const [suratBalasan, setSuratBalasan] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittingStatus, setSubmittingStatus] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );

  /* ---------- Edit Data Peserta (Superadmin Exclusive) ---------- */
  const [editMode, setEditMode] = useState(false);
  const [editedPeserta, setEditedPeserta] = useState<PesertaItem[]>([]);
  const [savingEditData, setSavingEditData] = useState(false);

  /* ---------- Bulk Delete (Superadmin Exclusive) ---------- */
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deleting, setDeleting] = useState(false);

  /* ---------- Edit Posisi State ---------- */
  const [editingPosisiIndex, setEditingPosisiIndex] = useState<number | null>(
    null,
  );
  const [newPosisiValue, setNewPosisiValue] = useState("");
  const [savingPosisi, setSavingPosisi] = useState(false);

  /* ---------- Assign Mentor Modal ---------- */
  const [mentorTarget, setMentorTarget] = useState<{
    index: number;
    peserta: PesertaItem;
  } | null>(null);
  const [selectedMentorId, setSelectedMentorId] = useState("");
  const [mentorSearch, setMentorSearch] = useState("");
  const [savingMentor, setSavingMentor] = useState(false);

  /* ---------- Create Akun Modal (Inline) ---------- */
  const [akunTarget, setAkunTarget] = useState<PesertaItem | null>(null);
  const [akunPassword, setAkunPassword] = useState("");
  const [creatingAkun, setCreatingAkun] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  /* ================= FETCH ================= */

  const loadData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [resPendaftaran, resPeserta, resMentor, formasi] =
        await Promise.all([
          fetch(`${API_BASE}/admin/pendaftaran`, { headers }),
          fetch(`${API_BASE}/admin/peserta`, { headers }),
          fetch(`${API_BASE}/admin/mentor`, { headers }),
          fetchFormasi().catch(() => [] as IFormasi[]),
        ]);

      if (!resPendaftaran.ok) {
        throw new Error("Gagal memuat data pendaftaran");
      }

      const [jsonPendaftaran, jsonPeserta, jsonMentor] = await Promise.all([
        resPendaftaran.json(),
        resPeserta.ok ? resPeserta.json() : [],
        resMentor.ok ? resMentor.json() : [],
      ]);

      setData(Array.isArray(jsonPendaftaran) ? jsonPendaftaran : []);
      setAkunPeserta(Array.isArray(jsonPeserta) ? jsonPeserta : []);
      setMentors(Array.isArray(jsonMentor) ? jsonMentor : []);
      setFormasiList(Array.isArray(formasi) ? formasi : []);
    } catch {
      showToast.error("Gagal memuat data pendaftaran");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ================= OPEN DETAIL & DEEP LINK ================= */

  const openDetailModal = useCallback((item: Pendaftaran) => {
    setSelected(item);
    setAlasan(item.jawabanAdmin || "");
    setSuratBalasan(null);
    setFileError(null);
    setFormError(null);
    setEditingPosisiIndex(null);
    setNewPosisiValue("");
    setEditMode(false);
    setEditedPeserta(
      item.peserta.map((p) => ({
        ...p,
        asal: p.asal ? { ...p.asal } : { jenis: "", nama: "" },
      })),
    );
    setConfirmAction(null);
    setMentorTarget(null);
    setAkunTarget(null);
  }, []);

  useEffect(() => {
    if (data.length === 0) return;

    const hashId = window.location.hash.replace("#", "").trim();
    const queryId =
      new URLSearchParams(window.location.search).get("id")?.trim() || "";
    const targetId = hashId || queryId;

    if (targetId) {
      const match = data.find((d) => d._id === targetId);
      if (match) openDetailModal(match);
    }
  }, [data, openDetailModal]);

  /* ================= ESCAPE KEY HANDLER ================= */

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (deleteStep > 0 && !deleting) setDeleteStep(0);
      else if (confirmAction && !submittingStatus) setConfirmAction(null);
      else if (akunTarget && !creatingAkun) setAkunTarget(null);
      else if (mentorTarget && !savingMentor) setMentorTarget(null);
      else if (selected && !savingEditData) setSelected(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    deleteStep,
    deleting,
    confirmAction,
    submittingStatus,
    akunTarget,
    creatingAkun,
    mentorTarget,
    savingMentor,
    selected,
    savingEditData,
  ]);

  /* ================= FILTERING & PAGINATION ================= */

  const statusCounts = useMemo(() => {
    const counts = {
      Semua: data.length,
      Menunggu: 0,
      "Sedang Diproses": 0,
      Disetujui: 0,
      Ditolak: 0,
    };

    for (const item of data) {
      if (item.status === "Menunggu") counts.Menunggu += 1;
      else if (item.status === "Sedang Diproses") counts["Sedang Diproses"] += 1;
      else if (item.status === "Disetujui") counts.Disetujui += 1;
      else if (item.status === "Ditolak") counts.Ditolak += 1;
    }

    return counts;
  }, [data]);

  const totalPesertaCount = useMemo(
    () =>
      data.reduce(
        (acc, item) => acc + (item.jumlahPeserta || item.peserta?.length || 0),
        0,
      ),
    [data],
  );

  const availableYears = useMemo(() => extractPendaftaranYears(data), [data]);
  const highlightedDates = useMemo(() => extractPendaftaranDates(data), [data]);

  const extraFilteredData = useMemo(
    () => data.filter((item) => matchesPendaftaranExtraFilters(item, extraFilters)),
    [data, extraFilters],
  );

  const tabStatusCounts = useMemo(() => {
    const counts = {
      Semua: extraFilteredData.length,
      Menunggu: 0,
      "Sedang Diproses": 0,
      Disetujui: 0,
      Ditolak: 0,
    };

    for (const item of extraFilteredData) {
      if (item.status === "Menunggu") counts.Menunggu += 1;
      else if (item.status === "Sedang Diproses") counts["Sedang Diproses"] += 1;
      else if (item.status === "Disetujui") counts.Disetujui += 1;
      else if (item.status === "Ditolak") counts.Ditolak += 1;
    }

    return counts;
  }, [extraFilteredData]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();

    return extraFilteredData.filter((item) => {
      if (statusFilter !== "Semua" && item.status !== statusFilter) {
        return false;
      }

      if (!q) return true;
      if (item._id.toLowerCase().includes(q)) return true;
      if (item.kategori?.toLowerCase().includes(q)) return true;

      return item.peserta.some(
        (p) =>
          p.nama?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.posisi?.toLowerCase().includes(q) ||
          p.jurusan?.toLowerCase().includes(q) ||
          p.asal?.nama?.toLowerCase().includes(q) ||
          p.wa?.toLowerCase().includes(q),
      );
    });
  }, [extraFilteredData, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, safePage]);

  /* ================= ACCOUNT & QUOTA HELPERS ================= */

  const findAkunByEmail = useCallback(
    (email?: string) => {
      if (!email) return undefined;
      const target = email.trim().toLowerCase();
      return akunPeserta.find((a) => a.email?.trim().toLowerCase() === target);
    },
    [akunPeserta],
  );

  const findFormasiByPosisi = useCallback(
    (posisi?: string) => {
      if (!posisi) return undefined;
      const target = posisi.trim().toLowerCase();
      return formasiList.find((f) => f.title?.trim().toLowerCase() === target);
    },
    [formasiList],
  );

  /* ================= BULK DELETE HANDLERS ================= */

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectPage = () => {
    const pageIds = paginatedData.map((d) => d._id);
    const allSelected =
      pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const requestBulkDelete = () => {
    if (selectedIds.length === 0) {
      showToast.error("Pilih minimal 1 data pendaftaran untuk dihapus");
      return;
    }
    setDeleteStep(1);
  };

  const executeBulkDelete = async () => {
    const toastId = showToast.loading("Menghapus data pendaftaran...");
    try {
      setDeleting(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/pendaftaran/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result?.message || "Gagal menghapus pendaftaran");
      }

      showToast.updateSuccess(
        toastId,
        result?.message || "Pendaftaran berhasil dihapus",
      );
      setSelectedIds([]);
      setDeleteMode(false);
      setDeleteStep(0);
      await loadData(true);
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal menghapus pendaftaran",
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ================= STATUS, FILE, POSISI, MENTOR, EDIT ================= */

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    setFormError(null);

    if (!file) {
      setSuratBalasan(null);
      return;
    }

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setSuratBalasan(null);
      e.target.value = "";
      const msg = "Hanya file berformat PDF yang diperbolehkan";
      setFileError(msg);
      showToast.error(msg);
      return;
    }

    if (file.size > MAX_PDF_SIZE) {
      setSuratBalasan(null);
      e.target.value = "";
      const msg = "Ukuran file maksimal 5MB";
      setFileError(msg);
      showToast.error(msg);
      return;
    }

    setSuratBalasan(file);
  };

  const requestUpdateStatus = (
    targetStatus: "Sedang Diproses" | "Disetujui" | "Ditolak",
  ) => {
    if (!selected) return;

    if (selected.status === "Disetujui" || selected.status === "Ditolak") {
      showToast.error(
        "Pendaftaran dengan status final tidak dapat diubah kembali.",
      );
      return;
    }

    setFormError(null);

    if (
      (targetStatus === "Disetujui" || targetStatus === "Ditolak") &&
      !alasan.trim()
    ) {
      const msg =
        targetStatus === "Disetujui"
          ? "Catatan / pesan persetujuan admin wajib diisi."
          : "Alasan penolakan admin wajib diisi.";
      setFormError(msg);
      showToast.error(msg);
      return;
    }

    if (targetStatus === "Disetujui") {
      if (!suratBalasan && !selected.suratBalasan) {
        const msg = "Surat balasan (PDF) wajib diunggah sebelum menyetujui.";
        setFormError(msg);
        showToast.error(msg);
        return;
      }

      const kuotaError = validasiApprovalFormasi(selected.peserta, formasiList);
      if (kuotaError) {
        setFormError(kuotaError);
        showToast.error(kuotaError);
        return;
      }
    }

    if (targetStatus === "Sedang Diproses") {
      setConfirmAction({
        status: "Sedang Diproses",
        title: "Tandai Sedang Diproses?",
        message:
          "Status pendaftaran akan diperbarui menjadi Sedang Diproses agar pendaftar mengetahui berkas sedang ditinjau.",
      });
      return;
    }

    if (targetStatus === "Disetujui") {
      setConfirmAction({
        status: "Disetujui",
        title: "Setujui Pendaftaran Magang?",
        message: `Apakah Anda yakin ingin MENYETUJUI pendaftaran ini (${selected.peserta.length} peserta)? Akun peserta yang belum terdaftar akan dibuat otomatis dan kredensial dikirim melalui email.`,
      });
      return;
    }

    setConfirmAction({
      status: "Ditolak",
      title: "Tolak Pendaftaran Magang?",
      message:
        "Apakah Anda yakin ingin MENOLAK pendaftaran ini? Email penolakan akan dikirim dan keputusan bersifat final.",
    });
  };

  const executeUpdateStatus = async () => {
    if (!selected || !confirmAction) return;

    try {
      setSubmittingStatus(true);
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("status", confirmAction.status);
      formData.append(
        "jawabanAdmin",
        alasan.trim() ||
          (confirmAction.status === "Sedang Diproses"
            ? "Berkas pendaftaran sedang ditinjau."
            : ""),
      );
      if (suratBalasan) {
        formData.append("suratBalasan", suratBalasan);
      }

      const res = await fetch(`${API_BASE}/admin/pendaftaran/${selected._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || "Gagal memperbarui status");
      }

      const updatedDoc: Pendaftaran | undefined = json?.data;

      setConfirmAction(null);
      showToast.success(
        json?.message ||
          `Status pendaftaran berhasil diubah menjadi "${confirmAction.status}"`,
      );

      if (updatedDoc) {
        setSelected(updatedDoc);
        setAlasan(updatedDoc.jawabanAdmin || "");
        setData((prev) =>
          prev.map((d) => (d._id === updatedDoc._id ? updatedDoc : d)),
        );
      }

      await loadData(true);
      if (updatedDoc) {
        setSelected(updatedDoc);
        setAlasan(updatedDoc.jawabanAdmin || "");
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Gagal memperbarui status";
      showToast.error(msg);
      setFormError(msg);
      setConfirmAction(null);
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleSavePosisi = async (indexPeserta: number) => {
    if (!selected) return;
    const trimmed = newPosisiValue.trim();
    if (!trimmed) {
      showToast.error("Posisi tidak boleh kosong");
      return;
    }

    try {
      setSavingPosisi(true);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/admin/pendaftaran/${selected._id}/posisi`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ indexPeserta, posisi: trimmed }),
        },
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || "Gagal memperbarui posisi");
      }

      const updatedDoc: Pendaftaran = json?.data || {
        ...selected,
        peserta: selected.peserta.map((p, idx) =>
          idx === indexPeserta ? { ...p, posisi: trimmed } : p,
        ),
      };

      setSelected(updatedDoc);
      setData((prev) =>
        prev.map((d) => (d._id === updatedDoc._id ? updatedDoc : d)),
      );
      setEditingPosisiIndex(null);
      setNewPosisiValue("");
      showToast.success("Posisi peserta berhasil diperbarui");
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : "Gagal memperbarui posisi",
      );
    } finally {
      setSavingPosisi(false);
    }
  };

  const handleSaveEditData = async () => {
    if (!selected) return;

    try {
      setSavingEditData(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/pendaftaran/${selected._id}/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ peserta: editedPeserta }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || "Gagal menyimpan perubahan data");
      }

      const updatedDoc: Pendaftaran = json?.data || {
        ...selected,
        peserta: editedPeserta,
      };

      setSelected(updatedDoc);
      setData((prev) =>
        prev.map((d) => (d._id === updatedDoc._id ? updatedDoc : d)),
      );
      setEditMode(false);
      showToast.success("Data peserta pendaftaran berhasil diperbarui");
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : "Gagal menyimpan perubahan",
      );
    } finally {
      setSavingEditData(false);
    }
  };

  const updateEditedField = (
    idx: number,
    updater: (prev: PesertaItem) => PesertaItem,
  ) => {
    setEditedPeserta((prev) =>
      prev.map((item, i) => (i === idx ? updater(item) : item)),
    );
  };

  const openMentorModal = (index: number, peserta: PesertaItem) => {
    const existing = getMentorObject(peserta.mentor, mentors);
    setMentorTarget({ index, peserta });
    const matchesFormasi =
      existing &&
      isMatchingMentorFormasi(peserta.posisi, existing.posisiMentor);
    setSelectedMentorId(matchesFormasi ? existing._id || "" : "");
    setMentorSearch("");
  };

  const handleSaveMentor = async () => {
    if (!selected || !mentorTarget) return;
    if (!selectedMentorId) {
      showToast.error("Pilih mentor terlebih dahulu");
      return;
    }

    try {
      setSavingMentor(true);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/admin/pendaftaran/${selected._id}/mentor-peserta`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: mentorTarget.peserta.email,
            mentorId: selectedMentorId,
          }),
        },
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || "Gagal menetapkan mentor");
      }

      const updatedDoc: Pendaftaran | undefined = json?.data;
      if (updatedDoc) {
        setSelected(updatedDoc);
        setData((prev) =>
          prev.map((d) => (d._id === updatedDoc._id ? updatedDoc : d)),
        );
      }

      setMentorTarget(null);
      showToast.success("Mentor peserta berhasil ditetapkan");
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : "Gagal menetapkan mentor",
      );
    } finally {
      setSavingMentor(false);
    }
  };

  const openAkunModal = (peserta: PesertaItem) => {
    setAkunTarget(peserta);
    setAkunPassword(generateAccountPassword(10));
  };

  const handleCreateAkunManual = async () => {
    if (!akunTarget) return;
    const pwd = akunPassword.trim();
    if (
      pwd.length < 8 ||
      !/[A-Z]/.test(pwd) ||
      !/[a-z]/.test(pwd) ||
      !/[0-9]/.test(pwd)
    ) {
      showToast.error(
        "Password minimal 8 karakter (wajib huruf besar, huruf kecil, dan angka)",
      );
      return;
    }

    try {
      setCreatingAkun(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/superadmin/buat-peserta`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: akunTarget.nama,
          email: akunTarget.email.trim().toLowerCase(),
          password: pwd,
          periode: akunTarget.tanggalMulaiMagang
            ? akunTarget.tanggalMulaiMagang.slice(0, 4)
            : new Date().getFullYear().toString(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || "Gagal membuat akun peserta");
      }

      if (json?.user) {
        setAkunPeserta((prev) => [
          ...prev,
          {
            _id: json.user.id || json.user._id || akunTarget.email,
            name: json.user.name || akunTarget.nama,
            email: json.user.email || akunTarget.email,
            status: json.user.status || "Aktif",
          },
        ]);
      } else {
        await loadData(true);
      }

      setAkunTarget(null);
      setAkunPassword("");
      showToast.success(
        json?.message || "Akun peserta berhasil dibuat & email terkirim",
      );
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : "Gagal membuat akun peserta",
      );
    } finally {
      setCreatingAkun(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (filteredData.length === 0) {
      showToast.error("Tidak ada data yang dapat diekspor");
      return;
    }

    try {
      setExportingPdf(true);
      const user = getJwtUserSummary();
      const rows = buildPendaftaranPdfRows(
        filteredData,
        (p) => getMentorObject(p.mentor, mentors)?.name,
        (item, p) =>
          item.status === "Disetujui"
            ? getStatusMagangByDate(
                p.tanggalMulaiMagang,
                p.tanggalSelesaiMagang,
              )
            : item.status === "Ditolak"
              ? "Tidak Magang"
              : "Menunggu",
      );

      const filterSummary = buildPendaftaranFilterSummary({
        statusFilter,
        extraFilters,
        search,
      });

      await downloadPendaftaranPdf(rows, {
        title: "LAPORAN REKAPITULASI DATA PENDAFTARAN MAGANG",
        subtitle: "Balai Besar Pengawas Obat dan Makanan di Palembang",
        roleLabel: "Superadmin",
        printedByName: user.name || "Superadmin",
        printedByDetail: user.email,
        filterSummary,
        totalPendaftaran: filteredData.length,
        fileName: `Laporan-Pendaftaran-Magang-Superadmin-${getTodayWibIso()}.pdf`,
      });
      showToast.success(`PDF laporan (${rows.length} peserta) berhasil diunduh`);
    } catch (err) {
      console.error("Error export PDF pendaftaran superadmin:", err);
      showToast.error("Gagal membuat file PDF laporan pendaftaran");
    } finally {
      setExportingPdf(false);
    }
  };

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <TablePageSkeleton
        title="Manajemen Pendaftaran Magang"
        subtitle="Memuat seluruh data pendaftaran magang..."
        columnsCount={6}
        rowsCount={8}
      />
    );
  }

  const isSelectedFinal =
    selected?.status === "Disetujui" || selected?.status === "Ditolak";
  const activeMentors = mentors.filter((m) => m.status !== "nonaktif");
  const formasiMentors = mentorTarget
    ? activeMentors.filter((m) =>
        isMatchingMentorFormasi(mentorTarget.peserta.posisi, m.posisiMentor),
      )
    : [];
  const filteredMentors = formasiMentors.filter((m) => {
    const q = mentorSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      (m.posisiMentor && m.posisiMentor.toLowerCase().includes(q))
    );
  });

  const pageIds = paginatedData.map((d) => d._id);
  const isAllPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Manajemen Pendaftaran Magang
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Verifikasi berkas pendaftaran, edit data peserta, tetapkan mentor,
            dan kelola penghapusan berkas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-60"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          {deleteMode ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setDeleteMode(false);
                  setSelectedIds([]);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                Batal Hapus
              </button>
              <button
                type="button"
                onClick={requestBulkDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Terpilih ({selectedIds.length})
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setDeleteMode(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Mode Hapus
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={exportingPdf || filteredData.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            {exportingPdf ? "Menyiapkan PDF..." : "Unduh PDF"}
          </button>
        </div>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5 bg-linear-to-br from-[#0284c7] to-blue-700 text-white shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-sky-100">
                Total Pendaftaran
              </p>
              <p className="text-3xl font-extrabold tracking-tight mt-2">
                {statusCounts.Semua}
              </p>
              <p className="text-[11px] text-sky-100 mt-1.5">
                {totalPesertaCount} total calon peserta terdaftar
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Menunggu &amp; Diproses
              </p>
              <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight mt-2">
                {statusCounts.Menunggu + statusCounts["Sedang Diproses"]}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                {statusCounts.Menunggu} menunggu •{" "}
                {statusCounts["Sedang Diproses"]} diproses
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Disetujui
              </p>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-2">
                {statusCounts.Disetujui}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Berkas diterima &amp; siap magang
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Ditolak
              </p>
              <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight mt-2">
                {statusCounts.Ditolak}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Tidak memenuhi kriteria / kuota
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ================= FILTER & SEARCH ================= */}
      <PendaftaranFilterToolbar
        statusFilter={statusFilter}
        onStatusChange={(next) => {
          setStatusFilter(next);
          setCurrentPage(1);
        }}
        statusCounts={tabStatusCounts}
        search={search}
        onSearchChange={(next) => {
          setSearch(next);
          setCurrentPage(1);
        }}
        extraFilters={extraFilters}
        onExtraFiltersChange={(next) => {
          setExtraFilters(next);
          setCurrentPage(1);
        }}
        availableYears={availableYears}
        highlightedDates={highlightedDates}
        filteredCount={filteredData.length}
      />

      {/* ================= TABLE ================= */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                {deleteMode && (
                  <th className="py-3.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      onChange={toggleSelectPage}
                      aria-label="Pilih semua baris di halaman ini"
                      className="w-4 h-4 accent-rose-600 cursor-pointer"
                    />
                  </th>
                )}
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Pendaftar &amp; Anggota</th>
                <th className="py-3.5 px-4">Asal &amp; Posisi</th>
                <th className="py-3.5 px-4">Periode &amp; Berkas</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={deleteMode ? 7 : 6}
                    className="py-14 px-4 text-center text-slate-500 dark:text-slate-400"
                  >
                    <ClipboardList className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-200">
                      Tidak ada data pendaftaran yang sesuai
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => {
                  const first = item.peserta[0];
                  const rowNo = (safePage - 1) * ITEMS_PER_PAGE + idx + 1;
                  const uniquePositions = Array.from(
                    new Set(
                      item.peserta.map((p) => p.posisi).filter(Boolean),
                    ),
                  );
                  const liveMagangStatus =
                    item.status === "Disetujui" && first
                      ? getStatusMagangByDate(
                          first.tanggalMulaiMagang,
                          first.tanggalSelesaiMagang,
                        )
                      : null;
                  const checked = selectedIds.includes(item._id);

                  return (
                    <tr
                      key={item._id}
                      className={`transition-colors ${
                        checked
                          ? "bg-rose-50/50 dark:bg-rose-950/20"
                          : "hover:bg-sky-50/40 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      {deleteMode && (
                        <td className="py-3.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelectRow(item._id)}
                            aria-label={`Pilih pendaftaran ${first?.nama || item._id}`}
                            className="w-4 h-4 accent-rose-600 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {rowNo}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {first?.nama || "-"}
                            </span>
                            {item.peserta.some((p) => isPkpaPeserta(p)) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800">
                                PKPA
                              </span>
                            )}
                            {item.peserta.length > 1 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-[#0284c7] border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800">
                                <Users className="w-3 h-3" />+
                                {item.peserta.length - 1} anggota
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {first?.email || "-"}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            Didaftarkan: {formatTanggalShort(item.createdAt)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{first?.asal?.nama || "-"}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {uniquePositions.map((pos) => (
                              <span
                                key={pos}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              >
                                {pos}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1.5 text-xs">
                          <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {first?.tanggalMulaiMagang || "-"} s/d{" "}
                            {first?.tanggalSelesaiMagang || "-"}
                          </span>

                          <div className="flex flex-wrap items-center gap-2">
                            {liveMagangStatus && (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${getStatusMagangBadge(
                                  liveMagangStatus,
                                )}`}
                              >
                                {liveMagangStatus}
                              </span>
                            )}

                            {item.suratPengantar && (
                              <a
                                href={`${API_BASE}/uploads/${item.suratPengantar}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0284c7] hover:underline"
                              >
                                <FileText className="w-3 h-3" />
                                Surat Pengantar
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${getStatusPendaftaranBadge(
                            item.status,
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openDetailModal(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <PaginationFooter
          currentPage={safePage}
          totalItems={filteredData.length}
          itemsPerPage={ITEMS_PER_PAGE}
          itemLabel="pendaftaran"
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ================= DETAIL & PROSES MODAL ================= */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={(e) => {
            if (
              e.target === e.currentTarget &&
              !submittingStatus &&
              !savingEditData
            ) {
              setSelected(null);
            }
          }}
        >
          <div className="w-full max-w-5xl max-h-[92vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-linear-to-r from-[#0284c7] to-blue-700 px-6 py-4 text-white flex flex-wrap items-start justify-between gap-4 shrink-0">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-lg sm:text-xl font-bold">
                    Detail Pendaftaran Magang
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                    {selected.kategori === "bersama" ? "Kelompok" : "Mandiri"} (
                    {selected.peserta.length} Peserta)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-[#0284c7]">
                    {selected.status}
                  </span>
                </div>
                <p className="text-xs text-sky-100 mt-1">
                  ID: {selected._id} • Diterima pada{" "}
                  {formatTanggalShort(selected.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (editMode) {
                      setEditMode(false);
                      setEditedPeserta(
                        selected.peserta.map((p) => ({
                          ...p,
                          asal: p.asal
                            ? { ...p.asal }
                            : { jenis: "", nama: "" },
                        })),
                      );
                    } else {
                      setEditMode(true);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/15 hover:bg-white/25 text-white transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {editMode ? "Batal Edit Data" : "Edit Data Peserta"}
                </button>

                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Tutup detail pendaftaran"
                  className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
              {/* Berkas Resmi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-300 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Surat Pengantar Pendaftar
                      </p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                        {selected.suratPengantar
                          ? selected.suratPengantar.split("/").pop()
                          : "Tidak tersedia"}
                      </p>
                    </div>
                  </div>
                  {selected.suratPengantar && (
                    <a
                      href={`${API_BASE}/uploads/${selected.suratPengantar}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shrink-0 transition"
                    >
                      Buka PDF
                    </a>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Surat Balasan Admin
                      </p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                        {selected.suratBalasan
                          ? selected.suratBalasan.split("/").pop()
                          : "Belum diunggah"}
                      </p>
                    </div>
                  </div>
                  {selected.suratBalasan && (
                    <a
                      href={`${API_BASE}/uploads/${selected.suratBalasan}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 transition"
                    >
                      Lihat PDF
                    </a>
                  )}
                </div>
              </div>

              {/* Save Bar if EditMode */}
              {editMode && (
                <div className="p-4 rounded-2xl border border-sky-300 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/30 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-[#0284c7] dark:text-sky-300">
                    Mode Edit Data Superadmin aktif — ubah kolom di bawah lalu
                    simpan perubahan.
                  </p>
                  <button
                    type="button"
                    disabled={savingEditData}
                    onClick={handleSaveEditData}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition disabled:opacity-60"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingEditData
                      ? "Menyimpan..."
                      : "Simpan Perubahan Data"}
                  </button>
                </div>
              )}

              {/* Daftar Peserta */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Data Peserta ({selected.peserta.length})
                </h3>

                <div className="space-y-4">
                  {(editMode ? editedPeserta : selected.peserta).map(
                    (p, idx) => {
                      const mentorObj = getMentorObject(p.mentor, mentors);
                      const akun = findAkunByEmail(p.email);
                      const formasiInfo = findFormasiByPosisi(p.posisi);
                      const isEditingThisPosisi = editingPosisiIndex === idx;
                      const magangStatus =
                        selected.status === "Disetujui"
                          ? getStatusMagangByDate(
                              p.tanggalMulaiMagang,
                              p.tanggalSelesaiMagang,
                            )
                          : selected.status === "Ditolak"
                            ? "Tidak Magang"
                            : "Menunggu";

                      return (
                        <div
                          key={`${p.email}-${idx}`}
                          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4"
                        >
                          {/* Peserta Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  Peserta {idx + 1}
                                </span>
                                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                  {p.nama}
                                </h4>
                                {isPkpaPeserta(p) && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800">
                                    PKPA
                                  </span>
                                )}
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${getStatusMagangBadge(
                                    magangStatus,
                                  )}`}
                                >
                                  {magangStatus}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                                <span className="inline-flex items-center gap-1">
                                  <Mail className="w-3.5 h-3.5" />
                                  {p.email}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5" />
                                  {p.wa}
                                </span>
                              </div>
                            </div>

                            {!editMode && (
                              <div className="flex flex-wrap items-center gap-2">
                                {akun ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Akun Terdaftar ({akun.status || "aktif"})
                                  </span>
                                ) : (
                                  selected.status !== "Ditolak" && (
                                    <button
                                      type="button"
                                      onClick={() => openAkunModal(p)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition"
                                    >
                                      <UserPlus className="w-3.5 h-3.5" />
                                      Buatkan Akun
                                    </button>
                                  )
                                )}

                                {selected.status !== "Ditolak" && (
                                  <button
                                    type="button"
                                    onClick={() => openMentorModal(idx, p)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    {mentorObj
                                      ? "Ubah Mentor"
                                      : "Tetapkan Mentor"}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Editable Fields or View Grid */}
                          {editMode ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                              <EditField
                                label="Nama Lengkap"
                                value={p.nama}
                                onChange={(val) =>
                                  updateEditedField(idx, (prev) => ({
                                    ...prev,
                                    nama: val,
                                  }))
                                }
                              />
                              <EditField
                                label="Email"
                                type="email"
                                value={p.email}
                                onChange={(val) =>
                                  updateEditedField(idx, (prev) => ({
                                    ...prev,
                                    email: val,
                                  }))
                                }
                              />
                              <EditField
                                label="WhatsApp"
                                value={p.wa}
                                onChange={(val) =>
                                  updateEditedField(idx, (prev) => ({
                                    ...prev,
                                    wa: val,
                                  }))
                                }
                              />
                              <EditField
                                label="Asal Institusi"
                                value={p.asal?.nama || ""}
                                onChange={(val) =>
                                  updateEditedField(idx, (prev) => ({
                                    ...prev,
                                    asal: {
                                      jenis: prev.asal?.jenis || "",
                                      nama: val,
                                    },
                                  }))
                                }
                              />
                              <EditField
                                label="Jurusan"
                                value={p.jurusan || ""}
                                onChange={(val) =>
                                  updateEditedField(idx, (prev) => ({
                                    ...prev,
                                    jurusan: val,
                                  }))
                                }
                              />
                              <EditField
                                label="Tanggal Mulai Magang"
                                type="date"
                                value={p.tanggalMulaiMagang || ""}
                                onChange={(val) =>
                                  updateEditedField(idx, (prev) => ({
                                    ...prev,
                                    tanggalMulaiMagang: val,
                                  }))
                                }
                              />
                              <EditField
                                label="Tanggal Selesai Magang"
                                type="date"
                                value={p.tanggalSelesaiMagang || ""}
                                onChange={(val) =>
                                  updateEditedField(idx, (prev) => ({
                                    ...prev,
                                    tanggalSelesaiMagang: val,
                                  }))
                                }
                              />
                              <EditField
                                label="Tempat Lahir"
                                value={p.tempatLahir || ""}
                                onChange={(val) =>
                                  updateEditedField(idx, (prev) => ({
                                    ...prev,
                                    tempatLahir: val,
                                  }))
                                }
                              />
                              <EditField
                                label="Tanggal Lahir"
                                type="date"
                                value={(p.tanggalLahir || "").split("T")[0]}
                                onChange={(val) =>
                                  updateEditedField(idx, (prev) => ({
                                    ...prev,
                                    tanggalLahir: val,
                                  }))
                                }
                              />
                              <div className="sm:col-span-2 lg:col-span-3">
                                <EditField
                                  label="Alamat Lengkap"
                                  value={p.alamatLengkap || ""}
                                  onChange={(val) =>
                                    updateEditedField(idx, (prev) => ({
                                      ...prev,
                                      alamatLengkap: val,
                                    }))
                                  }
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                <p className="text-slate-400 font-medium mb-1">
                                  Asal Institusi &amp; Jurusan
                                </p>
                                <p className="font-semibold text-slate-800 dark:text-slate-100">
                                  {p.asal?.nama || "-"} ({p.asal?.jenis || "-"})
                                </p>
                                <p className="text-slate-500 dark:text-slate-400 mt-0.5 inline-flex items-center gap-1">
                                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                                  {p.jurusan || "-"}
                                </p>
                              </div>

                              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <p className="text-slate-400 font-medium">
                                    Posisi / Formasi
                                  </p>
                                  {!isSelectedFinal && !isEditingThisPosisi && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingPosisiIndex(idx);
                                        setNewPosisiValue(p.posisi || "");
                                      }}
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0284c7] hover:underline"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      Edit Posisi
                                    </button>
                                  )}
                                </div>

                                {isEditingThisPosisi ? (
                                  <div className="space-y-2 mt-1">
                                    {formasiList.length > 0 ? (
                                      <select
                                        value={newPosisiValue}
                                        onChange={(e) =>
                                          setNewPosisiValue(e.target.value)
                                        }
                                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                                      >
                                        <option value="">
                                          -- Pilih Formasi --
                                        </option>
                                        {formasiList.map((f) => (
                                          <option key={f._id} value={f.title}>
                                            {f.title} (Sisa: {f.sisaKuota})
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input
                                        type="text"
                                        value={newPosisiValue}
                                        onChange={(e) =>
                                          setNewPosisiValue(e.target.value)
                                        }
                                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                                      />
                                    )}
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        disabled={savingPosisi}
                                        onClick={() => handleSavePosisi(idx)}
                                        className="px-2.5 py-1 rounded-lg bg-[#0284c7] text-white text-[11px] font-semibold disabled:opacity-50"
                                      >
                                        {savingPosisi
                                          ? "Menyimpan..."
                                          : "Simpan"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditingPosisiIndex(null)
                                        }
                                        className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold"
                                      >
                                        Batal
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                                      {p.posisi || "-"}
                                    </p>
                                    {formasiInfo && (
                                      <p
                                        className={`text-[11px] font-medium mt-0.5 ${
                                          formasiInfo.sisaKuota > 0
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-rose-600 dark:text-rose-400"
                                        }`}
                                      >
                                        Sisa kuota formasi:{" "}
                                        {formasiInfo.sisaKuota}
                                      </p>
                                    )}
                                  </>
                                )}
                              </div>

                              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                <p className="text-slate-400 font-medium mb-1">
                                  Periode &amp; Pembimbing
                                </p>
                                <p className="font-semibold text-slate-800 dark:text-slate-100">
                                  {p.tanggalMulaiMagang} s/d{" "}
                                  {p.tanggalSelesaiMagang}
                                </p>
                                <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                                  Mentor:{" "}
                                  <span className="font-semibold text-[#0284c7] dark:text-sky-400">
                                    {mentorObj
                                      ? mentorObj.name
                                      : "Belum ditetapkan"}
                                  </span>
                                </p>
                              </div>

                              <div className="sm:col-span-2 lg:col-span-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-start gap-2">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                <div className="text-slate-600 dark:text-slate-300">
                                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                                    TTL &amp; Alamat:{" "}
                                  </span>
                                  {p.tempatLahir || "-"},{" "}
                                  {p.tanggalLahir || "-"} (
                                  {p.jenisKelamin || "-"}) —{" "}
                                  {[
                                    p.alamatLengkap,
                                    p.kelurahan,
                                    p.kecamatan,
                                    p.kota,
                                    p.provinsi,
                                  ]
                                    .filter(Boolean)
                                    .join(", ") || "-"}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              </div>

              {/* Keputusan Status */}
              {!editMode && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-5 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Verifikasi &amp; Keputusan
                  </h3>

                  {isSelectedFinal ? (
                    <div
                      className={`rounded-xl p-4 border ${
                        selected.status === "Disetujui"
                          ? "bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                          : "bg-rose-50/80 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {selected.status === "Disetujui" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-1 text-sm">
                          <p className="font-bold text-slate-900 dark:text-white">
                            Keputusan Final: {selected.status}
                          </p>
                          <p className="text-slate-700 dark:text-slate-300">
                            <span className="font-semibold">
                              Catatan Admin:{" "}
                            </span>
                            {selected.jawabanAdmin || "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formError && (
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{formError}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Catatan / Alasan Keputusan{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={3}
                          value={alasan}
                          onChange={(e) => {
                            setAlasan(e.target.value);
                            if (formError) setFormError(null);
                          }}
                          placeholder="Tuliskan catatan persetujuan, informasi proses, atau alasan penolakan..."
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Upload Surat Balasan Resmi (PDF, maks. 5MB — wajib
                          untuk menyetujui)
                        </label>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#0284c7] bg-sky-50/60 dark:bg-sky-950/30 text-[#0284c7] dark:text-sky-300 text-xs font-semibold cursor-pointer hover:bg-sky-100/70 transition">
                            <Upload className="w-4 h-4" />
                            <span>
                              {suratBalasan
                                ? suratBalasan.name
                                : "Pilih File PDF Surat Balasan"}
                            </span>
                            <input
                              type="file"
                              accept=".pdf,application/pdf"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                          {suratBalasan && (
                            <button
                              type="button"
                              onClick={() => {
                                setSuratBalasan(null);
                                setFileError(null);
                              }}
                              className="text-xs font-semibold text-rose-600 hover:underline self-start sm:self-center"
                            >
                              Hapus file
                            </button>
                          )}
                        </div>
                        {fileError && (
                          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5 font-medium">
                            {fileError}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                        {selected.status === "Menunggu" && (
                          <button
                            type="button"
                            onClick={() =>
                              requestUpdateStatus("Sedang Diproses")
                            }
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-sky-100 hover:bg-sky-200 text-[#0284c7] dark:bg-sky-950/60 dark:text-sky-300 transition"
                          >
                            <Clock className="w-4 h-4" />
                            Tandai Sedang Diproses
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => requestUpdateStatus("Ditolak")}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition"
                        >
                          <XCircle className="w-4 h-4" />
                          Tolak Pendaftaran
                        </button>

                        <button
                          type="button"
                          onClick={() => requestUpdateStatus("Disetujui")}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Setujui &amp; Kirim Surat
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MENTOR MODAL ================= */}
      {mentorTarget && selected && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !savingMentor) {
              setMentorTarget(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="bg-linear-to-r from-[#0284c7] to-blue-700 px-5 py-4 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Tetapkan Mentor Peserta</h3>
              <button
                type="button"
                onClick={() => setMentorTarget(null)}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
                <p className="font-bold text-slate-800 dark:text-white text-sm">
                  {mentorTarget.peserta.nama}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  {mentorTarget.peserta.email} • Posisi:{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {mentorTarget.peserta.posisi}
                  </span>
                </p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={mentorSearch}
                  onChange={(e) => setMentorSearch(e.target.value)}
                  placeholder="Filter nama atau fungsi mentor..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilih Mentor Pembimbing (Formasi:{" "}
                  {mentorTarget.peserta.posisi || "-"})
                </label>
                <select
                  value={selectedMentorId}
                  onChange={(e) => setSelectedMentorId(e.target.value)}
                  disabled={filteredMentors.length === 0}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7] disabled:opacity-60"
                >
                  <option value="">
                    {filteredMentors.length === 0
                      ? "-- Tidak ada mentor untuk formasi ini --"
                      : "-- Pilih Mentor --"}
                  </option>
                  {filteredMentors.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                      {m.posisiMentor ? ` — ${m.posisiMentor}` : ""}
                    </option>
                  ))}
                </select>
                {formasiMentors.length === 0 && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5">
                    Belum ada mentor aktif yang terdaftar untuk formasi{" "}
                    <b>{mentorTarget.peserta.posisi || "-"}</b>.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMentorTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={savingMentor || filteredMentors.length === 0}
                  onClick={handleSaveMentor}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition disabled:opacity-60"
                >
                  {savingMentor ? "Menyimpan..." : "Simpan Mentor"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= BUAT AKUN MODAL (INLINE) ================= */}
      {akunTarget && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !creatingAkun) {
              setAkunTarget(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="bg-linear-to-r from-[#0284c7] to-blue-700 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                <h3 className="text-base font-bold">Buat Akun Peserta</h3>
              </div>
              <button
                type="button"
                disabled={creatingAkun}
                onClick={() => setAkunTarget(null)}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
                <p className="font-bold text-slate-800 dark:text-white text-sm">
                  {akunTarget.nama}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Email:{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {akunTarget.email.trim().toLowerCase()}
                  </span>
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Posisi: {akunTarget.posisi || "-"}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#0284c7]" />
                    Password Awal Akun
                  </label>
                  <button
                    type="button"
                    onClick={() => setAkunPassword(generateAccountPassword(10))}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0284c7] hover:underline"
                  >
                    <Sparkles className="w-3 h-3" />
                    Generate Acak
                  </button>
                </div>
                <input
                  type="text"
                  value={akunPassword}
                  onChange={(e) => setAkunPassword(e.target.value)}
                  placeholder="Minimal 8 karakter (huruf besar, kecil & angka)"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Kredensial login dikirim otomatis ke email peserta. Akun yang
                  belum terdaftar juga dibuat otomatis saat status Disetujui.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={creatingAkun}
                  onClick={() => setAkunTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={creatingAkun}
                  onClick={handleCreateAkunManual}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition disabled:opacity-60"
                >
                  {creatingAkun ? "Membuat Akun..." : "Buat & Kirim Email"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= CONFIRM STATUS MODAL ================= */}
      {confirmAction && (
        <div className="fixed inset-0 z-70 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  confirmAction.status === "Disetujui"
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                    : confirmAction.status === "Ditolak"
                      ? "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                      : "bg-sky-100 text-[#0284c7] dark:bg-sky-950/60 dark:text-sky-400"
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {confirmAction.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {confirmAction.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={submittingStatus}
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submittingStatus}
                onClick={executeUpdateStatus}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition disabled:opacity-60 ${
                  confirmAction.status === "Disetujui"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : confirmAction.status === "Ditolak"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-[#0284c7] hover:bg-sky-700"
                }`}
              >
                {submittingStatus ? "Memproses..." : "Ya, Lanjutkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 2-STEP BULK DELETE CONFIRM MODAL ================= */}
      {deleteStep > 0 && (
        <div className="fixed inset-0 z-70 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {deleteStep === 1
                    ? "Hapus Data Pendaftaran?"
                    : "Konfirmasi Penghapusan Permanen"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {deleteStep === 1
                    ? `Anda memilih ${selectedIds.length} pendaftaran untuk dihapus. Lanjutkan ke konfirmasi akhir?`
                    : `Semua ${selectedIds.length} pendaftaran yang dipilih akan dihapus permanen dari database dan tidak dapat dipulihkan.`}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteStep(0)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              {deleteStep === 1 ? (
                <button
                  type="button"
                  onClick={() => setDeleteStep(2)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition"
                >
                  Lanjutkan
                </button>
              ) : (
                <button
                  type="button"
                  disabled={deleting}
                  onClick={executeBulkDelete}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition disabled:opacity-60"
                >
                  {deleting ? "Menghapus..." : "Ya, Hapus Permanen"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "date";
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
      />
    </div>
  );
}
