"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function AdminLogin() {
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    const res = await signIn("credentials", {
      redirect: false,
      email: e.target.email.value,
      password: e.target.password.value,
      callbackUrl: "/admin/overview",
    });

    if (res?.error) {
      setError("Nesprávny email alebo heslo");
    } else if (res.url) {
      window.location.href = res.url; // manually redirect
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <img src="/logo.jpg" alt="Logo" className="w-24 h-auto" />
        </div>

        <h2 className="text-2xl font-semibold text-center mb-6 text-[#302D23]">
          Admin Login
        </h2>

        <form className="flex flex-col gap-4" onSubmit={handleLogin}>
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#302D23]"
          />

          <input
            name="password"
            type="password"
            placeholder="Heslo"
            required
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#302D23]"
          />

          <button
            type="submit"
            className="bg-[#302D23] text-white py-2 rounded-lg hover:bg-opacity-90 transition"
          >
            Prihlásiť sa
          </button>
        </form>

        {error && <p className="text-red-600 text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
