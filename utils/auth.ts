// src/utils/auth.ts
import axios from "axios";

/**
 * Login qilish: access_token va refresh_token ni localStorage ga saqlaydi.
 */
export async function loginUser(username: string, password: string): Promise<boolean> {
  try {
    const response = await axios.post("https://gps.mxsoft.uz/account/token/", {
      username,
      password,
    });

    const { access, refresh } = response.data;

    if (access && refresh) {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      console.log("✅ Tokenlar saqlandi");
      return true;
    }

    console.warn("⚠️ Tokenlar topilmadi");
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

/**
 * access_token ni tekshiradi, yo'q bo‘lsa refresh_token orqali yangilaydi.
 */
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

      const newAccess = response.data.access;
      if (newAccess) {
        localStorage.setItem("access_token", newAccess);
        return newAccess;
      } else {
        console.warn("⚠️ Yangilangan access token topilmadi");
        return null;
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("❌ Token yangilashda xatolik:", error.response?.data || error.message);
      } else {
        console.error("❌ Noma'lum xatolik:", error);
      }
      return null;
    }
  }

  console.warn("❌ Refresh token mavjud emas");
  return null;
}

/**
 * Logout qilish funksiyasi.
 */
export function logoutUser() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}
