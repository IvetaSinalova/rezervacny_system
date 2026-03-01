"use client"; // Must be at the very top for useEffect to work

import { useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Note: In Next.js "use client" files, you cannot export metadata like this.
// If you need SEO metadata, move this to a separate page.tsx or a Server Component.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    const sendHeight = () => {
      // We use documentElement.scrollHeight for better accuracy in most browsers
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: "RESIZE_IFRAME", height: height }, "*");
    };

    // Initial check
    sendHeight();

    // Watch for window resizing
    window.addEventListener("resize", sendHeight);

    // Watch for internal content changes (like opening a calendar event)
    const observer = new MutationObserver(sendHeight);
    observer.observe(document.body, { subtree: true, childList: true });

    return () => {
      window.removeEventListener("resize", sendHeight);
      observer.disconnect();
    };
  }, []);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
