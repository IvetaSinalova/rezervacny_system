import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdmin = token?.role === "admin";
    const pathname = req.nextUrl.pathname;

    // If trying to access admin area without admin role
    if (pathname.startsWith("/admin/dashboard") && !isAdmin) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  },
  {
    callbacks: {
      // This ensures the middleware only runs if a session exists
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/admin/login", // Redirects here if not logged in at all
    },
  }
);

// Only protect these specific routes
export const config = {
  matcher: [
    "/admin/dashboard/:path*",
    "/admin/overview/:path*",
    "/admin/manage-events/:path*",
    "/admin/accomodation/:path*",
    "/admin/update-long-term-events/:path*",
    "/admin/short-term-reservations-overview/:path*",
    "/admin/long-term-reservations-overview/:path*",
  ],
};
