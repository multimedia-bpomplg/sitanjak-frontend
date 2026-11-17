"use client";

import { useState, useEffect } from "react";
import { plusJakarta, caveat } from '@/lib/font';
import {
  HiOutlineOfficeBuilding,
  HiOutlineShieldCheck,
  HiOutlineBeaker,
  HiOutlineSearchCircle,
  HiOutlineSpeakerphone,
  HiOutlineAcademicCap,
  HiOutlineChevronDown,
} from "react-icons/hi";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";



const API = process.env.NEXT_PUBLIC_API_URL;

const iconMap: Record<string, React.ReactNode> = {
  HiOfficeBuilding: <HiOutlineOfficeBuilding />,
  HiShieldCheck: <HiOutlineShieldCheck />,
  HiBeaker: <HiOutlineBeaker />,
  HiSearch: <HiOutlineSearchCircle />,
  HiSpeakerphone: <HiOutlineSpeakerphone />,
  HiAcademicCap: <HiOutlineAcademicCap />,
};

// Fallback ikon berdasarkan judul jika iconName tidak cocok
const getFallbackIcon = (title = "") => {
  const lower = title.toLowerCase();
  if (lower.includes("pengujian")) return <HiOutlineBeaker />;
  if (lower.includes("pemeriksaan") || lower.includes("inspeksi"))
    return <HiOutlineShieldCheck />;
  if (lower.includes("penindakan")) return <HiOutlineSearchCircle />;
  if (lower.includes("informasi") || lower.includes("komunikasi"))
    return <HiOutlineSpeakerphone />;
  return <HiOutlineOfficeBuilding />;
};

/* ================= CARD ================= */

function InformasiFungsiCard({
  item,
  index,
  expandedIndex,
  setExpandedIndex,
}: any) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });

  const isOpen = expandedIndex === index;
  const jurusanList: string[] = Array.isArray(item.jurusan)
    ? item.jurusan
    : [];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.08, ease: "easeOut" }}
      className="group h-full"
    >
      <div
        className="
          relative h-full
          rounded-3xl
          overflow-hidden
          bg-white
          border border-slate-200/85
          hover:border-[#0088FF]/50
          shadow-[0_4px_20px_rgba(11,27,61,0.04)]
          hover:shadow-[0_18px_40px_rgba(0,136,255,0.12)]
          hover:-translate-y-1.5
          transition-all duration-300
          flex flex-col justify-between
          p-6 sm:p-7
        "
      >
        <div className="min-w-0">
          {/* TOP BAR: ICON & NUMBER BADGE */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div
              className="
                w-13 h-13
                rounded-2xl
                bg-[#EBF5FF] text-[#0088FF]
                group-hover:bg-[#0088FF] group-hover:text-white
                flex items-center justify-center
                text-2xl
                shadow-xs
                transition-all duration-300
              "
            >
              {iconMap[item.iconName] || getFallbackIcon(item.title)}
            </div>

            <span className="text-xs font-extrabold tracking-widest text-[#94A3B8] bg-[#F8FAFC] border border-slate-200/70 px-3 py-1 rounded-full">
              FUNGSI {String(index + 1).padStart(2, "0")}
            </span>
          </div>

          {/* TITLE */}
          <h3 className="text-lg sm:text-xl font-extrabold text-[#0B1B3D] group-hover:text-[#0088FF] transition-colors leading-snug mb-3 capitalize break-words">
            {item.title}
          </h3>

          {/* DESCRIPTION */}
          <p className="text-sm text-[#475569] leading-relaxed break-words">
            {item.desc}
          </p>
        </div>

        {/* ACCORDION JURUSAN */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setExpandedIndex(isOpen ? null : index)}
            className={`
              w-full flex items-center justify-between
              px-4 py-3 rounded-2xl
              border transition-all duration-200
              ${
                isOpen
                  ? "bg-[#F0F7FF] border-[#0088FF]/30 text-[#0088FF]"
                  : "bg-[#F8FAFC] hover:bg-[#F0F7FF]/60 border-slate-200/80 text-[#0B1B3D]"
              }
            `}
          >
            <div className="flex items-center gap-2.5">
              <HiOutlineAcademicCap className="text-lg text-[#0088FF] shrink-0" />
              <span className="text-xs sm:text-sm font-bold">
                Kualifikasi Jurusan
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-white text-[#0088FF] border border-[#D6EEFF]">
                {jurusanList.length} Jurusan
              </span>

              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.25 }}
                className="text-[#64748B]"
              >
                <HiOutlineChevronDown className="text-base" />
              </motion.div>
            </div>
          </button>

          <motion.div
            initial={false}
            animate={{
              height: isOpen ? "auto" : 0,
              opacity: isOpen ? 1 : 0,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-4 flex flex-wrap gap-2">
              {jurusanList.map((j: string, i: number) => (
                <span
                  key={i}
                  className="
                    px-3 py-1.5
                    text-xs font-semibold
                    rounded-xl
                    bg-[#F0F7FF]
                    border border-[#D6EEFF]
                    text-[#0B1B3D]
                    hover:bg-[#0088FF] hover:text-white hover:border-[#0088FF]
                    transition-colors duration-200
                  "
                >
                  {j}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ================= MAIN ================= */

export default function InformasiFungsi() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/informasi-fungsi`)
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json)) {
          setData(json);
        } else if (Array.isArray(json?.data)) {
          setData(json.data);
        } else {
          setData([]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section
      id="informasi"
      className={`${plusJakarta.className} relative w-full bg-white py-16 lg:py-24 overflow-hidden`}
    >
      <div className="max-w-7xl mx-auto w-full px-6 lg:px-12">
        {/* ================= HEADER ================= */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center justify-center gap-2.5">
            <span className="w-6 h-[2px] bg-[#0088FF] rounded-full" />
            <span className="text-xs font-bold tracking-[0.18em] text-[#0088FF] uppercase">
              PANDUAN BIDANG & KOMPETENSI
            </span>
            <span className="w-6 h-[2px] bg-[#0088FF] rounded-full" />
          </div>

          <h2 className="text-3xl sm:text-4xl xl:text-[42px] font-extrabold text-[#0B1B3D] leading-[1.18] tracking-[-0.02em]">
            Informasi Fungsi{" "}
            <span className="text-[#0088FF]">Formasi Magang</span>
          </h2>

          <p className="text-[#475569] text-sm sm:text-base leading-relaxed">
            Kenali tugas dari masing-masing fungsi dan bagian di Balai Besar POM
            di Palembang untuk memilih penempatan magang yang paling sesuai
            dengan latar belakang jurusan Anda.
          </p>
        </div>

        {/* ================= LOADING SKELETON ================= */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200/80 rounded-3xl p-7 space-y-4 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="w-13 h-13 rounded-2xl bg-slate-200" />
                  <div className="w-20 h-6 rounded-full bg-slate-100" />
                </div>
                <div className="h-6 bg-slate-200 rounded-lg w-3/4" />
                <div className="space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-full" />
                  <div className="h-4 bg-slate-100 rounded w-5/6" />
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                </div>
                <div className="h-11 bg-slate-100 rounded-2xl mt-4" />
              </div>
            ))}
          </div>
        )}

        {/* ================= GRID CARDS ================= */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 items-stretch">
            {data.map((item, index) => (
              <InformasiFungsiCard
                key={item._id || index}
                item={item}
                index={index}
                expandedIndex={expandedIndex}
                setExpandedIndex={setExpandedIndex}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
