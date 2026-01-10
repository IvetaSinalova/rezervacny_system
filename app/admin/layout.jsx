// app/admin/layout.jsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // cesta k novému súboru
import { redirect } from "next/navigation";

import AdminNavbar from "../../components/admin/AdminNavbar";
import SidebarMenu from "../../components/admin/SidebarMenu";
import { AdminDataProvider } from "../../context/AdminDataContext";

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);

  // 1. Ak nie je prihlásený alebo nie je admin, layout vôbec nevykreslíme
  if (!session || session.user?.role !== "admin") {
    // Ak ide o stránku login, nechceme redirect (aby sme sa vyhli slučke),
    // ale vrátime len čisté deti (children) bez admin prvkov.
    return <>{children}</>;
  }

  return (
    <AdminDataProvider>
      <AdminNavbar />
      <div style={{ display: "flex", flex: "1 1 auto" }}>
        <div
          style={{
            flex: "0 0 250px",
            height: "calc(100vh - 85px)",
            overflowY: "auto",
          }}
        >
          <SidebarMenu />
        </div>
        <div style={{ flex: "1 1 auto", padding: "1rem" }}>{children}</div>
      </div>
    </AdminDataProvider>
  );
}
