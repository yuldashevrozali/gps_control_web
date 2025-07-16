"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AttendanceChart from "@/app/components/dashboard/AttendanceChart";
import AttendanceTable from "@/app/components/dashboard/AttendanceTable";
import MyScheduleCard from "@/app/components/dashboard/MyScheduleCard";
import StatCards from "@/app/components/dashboard/StatCards";
import { Card, CardContent } from "@/components/ui/card";

// Cookie'dan qiymat olish funksiyasi
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = getCookie("loggedIn");
    if (isLoggedIn !== "true") {
      router.push("/login");
    }
  }, []);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <StatCards />
          <Card>
            <CardContent className="p-6">
              <AttendanceChart />
            </CardContent>
          </Card>
        </div>
        <div className="lg:w-96">
          <MyScheduleCard />
        </div>
      </div>
      <AttendanceTable />
    </div>
  );
}
