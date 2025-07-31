'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import StatCards from "@/app/components/dashboard/StatCards";

// Cookie'dan qiymat olish funksiyasi
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

// Dinamik import qilingan MapHistory komponenti
const MapHistory = dynamic(() => import('../components/MapHistoryComponent'), {
  ssr: false,
});

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = getCookie("loggedIn");
    if (isLoggedIn !== "true") {
      router.push("/index");
    }
  }, []);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <StatCards />
        </div>
      </div>

      {/* MapHistory pastga qo‘shildi */}
      <div className="mt-15">
        <MapHistory />
      </div>
    </div>
  );
}
