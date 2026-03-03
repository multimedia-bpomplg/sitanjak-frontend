"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  HiLockClosed,
  HiEye,
  HiEyeOff,
  HiShieldCheck,
  HiKey,
  HiOutlineLogin,
  HiOutlineExclamationCircle,
  HiFingerPrint,
  HiOutlineRefresh,
} from "react-icons/hi";
import { superadminCoreLoginApi } from "@/app/lib/api";

// Validasi email dengan regex yang lebih ketat
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Animasi loading dots
const LoadingDots = () => {
  return (
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
    </div>
  );
};

// Komponen untuk menampilkan kekuatan password
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return Math.min(score, 4);
  };

  const strength = getStrength(password);
  const strengthLabels = ["Lemah", "Cukup", "Baik", "Kuat", "Sangat Kuat"];
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-emerald-500",
  ];

  if (password.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1 h-1.5">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-300 ${
              i < strength ? strengthColors[strength - 1] : "bg-gray-700"
            }`}
          />
        ))}
      </div>
      <p
        className={`text-xs ${strengthColors[strength - 1].replace("bg-", "text-")}`}
      >
        {strengthLabels[strength]}
      </p>
    </div>
  );
};

// Komponen untuk modal konfirmasi
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  email,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  email: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-gray-900 rounded-2xl p-8 max-w-md mx-4 border border-red-900/30 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center">
            <HiShieldCheck className="text-red-500 text-2xl" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Akses Core System</h3>
            <p className="text-sm text-gray-400">
              Verifikasi keamanan tingkat tinggi
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400">Email terdaftar:</p>
            <p className="text-white font-mono">{email}</p>
          </div>

          <div className="bg-red-900/20 border border-red-900/30 rounded-lg p-4">
            <p className="text-sm text-red-400 flex items-start gap-2">
              <HiOutlineExclamationCircle className="text-lg flex-shrink-0 mt-0.5" />
              <span>
                Anda akan mengakses Core System dengan hak akses Superadmin
                penuh. Semua aktivitas akan diaudit dan dicatat.
              </span>
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition font-medium"
            >
              Batal
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-3 bg-red-700 hover:bg-red-600 rounded-lg transition font-medium"
            >
              Lanjutkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SuperadminCoreLogin() {
  const router = useRouter();
  const emailInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    email: "",
    password: "",
  });

  // Auto focus email input on mount
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  // Lock mechanism
  useEffect(() => {
    if (isLocked && lockTimeRemaining > 0) {
      const timer = setTimeout(() => {
        setLockTimeRemaining((prev) => prev - 1);
      }, 1000);

      if (lockTimeRemaining === 0) {
        setIsLocked(false);
        setAttemptCount(0);
      }

      return () => clearTimeout(timer);
    }
  }, [isLocked, lockTimeRemaining]);

  /* =====================
     AUTO REDIRECT IF ALREADY SUPERADMIN
  ===================== */
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem("token");

        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const roles = payload.roles || [];

          if (roles.includes("superadmin")) {
            router.push("/dashboard/superadmin");
          }
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      }
    };

    checkAuth();
  }, [router]);

  /* =====================
     VALIDASI FORM
  ===================== */
  const validateForm = (): boolean => {
    const errors = {
      email: "",
      password: "",
    };

    if (!form.email) {
      errors.email = "Email wajib diisi";
    } else if (!emailRegex.test(form.email)) {
      errors.email = "Format email tidak valid";
    }

    if (!form.password) {
      errors.password = "Password wajib diisi";
    } else if (form.password.length < 8) {
      errors.password = "Password minimal 8 karakter";
    }

    setValidationErrors(errors);
    return !errors.email && !errors.password;
  };

  /* =====================
     HANDLE LOGIN
  ===================== */
  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const data = await superadminCoreLoginApi({
        email: form.email,
        password: form.password,
      });

      const roles = data.roles || [];

      /* 🚨 HARD VALIDATION ROLE */
      if (!roles.includes("superadmin")) {
        setAttemptCount((prev) => prev + 1);
        setError("Akses ditolak. Halaman ini hanya untuk Superadmin.");

        // Lock setelah 3 percobaan
        if (attemptCount >= 2) {
          setIsLocked(true);
          setLockTimeRemaining(30);
        }

        setLoading(false);
        return;
      }

      /* STORE TOKEN DENGAN SECURE FLAGS */
      document.cookie = `token=${data.token}; path=/; secure; samesite=strict; max-age=86400`;
      document.cookie = `roles=${JSON.stringify(roles)}; path=/; secure; samesite=strict; max-age=86400`;

      localStorage.setItem("token", data.token);

      // 🔥 Decode token untuk ambil name
      const payload = JSON.parse(atob(data.token.split(".")[1]));

      localStorage.setItem("roles", JSON.stringify(payload.roles || []));

      // Audit log
      console.info(
        `[AUDIT] Superadmin login: ${form.email} at ${new Date().toISOString()}`,
      );

      router.push("/dashboard/superadmin");
    } catch (err: any) {
      setAttemptCount((prev) => prev + 1);
      setError(err.message || "Login gagal");

      // Lock setelah 3 percobaan
      if (attemptCount >= 2) {
        setIsLocked(true);
        setLockTimeRemaining(30);
      }

      setLoading(false);
    }
  };

  /* =====================
     SUBMIT HANDLER
  ===================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) return;

    if (!validateForm()) {
      return;
    }

    setShowConfirmation(true);
  };

  /* =====================
     RESET FORM
  ===================== */
  const handleReset = () => {
    setForm({ email: "", password: "" });
    setError("");
    setValidationErrors({ email: "", password: "" });
    emailInputRef.current?.focus();
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-950 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, red 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Animated Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-700/20 rounded-full blur-3xl animate-pulse" />

        <div className="relative w-full max-w-md mx-4">
          {/* Security Badge */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-900/30 backdrop-blur px-4 py-2 rounded-full border border-red-700/30">
            <HiFingerPrint className="text-red-500" />
            <span className="text-xs font-mono text-red-300">
              SECURE CORE ACCESS
            </span>
            <HiShieldCheck className="text-red-500" />
          </div>

          <div className="bg-gray-900/90 backdrop-blur rounded-3xl p-10 shadow-2xl border border-red-900/30">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-red-700 to-red-900 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-red-900/50">
                <HiKey className="text-white text-3xl" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2 tracking-widest">
                CORE SYSTEM
              </h1>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <p className="text-sm text-gray-400">
                  Superadmin Authentication
                </p>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </div>
            </div>

            {/* Lock Status */}
            {isLocked && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-xl text-center">
                <HiLockClosed className="text-red-500 text-2xl mx-auto mb-2" />
                <p className="text-red-400 font-medium">Sistem Terkunci</p>
                <p className="text-sm text-gray-400">
                  Coba lagi dalam {lockTimeRemaining} detik
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* EMAIL FIELD */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Superadmin Email
                </label>
                <input
                  ref={emailInputRef}
                  type="email"
                  placeholder="superadmin@domain.com"
                  className={`
                    w-full px-4 py-3 rounded-xl bg-gray-800 border 
                    focus:outline-none focus:ring-2 transition-all
                    ${
                      validationErrors.email
                        ? "border-red-700 focus:ring-red-700/50"
                        : "border-gray-700 focus:border-red-600 focus:ring-red-600/50"
                    }
                  `}
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    if (validationErrors.email) {
                      setValidationErrors((prev) => ({ ...prev, email: "" }));
                    }
                  }}
                  disabled={loading || isLocked}
                  required
                />
                {validationErrors.email && (
                  <p className="mt-1 text-xs text-red-500">
                    {validationErrors.email}
                  </p>
                )}
              </div>

              {/* PASSWORD FIELD */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Password
                </label>
                <div className="relative">
                  <HiLockClosed className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`
                      w-full pl-10 pr-10 py-3 rounded-xl bg-gray-800 border 
                      focus:outline-none focus:ring-2 transition-all
                      ${
                        validationErrors.password
                          ? "border-red-700 focus:ring-red-700/50"
                          : "border-gray-700 focus:border-red-600 focus:ring-red-600/50"
                      }
                    `}
                    value={form.password}
                    onChange={(e) => {
                      setForm({ ...form, password: e.target.value });
                      if (validationErrors.password) {
                        setValidationErrors((prev) => ({
                          ...prev,
                          password: "",
                        }));
                      }
                    }}
                    disabled={loading || isLocked}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-300 transition"
                  >
                    {showPassword ? <HiEyeOff /> : <HiEye />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                <PasswordStrengthIndicator password={form.password} />

                {validationErrors.password && (
                  <p className="mt-1 text-xs text-red-500">
                    {validationErrors.password}
                  </p>
                )}
              </div>

              {/* ERROR MESSAGE */}
              {error && (
                <div className="p-4 bg-red-900/30 border border-red-700 rounded-xl">
                  <p className="text-sm text-red-400 text-center">{error}</p>
                </div>
              )}

              {/* ATTEMPT COUNTER */}
              {attemptCount > 0 && !isLocked && (
                <p className="text-xs text-gray-500 text-center">
                  Percobaan gagal: {attemptCount}/3
                </p>
              )}

              {/* ACTION BUTTONS */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || isLocked}
                  className="
                    w-full py-4 bg-gradient-to-r from-red-700 to-red-900 
                    hover:from-red-600 hover:to-red-800 
                    rounded-xl font-semibold tracking-wider
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all transform hover:scale-[1.02] active:scale-[0.98]
                    flex items-center justify-center gap-2 group
                  "
                >
                  {loading ? (
                    <>
                      <LoadingDots />
                      <span className="ml-2">Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <HiOutlineLogin className="text-lg group-hover:rotate-12 transition-transform" />
                      AKSES CORE SYSTEM
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="
                    w-full py-3 bg-gray-800 hover:bg-gray-700 
                    rounded-xl text-sm text-gray-400 hover:text-white
                    transition flex items-center justify-center gap-2
                  "
                >
                  <HiOutlineRefresh />
                  Reset Form
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-800">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>© 2026 SITANJAK</span>
                <span className="font-mono">v2.0.0 • CORE</span>
                <span className="flex items-center gap-1">
                  <HiShieldCheck />
                  AES-256
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleLogin}
        email={form.email}
      />
    </>
  );
}
