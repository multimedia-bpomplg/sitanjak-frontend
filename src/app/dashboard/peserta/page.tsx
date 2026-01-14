"use client";

import { useEffect, useState, useCallback } from "react";

/* ================= TYPES ================= */

type Peserta = {
  nama: string;
  email: string;
  wa: string;
  posisi: string;
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

  // fallback mentor (jika backend taruh di peserta)
  mentorNama?: string;
  mentorEmail?: string;
  mentorPosisi?: string;
};

type Mentor = {
  name: string;
  email: string;
  posisiMentor: string;
};

type Pendaftaran = {
  status: string;
  kategori: string;
  suratPengantar?: string;
  suratBalasan?: string;
  jawabanAdmin?: string;
  peserta: Peserta[];

  // kemungkinan mentor di root
  mentor?: Mentor;
  mentorNama?: string;
  mentorEmail?: string;
  mentorPosisi?: string;
};

/* ================= UTIL ================= */

function hitungDurasi(mulai?: string, selesai?: string) {
  if (!mulai || !selesai) return null;

  const start = new Date(mulai);
  const end = new Date(selesai);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start)
    return null;

  const totalHari = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    bulan: Math.floor(totalHari / 30),
    hari: totalHari % 30,
  };
}

const getInitial = (nama = "-") =>
  nama
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/* ================= MAIN ================= */

export default function PesertaDashboard() {
  const [pendaftaran, setPendaftaran] = useState<Pendaftaran | null>(null);
  const [open, setOpen] = useState(false);

  const FILE_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "";

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const payload = JSON.parse(atob(token.split(".")[1]));
      const email = payload.email;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pendaftaran/cek?email=${email}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      setPendaftaran(data);
    } catch (err) {
      console.error("Gagal memuat dashboard peserta", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!pendaftaran) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="animate-pulse text-slate-400">
          Memuat dashboard peserta...
        </span>
      </div>
    );
  }

  const peserta = pendaftaran.peserta?.[0];

  /* ================= RESOLVE MENTOR (ANTI GAGAL) ================= */

  const mentor = {
    nama: pendaftaran.mentor?.name || "Belum Ditentukan",
    email: pendaftaran.mentor?.email || "-",
    posisi: pendaftaran.mentor?.posisiMentor || "-",
  };

  const durasi = hitungDurasi(
    peserta?.tanggalMulaiMagang,
    peserta?.tanggalSelesaiMagang
  );

  const durasiText = durasi
    ? `(${durasi.bulan} bulan${durasi.hari ? ` ${durasi.hari} hari` : ""})`
    : "";

  /* ================= UI ================= */

  return (
    <div className="space-y-10">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-8 text-white shadow-xl">
        <div className="flex items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-3xl font-bold ring-4 ring-white/30">
            {getInitial(peserta.nama)}
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              Selamat Datang, {peserta.nama} 👋
            </h1>
            <p className="text-sm text-white/80">{peserta.email}</p>
            <span className="mt-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              Peserta Magang Aktif
            </span>
          </div>
        </div>
      </div>

      {/* ================= STAT (TAMPILAN AWAL) ================= */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Status Magang" value={pendaftaran.status} />
        <StatCard title="Posisi" value={peserta.posisi} />

        <StatCard
          title="Periode"
          value={
            <>
              <div>
                {peserta.tanggalMulaiMagang} – {peserta.tanggalSelesaiMagang}
              </div>
              {durasiText && (
                <div className="mt-1 text-xs text-slate-500">{durasiText}</div>
              )}
            </>
          }
        />

        {/* MENTOR */}
        <StatCard
          title="Mentor"
          value={
            <div className="flex items-start gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                {getInitial(mentor.nama)}
              </div>
              <div>
                <div className="font-semibold">{mentor.nama}</div>
                <div className="text-xs text-slate-500">{mentor.email}</div>
                <div className="text-xs text-slate-400">{mentor.posisi}</div>
              </div>
            </div>
          }
        />
      </div>

      {/* ================= DROPDOWN ================= */}
      <div className="overflow-hidden rounded-3xl border bg-white/80 shadow-xl backdrop-blur dark:bg-slate-900/80">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between px-8 py-6 text-left"
        >
          <div>
            <h2 className="text-xl font-bold">📂 Detail Informasi Peserta</h2>
            <p className="text-sm text-slate-500">
              Data diri, alamat, kategori, dokumen, dan catatan admin
            </p>
          </div>
          <span
            className={`text-2xl transition-transform ${
              open ? "rotate-180" : ""
            }`}
          >
            ⌄
          </span>
        </button>

        <div
          className={`grid transition-all duration-300 ${
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="space-y-10 overflow-hidden px-8 pb-8">
            {/* KATEGORI PINDAH KE DROPDOWN */}
            <Section title="🏷️ Informasi Magang">
              <Grid>
                <Item label="Kategori Magang" value={pendaftaran.kategori} />
              </Grid>
            </Section>

            <Section title="📄 Data Diri Peserta">
              <Grid>
                <Item label="Nama Lengkap" value={peserta.nama} />
                <Item label="Jenis Kelamin" value={peserta.jenisKelamin} />
                <Item label="Tempat Lahir" value={peserta.tempatLahir} />
                <Item label="Tanggal Lahir" value={peserta.tanggalLahir} />
                <Item label="Email" value={peserta.email} />
                <Item label="WhatsApp" value={peserta.wa} />
              </Grid>
            </Section>

            <Section title="📍 Alamat Lengkap">
              <Grid>
                <Item label="Provinsi" value={peserta.provinsi} />
                <Item label="Kota" value={peserta.kota} />
                <Item label="Kecamatan" value={peserta.kecamatan} />
                <Item label="Kelurahan" value={peserta.kelurahan} />
              </Grid>

              <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                <p className="mb-1 text-xs text-slate-500">Alamat Lengkap</p>
                <p className="font-medium">{peserta.alamatLengkap}</p>
              </div>
            </Section>

            <Section title="📎 Dokumen Magang">
              <Grid>
                <FileItem
                  label="Surat Pengantar"
                  file={pendaftaran.suratPengantar}
                  baseUrl={FILE_BASE_URL}
                />
                <FileItem
                  label="Surat Balasan"
                  file={pendaftaran.suratBalasan}
                  baseUrl={FILE_BASE_URL}
                />
              </Grid>
            </Section>

            <Section title="📝 Catatan Admin">
              <div className="rounded-xl border-l-4 border-yellow-400 bg-yellow-50 p-5 text-sm text-yellow-800">
                {pendaftaran.jawabanAdmin || "Belum ada catatan dari admin"}
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= UI COMPONENTS ================= */

function Section({ title, children }: { title: string; children: any }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Grid({ children }: { children: any }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-2xl border bg-gradient-to-br from-white to-slate-50 p-5 shadow-md dark:from-slate-900 dark:to-slate-800">
      <p className="text-xs text-slate-500">{title}</p>
      <div className="mt-1 text-sm font-bold">{value}</div>
    </div>
  );
}

function Item({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-medium">{value || "-"}</p>
    </div>
  );
}

function FileItem({
  label,
  file,
  baseUrl,
}: {
  label: string;
  file?: string;
  baseUrl: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="max-w-[180px] truncate text-sm font-medium">
          {file || "Tidak tersedia"}
        </p>
      </div>

      {file && (
        <a
          href={`${baseUrl}/uploads/${file}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-emerald-600 hover:underline"
        >
          Lihat
        </a>
      )}
    </div>
  );
}
