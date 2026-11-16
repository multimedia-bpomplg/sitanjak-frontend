export type Peserta = {
  userId?: string | null;
  nama: string;
  email: string;
  wa: string;

  posisi: string;
  jurusan?: string;
  asal?: {
    jenis: string;
    nama: string;
  } | null;
  statusMagang?: string;

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

  kategori?: string;

  mentor?: {
    name: string;
    email: string;
    posisiMentor: string;
  };
};
