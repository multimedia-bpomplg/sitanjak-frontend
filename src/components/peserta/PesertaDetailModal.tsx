"use client";

import {
  HiX,
  HiUser,
  HiMail,
  HiPhone,
  HiLocationMarker,
  HiCalendar,
  HiBriefcase,
} from "react-icons/hi";

type Peserta = {
  nama: string;
  email: string;
  wa: string;
  posisi: string;
  jurusan?: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  tanggalMulaiMagang: string;
  tanggalSelesaiMagang: string;
  provinsi: string;
  kota: string;
  kecamatan: string;
  kelurahan: string;
  alamatLengkap: string;
  mentor?: {
    name: string;
    email: string;
    posisiMentor: string;
  };
};

export default function PesertaDetailModal({
  open,
  onClose,
  peserta,
}: {
  open: boolean;
  onClose: () => void;
  peserta: Peserta | null;
}) {
  if (!open || !peserta) return null;

  return (
    <div className="fixed inset-0 z-40 flex pointer-events-none">
      {/* overlay */}
      <div
        className="
          absolute inset-y-0 right-0
          left-0 lg:left-72
          bg-black/40 backdrop-blur-sm
          pointer-events-auto
        "
        onClick={onClose}
      />

      {/* modal */}
      <div
        className="
          relative ml-auto
          w-full
          lg:w-[calc(100%-18rem)]
          max-w-none
          h-full
          bg-linear-to-br
          from-[#FFF7ED] via-[#FFE4E6] to-[#FEF3C7]
          dark:from-[#0B0614] dark:via-[#120A24] dark:to-[#1E0F3D]
          shadow-2xl
          flex flex-col
          animate-[slideIn_.3s_ease-out]
          pointer-events-auto
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          className="
            sticky top-0 z-20
            flex items-center justify-between
            px-6 py-4

            bg-linear-to-r
            from-[#7F1D1D] via-[#B91C1C] to-white
            dark:from-indigo-900 dark:via-violet-800 dark:to-purple-800

            border-b border-[#F59E0B]/40 dark:border-indigo-500/40
            shadow-lg

            text-white
          "
        >
          <div>
            <h2 className="text-lg font-bold">Detail Peserta</h2>
            <p className="text-xs text-white/80">
              Informasi lengkap peserta magang
            </p>
          </div>

          <button
            onClick={onClose}
            className="
              w-9 h-9 rounded-full
              flex items-center justify-center
              bg-white text-[#7F1D1D]
              hover:bg-rose-100
              dark:bg-white/10 dark:text-indigo-200
              transition
            "
          >
            <HiX className="text-lg" />
          </button>
        </div>

        {/* content */}
        <div className="p-5 sm:p-8 space-y-10 text-sm overflow-y-auto">
          <Section title="👤 Data Diri">
            <Item label="Nama" value={peserta.nama} icon={<HiUser />} />
            <Item label="Email" value={peserta.email} icon={<HiMail />} />
            <Item label="WhatsApp" value={peserta.wa} icon={<HiPhone />} />
            <Item label="Jenis Kelamin" value={peserta.jenisKelamin} />
            <Item label="Tempat Lahir" value={peserta.tempatLahir} />
            <Item label="Tanggal Lahir" value={peserta.tanggalLahir} />
          </Section>

          <Section title="💼 Informasi Magang">
            <Item
              label="Posisi"
              value={peserta.posisi}
              icon={<HiBriefcase />}
            />
            <Item label="Jurusan" value={peserta.jurusan} />
            <Item
              label="Mulai"
              value={peserta.tanggalMulaiMagang}
              icon={<HiCalendar />}
            />
            <Item
              label="Selesai"
              value={peserta.tanggalSelesaiMagang}
              icon={<HiCalendar />}
            />
          </Section>

          <Section title="📍 Alamat">
            <Item label="Provinsi" value={peserta.provinsi} />
            <Item label="Kota" value={peserta.kota} />
            <Item label="Kecamatan" value={peserta.kecamatan} />
            <Item label="Kelurahan" value={peserta.kelurahan} />
            <Item label="Alamat Lengkap" value={peserta.alamatLengkap} />
          </Section>

          <Section title="🧑‍🏫 Mentor">
            {peserta.mentor ? (
              <>
                <Item label="Nama Mentor" value={peserta.mentor.name} />
                <Item label="Email Mentor" value={peserta.mentor.email} />
                <Item
                  label="Posisi Mentor"
                  value={peserta.mentor.posisiMentor}
                />
              </>
            ) : (
              <p className="text-slate-400 text-sm">Belum ada mentor</p>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

/* ================= UI KECIL ================= */

function Section({ title, children }: any) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-[#7F1D1D] dark:text-indigo-300">
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  );
}

function Item({ label, value, icon }: any) {
  return (
    <div
      className="
        group
        rounded-2xl
        bg-white/90 dark:bg-white/5
        backdrop-blur
        border border-[#F59E0B]/30 dark:border-indigo-500/30
        p-4
        hover:shadow-lg hover:-translate-y-1
        transition
      "
    >
      <p className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-semibold flex items-center gap-2">
        {icon && (
          <span className="text-[#B91C1C] dark:text-indigo-400 text-base">
            {icon}
          </span>
        )}
        {value || "-"}
      </p>
    </div>
  );
}