'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from "./components/navbar";
import { Sidebar } from "./components/sidebar";
import { HydrationProvider } from "react-hydration-provider";

export default function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideSidebarRoutes = ["/login", "/register"];
  const hideSidebar = hideSidebarRoutes.includes(pathname);

  return (
    <HydrationProvider>
      {!hideSidebar && <Sidebar />}
      <div className={!hideSidebar ? "lg:ml-64 transition-all duration-300" : ""}>
        {!hideSidebar && <Navbar />}
        <main className={!hideSidebar ? "mt-[7vh] p-6 bg-background" : ""}>
          {children}
        </main>
      </div>
    </HydrationProvider>
  );
}
