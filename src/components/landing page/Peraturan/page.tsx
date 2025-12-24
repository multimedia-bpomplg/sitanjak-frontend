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
  },
  {
    title: "Durasi Magang",
    desc: "Pelaksanaan magang berlangsung minimal 1 bulan dan maksimal 6 bulan sesuai ketentuan instansi.",
    icon: HiClock,
  },
  {
    title: "Kehadiran & Disiplin",
    desc: "Peserta wajib mematuhi jam kerja, tata tertib, serta menjaga etika selama mengikuti program magang.",
    icon: HiUserGroup,
  },
  {
    title: "Laporan & Evaluasi",
    desc: "Peserta diwajibkan menyusun laporan magang dan mengikuti evaluasi di akhir periode.",
    icon: HiDocumentText,
  },
  {
    title: "Sanksi & Pembatalan",
    desc: "Pelanggaran terhadap peraturan dapat mengakibatkan teguran hingga pembatalan keikutsertaan magang.",
    icon: HiExclamation,
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
          bg-gradient-to-br from-blue-100/20 via-cyan-100/20 to-emerald-100/20
          backdrop-blur-xl
          rounded-3xl shadow-xl
          px-8 lg:px-14 py-16
        "
      >
        {/* HEADER */}
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-blue-900">
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
          <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-400 via-cyan-400 to-emerald-400 hidden sm:block" />

          <div className="space-y-10">
            {peraturanList.map((item, index) => (
              <div
                key={index}
                className="relative flex gap-6 pl-16"
              >
                {/* NUMBER / ICON */}
                <div
                  className="
                    absolute
                    left-0
                    top-1/2
                    -translate-y-1/2
                    w-12 h-12
                    rounded-xl
                    bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500
                    text-white
                    flex items-center justify-center
                    shadow-lg
                  "
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
                  <h3 className="text-lg font-bold text-blue-800 mb-2">
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