"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Cookie o‘qish funksiyasi
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

const Settings = () => {
  const router = useRouter();
  
    useEffect(() => {
      const isLoggedIn = getCookie("loggedIn");
      if (isLoggedIn !== "true") {
        router.push("/index");
      }
    }, []);
  return <div>Settings</div>;
};

export default Settings;
