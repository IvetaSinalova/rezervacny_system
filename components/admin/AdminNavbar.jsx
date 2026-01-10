"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import Image from "next/image";

export default function AdminNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-[#59513f] text-white px-6 py-3 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <Image
            src="/logo.jpg" // your logo path in /public folder
            alt="Psia škola"
            width={60} // adjust size
            height={60}
            className="object-contain"
          />
          <span className="text-xl font-semibold">Psia škola</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 items-center text-lg">
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="bg-white text-[#302D23] px-4 py-1 rounded-md hover:bg-gray-200 transition"
          >
            Odhlásiť sa
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? "✖" : "☰"}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {open && (
        <div className="md:hidden flex flex-col gap-4 mt-3 text-lg pb-4">
          <Link
            href="/admin/kalendar"
            className="px-2"
            onClick={() => setOpen(false)}
          >
            Kalendár udalostí
          </Link>

          <Link
            href="/admin/prevychova"
            className="px-2"
            onClick={() => setOpen(false)}
          >
            Prevýchova
          </Link>

          <Link
            href="/admin/vycvik"
            className="px-2"
            onClick={() => setOpen(false)}
          >
            Výcvik
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="bg-white text-[#302D23] mx-2 py-1 rounded-md hover:bg-gray-200 transition"
          >
            Odhlásiť sa
          </button>
        </div>
      )}
    </nav>
  );
}
