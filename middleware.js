import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdmin = token?.role === "admin";
    const pathname = req.nextUrl.pathname;

    // If trying to access admin area without admin role
    if (pathname.startsWith("/admin/overview") && !isAdmin) {
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
  },
);

// Only protect these specific routes
export const config = {
  matcher: [
    "/admin/3day-camp-reservation/:path*",
    "/admin/accomodation/:path*",
    "/admin/create-daily-hotel-reservation/:path*",
    "/admin/create-event-reservation/:path*",
    "/admin/create-hotel-reservation/:path*",
    "/admin/create-rehabilitation-reservation/:path*",
    "/admin/create-training-reservation/:path*",
    "/admin/discount-management/:path*",
    "/admin/hall-reservation/:path*",
    "/admin/long-term-reservations-overview/:path*",
    "/admin/manage-events/:path*",
    "/admin/overview/:path*",
    "/admin/reservation-stats/:path*",
    "/admin/short-term-reservations-overview/:path*",
    "/admin/update-long-term-events/:path*",
  ],
};
