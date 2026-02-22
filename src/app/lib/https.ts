const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function http<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // 🔥 PAKAI OBJECT BIASA (BIAR TYPESCRIPT AMAN)
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Gabungkan headers dari options kalau ada
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  // Tambahkan Authorization jika token ada
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Request error");
  }

  return res.json();
}
