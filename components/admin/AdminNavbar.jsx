"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function AdminNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // 1. Close menu when screen becomes larger than 768px
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 2. Helper to close menu when a link is clicked
  const closeMenu = () => setOpen(false);

  const menuItems = [
    {
      label: "Kalendár udalostí",
      submenu: [
        { label: "Prehľad", href: "/admin/overview" },
        { label: "Spravovať udalosti", href: "/admin/manage-events" },
      ],
    },
    {
      label: "Dlhodobé ubytovanie",
      submenu: [
        { label: "Typ ubytovania", href: "/admin/accomodation" },
        {
          label: "Spravovať ubytovanie",
          href: "/admin/update-long-term-events",
        },
      ],
    },
    {
      label: "Prehľad rezervácií",
      submenu: [
        { label: "Kurzy", href: "/admin/short-term-reservations-overview" },
        {
          label: "Dlhodobé ubytovanie",
          href: "/admin/long-term-reservations-overview",
        },
      ],
    },
    {
      label: "Vytvoriť rezerváciu",
      submenu: [
        { label: "Kurz", href: "/admin/create-event-reservation" },
        {
          label: "Prevýchova",
          href: "/admin/create-rehabilitation-reservation",
        },
        { label: "Výcvik", href: "/admin/create-training-reservation" },
        { label: "Hotel", href: "/admin/create-hotel-reservation" },
        {
          label: "Hotel s ubytovaním",
          href: "/admin/create-long-term-hotel-reservation",
        },
        { label: "Hala", href: "/admin/hall-reservation" },
      ],
    },
  ];

  return (
    <nav className="bg-[#59513f] text-white shadow-xl sticky top-0 z-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 group"
          >
            <div>
              <Image
                src="/logo.jpg"
                alt="Logo"
                width={65}
                height={65}
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tight">Psia škola</span>
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="hidden md:flex ml-4 bg-white hover:bg-transparent hover:text-white px-4 py-2 rounded-lg text-md font-semibold transition border text-[var(--color-primary)]"
          >
            Odhlásiť
          </button>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-black/10 transition"
            onClick={() => setOpen(!open)}
          >
            {open ? (
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity md:hidden ${open ? "opacity-100 visible" : "opacity-0 invisible"}`}
        style={{ zIndex: 40 }}
        onClick={closeMenu}
      />

      {/* Mobile Sidebar (WHITE BACKGROUND) */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[300px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 md:hidden overflow-x-hidden ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-4 flex flex-col h-full text-gray-800">
          <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-2">
            <button
              onClick={closeMenu}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500 ml-auto flex items-center justify-center"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {menuItems.map((item) => (
              <div key={item.label} className="mb-6">
                <h3 className="text-sm uppercase tracking-[2px] text-[var(--color-primary)] font-bold mb-3 px-2">
                  {item.label}
                </h3>
                <div className="space-y-0.5">
                  {item.submenu.map((sub) => {
                    const isActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={closeMenu}
                        className={`block p-3 mx-2 rounded-xl text-sm transition-all ${
                          isActive
                            ? "bg-[var(--color-secondary)] text-white shadow-md font-bold"
                            : "text-black hover:bg-gray-100 hover:text-[#59513f]"
                        }`}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-6 w-full bg-[#59513f] text-white py-4 rounded-xl font-bold hover:bg-[#453e30] transition active:scale-95 shadow-lg"
          >
            Odhlásiť sa
          </button>
        </div>
      </div>
    </nav>
  );
}
