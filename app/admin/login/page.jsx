"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";

export default function AdminLogin() {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: e.target.email.value,
        password: e.target.password.value,
        callbackUrl: "/admin/overview",
      });

      if (res?.error) {
        setError("Nesprávny email alebo heslo");
      } else if (res?.url) {
        window.location.href = res.url;
        return;
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <Image src="/logo.jpg" alt="Logo" width={96} height={96} className="h-auto" priority />
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
            disabled={isSubmitting}
            className="bg-[#302D23] text-white py-2 rounded-lg hover:bg-opacity-90 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Prihlasujem…" : "Prihlásiť sa"}
          </button>
        </form>

        {error && <p className="text-red-600 text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
