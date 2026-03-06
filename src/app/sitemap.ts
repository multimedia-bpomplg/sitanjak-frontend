import { MetadataRoute } from "next";

const baseUrl = "https://sitanjak.tech";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/pendaftaran", "/pendaftaran/riwayat"];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
