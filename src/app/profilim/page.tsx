"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

interface UserProfile {
  id: number;
  first_name: string | null;
  last_name: string | null;
  photo: string | null;
  phone_number: string | null;
  email: string;
  status: boolean;
  start_time: string | null;
  end_time: string | null;
}

export default function Profilim() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const router = useRouter();

  useEffect(() => {
          const isLoggedIn = getCookie("loggedIn");
          if (isLoggedIn !== "true") {
            router.push("/login");
          }
        }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token"); // tokenni shu yerdan oladi
    if (!token) return;

    axios
      .get("https://gps.mxsoft.uz/account/user/profile/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        console.log(res);
        setUser(res.data);
      })
      .catch((err) => {
        console.error("Profilni olishda xatolik:", err);
      });
  }, []);

  console.log(user,40);
  

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Profilim</h1>

      <div className="bg-white shadow-md rounded-2xl p-6 max-w-xl space-y-4">
        <div className="flex items-center gap-4">
          {user?.photo ? (
            <img
              src={user.photo}
              alt="User photo"
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-2xl">
              👤
            </div>
          )}
          <div>
            <p className="text-lg font-semibold">
              {user?.first_name || "Ism yo‘q"} {user?.last_name || ""}
            </p>
            <p className="text-sm text-gray-500">{user?.email || "Email yo‘q"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <div>
            <p className="text-gray-500 text-sm">Telefon raqami</p>
            <p className="font-medium">
              {user?.phone_number || "Kiritilmagan"}
            </p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Holati</p>
            <p
              className={`font-medium ${
                user?.status ? "text-green-600" : "text-red-600"
              }`}
            >
              {user?.status ? "Aktiv" : "Noaktiv"}
            </p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Boshlanish vaqti</p>
            <p className="font-medium">{user?.start_time || "—"}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Tugash vaqti</p>
            <p className="font-medium">{user?.end_time || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
