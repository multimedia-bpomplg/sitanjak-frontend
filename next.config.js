/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    unoptimized: true, // ⬅️ TAMBAHKAN INI

    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5001",
        pathname: "/api/uploads/**",
      },
    ],
  },
};

module.exports = nextConfig;
