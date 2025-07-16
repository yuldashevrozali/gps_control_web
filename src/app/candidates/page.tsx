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

const Candidates = () => {
  const router = useRouter();
  
    useEffect(() => {
      const isLoggedIn = getCookie("loggedIn");
      if (isLoggedIn !== "true") {
        router.push("/login");
      }
    }, []);
    
  return <div>Candidates</div>;
};

export default Candidates;
