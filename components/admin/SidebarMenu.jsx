"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarMenu() {
  const pathname = usePathname();

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
          label: "Spravovať ubytovanie alebo kurz",
          href: "/admin/update-long-term-events",
        },
      ],
    },
    {
      label: "Prehľad rezervácií",
      submenu: [
        { label: "Kurzy", href: "/admin/short-term-reservations-overview" },
        {
          label: "Dlhodobé ubytovanie a prevýchovy",
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
          label: "Hotel s dlhodobým ubytovaním",
          href: "/admin/create-long-term-hotel-reservation",
        },
        {
          label: "Hala",
          href: "/admin/hall-reservation",
        },
      ],
    },
  ];

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #ddd",
        boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
        background: "#fff",
      }}
    >
      <ul style={{ margin: 0, padding: 0, listStyle: "none", flex: 1 }}>
        {menuItems.map((item) => (
          <li key={item.label}>
            {/* Main menu label */}
            <div
              style={{
                padding: "1rem",
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              {item.label}
            </div>

            {/* Submenu */}
            {item.submenu && (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {item.submenu.map((subItem) => (
                  <li key={subItem.href}>
                    <Link
                      href={subItem.href}
                      style={{
                        display: "block",
                        padding: "0.5rem 2rem",
                        fontSize: "16px",
                        background:
                          pathname === subItem.href ? "#655E56" : "transparent",
                        color: pathname === subItem.href ? "white" : "black",
                        textDecoration: "none",
                      }}
                    >
                      {subItem.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
