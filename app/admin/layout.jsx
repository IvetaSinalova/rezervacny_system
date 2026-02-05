// app/admin/layout.jsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

import AdminNavbar from "../../components/admin/AdminNavbar";
import SidebarMenu from "../../components/admin/SidebarMenu";
import { AdminDataProvider } from "../../context/AdminDataContext";

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "admin") {
    return <>{children}</>;
  }

  return (
    <AdminDataProvider>
      {/* Wrapper to ensure the layout takes at least full screen height */}
      <div className="min-h-screen flex flex-col">
        <AdminNavbar />

        <div className="flex flex-1">
          {/* SIDEBAR WRAPPER */}
          {/* hidden = 0px width on mobile. md:block = 250px on desktop */}
          <aside className="hidden md:block w-[250px] sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto bg-white z-10 shadow-[4px_0_10px_-3px_rgba(0,0,0,0.1)]">
            <SidebarMenu />
          </aside>

          {/* MAIN CONTENT */}
          {/* flex-1 ensures it grows to fill all available space */}
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </AdminDataProvider>
  );
}
