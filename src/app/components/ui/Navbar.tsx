"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <nav className="w-full bg-blue-700 text-white px-6 py-4 shadow">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-semibold tracking-wide">
          BPOM Magang
        </Link>

        <div className="flex gap-6 items-center">
          <Link href="/" className="hover:text-blue-200">
            Home
          </Link>
          <Link href="/auth/register" className="hover:text-blue-200">
            Daftar
          </Link>

          {token ? (
            <>
              <Link href="/dashboard" className="hover:text-blue-200">
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/auth/login" className="hover:text-blue-200">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
