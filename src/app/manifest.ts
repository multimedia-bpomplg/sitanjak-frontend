import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SI TANJAK - Peserta Magang BPOM Palembang",
    short_name: "SI TANJAK",
    description:
      "Portal Peserta Magang Balai Besar POM di Palembang untuk absensi, logbook harian, dan progres magang.",
    start_url: "/dashboard/peserta",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFFFFF",
    theme_color: "#1D64F2",
    lang: "id",
    icons: [
      {
        src: "/images/assets-new/icon-mobile/192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/assets-new/icon-mobile/512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/assets-new/icon-mobile/192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/images/assets-new/icon-mobile/512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
