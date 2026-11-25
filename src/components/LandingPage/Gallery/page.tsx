"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  X,
} from "lucide-react";

interface GalleryItem {
  id: string;
  src: string;
  title: string;
  defaultPath?: string | null;
}

const DEFAULT_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "default-1",
    src: "/images/assets-new/galery/1.jpg",
    title: "Dokumentasi Kegiatan Magang SI TANJAK 01",
    defaultPath: "/images/assets-new/galery/1.jpg",
  },
  {
    id: "default-2",
    src: "/images/assets-new/galery/2.jpg",
    title: "Dokumentasi Kegiatan Magang SI TANJAK 02",
    defaultPath: "/images/assets-new/galery/2.jpg",
  },
  {
    id: "default-3",
    src: "/images/assets-new/galery/3.jpg",
    title: "Dokumentasi Kegiatan Magang SI TANJAK 03",
    defaultPath: "/images/assets-new/galery/3.jpg",
  },
  {
    id: "default-4",
    src: "/images/assets-new/galery/4.jpg",
    title: "Dokumentasi Kegiatan Magang SI TANJAK 04",
    defaultPath: "/images/assets-new/galery/4.jpg",
  },
  {
    id: "default-5",
    src: "/images/assets-new/galery/5.jpg",
    title: "Dokumentasi Kegiatan Magang SI TANJAK 05",
    defaultPath: "/images/assets-new/galery/5.jpg",
  },
  {
    id: "default-6",
    src: "/images/assets-new/galery/6.jpg",
    title: "Dokumentasi Kegiatan Magang SI TANJAK 06",
    defaultPath: "/images/assets-new/galery/6.jpg",
  },
  {
    id: "default-7",
    src: "/images/assets-new/galery/7.jpg",
    title: "Dokumentasi Kegiatan Magang SI TANJAK 07",
    defaultPath: "/images/assets-new/galery/7.jpg",
  },
  {
    id: "default-8",
    src: "/images/assets-new/galery/8.jpg",
    title: "Dokumentasi Kegiatan Magang SI TANJAK 08",
    defaultPath: "/images/assets-new/galery/8.jpg",
  },
  {
    id: "default-9",
    src: "/images/assets-new/galery/9.jpg",
    title: "Dokumentasi Kegiatan Magang SI TANJAK 09",
    defaultPath: "/images/assets-new/galery/9.jpg",
  },
  {
    id: "default-10",
    src: "/images/assets-new/galery/10.jpg",
    title: "Dokumentasi Kegiatan Magang SI TANJAK 10",
    defaultPath: "/images/assets-new/galery/10.jpg",
  },
  {
    id: "default-11",
    src: "/images/assets-new/galery/11.jpg",
    title: "Dokumentasi Kegiatan Magang SI TANJAK 11",
    defaultPath: "/images/assets-new/galery/11.jpg",
  },
];

const HIGHLIGHTS = [
  {
    num: "#01",
    label: "Laboratorium Pengujian",
  },
  {
    num: "#02",
    label: "Inspeksi & Sertifikasi",
  },
  {
    num: "#03",
    label: "Informasi & Komunikasi",
  },
  {
    num: "#04",
    label: "Tata Usaha & Layanan",
  },
];

function resolveImageUrl(
  rawUrl: string | undefined | null,
  defaultPath: string | undefined | null,
  apiBase: string,
): string {
  const candidate = rawUrl || defaultPath || "";
  if (!candidate) return "/images/assets-new/galery/1.jpg";
  if (candidate.startsWith("http://") || candidate.startsWith("https://")) {
    return candidate;
  }
  if (candidate.startsWith("/uploads/")) {
    return `${apiBase}${candidate}`;
  }
  return candidate;
}

