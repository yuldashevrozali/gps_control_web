// src/utils/auth.ts
import axios from "axios";

/**
 * access_token ni qaytaradi.
 * Agar mavjud bo'lmasa, refresh_token orqali yangilaydi.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const access = localStorage.getItem("access_token");
  const refresh = localStorage.getItem("refresh_token");

  // Access token bo‘lsa, shu bilan ishlaymiz
  if (access) return access;

  // Refresh token orqali yangilash
  if (refresh) {
    try {
      const response = await axios.post(
        "https://gps.mxsoft.uz/account/token/refresh/",
        { refresh },
        { headers: { "Content-Type": "application/json" } }
      );
      const newAccess = response.data.access;
      localStorage.setItem("access_token", newAccess);
      return newAccess;
    } catch (error) {
      console.error("❌ Token yangilashda xatolik:", error);
      return null;
    }
  }

  return null;
}
