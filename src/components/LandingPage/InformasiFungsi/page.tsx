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
      <div className="
        relative
        h-full
        rounded-3xl
        overflow-hidden
        bg-white
        border border-slate-200/70
        shadow-sm
        transition-all duration-500
        hover:shadow-2xl
        hover:-translate-y-2
      ">
        {/* Accent Line Dynamic */}
        <div
          className={`
            absolute -top-20 -right-20
            w-40 h-40
            rounded-full
            opacity-20 blur-3xl
            bg-linear-to-br ${item.gradient || "from-red-600 to-orange-500"}
            transition-all duration-700
            group-hover:scale-125
          `}
        />

        <div
          className={`
            absolute top-0 left-0 w-full h-1
            bg-linear-to-r ${item.gradient || "from-red-600 to-orange-500"}
          `}
        />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col h-full">
          
          {/* ICON */}
          <div
            className={`
              mb-5
              w-14 h-14 sm:w-16 sm:h-16
              rounded-2xl
              bg-linear-to-br ${item.gradient || "from-red-600 to-orange-500"}
              text-white
              flex items-center justify-center
              text-xl sm:text-2xl
              shadow-lg
              ring-4 ring-white
              transition-all duration-500
              group-hover:scale-110 group-hover:rotate-3
            `}
          >
            {iconMap[item.iconName] || <HiOfficeBuilding />}
          </div>

          {/* TITLE */}
          <h3 className="relative inline-block text-xl sm:text-2xl font-bold text-slate-800 mb-4 leading-snug">
            {item.title}

            <span
              className={`
                absolute left-0 -bottom-1
                h-0.75 w-12
                rounded-full
                bg-linear-to-r ${item.gradient || "from-red-600 to-orange-500"}
                transition-all duration-300
                group-hover:w-full
              `}
            />
          </h3>

          <p className="
            text-sm sm:text-base
            text-slate-600
            leading-relaxed
            grow
            line-clamp-3
          ">
            {item.desc}
          </p>

          {/* Divider */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <button
              onClick={() => setExpandedIndex(isOpen ? null : index)}
              className="
                w-full flex items-center justify-between
                py-2
              "
            >
              <div className="flex items-center gap-3">

                {/* Title */}
                <span
                  className={`
                    text-sm font-semibold
                    bg-linear-to-r ${item.gradient || "from-red-600 to-orange-500"}
                    bg-clip-text text-transparent
                  `}
                >
                  Jurusan yang Diterima
                </span>

                {/* Counter */}
                <span
                  className={`
                    text-xs font-semibold
                    px-2.5 py-1
                    rounded-full
                    bg-slate-100
                    text-slate-600
                  `}
                >
                  {item.jurusan.length}
                </span>
              </div>

              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.25 }}
                className="text-slate-400"
              >
                <HiOutlineChevronDown className="text-lg" />
              </motion.div>
            </button>

            <motion.div
              initial={false}
              animate={{
                height: isOpen ? "auto" : 0,
                opacity: isOpen ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-5 flex flex-wrap gap-2">
                {item.jurusan.map((j: string, i: number) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.08 }}
                    className={`
                      px-4 py-1.5
                      text-xs sm:text-sm
                      font-medium
                      rounded-full
                      bg-white
                      border border-slate-200
                      text-slate-700
                      shadow-sm
                      transition-all duration-300
                      hover:text-white
                      hover:border-transparent
                      hover:bg-linear-to-r ${item.gradient || "from-red-600 to-orange-500"}
                    `}
                  >
                    {j}
                  </motion.span>
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
      className="w-full flex justify-center px-4 mt-24"
    >
      <div className="max-w-6xl w-full px-6 lg:px-14 py-16">
        {/* HEADER */}
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-[#7F1D1D]">
            Informasi Fungsi Formasi Magang
            <span className="block text-2xl md:text-xl text-slate-700 font-bold mt-1">
              di BPOM Kota Palembang
            </span>
          </h2>

          <p className="text-gray-600 mt-3 max-w-2xl mx-auto leading-relaxed">
            Berikut adalah informasi mengenai fungsi dan peran di Balai Besar POM di Palembang yang dapat menjadi pilihan bidang magang sesuai minat dan latar belakang pendidikan Anda.
          </p>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
