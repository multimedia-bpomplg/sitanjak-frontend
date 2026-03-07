import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ConfirmProvider } from "@/components/ui/ConfirmProvider";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sitanjak.tech"),

  title: {
    default: "SI TANJAK - Sistem Informasi Magang BPOM Palembang",
    template: "%s | SI TANJAK",
  },

  description:
    "SI TANJAK adalah Sistem Informasi Tahapan dan Jangkauan Magang Akademik di Balai Besar POM Palembang untuk pendaftaran magang mahasiswa dan magang SMK secara digital.",

  keywords: [
    "sitanjak",
    "sitanjak bpom palembang",
    "magang bpom",
    "magang bpom palembang",
    "magang palembang",
    "magang smk",
    "magang mahasiswa",
    "balai besar pom palembang",
    "bpom palembang",
  ],

  /* ================= CANONICAL ================= */
  alternates: {
    canonical: "/",
  },

  /* ================= ICON ================= */
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },

  /* ================= ROBOTS ================= */
  robots: {
    index: true,
    follow: true,
  },

  /* ================= OPEN GRAPH ================= */
  openGraph: {
    title: "SI TANJAK - Sistem Informasi Magang BPOM Palembang",
    description:
      "Platform digital pendaftaran dan pengelolaan magang mahasiswa dan SMK di BPOM Palembang.",
    url: "https://sitanjak.tech",
    siteName: "SI TANJAK",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/seo.png",
        width: 1200,
        height: 630,
      },
    ],
  },

  /* ================= TWITTER ================= */
  twitter: {
    card: "summary_large_image",
    title: "SI TANJAK - Sistem Informasi Magang BPOM Palembang",
    description:
      "Platform digital pendaftaran dan pengelolaan magang mahasiswa dan SMK di BPOM Palembang.",
    images: ["/seo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.variable} antialiased`}>
        <ConfirmProvider>{children}</ConfirmProvider>

        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
          theme="light"
        />

        {/* ================= GOOGLE ANALYTICS ================= */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-N99D5H3PSJ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-N99D5H3PSJ');
          `}
        </Script>
      </body>
    </html>
  );
}
