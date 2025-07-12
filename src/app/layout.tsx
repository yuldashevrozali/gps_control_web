/** @format */

"use client";

import { type Metadata } from "next";
import { ThemeProvider } from "../providers/theme-provider";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import NextTopLoader from "nextjs-toploader";
import { Sidebar } from "./components/sidebar";
import { Navbar } from "./components/navbar";
import { HydrationProvider } from "react-hydration-provider";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get current route
  const pathname = usePathname();

  // Routes where we want to hide Sidebar + Navbar
  const hideSidebarRoutes = ["/login", "/register"];
  const hideSidebar = hideSidebarRoutes.includes(pathname);

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="hrms-theme"
        >
          <HydrationProvider>
            {!hideSidebar && <Sidebar />}
            <div className={!hideSidebar ? "lg:ml-64 transition-all duration-300" : ""}>
              {!hideSidebar && <Navbar />}
              <main className={!hideSidebar ? "mt-[7vh] p-6 bg-background" : ""}>
                {children}
              </main>
            </div>
          </HydrationProvider>

          <Toaster position="top-right" />
          <NextTopLoader
            color="var(--primary)"
            initialPosition={0.5}
            crawlSpeed={200}
            height={3}
            crawl
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px var(--primary), 0 0 5px var(--primary)"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
