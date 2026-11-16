"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  RotateCcw,
  X,
  Building2,
  FileText,
  Info,
} from "lucide-react";
import { showToast } from "@/components/ui/toastDashboard";

/* ================= CONSTANTS & TYPES ================= */

// Koordinat Kantor Balai Besar POM di Palembang (Jl. Pangeran Ratu, 5 Ulu, Seberang Ulu I, Palembang)
const BBPOM_PALEMBANG_COORD = {
  lat: -3.012694,
  lng: 104.774716,
  radiusMeters: 400,
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
  lockedAt: string;
};

type AttendanceTimeStatus =
  | "on_time"
  | "late"
  | "on_time_note"
  | "early_no_note";

type AttendanceEntry = {
  type: "check_in" | "check_out";
  timeWIB: string;
  photoDataUrl: string;
  location: GpsLocation;
  timeStatus: AttendanceTimeStatus;
  timeStatusLabel: string;
  keterangan?: string;
  attemptCount?: number;
};

type DailyAttendanceRecord = {
  dateIso: string;
  checkIn?: AttendanceEntry;
  checkOut?: AttendanceEntry;
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

// Evaluate Check-In time status (After 08:00:00 WIB is Late)
function evaluateCheckInStatus(now: Date): {
  status: AttendanceTimeStatus;
  label: string;
} {
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();

  const isLate = h > 8 || (h === 8 && (m > 0 || s > 0));
  if (isLate) {
    return { status: "late", label: "Terlambat (> 08.00)" };
  }
  return { status: "on_time", label: "Tepat Waktu" };
}

// Evaluate Check-Out time status (< 16:00 without note = Tidak Tepat Waktu; < 16:00 with note = Tepat Waktu (Keterangan); >= 16:00 = Tepat Waktu)
function evaluateCheckOutStatus(
  now: Date,
  hasNote: boolean,
): {
  status: AttendanceTimeStatus;
  label: string;
} {
  const h = now.getHours();
  const isBefore16 = h < 16;

  if (!isBefore16) {
    return { status: "on_time", label: "Pulang Tepat Waktu" };
  }
  if (hasNote) {
    return {
      status: "on_time_note",
      label: "Tepat Waktu (Dengan Keterangan)",
    };
  }
  return {
    status: "early_no_note",
    label: "Pulang Tidak Tepat Waktu",
  };
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

// Haversine distance in meters
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

export default function AbsenPesertaPage() {
  const todayWIB = useMemo(() => getNowWIB(), []);
  const todayIso = useMemo(() => toIsoDate(todayWIB), [todayWIB]);
  const storageKey = `sitanjak_absen_${todayIso}`;

  const [pesertaName, setPesertaName] = useState("Peserta Magang");
  const [record, setRecord] = useState<DailyAttendanceRecord>({
    dateIso: todayIso,
  });

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
  const [submitting, setSubmitting] = useState(false);
  const [previewModalPhoto, setPreviewModalPhoto] = useState<string | null>(
    null,
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Determine current active step: Check-In (Pagi) -> Check-Out (Pulang) -> Done (unless repeating Check-Out)
  const activeStep: "check_in" | "check_out" | "completed" = !record.checkIn
    ? "check_in"
    : !record.checkOut || isRepeatingCheckOut
      ? "check_out"
      : "completed";

  // Load participant name & saved attendance for today
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setRecord(JSON.parse(saved));
      }

      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const email = payload?.email;
        if (email) {
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/pendaftaran/cek?email=${encodeURIComponent(email)}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          )
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
              const found = data?.peserta?.find(
                (p: any) => p.email?.toLowerCase() === email.toLowerCase(),
              );
              if (found?.nama) setPesertaName(found.nama);
            })
            .catch(() => {});
        }
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

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
    if (activeStep !== "completed") {
      lockGpsLocation();
    }
  }, [activeStep, lockGpsLocation]);

  // Start WebRTC front camera
  const startCamera = async () => {
    setCameraError(null);
    setCapturedPhoto(null);

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

  // Capture selfie frame onto canvas with official watermark
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 640;

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
    const barHeight = Math.max(96, Math.round(height * 0.18));
    ctx.fillStyle = "rgba(15, 23, 42, 0.80)";
    ctx.fillRect(0, height - barHeight, width, barHeight);

    const nowWib = getNowWIB();
    const nowTime = formatTimeWIB(nowWib);
    const evalResult =
      activeStep === "check_in"
        ? evaluateCheckInStatus(nowWib)
        : evaluateCheckOutStatus(
            nowWib,
            useCheckOutNote && checkOutNote.trim().length > 0,
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
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(
      `${stepTitle} • ${nowTime} [${evalResult.label.toUpperCase()}]`,
      16,
      height - barHeight + 26,
    );

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(
      `${pesertaName} • ${formatFullDateID(todayWIB)}`,
      16,
      height - barHeight + 50,
    );

    ctx.fillStyle = "#CBD5E1";
    ctx.font = "12px sans-serif";
    ctx.fillText(locText, 16, height - barHeight + 74);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  // Submit Check-In or Check-Out
  const handleSubmitAbsen = () => {
    if (!gpsLocation) {
      showToast.error("Titik lokasi GPS wajib dikunci terlebih dahulu");
      return;
    }
    if (!capturedPhoto) {
      showToast.error("Silakan ambil foto wajah terlebih dahulu");
      return;
    }
    if (
      activeStep === "check_out" &&
      useCheckOutNote &&
      checkOutNote.trim().length < 5
    ) {
      showToast.error(
        "Harap isi alasan/keterangan pulang minimal 5 karakter",
      );
      return;
    }

    setSubmitting(true);
    const nowWib = getNowWIB();
    const nowTime = formatTimeWIB(nowWib);

    const isCheckIn = activeStep === "check_in";
    const hasValidNote =
      !isCheckIn && useCheckOutNote && checkOutNote.trim().length >= 5;

    const evalResult = isCheckIn
      ? evaluateCheckInStatus(nowWib)
      : evaluateCheckOutStatus(nowWib, hasValidNote);

    const prevAttempts = record.checkOut?.attemptCount || 0;

    const entry: AttendanceEntry = {
      type: isCheckIn ? "check_in" : "check_out",
      timeWIB: nowTime,
      photoDataUrl: capturedPhoto,
      location: gpsLocation,
      timeStatus: evalResult.status,
      timeStatusLabel: evalResult.label,
      keterangan: hasValidNote ? checkOutNote.trim() : undefined,
      attemptCount: isCheckIn ? 1 : prevAttempts + 1,
    };

    setTimeout(() => {
      const nextRecord: DailyAttendanceRecord = {
        ...record,
        ...(isCheckIn ? { checkIn: entry } : { checkOut: entry }),
      };

      setRecord(nextRecord);
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextRecord));
      } catch {
        // ignore storage quota errors
      }

      setCapturedPhoto(null);
      setSubmitting(false);
      setIsRepeatingCheckOut(false);

      showToast.success(
        isCheckIn
          ? `Absen Pagi berhasil dicatat (${evalResult.label})! ✅`
          : `Absen Pulang terbaru berhasil disimpan (${evalResult.label})! ✅`,
      );
    }, 500);
  };

  const handleResetDemo = () => {
    localStorage.removeItem(storageKey);
    setRecord({ dateIso: todayIso });
    setCapturedPhoto(null);
    setIsRepeatingCheckOut(false);
    setUseCheckOutNote(false);
    setCheckOutNote("");
    stopCamera();
    lockGpsLocation();
    showToast.success("Simulasi absen hari ini direset");
  };

  // Calibrate to BBPOM Palembang office coordinates (for PC/Laptop whose IP ISP location drifts)
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

  // Build OpenStreetMap embed bbox around locked coordinates
  const mapEmbedUrl = useMemo(() => {
    if (!gpsLocation) return null;
    const delta = 0.0025;
    const bbox = `${gpsLocation.lng - delta}%2C${gpsLocation.lat - delta}%2C${gpsLocation.lng + delta}%2C${gpsLocation.lat + delta}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${gpsLocation.lat}%2C${gpsLocation.lng}`;
  }, [gpsLocation]);

  // Live preview of what status the user will get right now
  const currentLiveCheckInEval = evaluateCheckInStatus(getNowWIB());
  const currentLiveCheckOutEval = evaluateCheckOutStatus(
    getNowWIB(),
    useCheckOutNote && checkOutNote.trim().length >= 5,
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ================= 1. HEADER ================= */}
      <div className="flex items-start justify-between gap-3 pt-1">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white"
            style={{ fontWeight: 800 }}
          >
            Absensi Kehadiran
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            {formatFullDateID(todayWIB)}
          </p>
        </div>

        {(record.checkIn || record.checkOut) && (
          <button
            type="button"
            onClick={handleResetDemo}
            title="Reset simulasi absen hari ini"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition shrink-0"
          >
            <RotateCcw className="w-4 h-4 text-[#1D64F2]" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* ================= 2. RINGKASAN CHECK-IN & CHECK-OUT HARI INI ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        {/* Card Check-In Pagi */}
        <div
          className={`rounded-2xl border p-4 sm:p-5 shadow-2xs transition ${
            record.checkIn
              ? "bg-white dark:bg-slate-800/90 border-slate-200/90 dark:border-slate-700/80"
              : activeStep === "check_in"
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
                  className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400"
                  style={{ fontWeight: 600 }}
                >
                  Absen Pagi (Check-In)
                </p>
                <p
                  className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 tabular-nums"
                  style={{ fontWeight: 800 }}
                >
                  {record.checkIn ? record.checkIn.timeWIB : "--.-- WIB"}
                </p>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold border shrink-0 ${
                record.checkIn
                  ? getTimeStatusBadgeStyle(record.checkIn.timeStatus)
                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
              }`}
            >
              {record.checkIn ? record.checkIn.timeStatusLabel : "Belum Absen"}
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/70 text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2">
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
              : activeStep === "check_out"
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
                  className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400"
                  style={{ fontWeight: 600 }}
                >
                  Absen Pulang (Check-Out)
                </p>
                <p
                  className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 tabular-nums"
                  style={{ fontWeight: 800 }}
                >
                  {record.checkOut ? record.checkOut.timeWIB : "--.-- WIB"}
                </p>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold border shrink-0 ${
                record.checkOut
                  ? getTimeStatusBadgeStyle(record.checkOut.timeStatus)
                  : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
              }`}
            >
              {record.checkOut
                ? record.checkOut.timeStatusLabel
                : "Belum Absen"}
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/70 text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                {record.checkOut
                  ? record.checkOut.location.isInsideBpom
                    ? "Di Lingkungan BBPOM Palembang"
                    : `Di Luar BBPOM (${formatDistanceLabel(record.checkOut.location.distanceMeters)})`
                  : "Jadwal pulang: 16.00 WIB"}
              </span>
            </div>

            {record.checkOut && !isRepeatingCheckOut && (
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

      {/* ================= TOMBOL ABSEN PULANG ULANG (JIKA SUDAH CHECK-OUT) ================= */}
      {activeStep === "completed" && record.checkOut && (
        <div className="rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1D64F2] text-white flex items-center justify-center shrink-0 mt-0.5">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <p
                className="text-sm sm:text-base font-bold text-slate-900 dark:text-white"
                style={{ fontWeight: 700 }}
              >
                Ingin Memperbarui Absen Pulang?
              </p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Absen pulang dapat diulang. Sistem otomatis menyimpan dan
                menggunakan data <b>absen pulang terakhir</b> Anda
                {record.checkOut.attemptCount && record.checkOut.attemptCount > 1
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
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#1D64F2] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shrink-0 transition shadow-2xs"
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
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#1D64F2] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5 sm:mt-0">
                {activeStep === "check_in" ? (
                  <LogIn className="w-5 h-5" />
                ) : (
                  <LogOut className="w-5 h-5" />
                )}
              </div>
              <div>
                <h2
                  className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug"
                  style={{ fontWeight: 800 }}
                >
                  {activeStep === "check_in"
                    ? "Form Absen Pagi (Check-In)"
                    : isRepeatingCheckOut
                      ? "Perbarui Absen Pulang (Check-Out)"
                      : "Form Absen Pulang (Check-Out)"}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {activeStep === "check_in"
                    ? "Batas masuk tepat waktu pukul 08.00 WIB. Lewat dari 08.00 WIB terhitung terlambat."
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
                {activeStep === "check_in" ? "Tahap 1/2" : "Tahap 2/2"}
              </span>
            )}
          </div>

          {/* INFO ATURAN JAM ABSEN REAL-TIME */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-start sm:items-center gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
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
                className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2"
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
                    className="text-xs sm:text-sm font-bold"
                    style={{ fontWeight: 700 }}
                  >
                    Pulang Reguler (Tanpa Keterangan)
                  </p>
                  <p className="text-[11px] sm:text-xs opacity-80 mt-0.5">
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
                    className="text-xs sm:text-sm font-bold"
                    style={{ fontWeight: 700 }}
                  >
                    Pulang dengan Keterangan / Izin
                  </p>
                  <p className="text-[11px] sm:text-xs opacity-80 mt-0.5">
                    Tetap dihitung tepat waktu meski pulang sebelum 16.00 WIB
                  </p>
                </button>
              </div>

              {useCheckOutNote && (
                <div className="pt-1 space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    Keterangan / Alasan Pulang{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={checkOutNote}
                    onChange={(e) => setCheckOutNote(e.target.value)}
                    rows={2}
                    placeholder="Contoh: Izin pulang lebih awal karena bimbingan skripsi / kegiatan kampus atas izin Mentor..."
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#1D64F2] focus:ring-2 focus:ring-[#1D64F2]/20"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP A: TITIK LOKASI MAPS TERKUNCI */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label
                className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2"
                style={{ fontWeight: 700 }}
              >
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#1D64F2] shrink-0" />
                <span>1. Titik Lokasi Anda</span>
              </label>

              <button
                type="button"
                onClick={lockGpsLocation}
                disabled={loadingGps}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 transition disabled:opacity-50 shrink-0"
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
              <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/70 p-4 text-xs sm:text-sm text-red-700 dark:text-red-300 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-2.5">
                  <p className="font-semibold leading-relaxed">{gpsError}</p>
                  <button
                    type="button"
                    onClick={lockGpsLocation}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold transition"
                  >
                    Coba Kunci Ulang Lokasi
                  </button>
                </div>
              </div>
            ) : loadingGps && !gpsLocation ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 h-52 flex flex-col items-center justify-center gap-2.5 p-4 text-center text-xs sm:text-sm text-slate-500">
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

                  {/* Single Clean Locked Indicator Pill on Map */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/80 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Pin Maps Terkunci (±{gpsLocation.accuracy}m)</span>
                  </div>
                </div>

                {/* Location Metadata Details */}
                <div className="p-4 space-y-3">
                  {/* Status Area BBPOM Badge + Buka Maps Link */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold ${
                        gpsLocation.isInsideBpom
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
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
                      className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#1D64F2] hover:underline"
                    >
                      <span>Buka Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Full Address */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Alamat Terdeteksi:
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed break-words">
                      {gpsLocation.address}
                    </p>
                  </div>

                  {/* Coordinates & Distance Footer */}
                  <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
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

                  {/* Info & Kalibrasi jika dibuka dari Laptop/PC */}
                  {!gpsLocation.isInsideBpom && (
                    <div className="pt-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/70 p-3.5">
                        <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                          <b>Membuka dari Laptop/PC di Kantor BBPOM?</b> Browser
                          komputer menggunakan lokasi IP provider internet
                          sehingga titik dapat meleset.
                        </p>
                        <button
                          type="button"
                          onClick={calibrateToBpomOffice}
                          className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#1D64F2] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shrink-0 transition shadow-2xs"
                        >
                          Set Titik Kantor BBPOM
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* STEP B: KAMERA SWAFOTO WAJAH */}
          <div className="space-y-3">
            <label
              className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2"
              style={{ fontWeight: 700 }}
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-[#1D64F2] shrink-0" />
              <span>2. Ambil Foto Wajah</span>
            </label>

            <canvas ref={canvasRef} className="hidden" />

            {cameraError && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/70 p-3.5 text-xs sm:text-sm text-red-700 dark:text-red-300 flex items-center gap-2.5">
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
                    <span>Foto Wajah Tersimpan</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full sm:w-auto mx-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 transition"
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

                  {/* Face Guide Overlay */}
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
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 transition"
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
                    className="text-sm sm:text-base font-bold text-slate-900 dark:text-white"
                    style={{ fontWeight: 700 }}
                  >
                    Kamera Swafoto Wajah
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
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
                (activeStep === "check_out" &&
                  useCheckOutNote &&
                  checkOutNote.trim().length < 5)
              }
              onClick={handleSubmitAbsen}
              className="w-full py-3.5 px-5 rounded-xl bg-[#1D64F2] hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-sm sm:text-base font-extrabold shadow-xs transition flex items-center justify-center gap-2"
              style={{ fontWeight: 800 }}
            >
              {activeStep === "check_in" ? (
                <LogIn className="w-5 h-5" />
              ) : (
                <LogOut className="w-5 h-5" />
              )}
              <span>
                {submitting
                  ? "Menyimpan Data Absensi..."
                  : activeStep === "check_in"
                    ? "Kirim Absen Pagi (Check-In)"
                    : isRepeatingCheckOut
                      ? "Simpan Pembaruan Absen Pulang (Terakhir)"
                      : "Kirim Absen Pulang (Check-Out)"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ================= 4. BUKTI REKAMAN ABSEN HARI INI ================= */}
      {(record.checkIn || record.checkOut) && (
        <div className="space-y-3.5 pt-1">
          <h2
            className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white"
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
                photoDataUrl,
                location,
                timeStatus,
                timeStatusLabel,
                keterangan,
              } = item.data;
              return (
                <div
                  key={item.label}
                  className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-5 shadow-2xs space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className="text-sm sm:text-base font-bold text-slate-900 dark:text-white block"
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
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${getTimeStatusBadgeStyle(
                        timeStatus,
                      )}`}
                    >
                      {timeStatusLabel}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewModalPhoto(photoDataUrl)}
                    className="w-full h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 block"
                  >
                    <img
                      src={photoDataUrl}
                      alt={item.label}
                      className="w-full h-full object-cover hover:scale-105 transition"
                    />
                  </button>

                  {keterangan && (
                    <div className="rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/70 p-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                      <span className="font-bold text-[#1D64F2] dark:text-blue-400 block mb-0.5">
                        Keterangan Pulang:
                      </span>
                      <p className="leading-relaxed break-words">{keterangan}</p>
                    </div>
                  )}

                  <div className="space-y-2 text-xs sm:text-sm">
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
