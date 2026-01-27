"use client";

import {
  HiClipboardCheck,
  HiClock,
  HiDocumentText,
  HiUserGroup,
  HiExclamation,
} from "react-icons/hi";

const peraturanList = [
  {
    title: "Persyaratan Umum",
    desc: "Peserta merupakan mahasiswa aktif dari perguruan tinggi yang telah bekerja sama dan mendapat rekomendasi resmi dari institusi.",
    icon: HiClipboardCheck,
    color: "from-[#FACC15] to-[#EAB308]", 
  },
  {
    title: "Durasi Magang",
    desc: "Pelaksanaan magang berlangsung minimal 1 bulan dan maksimal 6 bulan sesuai ketentuan instansi.",
    icon: HiClock,
    color: "from-[#F97316] to-[#9A3412]",
  },
  {
    title: "Kehadiran & Disiplin",
    desc: "Peserta wajib mematuhi jam kerja, tata tertib, serta menjaga etika selama mengikuti program magang.",
    icon: HiUserGroup,
    color: "from-[#DC2626] to-[#7F1D1D]",
  },
  {
    title: "Laporan & Evaluasi",
    desc: "Peserta diwajibkan menyusun laporan magang dan mengikuti evaluasi di akhir periode.",
    icon: HiDocumentText,
    color: "from-[#84CC16] to-[#365314]",
  },
  {
    title: "Sanksi & Pembatalan",
    desc: "Pelanggaran terhadap peraturan dapat mengakibatkan teguran hingga pembatalan keikutsertaan magang.",
    icon: HiExclamation,
    color: "from-[#7F1D1D] to-[#450A0A]", 
  },
];

export default function Peraturan() {
  return (
    <section
      id="peraturan"
      className="w-full flex justify-center px-4 mt-24"
    >
      <div
        className="
          max-w-6xl w-full
          px-8 lg:px-14 py-16
        "
      >
        {/* HEADER */}
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-[#7F1D1D]">
            Peraturan Program Magang
          </h2>
          <p className="text-gray-700 mt-4 max-w-2xl mx-auto">
            Berikut adalah ketentuan dan peraturan yang wajib dipatuhi oleh seluruh
            peserta program magang di Balai Besar POM Palembang.
          </p>
        </div>

        {/* TIMELINE */}
        <div className="relative">
          {/* LINE */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-linear-to-b from-[#FACC15] via-[#B91C1C] to-[#7F1D1D] hidden sm:block" />

          <div className="space-y-10">
            {peraturanList.map((item, index) => (
              <div
                key={index}
                className="relative flex gap-6 pl-16"
              >
                {/* NUMBER / ICON */}
                <div
                  className={`
                    absolute
                    left-0
                    top-1/2
                    -translate-y-1/2
                    w-12 h-12
                    rounded-xl
                    bg-linear-to-r ${item.color}
                    text-white
                    flex items-center justify-center
                    shadow-lg
                    ring-2 ring-[#FDE68A]/40
                  `}
                >
                  <item.icon size={22} />
                </div>

                {/* CONTENT */}
                <div
                  className="
                    bg-white/40 backdrop-blur-lg
                    border border-white/50
                    rounded-2xl
                    p-6
                    shadow-md
                    hover:shadow-lg
                    transition
                    w-full
                  "
                >
                  <h3 className="text-lg font-bold text-[#7F1D1D] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTNOTE */}
        <div className="mt-16 text-center text-sm text-gray-600">
          Dengan mengikuti program magang ini, peserta dianggap telah memahami dan
          menyetujui seluruh peraturan yang berlaku.
        </div>
      </div>
    </section>
  );
}