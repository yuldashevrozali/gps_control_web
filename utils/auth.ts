// src/utils/auth.ts
import axios from "axios";

// 🔐 Asosiy login funksiyasi (phone_number va password orqali)
export async function loginUser(phone_number: string, password: string): Promise<boolean> {
  try {
    const response = await axios.post(
      "https://gps.mxsoft.uz/account/token/",
      {
        phone_number,
        password,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const { access, refresh } = response.data;

    if (access && refresh) {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      document.cookie = "loggedIn=true; path=/; max-age=86400; SameSite=Lax; Secure";
      console.log("✅ Access va refresh tokenlar saqlandi");
      return true;
    }

    console.warn("⚠️ Tokenlar olinmadi");
    return false;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("❌ Login xatolik:", error.response?.data || error.message);
    } else {
      console.error("❌ Noma'lum xatolik:", error);
    }
    return false;
  }
}

// 🔄 Valid access_token olish logikasi
export async function getValidAccessToken(): Promise<string | null> {
  const access = localStorage.getItem("access_token");
  const refresh = localStorage.getItem("refresh_token");

  if (access) return access;

  if (refresh) {
    try {
      const response = await axios.post(
        "https://gps.mxsoft.uz/account/token/refresh/",
        { refresh },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const { access: newAccess, refresh: newRefresh } = response.data;

      if (newAccess && newRefresh) {
        localStorage.setItem("access_token", newAccess);
        localStorage.setItem("refresh_token", newRefresh);
        console.log("🔄 Tokenlar yangilandi");
        return newAccess;
      }

      console.warn("⚠️ Yangilangan tokenlar topilmadi");
      return null;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const isBlacklisted = error.response?.data?.detail?.toLowerCase?.().includes("blacklisted");

        if (status === 401 || isBlacklisted) {
          console.warn("⚠️ Refresh token eskirgan yoki blacklistga tushgan. Login orqali yangilanadi...");

          // 👇 Hardcoded fallback user
          const phone_number = "+998901791459";
          const password = "salom123";

          const loggedIn = await loginUser(phone_number, password);
          if (loggedIn) {
            return localStorage.getItem("access_token");
          }
        }

        console.error("❌ Token yangilash xatosi:", error.response?.data || error.message);
      } else {
        console.error("❌ Noma'lum xatolik:", error);
      }
      return null;
    }
  }

  console.warn("❌ Refresh token mavjud emas");
  return null;
}

// 🚪 Logout qilish funksiyasi
export function logoutUser() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  document.cookie = "loggedIn=; path=/; max-age=0";
  console.log("🔒 Logout bajarildi");
}
