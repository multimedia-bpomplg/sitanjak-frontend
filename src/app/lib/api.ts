/* ======================================
   GLOBAL API HELPER
====================================== */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/* ======================
   RESPONSE HANDLER
====================== */
async function handleResponse(res: Response) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Terjadi kesalahan");
  }
  return data;
}

/* ======================
   AUTH API
====================== */
export async function loginApi(payload: {
  email: string;
  password: string;
  captchaToken: string;
}) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
}
