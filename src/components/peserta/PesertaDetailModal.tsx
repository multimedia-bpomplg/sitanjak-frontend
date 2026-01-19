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
    <div className="fixed inset-0 z-50 flex">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* modal */}
      <div
        className="
          relative ml-auto
          w-full max-w-2xl h-full
          bg-white dark:bg-[#0B0614]
          overflow-y-auto
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-[#0B0614]">
          <h2 className="text-lg font-bold">Detail Peserta</h2>
          <button onClick={onClose}>
            <HiX className="text-xl" />
          </button>
        </div>

        {/* content */}
        <div className="p-6 space-y-6 text-sm">
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
              <p className="text-slate-400">Belum ada mentor</p>
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
    <div className="space-y-3">
      <h3 className="font-semibold">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Item({ label, value, icon }: any) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium flex items-center gap-1">
        {icon}
        {value || "-"}
      </p>
    </div>
  );
}
