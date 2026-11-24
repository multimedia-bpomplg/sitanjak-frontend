export type ProfilIconKey =
  | "shield"
  | "beaker"
  | "academic"
  | "users"
  | "check"
  | "building";

export interface ProfilHighlightItem {
  title: string;
  desc: string;
  iconKey: ProfilIconKey | string;
}

export interface ProfilLandingContent {
  isCustom?: boolean;
  overlineTag: string;
  headingLine1: string;
  headingHighlight: string;
  profilDescription: string;
  profilHighlights: ProfilHighlightItem[];
  visi: string;
  misiList: string[];
  dasarHukumRegulasi: string;
  dasarHukumTentang: string;
  tugasPokok: string;
  fungsiUtamaList: string[];
  updatedBy?: { name?: string; email?: string } | null;
  updatedAt?: string | null;
}

export const PROFIL_ICON_OPTIONS: Array<{
  key: ProfilIconKey;
  label: string;
}> = [
  { key: "shield", label: "Perisai (Pengawasan)" },
  { key: "beaker", label: "Tabung Uji (Laboratorium)" },
  { key: "academic", label: "Toga Akademik (Edukasi)" },
  { key: "users", label: "Grup SDM (Tim Ahli)" },
  { key: "check", label: "Centang (Mutu / Layanan)" },
  { key: "building", label: "Gedung (Instansi)" },
];

export const DEFAULT_PROFIL_LANDING: ProfilLandingContent = {
  isCustom: false,
  overlineTag: "BALAI BESAR POM DI PALEMBANG",
  headingLine1: "Balai Besar Pengawas Obat",
  headingHighlight: "dan Makanan di Palembang",
  profilDescription:
    "Balai Besar Pengawas Obat dan Makanan (BBPOM) di Palembang merupakan Unit Pelaksana Teknis Badan POM yang bertugas melaksanakan pengawasan Obat dan Makanan untuk menjamin keamanan, mutu, dan manfaat produk, sekaligus menyediakan wadah pembelajaran profesional melalui program magang SI TANJAK.",
  profilHighlights: [
    {
      title: "Pengawasan Terpadu",
      desc: "Mengawal keamanan, mutu, dan khasiat Obat serta Makanan di masyarakat.",
      iconKey: "shield",
    },
    {
      title: "Laboratorium Modern",
      desc: "Fasilitas pengujian kimia, mikrobiologi, dan molekuler berstandar tinggi.",
      iconKey: "beaker",
    },
    {
      title: "Edukasi & Pembinaan",
      desc: "Wadah pembelajaran nyata bagi mahasiswa dan siswa magang akademik.",
      iconKey: "academic",
    },
    {
      title: "SDM Profesional",
      desc: "Didukung pengawas farmasi dan pangan ahli yang siap membimbing.",
      iconKey: "users",
    },
  ],
  visi: "Terwujudnya Sediaan Farmasi dan Pangan Olahan yang aman, bermutu, dan berdaya saing dalam mendukung masyarakat sehat dan sejahtera bersama Indonesia Maju menuju Indonesia Emas 2045.",
  misiList: [
    "Meningkatkan efektivitas pengawasan Sediaan Farmasi dan Pangan Olahan serta penindakan kejahatan melalui kolaborasi pemerintah, pelaku usaha, dan masyarakat.",
    "Memfasilitasi percepatan pengembangan dunia usaha Sediaan Farmasi dan Pangan Olahan termasuk UMKM guna membangun struktur ekonomi yang produktif dan berdaya saing.",
    "Meningkatkan kapasitas masyarakat di bidang Sediaan Farmasi dan Pangan Olahan dengan mengembangkan kemitraan bersama seluruh pemangku kepentingan.",
    "Pengelolaan pemerintahan yang bersih, efektif, dan terpercaya untuk memberikan pelayanan publik yang prima.",
  ],
  dasarHukumRegulasi: "Peraturan Badan POM Nomor 19 Tahun 2023",
  dasarHukumTentang:
    "tentang Organisasi dan Tata Kerja Unit Pelaksana Teknis di Lingkungan Badan POM:",
  tugasPokok:
    "Melaksanakan tugas teknis operasional di bidang pengawasan Obat dan Makanan pada wilayah kerja masing-masing sesuai dengan ketentuan peraturan perundang-undangan.",
  fungsiUtamaList: [
    "Penyusunan rencana, program, dan anggaran di bidang pengawasan Obat dan Makanan;",
    "Pelaksanaan pemeriksaan fasilitas produksi Obat dan Makanan;",
    "Pelaksanaan pemeriksaan fasilitas distribusi Obat dan Makanan dan fasilitas pelayanan kefarmasian;",
    "Pelaksanaan sertifikasi produk dan fasilitas produksi dan distribusi Obat dan Makanan;",
    "Pelaksanaan sampling Obat dan Makanan;",
    "Pelaksanaan pemantauan label dan iklan Obat dan Makanan;",
    "Pelaksanaan pengujian rutin Obat dan Makanan;",
    "Pelaksanaan pengujian Obat dan Makanan dalam rangka investigasi dan penyidikan;",
    "Pelaksanaan cegah tangkal, intelijen, dan penyidikan terhadap pelanggaran ketentuan peraturan perundang-undangan;",
    "Pelaksanaan pemantauan peredaran Obat dan Makanan melalui siber;",
    "Pengelolaan komunikasi, informasi, edukasi, dan pengaduan masyarakat;",
    "Pelaksanaan kerja sama di bidang pengawasan Obat dan Makanan;",
    "Pelaksanaan pemantauan, evaluasi, dan pelaporan di bidang pengawasan Obat dan Makanan;",
    "Pelaksanaan urusan tata usaha dan rumah tangga; dan",
    "Pelaksanaan fungsi lain yang diberikan oleh Kepala Badan.",
  ],
};