function getSignedCircularDelta(index: number, phase: number, total: number) {
  let d = (((index - phase) % total) + total) % total;
  if (d > total / 2) d -= total;
  return d;
}

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>(DEFAULT_GALLERY_ITEMS);
  const [phase, setPhase] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    if (!apiBase) return;

    fetch(`${apiBase}/gallery?activeOnly=true`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!active || !json?.success || !Array.isArray(json.data)) return;
        const mapped: GalleryItem[] = json.data.map(
          (doc: {
            _id?: string;
            title?: string;
            imageUrl?: string;
            defaultPath?: string | null;
          }) => ({
            id: String(doc._id || Math.random()),
            src: resolveImageUrl(doc.imageUrl, doc.defaultPath, apiBase),
            title: doc.title || "Dokumentasi Kegiatan Magang SI TANJAK",
            defaultPath: doc.defaultPath || null,
          }),
        );
        if (mapped.length > 0) {
          setItems(mapped);
          setPhase(0);
        }
      })
      .catch(() => {
        // Fallback ke DEFAULT_GALLERY_ITEMS jika gagal mengambil dari server
      });

    return () => {
      active = false;
    };
  }, []);

  // Pastikan ring 3D carousel minimal memiliki 9 slot agar lengkungan kiri-kanan selalu penuh
  const carouselRing = useMemo(() => {
    if (items.length === 0) return [];
    if (items.length >= 9) {
      return items.map((item, idx) => ({
        ...item,
        ringKey: `${item.id}-${idx}`,
        originalIndex: idx,
      }));
    }
    const repeated: Array<
      GalleryItem & { ringKey: string; originalIndex: number }
    > = [];
    let copyRound = 0;
    while (repeated.length < 9) {
      items.forEach((item, idx) => {
        repeated.push({
          ...item,
          ringKey: `${item.id}-r${copyRound}-${idx}`,
          originalIndex: idx,
        });
      });
      copyRound++;
    }
    return repeated;
  }, [items]);

  const totalItems = items.length;
  const totalRing = carouselRing.length;

  const handleClose = useCallback(() => setActiveIndex(null), []);
  const handlePrevModal = useCallback(() => {
    if (totalItems === 0) return;
    setActiveIndex((prev) =>
      prev === null ? null : (prev - 1 + totalItems) % totalItems,
    );
  }, [totalItems]);
  const handleNextModal = useCallback(() => {
    if (totalItems === 0) return;
    setActiveIndex((prev) => (prev === null ? null : (prev + 1) % totalItems));
  }, [totalItems]);

  // Auto-slide animation loop (smooth 60fps continuous glide)
  useEffect(() => {
    if (isPaused || isHovered || activeIndex !== null || totalRing === 0) {
      lastFrameRef.current = null;
      return;
    }

    let rafId: number;
    const speedCardsPerSec = 0.18;

    const tick = (now: number) => {
      if (lastFrameRef.current !== null) {
        const dt = Math.min(0.1, (now - lastFrameRef.current) / 1000);
        setPhase((prev) => (prev + dt * speedCardsPerSec) % totalRing);
      }
      lastFrameRef.current = now;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPaused, isHovered, activeIndex, totalRing]);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft") handlePrevModal();
      if (e.key === "ArrowRight") handleNextModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, handleClose, handlePrevModal, handleNextModal]);

  const stepCarousel = (delta: number) => {
    if (totalRing === 0) return;
    setPhase((prev) => (((prev + delta) % totalRing) + totalRing) % totalRing);
  };

  const activeItem =
    activeIndex !== null ? (items[activeIndex] ?? null) : null;

  return (
    <section className="relative bg-linear-to-br from-[#071531] via-[#0B1B3D] to-[#08306B] py-10 sm:py-12 lg:py-14 overflow-hidden">
      {/* Dekorasi Cahaya Biru Halus (Selaras dengan section CAPAIAN & DATA PROGRAM) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#0088FF]/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-sky-400/15 blur-3xl"
      />

      {/* ================= TOP CENTERED HEADER ================= */}
      <div className="relative z-10 max-w-3xl mx-auto px-5 text-center space-y-2.5">
        <span className="inline-block px-3 py-0.5 rounded-full bg-sky-400/15 border border-sky-400/30 text-[#38BDF8] text-xs font-bold tracking-wide">
          Galeri Dokumentasi
        </span>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-[1.15]">
          Potret Aktivitas &amp; Kegiatan{" "}
          <span className="text-[#38BDF8]">Magang BBPOM di Palembang</span>
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Dokumentasi kegiatan harian, praktik laboratorium pengujian, pelayanan
          publik, serta pembinaan peserta magang di Balai Besar POM di
          Palembang.
        </p>

        {/* Action Pill & Controls */}
        <div className="pt-1 flex items-center justify-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => stepCarousel(-1)}
            aria-label="Geser ke kiri"
            className="w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-xs transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (totalRing === 0) return;
              const currentSlot =
                ((Math.round(phase) % totalRing) + totalRing) % totalRing;
              const origIdx =
                carouselRing[currentSlot]?.originalIndex ?? 0;
              setActiveIndex(origIdx);
            }}
            className="group inline-flex items-center gap-2.5 pl-4 pr-1.5 py-1 rounded-full bg-white text-[#0B1B3D] shadow-lg shadow-black/20 hover:bg-sky-50 transition cursor-pointer"
          >
            <span className="text-xs font-bold text-[#0B1B3D]">
              Lihat Foto Penuh
            </span>
            <span className="w-7 h-7 rounded-full bg-[#0088FF] group-hover:bg-[#0270d1] text-white flex items-center justify-center transition">
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            aria-label={isPaused ? "Putar otomatis" : "Jeda geser otomatis"}
            title={isPaused ? "Putar otomatis" : "Jeda geser otomatis"}
            className="w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-xs transition cursor-pointer"
          >
            {isPaused ? (
              <Play className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Pause className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => stepCarousel(1)}
            aria-label="Geser ke kanan"
            className="w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-xs transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ================= 3D CURVED PANORAMA CAROUSEL ================= */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative z-10 w-full h-[240px] sm:h-[280px] lg:h-[320px] mt-3 sm:mt-4 flex items-center justify-center overflow-hidden select-none"
      >
        {carouselRing.map((item, idx) => {
          const d = getSignedCircularDelta(idx, phase, totalRing);
          const absD = Math.abs(d);

          // Hanya render kartu yang berada di jangkauan layar
          if (absD > 4.5) return null;

          // Geometri silinder cekung yang lebih ringkas secara vertikal
          const cardW = 122 + d * d * 6.2;
          const cardH = 136 + d * d * 14.5;
          const translateX = d * 136 + d * absD * 4.5;
          const rotateY = Math.max(-44, Math.min(44, -d * 11.8));
          const opacity = absD > 3.8 ? Math.max(0, 1 - (absD - 3.8) * 1.5) : 1;
          const zIndex = Math.round(50 - absD * 10);

          return (
            <button
              key={item.ringKey}
              type="button"
              onClick={() => setActiveIndex(item.originalIndex)}
              aria-label={item.title}
              style={{
                width: `${cardW.toFixed(1)}px`,
                height: `${cardH.toFixed(1)}px`,
                transform: `translate3d(${translateX.toFixed(1)}px, 0, 0) perspective(560px) rotateY(${rotateY.toFixed(2)}deg)`,
                opacity,
                zIndex,
              }}
              className="group absolute rounded-2xl overflow-hidden bg-slate-800 border border-white/15 shadow-[0_18px_40px_rgba(0,0,0,0.38)] hover:ring-3 hover:ring-[#38BDF8] focus:outline-none cursor-pointer transition-shadow duration-300"
            >
              <Image
                src={item.src}
                alt={item.title}
                fill
                sizes="260px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#071531]/55 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
            </button>
          );
        })}
      </div>

      {/* ================= BOTTOM 4 NUMBERED PILLARS ================= */}
      <div className="relative z-10 max-w-5xl mx-auto px-5 mt-2 sm:mt-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-center">
          {HIGHLIGHTS.map((h) => (
            <div key={h.num} className="space-y-0.5">
              <p className="text-xs font-extrabold text-[#38BDF8] tracking-wider">
                {h.num}
              </p>
              <p className="text-xs sm:text-sm font-bold text-white/95">
                {h.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ================= LIGHTBOX MODAL ================= */}
      {activeItem && activeIndex !== null && (
        <div
          onClick={handleClose}
          className="fixed inset-0 z-120 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-4 sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl flex flex-col items-center gap-3"
          >
            <div className="w-full flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/15 border border-white/20">
                  {String(activeIndex + 1).padStart(2, "0")} /{" "}
                  {String(totalItems).padStart(2, "0")}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-white/90">
                  {activeItem.title}
                </span>
              </div>

              <button
                type="button"
                onClick={handleClose}
                aria-label="Tutup pratinjau"
                className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full h-[65vh] sm:h-[75vh] bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden">
              <Image
                src={activeItem.src}
                alt={activeItem.title}
                fill
                sizes="90vw"
                className="object-contain"
                priority
              />

              <button
                type="button"
                onClick={handlePrevModal}
                aria-label="Foto sebelumnya"
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 hover:bg-black/75 text-white border border-white/20 transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleNextModal}
                aria-label="Foto berikutnya"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 hover:bg-black/75 text-white border border-white/20 transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
