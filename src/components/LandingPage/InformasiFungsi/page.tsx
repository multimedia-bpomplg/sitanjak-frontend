"use client";

import { useState, useEffect } from "react";
import {
  HiOfficeBuilding,
  HiShieldCheck,
  HiBeaker,
  HiSearch,
  HiSpeakerphone,
  HiAcademicCap,
  HiOutlineChevronDown,
} from "react-icons/hi";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const API = process.env.NEXT_PUBLIC_API_URL;

const iconMap: any = {
  HiOfficeBuilding: <HiOfficeBuilding />,
  HiShieldCheck: <HiShieldCheck />,
  HiBeaker: <HiBeaker />,
  HiSearch: <HiSearch />,
  HiSpeakerphone: <HiSpeakerphone />,
  HiAcademicCap: <HiAcademicCap />,
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

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover={{ y: -6 }}
      className="group"
    >
      <div className="relative h-full bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
        {/* ACCENT TOP LINE */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-700 via-red-500 to-orange-400" />

        <div className="p-8 flex flex-col h-full">
          {/* BADGE (OPTIONAL) */}
          {item.badge && (
            <span className="inline-block mb-4 px-3 py-1 text-xs font-semibold bg-red-50 text-red-600 rounded-full w-fit">
              {item.badge}
            </span>
          )}

          {/* ICON */}
          <div className="mb-4 w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-orange-500 text-white flex items-center justify-center text-xl shadow-md">
            {iconMap[item.iconName] || <HiOfficeBuilding />}
          </div>

          {/* TITLE */}
          <h3 className="text-xl font-bold text-slate-800 mb-4 leading-snug group-hover:text-red-700 transition">
            {item.title}
          </h3>

          {/* DESCRIPTION */}
          <p className="text-sm text-slate-600 leading-relaxed flex-grow">
            {item.desc}
          </p>

          {/* JURUSAN SECTION */}
          <div className="border-t border-slate-100 pt-6 mt-6">
            <button
              onClick={() => setExpandedIndex(isOpen ? null : index)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="text-sm font-semibold text-red-600">
                Jurusan yang Diterima
              </span>

              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <HiOutlineChevronDown className="text-lg text-red-600" />
              </motion.div>
            </button>

            <motion.div
              initial={false}
              animate={{
                height: isOpen ? "auto" : 0,
                opacity: isOpen ? 1 : 0,
              }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden"
            >
              <div className="mt-4 flex flex-wrap gap-2">
                {item.jurusan.map((j: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-full hover:bg-red-100 transition"
                  >
                    {j}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ================= MAIN ================= */

export default function InformasiFungsi() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/informasi-fungsi`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(console.error);
  }, []);

  return (
    <section
      id="informasi"
      className="relative py-28 px-4 bg-gradient-to-br from-slate-50 via-white to-slate-100"
    >
      {/* Soft Background Glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-200/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-700 via-red-600 to-orange-500">
              Informasi Fungsi
            </span>
            <span className="block text-2xl md:text-3xl text-slate-700 font-bold mt-3">
              di BPOM Kota Palembang
            </span>
          </h2>

          <p className="text-slate-600 max-w-3xl mx-auto text-lg leading-relaxed">
            Setiap fungsi memiliki peran strategis dalam menjaga keamanan, mutu,
            dan kualitas obat serta makanan yang beredar di masyarakat. Pilih
            bidang yang sesuai dengan kompetensimu.
          </p>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
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
      </div>
    </section>
  );
}
