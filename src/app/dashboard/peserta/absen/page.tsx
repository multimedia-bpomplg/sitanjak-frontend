"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Camera,
  MapPin,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  LogIn,
  LogOut,
  ExternalLink,
  Navigation,
  ShieldCheck,
  X,
  Building2,
  FileText,
  Info,
  CalendarX2,
  Home,
  BookOpen,
} from "lucide-react";
import { showToast } from "@/components/ui/toastDashboard";
import { PesertaDashboardSkeleton } from "@/components/dashboard/skeletons";

/* ================= CONSTANTS & TYPES ================= */

// Koordinat Kantor Balai Besar POM di Palembang (Jl. Pangeran Ratu, 5 Ulu, Seberang Ulu I, Palembang)
const BBPOM_PALEMBANG_COORD = {
  lat: -3.0220638,
  lng: 104.7736571,
  radiusMeters: 200,
  defaultAddress:
    "Balai Besar POM di Palembang, Jl. Pangeran Ratu, 5 Ulu, Kec. Seberang Ulu I, Kota Palembang, Sumatera Selatan 30254",
};

type GpsLocation = {
  lat: number;
  lng: number;
  accuracy: number;
  address: string;
  distanceMeters: number;
  isInsideBpom: boolean;
  lockedAt?: string;
};

type AttendanceTimeStatus =
  | "on_time"
  | "late"
  | "on_time_note"
  | "early_no_note";

type AttendanceEntry = {
  time?: string;
  timeWIB: string;
  photoPath: string;
  location: GpsLocation;
  timeStatus: AttendanceTimeStatus;
  timeStatusLabel: string;
  keterangan?: string;
  attemptCount?: number;
};

type AttendanceMode = "masuk" | "wfh" | "izin";

type DailyAttendanceRecord = {
  _id?: string;
  date: string;
  attendanceMode?: AttendanceMode;
  izinNote?: string;
  izinSubmittedWIB?: string;
  checkIn?: AttendanceEntry;
  checkOut?: AttendanceEntry;
};

type PesertaProfile = {
  nama: string;
  tanggalMulaiMagang?: string;
  tanggalSelesaiMagang?: string;
  statusMagang?: string;
};

/* ================= HELPERS ================= */

function getNowWIB(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatFullDateID(d: Date): string {
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDateID(dateStr?: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTimeWIB(d: Date): string {
  return (
    d
      .toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/:/g, ".") + " WIB"
  );
}

function evaluateCheckInStatus(
  now: Date,
  checkInLimitTime = "08:00",
): {
  status: AttendanceTimeStatus;
  label: string;
} {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(checkInLimitTime.trim());
  const limitSec = m ? Number(m[1]) * 3600 + Number(m[2]) * 60 : 8 * 3600;
  const currentSec =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const formattedLimit = checkInLimitTime.replace(":", ".");
  const hasTolerance = checkInLimitTime !== "08:00";

  if (currentSec <= limitSec) {
    return {
      status: "on_time",
      label: hasTolerance
        ? `Tepat Waktu (Toleransi ${formattedLimit} WIB)`
        : "Tepat Waktu",
    };
  }
  return {
    status: "late",
    label: hasTolerance
      ? `Terlambat (> ${formattedLimit})`
      : "Terlambat (> 08.00)",
  };
}

function evaluateCheckOutStatus(
  now: Date,
  hasNote: boolean,
): {
  status: AttendanceTimeStatus;
  label: string;
} {
  const currentSec =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const limitSec = 16 * 3600;

  if (currentSec >= limitSec) {
    return { status: "on_time", label: "Pulang Tepat Waktu" };
  }
  if (hasNote) {
    return { status: "on_time_note", label: "Tepat Waktu (Dengan Keterangan)" };
  }
  return { status: "early_no_note", label: "Pulang Tidak Tepat Waktu" };
}

function getTimeStatusBadgeStyle(status?: AttendanceTimeStatus) {
  switch (status) {
    case "on_time":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
    case "on_time_note":
      return "bg-blue-50 text-[#1D64F2] border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800";
    case "late":
    case "early_no_note":
      return "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
  }
}

function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function formatDistanceLabel(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

function getAbsensiPhotoUrl(photoPath?: string): string {
  if (!photoPath) return "";
  if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
    return photoPath;
  }
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const cleanBase = baseUrl.replace(/\/$/, "");
  const cleanPath = photoPath.startsWith("/") ? photoPath.slice(1) : photoPath;
  return `${cleanBase}/${cleanPath}`;
}

const MAX_ABSEN_PHOTO_BYTES = 100 * 1024; // Maksimal 100 KB per foto

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Gagal mengonversi gambar"));
      },
      "image/jpeg",
      quality,
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Gagal membaca blob gambar"));
    reader.readAsDataURL(blob);
  });
}

// Kompresi otomatis bertingkat agar ukuran foto wajah pasti <= 100 KB
async function compressCanvasToMaxSize(
  sourceCanvas: HTMLCanvasElement,
  maxBytes = MAX_ABSEN_PHOTO_BYTES,
): Promise<{ blob: Blob; dataUrl: string; sizeKb: number }> {
  const qualities = [0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.22];
  let workingCanvas = sourceCanvas;

  for (let pass = 0; pass < 3; pass++) {
    for (const q of qualities) {
      const blob = await canvasToBlob(workingCanvas, q);
      if (blob.size <= maxBytes) {
        const dataUrl = await blobToDataUrl(blob);
        return {
          blob,
          dataUrl,
          sizeKb: Math.max(1, Math.round(blob.size / 1024)),
        };
      }
    }

    // Jika masih > 100 KB, perkecil dimensi canvas 80% lalu ulangi kompresi
    const downCanvas = document.createElement("canvas");
    downCanvas.width = Math.max(320, Math.round(workingCanvas.width * 0.8));
    downCanvas.height = Math.max(320, Math.round(workingCanvas.height * 0.8));
    const downCtx = downCanvas.getContext("2d");
    if (!downCtx) break;
    downCtx.drawImage(
      workingCanvas,
      0,
      0,
      downCanvas.width,
      downCanvas.height,
    );
    workingCanvas = downCanvas;
  }

  const fallbackBlob = await canvasToBlob(workingCanvas, 0.25);
  const dataUrl = await blobToDataUrl(fallbackBlob);
  return {
    blob: fallbackBlob,
    dataUrl,
    sizeKb: Math.max(1, Math.round(fallbackBlob.size / 1024)),
  };
}

