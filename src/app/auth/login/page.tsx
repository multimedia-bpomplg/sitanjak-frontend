"use client";

import { useState } from "react";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Login berhasil");
      localStorage.setItem("token", data.token);
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-4">Login</h1>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border rounded"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 border rounded"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button className="w-full bg-blue-600 text-white p-3 rounded">
          Login
        </button>
      </form>
    </div>
  );
}
