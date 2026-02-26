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
   AUTH API (EXISTING)
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

/* ======================
   OTP LOGIN API (BARU)
====================== */

// Request OTP untuk login
export async function loginWithOtpApi(payload: { email: string }) {
  const res = await fetch(`${BASE_URL}/auth/login-otp/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
}

// Verifikasi OTP login
export async function verifyOtpLoginApi(payload: {
  email: string;
  otp: string;
}) {
  const res = await fetch(`${BASE_URL}/auth/login-otp/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
}

/* ======================
   SUPERADMIN CORE LOGIN
====================== */

export async function superadminCoreLoginApi(payload: {
  email: string;
  password: string;
}) {
  const res = await fetch(`${BASE_URL}/auth/core-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
}