export default function AbsenPesertaPage() {
  const todayWIB = useMemo(() => getNowWIB(), []);
  const todayIso = useMemo(() => toIsoDate(todayWIB), [todayWIB]);

  const [loadingPage, setLoadingPage] = useState(true);
  const [pesertaProfile, setPesertaProfile] = useState<PesertaProfile>({
    nama: "Peserta Magang",
  });
  const [record, setRecord] = useState<DailyAttendanceRecord>({
    date: todayIso,
  });
  const [holidayInfo, setHolidayInfo] = useState<{
    isHoliday: boolean;
    isWorkdayOverride?: boolean;
    reason?: string;
  }>({ isHoliday: false });
  const [todayTolerance, setTodayTolerance] = useState<{
    date: string;
    checkInLimitTime: string;
    reason: string;
  } | null>(null);

  // Attendance mode & Izin state
  const [selectedMode, setSelectedMode] = useState<AttendanceMode>("masuk");
  const [izinNote, setIzinNote] = useState("");

  // Logbook status today (prerequisite for Check-Out)
  const [hasFilledLogbookToday, setHasFilledLogbookToday] = useState(false);

  // Allow repeating Check-Out even after Check-Out is already submitted
  const [isRepeatingCheckOut, setIsRepeatingCheckOut] = useState(false);

  // Check-Out note state
  const [useCheckOutNote, setUseCheckOutNote] = useState(false);
  const [checkOutNote, setCheckOutNote] = useState("");

  // GPS state
  const [gpsLocation, setGpsLocation] = useState<GpsLocation | null>(null);
  const [loadingGps, setLoadingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedSizeKb, setCapturedSizeKb] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewModalPhoto, setPreviewModalPhoto] = useState<string | null>(
    null,
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isPastCutoff, setIsPastCutoff] = useState<boolean>(() => {
    const now = getNowWIB();
    return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() > 23 * 3600;
  });

  useEffect(() => {
    const checkCutoff = () => {
      const now = getNowWIB();
      setIsPastCutoff(
        now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() > 23 * 3600,
      );
    };
    const interval = setInterval(checkCutoff, 30000);
    return () => clearInterval(interval);
  }, []);

  const isWeekend = useMemo(() => {
    const day = todayWIB.getDay();
    return day === 0 || day === 6; // Minggu (0) atau Sabtu (6)
  }, [todayWIB]);

  const holidayReasonLabel = useMemo(() => {
    if (holidayInfo.reason) return holidayInfo.reason;
    const day = todayWIB.getDay();
    if (day === 0) return "Hari Minggu";
    if (day === 6) return "Hari Sabtu";
    return "Hari Libur";
  }, [holidayInfo.reason, todayWIB]);

  const isHolidayToday = holidayInfo.isWorkdayOverride
    ? false
    : isWeekend || holidayInfo.isHoliday;

  // Validate active internship period strictly
  const internshipPeriodStatus = useMemo(() => {
    if (
      pesertaProfile.statusMagang === "Selesai Magang" ||
      pesertaProfile.statusMagang === "Tidak Magang"
    ) {
      return { isActive: false, reason: "ended" as const };
    }
    if (
      !pesertaProfile.tanggalMulaiMagang ||
      !pesertaProfile.tanggalSelesaiMagang
    ) {
      return { isActive: true, reason: "ok" as const };
    }

    const sRaw = new Date(pesertaProfile.tanggalMulaiMagang);
    const eRaw = new Date(pesertaProfile.tanggalSelesaiMagang);
    if (isNaN(sRaw.getTime()) || isNaN(eRaw.getTime())) {
      return { isActive: true, reason: "ok" as const };
    }

    const startIso = toIsoDate(
      new Date(sRaw.getFullYear(), sRaw.getMonth(), sRaw.getDate()),
    );
    const endIso = toIsoDate(
      new Date(eRaw.getFullYear(), eRaw.getMonth(), eRaw.getDate()),
    );

    if (todayIso < startIso) {
      return { isActive: false, reason: "before_start" as const };
    }
    if (todayIso > endIso) {
      return { isActive: false, reason: "ended" as const };
    }
    return { isActive: true, reason: "ok" as const };
  }, [pesertaProfile, todayIso]);

  // Determine current active step
  const isIzinToday = record.attendanceMode === "izin";
  const activeStep: "check_in" | "check_out" | "completed" = isIzinToday
    ? "completed"
    : !record.checkIn
      ? "check_in"
      : !record.checkOut || isRepeatingCheckOut
        ? "check_out"
        : "completed";

  // Fetch initial participant info & today's attendance from DB
  const fetchAbsensiAndProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoadingPage(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      let email = "";
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        email = payload?.email || "";
      } catch {
        // ignore
      }

      const [absenRes, pendRes, logbookRes, holidayRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/absensi/today`, {
          headers,
        }).catch(() => null),
        email
          ? fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/pendaftaran/cek?email=${encodeURIComponent(email)}`,
              { headers },
            ).catch(() => null)
          : Promise.resolve(null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/logbook/date/${todayIso}`, {
          headers,
        }).catch(() => null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/holidays/check`, {
          headers,
        }).catch(() => null),
      ]);

      let resolvedHoliday = false;
      let resolvedOverride = false;
      let resolvedHolidayReason: string | undefined;
      if (holidayRes && holidayRes.ok) {
        const holData = await holidayRes.json().catch(() => null);
        if (holData && typeof holData.isHoliday === "boolean") {
          resolvedHoliday = holData.isHoliday;
          resolvedOverride = Boolean(holData.isWorkdayOverride);
          resolvedHolidayReason = holData.reason || undefined;
        }
      }

      let isLogbookFilled = false;
      if (logbookRes && logbookRes.ok) {
        isLogbookFilled = true;
      }

      if (absenRes && absenRes.ok) {
        const absenJson = await absenRes.json();
        if (typeof absenJson?.isWorkdayOverride === "boolean" && absenJson.isWorkdayOverride) {
          resolvedOverride = true;
          resolvedHoliday = false;
          resolvedHolidayReason =
            absenJson.holidayReason || resolvedHolidayReason;
        } else if (typeof absenJson?.isHoliday === "boolean" && absenJson.isHoliday) {
          resolvedHoliday = true;
          resolvedHolidayReason =
            absenJson.holidayReason || resolvedHolidayReason;
        }
        if (typeof absenJson?.hasLogbookToday === "boolean") {
          isLogbookFilled = isLogbookFilled || absenJson.hasLogbookToday;
        }
        if (absenJson?.tolerance?.checkInLimitTime) {
          setTodayTolerance(absenJson.tolerance);
        } else {
          setTodayTolerance(null);
        }
        if (absenJson?.absensi) {
          setRecord(absenJson.absensi);
          if (
            absenJson.absensi.attendanceMode === "masuk" ||
            absenJson.absensi.attendanceMode === "wfh" ||
            absenJson.absensi.attendanceMode === "izin"
          ) {
            setSelectedMode(absenJson.absensi.attendanceMode);
          }
        } else {
          setRecord({ date: absenJson?.date || todayIso });
        }
      }

      setHolidayInfo({
        isHoliday: resolvedHoliday,
        isWorkdayOverride: resolvedOverride,
        reason: resolvedHolidayReason,
      });

      setHasFilledLogbookToday(isLogbookFilled);

      if (pendRes && pendRes.ok) {
        const pendJson = await pendRes.json();
        const found = pendJson?.peserta?.find(
          (p: any) => p.email?.toLowerCase() === email.toLowerCase(),
        );
        if (found) {
          setPesertaProfile({
            nama: found.nama || "Peserta Magang",
            tanggalMulaiMagang: found.tanggalMulaiMagang,
            tanggalSelesaiMagang: found.tanggalSelesaiMagang,
            statusMagang: found.statusMagang,
          });
        }
      }
    } catch (err) {
      console.error("Gagal memuat data absensi:", err);
    } finally {
      setLoadingPage(false);
    }
  }, [todayIso]);

  useEffect(() => {
    fetchAbsensiAndProfile();
  }, [fetchAbsensiAndProfile]);

  // Stop camera stream helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Lock GPS Coordinates & Reverse Geocode
  const lockGpsLocation = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGpsError(
        "Perangkat atau browser Anda tidak mendukung sensor lokasi GPS.",
      );
      return;
    }

    setLoadingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy || 15);
        const distanceMeters = calculateDistanceMeters(
          lat,
          lng,
          BBPOM_PALEMBANG_COORD.lat,
          BBPOM_PALEMBANG_COORD.lng,
        );
        const isInsideBpom =
          distanceMeters <= BBPOM_PALEMBANG_COORD.radiusMeters;

        let address = `Koordinat ${lat}, ${lng}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
              headers: { "Accept-Language": "id" },
            },
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.display_name) {
              address = data.display_name;
            }
          }
        } catch {
          // fallback to coordinate string
        }

        setGpsLocation({
          lat,
          lng,
          accuracy,
          address,
          distanceMeters,
          isInsideBpom,
          lockedAt: formatTimeWIB(getNowWIB()),
        });
        setLoadingGps(false);
      },
      (err) => {
        setLoadingGps(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError(
            "Izin lokasi ditolak. Mohon aktifkan izin lokasi (GPS) pada browser Anda untuk melakukan absensi.",
          );
        } else {
          setGpsError(
            "Gagal mengunci titik GPS perangkat. Pastikan GPS aktif lalu klik Segarkan GPS.",
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      },
    );
  }, []);

  useEffect(() => {
    if (
      !loadingPage &&
      internshipPeriodStatus.isActive &&
      !isHolidayToday &&
      !isPastCutoff &&
      selectedMode !== "izin" &&
      activeStep !== "completed"
    ) {
      lockGpsLocation();
    }
  }, [
    loadingPage,
    internshipPeriodStatus.isActive,
    isHolidayToday,
    isPastCutoff,
    selectedMode,
    activeStep,
    lockGpsLocation,
  ]);

  // Start WebRTC front camera
  const startCamera = async () => {
    setCameraError(null);
    setCapturedPhoto(null);
    setCapturedBlob(null);
    setCapturedSizeKb(null);

    try {
      stopCamera();
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch {
      setCameraError(
        "Tidak dapat mengakses kamera. Pastikan izin kamera pada browser sudah diizinkan.",
      );
    }
  };

  // Capture selfie frame onto canvas with official watermark & compress <= 100 KB
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const rawW = video.videoWidth || 640;
    const rawH = video.videoHeight || 640;

    // Batasi sisi terpanjang maksimal 720px agar ringan & tetap jernih
    const maxDim = 720;
    const scale = Math.min(1, maxDim / Math.max(rawW, rawH));
    const width = Math.round(rawW * scale);
    const height = Math.round(rawH * scale);

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror horizontally for natural front-camera selfie
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    // Draw semi-transparent watermark footer on photo
    const barHeight = Math.max(88, Math.round(height * 0.19));
    ctx.fillStyle = "rgba(15, 23, 42, 0.80)";
    ctx.fillRect(0, height - barHeight, width, barHeight);

    const nowWib = getNowWIB();
    const nowTime = formatTimeWIB(nowWib);
    const evalResult =
      activeStep === "check_in"
        ? evaluateCheckInStatus(nowWib, todayTolerance?.checkInLimitTime || "08:00")
        : evaluateCheckOutStatus(
            nowWib,
            useCheckOutNote && checkOutNote.trim().length >= 5,
          );

    const stepTitle =
      activeStep === "check_in"
        ? "ABSEN PAGI (CHECK-IN)"
        : "ABSEN PULANG (CHECK-OUT)";
    const locText = gpsLocation
      ? `GPS: ${gpsLocation.lat}, ${gpsLocation.lng} (${
          gpsLocation.isInsideBpom
            ? "Di Lingkungan BBPOM"
            : `Di Luar BBPOM • ${formatDistanceLabel(gpsLocation.distanceMeters)}`
        })`
      : "GPS: Belum Terkunci";

    ctx.fillStyle =
      evalResult.status === "late" || evalResult.status === "early_no_note"
        ? "#F87171"
        : "#60A5FA";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(
      `${stepTitle} • ${nowTime} [${evalResult.label.toUpperCase()}]`,
      14,
      height - barHeight + 24,
    );

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(
      `${pesertaProfile.nama} • ${formatFullDateID(todayWIB)}`,
      14,
      height - barHeight + 46,
    );

    ctx.fillStyle = "#CBD5E1";
    ctx.font = "11px sans-serif";
    ctx.fillText(locText, 14, height - barHeight + 68);

    try {
      const compressed = await compressCanvasToMaxSize(
        canvas,
        MAX_ABSEN_PHOTO_BYTES,
      );
      setCapturedBlob(compressed.blob);
      setCapturedPhoto(compressed.dataUrl);
      setCapturedSizeKb(compressed.sizeKb);
    } catch {
      showToast.error("Gagal mengompres foto wajah");
    }
    stopCamera();
  };

  // Submit Check-In or Check-Out directly to Backend API
  const handleSubmitAbsen = async () => {
    if (activeStep === "check_out" && !hasFilledLogbookToday) {
      showToast.error(
        "Anda wajib mengisi laporan kegiatan harian (logbook) hari ini terlebih dahulu sebelum absen pulang.",
      );
      return;
    }
    if (!gpsLocation) {
      showToast.error("Titik lokasi GPS wajib dikunci terlebih dahulu");
      return;
    }
    if (
      activeStep === "check_in" &&
      selectedMode === "masuk" &&
      !gpsLocation.isInsideBpom
    ) {
      showToast.error(
        `Lokasi Anda berada di luar radius ${BBPOM_PALEMBANG_COORD.radiusMeters} m kantor BBPOM Palembang (${formatDistanceLabel(gpsLocation.distanceMeters)}). Absen Masuk wajib dilakukan di area kantor.`,
      );
      return;
    }
    if (!capturedPhoto || !capturedBlob) {
      showToast.error("Silakan ambil foto wajah terlebih dahulu");
      return;
    }
    if (
      activeStep === "check_out" &&
      useCheckOutNote &&
      checkOutNote.trim().length < 5
    ) {
      showToast.error("Harap isi alasan/keterangan pulang minimal 5 karakter");
      return;
    }

    setSubmitting(true);
    const isCheckIn = activeStep === "check_in";
    const toastId = showToast.loading(
      isCheckIn
        ? "Mengirim Absen Pagi ke server..."
        : "Mengirim Absen Pulang ke server...",
    );

    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("photo", capturedBlob, `absen-${Date.now()}.jpg`);
      formData.append("lat", String(gpsLocation.lat));
      formData.append("lng", String(gpsLocation.lng));
      formData.append("accuracy", String(gpsLocation.accuracy));
      formData.append("address", gpsLocation.address);

      if (isCheckIn) {
        formData.append(
          "attendanceMode",
          selectedMode === "wfh" ? "wfh" : "masuk",
        );
      }

      if (!isCheckIn && useCheckOutNote && checkOutNote.trim().length >= 5) {
        formData.append("keterangan", checkOutNote.trim());
      }

      const endpoint = isCheckIn
        ? `${process.env.NEXT_PUBLIC_API_URL}/absensi/check-in`
        : `${process.env.NEXT_PUBLIC_API_URL}/absensi/check-out`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Gagal menyimpan absensi");
      }

      if (data?.absensi) {
        setRecord(data.absensi);
      }
      await fetchAbsensiAndProfile();

      setCapturedPhoto(null);
      setCapturedBlob(null);
      setCapturedSizeKb(null);
      setIsRepeatingCheckOut(false);

      showToast.updateSuccess(
        toastId,
        data?.message ||
          (isCheckIn
            ? "Absen Pagi berhasil disimpan ke database! ✅"
            : "Absen Pulang terbaru berhasil disimpan! ✅"),
      );
    } catch (err: any) {
      showToast.updateError(
        toastId,
        err?.message || "Terjadi kesalahan saat menyimpan absensi",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Keterangan Izin (tanpa foto & GPS)
  const handleSubmitIzin = async () => {
    const note = izinNote.trim();
    if (note.length < 5) {
      showToast.error("Keterangan / alasan izin minimal 5 karakter");
      return;
    }

    setSubmitting(true);
    const toastId = showToast.loading("Menyimpan keterangan Izin...");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/absensi/izin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ keterangan: note }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Gagal menyimpan keterangan izin");
      }

      if (data?.absensi) {
        setRecord(data.absensi);
      }
      await fetchAbsensiAndProfile();
      showToast.updateSuccess(
        toastId,
        data?.message || "Keterangan Izin hari ini berhasil disimpan.",
      );
    } catch (err: any) {
      showToast.updateError(
        toastId,
        err?.message || "Terjadi kesalahan saat mengirim keterangan izin",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // [DINONAKTIFKAN] Calibrate to BBPOM Palembang office coordinates (for PC/Laptop whose IP ISP location drifts)
  /*
  const calibrateToBpomOffice = () => {
    setGpsError(null);
    setGpsLocation({
      lat: BBPOM_PALEMBANG_COORD.lat,
      lng: BBPOM_PALEMBANG_COORD.lng,
      accuracy: 10,
      address: BBPOM_PALEMBANG_COORD.defaultAddress,
      distanceMeters: 0,
      isInsideBpom: true,
      lockedAt: formatTimeWIB(getNowWIB()),
    });
    showToast.success(
      "Titik lokasi dikalibrasi ke Kantor BBPOM di Palembang 📍",
    );
  };
  */

  // Build OpenStreetMap embed bbox around locked coordinates
  const mapEmbedUrl = useMemo(() => {
    if (!gpsLocation) return null;
    const delta = 0.0025;
    const bbox = `${gpsLocation.lng - delta}%2C${gpsLocation.lat - delta}%2C${gpsLocation.lng + delta}%2C${gpsLocation.lat + delta}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${gpsLocation.lat}%2C${gpsLocation.lng}`;
  }, [gpsLocation]);

  const currentLiveCheckInEval = evaluateCheckInStatus(
    getNowWIB(),
    todayTolerance?.checkInLimitTime || "08:00",
  );
  const currentLiveCheckOutEval = evaluateCheckOutStatus(
    getNowWIB(),
    useCheckOutNote && checkOutNote.trim().length >= 5,
  );

  if (loadingPage) {
    return <PesertaDashboardSkeleton />;
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ================= 1. HEADER ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white"
            style={{ fontWeight: 800 }}
          >
            Absensi Kehadiran
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
            {formatFullDateID(todayWIB)}
          </p>
        </div>

        {(record.checkIn || isIzinToday) && (
          <span
            className={`px-3.5 py-1.5 rounded-full text-sm font-bold border ${
              isIzinToday
                ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800"
                : record.attendanceMode === "wfh"
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800"
                  : "bg-blue-50 text-[#1D64F2] border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
            }`}
          >
            {isIzinToday
              ? "Status Hari Ini: Izin"
              : record.attendanceMode === "wfh"
                ? "Status Hari Ini: WFH"
                : "Status Hari Ini: Masuk (Kantor)"}
          </span>
        )}
      </div>

      {/* ================= 2. RINGKASAN CHECK-IN & CHECK-OUT / IZIN HARI INI ================= */}
      {isIzinToday ? (
        <div className="rounded-2xl border border-violet-200/90 dark:border-violet-800/70 bg-white dark:bg-slate-800/90 p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p
                  className="text-sm font-bold text-slate-500 dark:text-slate-400"
                  style={{ fontWeight: 600 }}
                >
                  Kehadiran Hari Ini (Izin)
                </p>
                <p
                  className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 tabular-nums"
                  style={{ fontWeight: 800 }}
                >
                  {record.izinSubmittedWIB || "Tercatat"}
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800">
              Izin Tercatat
            </span>
          </div>

          <div className="rounded-xl bg-violet-50/60 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/60 p-3.5 text-sm text-slate-700 dark:text-slate-200">
            <span className="font-bold text-violet-700 dark:text-violet-300 block mb-0.5">
              Keterangan Izin:
            </span>
            <p className="leading-relaxed break-words">{record.izinNote || "-"}</p>
          </div>
        </div>
      ) : isHolidayToday && !record.checkIn ? null : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        {/* Card Check-In Pagi */}
        <div
          className={`rounded-2xl border p-4 sm:p-5 shadow-2xs transition ${
            record.checkIn
              ? "bg-white dark:bg-slate-800/90 border-slate-200/90 dark:border-slate-700/80"
              : internshipPeriodStatus.isActive && activeStep === "check_in"
                ? "bg-white dark:bg-slate-800/90 border-[#1D64F2] ring-2 ring-[#1D64F2]/15"
                : "bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/80"
          }`}
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center shrink-0">
                <LogIn className="w-5 h-5" />
              </div>
              <div>
                <p
                  className="text-sm font-bold text-slate-500 dark:text-slate-400"
                  style={{ fontWeight: 600 }}
                >
                  Absen Pagi (Check-In)
                </p>
                <p
                  className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 tabular-nums"
                  style={{ fontWeight: 800 }}
                >
                  {record.checkIn ? record.checkIn.timeWIB : "--.-- WIB"}
                </p>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${
                record.checkIn
                  ? getTimeStatusBadgeStyle(record.checkIn.timeStatus)
                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
              }`}
            >
              {record.checkIn ? record.checkIn.timeStatusLabel : "Belum Absen"}
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/70 text-sm text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                {record.checkIn
                  ? record.checkIn.location.isInsideBpom
                    ? "Di Lingkungan BBPOM Palembang"
                    : `Di Luar BBPOM (${formatDistanceLabel(record.checkIn.location.distanceMeters)})`
                  : "Batas masuk tepat waktu: 08.00 WIB"}
              </span>
            </div>
          </div>
        </div>

        {/* Card Check-Out Pulang */}
        <div
          className={`rounded-2xl border p-4 sm:p-5 shadow-2xs transition ${
            record.checkOut && !isRepeatingCheckOut
              ? "bg-white dark:bg-slate-800/90 border-slate-200/90 dark:border-slate-700/80"
              : internshipPeriodStatus.isActive && activeStep === "check_out"
                ? "bg-white dark:bg-slate-800/90 border-[#1D64F2] ring-2 ring-[#1D64F2]/15"
                : "bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/80"
          }`}
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <p
                  className="text-sm font-bold text-slate-500 dark:text-slate-400"
                  style={{ fontWeight: 600 }}
                >
                  Absen Pulang (Check-Out)
                </p>
                <p
                  className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 tabular-nums"
                  style={{ fontWeight: 800 }}
                >
                  {record.checkOut ? record.checkOut.timeWIB : "--.-- WIB"}
                </p>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${
                record.checkOut
                  ? getTimeStatusBadgeStyle(record.checkOut.timeStatus)
                  : activeStep === "check_out" && !hasFilledLogbookToday
                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                    : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
              }`}
            >
              {record.checkOut
                ? record.checkOut.timeStatusLabel
                : activeStep === "check_out" && !hasFilledLogbookToday
                  ? "Wajib Logbook Dulu"
                  : "Belum Absen"}
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/70 text-sm text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                {record.checkOut
                  ? record.checkOut.location.isInsideBpom
                    ? "Di Lingkungan BBPOM Palembang"
                    : `Di Luar BBPOM (${formatDistanceLabel(record.checkOut.location.distanceMeters)})`
                  : activeStep === "check_out" && !hasFilledLogbookToday
                    ? "Isi laporan harian agar dapat check-out"
                    : "Jadwal pulang: 16.00 WIB"}
              </span>
            </div>

            {internshipPeriodStatus.isActive &&
              !isHolidayToday &&
              !isPastCutoff &&
              activeStep === "check_out" &&
              !hasFilledLogbookToday && (
                <Link
                  href="/dashboard/peserta/isi-logbook"
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline shrink-0 flex items-center gap-1"
                >
                  <span>Isi Logbook</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}

            {internshipPeriodStatus.isActive &&
              !isHolidayToday &&
              !isPastCutoff &&
              record.checkOut &&
              !isRepeatingCheckOut && (
                <button
                  type="button"
                  onClick={() => {
                    setUseCheckOutNote(Boolean(record.checkOut?.keterangan));
                    setCheckOutNote(record.checkOut?.keterangan || "");
                    setIsRepeatingCheckOut(true);
                  }}
                  className="text-xs font-bold text-[#1D64F2] hover:underline shrink-0"
                >
                  Absen Ulang
                </button>
              )}
          </div>
        </div>
      </div>
      )}

      {/* ================= JIKA DI LUAR MASA MAGANG AKTIF ================= */}
      {!internshipPeriodStatus.isActive ? (
        <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-6 sm:p-8 text-center shadow-2xs space-y-3">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 dark:bg-slate-700/70 text-slate-500 dark:text-slate-300 flex items-center justify-center mx-auto">
            <CalendarX2 className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="space-y-1">
            <h2
              className="text-lg font-extrabold text-slate-900 dark:text-white"
              style={{ fontWeight: 800 }}
            >
              {internshipPeriodStatus.reason === "before_start"
                ? "Periode Magang Belum Dimulai"
                : "Masa Magang Telah Selesai"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {internshipPeriodStatus.reason === "before_start"
                ? `Fitur absensi akan aktif otomatis mulai tanggal ${formatShortDateID(
                    pesertaProfile.tanggalMulaiMagang,
                  )}.`
                : `Periode magang Anda (${formatShortDateID(
                    pesertaProfile.tanggalMulaiMagang,
                  )} – ${formatShortDateID(
                    pesertaProfile.tanggalSelesaiMagang,
                  )}) telah berakhir. Absensi hanya tersedia bagi peserta magang aktif.`}
            </p>
          </div>
        </div>
      ) : isHolidayToday ? (
        <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-6 sm:p-8 text-center shadow-2xs space-y-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center mx-auto">
            <CalendarX2 className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="space-y-1.5">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600">
              {holidayReasonLabel}
            </span>
            <h2
              className="text-lg font-extrabold text-slate-900 dark:text-white pt-1"
              style={{ fontWeight: 800 }}
            >
              Hari Ini Adalah Hari Libur
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Hari ini ({holidayReasonLabel}) termasuk jadwal libur sehingga Anda tidak perlu melakukan Check-In, Check-Out, maupun pengajuan Izin.
            </p>
          </div>
          <div className="pt-1">
            <Link
              href="/dashboard/peserta"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white transition"
            >
              <Home className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        </div>
      ) : isPastCutoff && activeStep !== "completed" ? (
        <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-6 sm:p-8 text-center shadow-2xs space-y-3">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="space-y-1">
            <h2
              className="text-lg font-extrabold text-slate-900 dark:text-white"
              style={{ fontWeight: 800 }}
            >
              Batas Waktu Pengisian Hari Ini Berakhir
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Pengisian absensi harian dibuka maksimal sampai pukul 23.00 WIB. Silakan lakukan absensi kembali besok.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* ================= TOMBOL ABSEN PULANG ULANG (JIKA SUDAH CHECK-OUT) ================= */}
          {activeStep === "completed" && record.checkOut && (
            <div className="rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1D64F2] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <p
                    className="text-base font-bold text-slate-900 dark:text-white"
                    style={{ fontWeight: 700 }}
                  >
                    Ingin Memperbarui Absen Pulang?
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    Absen pulang dapat diulang. Sistem otomatis menyimpan dan
                    menggunakan data <b>absen pulang terakhir</b> Anda
                    {record.checkOut.attemptCount &&
                    record.checkOut.attemptCount > 1
                      ? ` (Tercatat telah diperbarui ${record.checkOut.attemptCount}x)`
                      : "."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUseCheckOutNote(Boolean(record.checkOut?.keterangan));
                  setCheckOutNote(record.checkOut?.keterangan || "");
                  setIsRepeatingCheckOut(true);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#1D64F2] hover:bg-blue-700 text-white text-sm font-bold shrink-0 transition shadow-2xs"
              >
                Absen Pulang Ulang
              </button>
            </div>
          )}

          {/* ================= 3. FORM ABSEN AKTIF ================= */}
          {activeStep !== "completed" && (
            <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-6 shadow-2xs space-y-5 sm:space-y-6">
              {/* Step Banner */}
              <div className="flex items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-700/70">
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5 sm:mt-0 ${
                      activeStep === "check_in" && selectedMode === "izin"
                        ? "bg-violet-600"
                        : activeStep === "check_in" && selectedMode === "wfh"
                          ? "bg-indigo-600"
                          : "bg-[#1D64F2]"
                    }`}
                  >
                    {activeStep === "check_in" && selectedMode === "izin" ? (
                      <FileText className="w-5 h-5" />
                    ) : activeStep === "check_in" && selectedMode === "wfh" ? (
                      <Home className="w-5 h-5" />
                    ) : activeStep === "check_in" ? (
                      <LogIn className="w-5 h-5" />
                    ) : (
                      <LogOut className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h2
                      className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug"
                      style={{ fontWeight: 800 }}
                    >
                      {activeStep === "check_in"
                        ? selectedMode === "izin"
                          ? "Form Pengajuan Izin Hari Ini"
                          : selectedMode === "wfh"
                            ? "Form Absen Pagi (WFH)"
                            : "Form Absen Pagi (Check-In)"
                        : isRepeatingCheckOut
                          ? `Perbarui Absen Pulang${record.attendanceMode === "wfh" ? " (WFH)" : ""}`
                          : `Form Absen Pulang${record.attendanceMode === "wfh" ? " (WFH)" : " (Check-Out)"}`}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {activeStep === "check_in"
                        ? selectedMode === "izin"
                          ? "Tidak perlu mengambil foto dan lokasi GPS. Cukup isi keterangan izin Anda hari ini."
                          : selectedMode === "wfh"
                            ? "Mode WFH tetap wajib melakukan Check-In & Check-Out seperti biasa (batas tepat waktu 08.00 WIB)."
                            : "Batas masuk tepat waktu pukul 08.00 WIB. Lewat dari 08.00 WIB terhitung terlambat."
                        : "Jadwal pulang pukul 16.00 WIB. Absen pulang dapat diulang dan diambil data terakhir."}
                    </p>
                  </div>
                </div>

                {isRepeatingCheckOut ? (
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setCapturedPhoto(null);
                      setIsRepeatingCheckOut(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0 transition"
                  >
                    Batal
                  </button>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#1D64F2] border border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 shrink-0">
                    {activeStep === "check_in"
                      ? selectedMode === "izin"
                        ? "Izin"
                        : "Tahap 1/2"
                      : "Tahap 2/2"}
                  </span>
                )}
              </div>

              {/* PILIHAN STATUS KEHADIRAN (MASUK / WFH / IZIN) SEBELUM CHECK-IN */}
              {activeStep === "check_in" && (
                <div className="space-y-2.5">
                  <label
                    className="text-base font-bold text-slate-900 dark:text-white block"
                    style={{ fontWeight: 700 }}
                  >
                    Pilih Jenis Kehadiran Hari Ini
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedMode("masuk")}
                      className={`p-3.5 rounded-xl border text-left transition ${
                        selectedMode === "masuk"
                          ? "border-2 border-[#1D64F2] bg-blue-50/70 dark:bg-blue-950/50 text-[#1D64F2] dark:text-blue-300"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Building2 className="w-4 h-4 shrink-0" />
                        <span>Masuk (Kantor)</span>
                      </div>
                      <p className="text-xs opacity-80 mt-1">
                        Hadir di BBPOM, wajib foto &amp; lokasi GPS masuk/pulang.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedMode("wfh")}
                      className={`p-3.5 rounded-xl border text-left transition ${
                        selectedMode === "wfh"
                          ? "border-2 border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Home className="w-4 h-4 shrink-0" />
                        <span>WFH</span>
                      </div>
                      <p className="text-xs opacity-80 mt-1">
                        Tetap wajib absen foto &amp; lokasi, tercatat sebagai WFH.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        stopCamera();
                        setSelectedMode("izin");
                      }}
                      className={`p-3.5 rounded-xl border text-left transition ${
                        selectedMode === "izin"
                          ? "border-2 border-violet-600 bg-violet-50/70 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <FileText className="w-4 h-4 shrink-0" />
                        <span>Izin</span>
                      </div>
                      <p className="text-xs opacity-80 mt-1">
                        Tidak perlu foto &amp; GPS, cukup isi keterangan izin saja.
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* JIKA MEMILIH IZIN -> FORM KETERANGAN IZIN SAJA */}
              {activeStep === "check_in" && selectedMode === "izin" ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-violet-200 dark:border-violet-800/70 bg-violet-50/60 dark:bg-violet-950/30 p-4 space-y-2.5">
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                      Keterangan / Alasan Izin Hari Ini{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={izinNote}
                      onChange={(e) => setIzinNote(e.target.value)}
                      rows={3}
                      placeholder="Contoh: Izin sakit / urusan keluarga / kegiatan akademik kampus atas sepengetahuan pembimbing..."
                      className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Minimal 5 karakter. Setelah dikirim, Anda tidak perlu Check-In maupun Check-Out hari ini.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={submitting || izinNote.trim().length < 5}
                    onClick={handleSubmitIzin}
                    className="w-full py-3.5 px-5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-base font-extrabold shadow-xs transition flex items-center justify-center gap-2"
                    style={{ fontWeight: 800 }}
                  >
                    <FileText className="w-5 h-5" />
                    <span>
                      {submitting ? "Menyimpan Izin..." : "Kirim Keterangan Izin"}
                    </span>
                  </button>
                </div>
              ) : activeStep === "check_out" && !hasFilledLogbookToday ? (
                /* KETERANGAN WAJIB ISI LOGBOOK DULU SEBELUM ABSEN PULANG */
                <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-700/80 bg-gradient-to-br from-amber-50/90 via-white to-amber-50/50 dark:from-amber-950/40 dark:via-slate-800 dark:to-amber-950/20 p-6 sm:p-8 text-center space-y-4 shadow-2xs">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs ring-4 ring-amber-100/70 dark:ring-amber-900/40">
                    <BookOpen className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>

                  <div className="space-y-2 max-w-md mx-auto">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-300 inline-block">
                      Prasyarat Absen Pulang
                    </span>
                    <h3
                      className="text-lg font-extrabold text-slate-900 dark:text-white"
                      style={{ fontWeight: 800 }}
                    >
                      Wajib Mengisi Logbook Terlebih Dahulu
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Anda belum mengisi laporan kegiatan harian (logbook) hari ini.
                      Sesuai ketentuan, Anda wajib melengkapi dan menyimpan logbook hari ini terlebih dahulu agar form Absen Pulang terbuka.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                    <Link
                      href="/dashboard/peserta/isi-logbook"
                      className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1D64F2] hover:bg-blue-700 text-white text-sm font-extrabold transition shadow-xs"
                      style={{ fontWeight: 800 }}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Isi Logbook Hari Ini</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => fetchAbsensiAndProfile()}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold transition shadow-2xs"
                    >
                      <RefreshCw className="w-4 h-4 text-[#1D64F2]" />
                      <span>Cek Status</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* INFO BANNER WFH JIKA MODE WFH */}
                  {(selectedMode === "wfh" || record.attendanceMode === "wfh") && (
                    <div className="rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/70 p-3.5 text-sm text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
                      <Home className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <span>
                        <b>Mode WFH Aktif:</b> Hari ini Anda tercatat bekerja dari rumah (WFH). Tetap lakukan foto wajah dan kunci lokasi saat Check-In maupun Check-Out.
                      </span>
                    </div>
                  )}

                  {/* INFO BANNER TOLERANSI JAM MASUK HARIAN */}
                  {activeStep === "check_in" && todayTolerance && (
                    <div className="rounded-xl bg-sky-50/90 dark:bg-sky-950/40 border border-sky-200/90 dark:border-sky-800/70 p-3.5 text-sm text-sky-900 dark:text-sky-200 flex items-start gap-2.5">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#1D64F2] dark:text-sky-400 shrink-0 mt-0.5" />
                      <span>
                        <b>Toleransi Jam Masuk Hari Ini:</b> Batas Check-In tepat waktu diperpanjang hingga{" "}
                        <b>{todayTolerance.checkInLimitTime.replace(":", ".")} WIB</b>{" "}
                        ({todayTolerance.reason}).
                      </span>
                    </div>
                  )}

                  {/* INFO ATURAN JAM ABSEN REAL-TIME */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start sm:items-center gap-2.5 text-sm text-slate-700 dark:text-slate-200">
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 text-[#1D64F2] shrink-0 mt-0.5 sm:mt-0" />
                  <span>
                    {activeStep === "check_in"
                      ? "Status waktu Check-In Anda saat ini:"
                      : "Status waktu Check-Out Anda saat ini:"}
                  </span>
                </div>

                <span
                  className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold border ${getTimeStatusBadgeStyle(
                    activeStep === "check_in"
                      ? currentLiveCheckInEval.status
                      : currentLiveCheckOutEval.status,
                  )}`}
                >
                  {activeStep === "check_in"
                    ? currentLiveCheckInEval.label
                    : currentLiveCheckOutEval.label}
                </span>
              </div>

              {/* KHUSUS CHECK-OUT: PILIHAN PULANG DENGAN KETERANGAN */}
              {activeStep === "check_out" && (
                <div className="space-y-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 p-4">
                  <label
                    className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2"
                    style={{ fontWeight: 700 }}
                  >
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#1D64F2] shrink-0" />
                    <span>Kategori Absen Pulang</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setUseCheckOutNote(false)}
                      className={`p-3.5 rounded-xl border text-left transition ${
                        !useCheckOutNote
                          ? "border-2 border-[#1D64F2] bg-blue-50/70 dark:bg-blue-950/50 text-[#1D64F2] dark:text-blue-300"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <p
                        className="text-sm font-bold"
                        style={{ fontWeight: 700 }}
                      >
                        Pulang Reguler (Tanpa Keterangan)
                      </p>
                      <p className="text-xs opacity-80 mt-0.5">
                        Tepat waktu jika absen pukul 16.00 WIB atau lebih
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUseCheckOutNote(true)}
                      className={`p-3.5 rounded-xl border text-left transition ${
                        useCheckOutNote
                          ? "border-2 border-[#1D64F2] bg-blue-50/70 dark:bg-blue-950/50 text-[#1D64F2] dark:text-blue-300"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <p
                        className="text-sm font-bold"
                        style={{ fontWeight: 700 }}
                      >
                        Pulang dengan Keterangan / Izin
                      </p>
                      <p className="text-xs opacity-80 mt-0.5">
                        Tetap dihitung tepat waktu meski pulang sebelum 16.00
                        WIB
                      </p>
                    </button>
                  </div>

                  {useCheckOutNote && (
                    <div className="pt-1 space-y-1.5">
                      <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                        Keterangan / Alasan Pulang{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={checkOutNote}
                        onChange={(e) => setCheckOutNote(e.target.value)}
                        rows={2}
                        placeholder="Contoh: Izin pulang lebih awal karena bimbingan skripsi / kegiatan kampus atas izin Mentor..."
                        className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#1D64F2] focus:ring-2 focus:ring-[#1D64F2]/20"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* STEP A: TITIK LOKASI MAPS TERKUNCI */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label
                    className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2"
                    style={{ fontWeight: 700 }}
                  >
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#1D64F2] shrink-0" />
                    <span>1. Titik Lokasi Anda</span>
                  </label>

                  <button
                    type="button"
                    onClick={lockGpsLocation}
                    disabled={loadingGps}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-sm font-bold text-slate-700 dark:text-slate-200 transition disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 text-[#1D64F2] ${
                        loadingGps ? "animate-spin" : ""
                      }`}
                    />
                    <span>{loadingGps ? "Memuat..." : "Segarkan GPS"}</span>
                  </button>
                </div>

                {gpsError ? (
                  <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/70 p-4 text-sm text-red-700 dark:text-red-300 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="space-y-2.5">
                      <p className="font-semibold leading-relaxed">
                        {gpsError}
                      </p>
                      <button
                        type="button"
                        onClick={lockGpsLocation}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition"
                      >
                        Coba Kunci Ulang Lokasi
                      </button>
                    </div>
                  </div>
                ) : loadingGps && !gpsLocation ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 h-52 flex flex-col items-center justify-center gap-2.5 p-4 text-center text-sm text-slate-500">
                    <Navigation className="w-6 h-6 text-[#1D64F2] animate-pulse" />
                    <span>Mengunci titik koordinat GPS perangkat Anda...</span>
                  </div>
                ) : gpsLocation ? (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50/70 dark:bg-slate-900/60">
                    {/* Locked Map View (non-draggable pin) */}
                    <div className="relative h-48 sm:h-56 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      {mapEmbedUrl && (
                        <iframe
                          title="Titik Lokasi Absen Terkunci"
                          src={mapEmbedUrl}
                          className="w-full h-full border-0 pointer-events-none select-none"
                        />
                      )}

                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/80 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs shadow-xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>
                          Pin Maps Terkunci (±{gpsLocation.accuracy}m)
                        </span>
                      </div>
                    </div>

                    {/* Location Metadata Details */}
                    <div className="p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
                            gpsLocation.isInsideBpom
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                              : activeStep === "check_in" && selectedMode === "masuk"
                                ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                                : "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                          }`}
                        >
                          <Building2 className="w-4 h-4 shrink-0" />
                          <span>
                            {gpsLocation.isInsideBpom
                              ? "Di Lingkungan BBPOM Palembang"
                              : `Di Luar Area BBPOM (${formatDistanceLabel(gpsLocation.distanceMeters)})`}
                          </span>
                        </span>

                        <a
                          href={`https://www.google.com/maps?q=${gpsLocation.lat},${gpsLocation.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-bold text-[#1D64F2] hover:underline"
                        >
                          <span>Buka Google Maps</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          Alamat Terdeteksi:
                        </p>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed break-words">
                          {gpsLocation.address}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                        <span>
                          Koordinat:{" "}
                          <b className="text-slate-800 dark:text-slate-200 tabular-nums">
                            {gpsLocation.lat}, {gpsLocation.lng}
                          </b>
                        </span>
                        <span>
                          Jarak ke BBPOM:{" "}
                          <b className="text-slate-800 dark:text-slate-200">
                            {formatDistanceLabel(gpsLocation.distanceMeters)}
                          </b>
                        </span>
                      </div>

                      {activeStep === "check_in" &&
                        selectedMode === "masuk" &&
                        !gpsLocation.isInsideBpom && (
                          <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 p-3.5 flex items-start gap-2.5 text-sm text-rose-800 dark:text-rose-200">
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            <p className="leading-relaxed">
                              <b>Absen Masuk diblokir:</b> Koordinat Anda berada
                              di luar batas radius{" "}
                              <b>{BBPOM_PALEMBANG_COORD.radiusMeters} m</b> dari
                              kantor BBPOM Palembang (
                              {formatDistanceLabel(gpsLocation.distanceMeters)}
                              ). Silakan menuju area kantor lalu klik{" "}
                              <b>Segarkan GPS</b>, atau pilih mode <b>WFH</b>{" "}
                              bila sedang bekerja dari luar kantor.
                            </p>
                          </div>
                        )}

                      {/* [DINONAKTIFKAN] Fitur Set Titik Kantor BBPOM untuk kalibrasi PC/Laptop */}
                      {/* {!gpsLocation.isInsideBpom &&
                        selectedMode === "masuk" &&
                        record.attendanceMode !== "wfh" && (
                        <div className="pt-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/70 p-3.5">
                            <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                              <b>Membuka dari Laptop/PC di Kantor BBPOM?</b>{" "}
                              Browser komputer menggunakan lokasi IP provider
                              internet sehingga titik dapat meleset.
                            </p>
                            <button
                              type="button"
                              onClick={calibrateToBpomOffice}
                              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#1D64F2] hover:bg-blue-700 text-white text-sm font-bold shrink-0 transition shadow-2xs"
                            >
                              Set Titik Kantor BBPOM
                            </button>
                          </div>
                        </div>
                      )} */}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* STEP B: KAMERA SWAFOTO WAJAH */}
              <div className="space-y-3">
                <label
                  className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2"
                  style={{ fontWeight: 700 }}
                >
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-[#1D64F2] shrink-0" />
                  <span>2. Ambil Foto Wajah</span>
                </label>

                <canvas ref={canvasRef} className="hidden" />

                {cameraError && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/70 p-3.5 text-sm text-red-700 dark:text-red-300 flex items-center gap-2.5">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                )}

                {capturedPhoto ? (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 aspect-3/4 sm:aspect-4/3 max-h-96 mx-auto">
                      <img
                        src={capturedPhoto}
                        alt="Hasil Foto Wajah Absen"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          Foto Wajah Siap
                          {capturedSizeKb ? ` (${capturedSizeKb} KB)` : ""}
                        </span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={startCamera}
                      className="w-full sm:w-auto mx-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-sm font-bold text-slate-700 dark:text-slate-200 transition"
                    >
                      <RefreshCw className="w-4 h-4 text-[#1D64F2]" />
                      <span>Ambil Ulang Foto</span>
                    </button>
                  </div>
                ) : cameraActive ? (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden border-2 border-[#1D64F2] bg-slate-950 aspect-3/4 sm:aspect-4/3 max-h-96 mx-auto">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover -scale-x-100"
                      />

                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-48 h-60 sm:w-52 sm:h-64 rounded-full border-2 border-dashed border-white/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.3)]" />
                      </div>

                      <div className="absolute bottom-3 inset-x-3 text-center pointer-events-none">
                        <span className="inline-block px-3.5 py-1.5 rounded-full bg-slate-900/80 text-white text-xs font-semibold">
                          Posisikan wajah di dalam garis lingkaran
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-2.5">
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 transition"
                      >
                        Matikan Kamera
                      </button>
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#1D64F2] hover:bg-blue-700 text-white text-sm font-bold shadow-xs transition"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Ambil Foto Sekarang</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 p-6 sm:p-8 text-center space-y-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center mx-auto">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <p
                        className="text-base font-bold text-slate-900 dark:text-white"
                        style={{ fontWeight: 700 }}
                      >
                        Kamera Swafoto Wajah
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Ambil foto wajah secara langsung. Foto otomatis diberi
                        stempel jam WIB dan titik koordinat GPS Anda.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#1D64F2] hover:bg-blue-700 text-white text-sm font-bold shadow-xs transition"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Buka Kamera Wajah</span>
                    </button>
                  </div>
                )}
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={
                    !gpsLocation ||
                    !capturedPhoto ||
                    submitting ||
                    (activeStep === "check_in" &&
                      selectedMode === "masuk" &&
                      !gpsLocation.isInsideBpom) ||
                    (activeStep === "check_out" &&
                      useCheckOutNote &&
                      checkOutNote.trim().length < 5)
                  }
                  onClick={handleSubmitAbsen}
                  className="w-full py-3.5 px-5 rounded-xl bg-[#1D64F2] hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-base font-extrabold shadow-xs transition flex items-center justify-center gap-2"
                  style={{ fontWeight: 800 }}
                >
                  {activeStep === "check_in" ? (
                    <LogIn className="w-5 h-5" />
                  ) : (
                    <LogOut className="w-5 h-5" />
                  )}
                  <span>
                    {submitting
                      ? "Menyimpan ke Database..."
                      : activeStep === "check_in"
                        ? selectedMode === "wfh"
                          ? "Kirim Absen Pagi (WFH)"
                          : "Kirim Absen Pagi (Check-In)"
                        : isRepeatingCheckOut
                          ? "Simpan Pembaruan Absen Pulang (Terakhir)"
                          : "Kirim Absen Pulang (Check-Out)"}
                  </span>
                </button>
              </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* ================= 4. BUKTI REKAMAN ABSEN HARI INI (DARI DATABASE) ================= */}
      {(record.checkIn || record.checkOut) && !isIzinToday && (
        <div className="space-y-3.5 pt-1">
          <h2
            className="text-lg font-extrabold text-slate-900 dark:text-white"
            style={{ fontWeight: 800 }}
          >
            Rekaman Bukti Absen Hari Ini
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                label: "Absen Pagi (Check-In)",
                data: record.checkIn,
              },
              {
                label: "Absen Pulang (Check-Out Terakhir)",
                data: record.checkOut,
              },
            ].map((item) => {
              if (!item.data) return null;
              const {
                timeWIB,
                photoPath,
                location,
                timeStatus,
                timeStatusLabel,
                keterangan,
              } = item.data;
              const photoUrl = getAbsensiPhotoUrl(photoPath);

              return (
                <div
                  key={item.label}
                  className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-5 shadow-2xs space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className="text-base font-bold text-slate-900 dark:text-white block"
                        style={{ fontWeight: 700 }}
                      >
                        {item.label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{timeWIB}</span>
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${getTimeStatusBadgeStyle(
                        timeStatus,
                      )}`}
                    >
                      {timeStatusLabel}
                    </span>
                  </div>

                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewModalPhoto(photoUrl)}
                      className="w-full h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 block"
                    >
                      <img
                        src={photoUrl}
                        alt={item.label}
                        className="w-full h-full object-cover hover:scale-105 transition"
                      />
                    </button>
                  )}

                  {keterangan && (
                    <div className="rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/70 p-3 text-sm text-slate-700 dark:text-slate-200">
                      <span className="font-bold text-[#1D64F2] dark:text-blue-400 block mb-0.5">
                        Keterangan Pulang:
                      </span>
                      <p className="leading-relaxed break-words">{keterangan}</p>
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">Status Area:</span>
                      <span
                        className={`font-bold ${
                          location.isInsideBpom
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {location.isInsideBpom
                          ? "Di Lingkungan BBPOM"
                          : `Di Luar BBPOM (${formatDistanceLabel(location.distanceMeters)})`}
                      </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {location.address}
                    </p>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/70 flex items-center justify-between text-xs text-slate-500">
                      <span className="tabular-nums font-medium">
                        {location.lat}, {location.lng}
                      </span>
                      <a
                        href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-[#1D64F2] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Lihat Maps</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= MODAL PREVIEW FOTO BUKTI ================= */}
      {previewModalPhoto && (
        <div
          onClick={() => setPreviewModalPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full"
          >
            <button
              type="button"
              onClick={() => setPreviewModalPhoto(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewModalPhoto}
              alt="Preview Bukti Foto Absen"
              className="w-full max-h-[82vh] object-contain rounded-2xl border border-white/15"
            />
          </div>
        </div>
      )}
    </div>
  );
}
