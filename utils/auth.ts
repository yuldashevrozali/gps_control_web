// src/utils/auth.ts
import axios from "axios";

/**
 * Login qilish: access_token va refresh_token ni localStorage ga saqlaydi.
 */
export async function loginUser(): Promise<boolean> {
  try {
    const refresh = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc1MzI2NzA4MywiaWF0IjoxNzUyNjYyMjgzLCJqdGkiOiJjOThiZGRjZDUwNmU0OTczODhiNjdkYzBiYzk2YmFmYiIsInVzZXJfaWQiOjEsInVzZXJfdHlwZSI6Ik1BTkFHRVIiLCJmdWxsX25hbWUiOiJOb25lIE5vbmUiLCJwaG9uZV9udW1iZXIiOiIrOTk4OTAxNzkxNDU5In0.rzOT2IqGxepwqzwqZmAvs74WPxLfEFGYthvbYN36N3s'; // siz bergan token

    // Avval localStorage ga refresh_token ni saqlaymiz
    localStorage.setItem("refresh_token", refresh);

    // Endi ushbu refresh token orqali access tokenni serverdan so'raymiz
    const response = await axios.post(
      "https://gps.mxsoft.uz/account/token/refresh/",
      { refresh },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const access = response.data.access;

    if (access) {
      localStorage.setItem("access_token", access);
      console.log("✅ Tokenlar saqlandi");
      return true;
    }

    console.warn("⚠️ Access tokenni olishda muammo");
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
