// src/utils/auth.ts
import axios from "axios";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

// 📌 Qurilma ID olish (FingerprintJS orqali)
async function getDeviceId(): Promise<string> {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  console.log("📱 Qurilma ID:", result.visitorId); // ✅ Konsolga chiqariladi
  return result.visitorId;
}

// 🔐 Login funksiyasi (phone, password, fingerprint bilan)
export async function loginUser(phone_number: string, password: string): Promise<boolean> {
  try {
    const device_id = await getDeviceId(); // ✅ Fingerprint orqali qurilma ID olinmoqda
    console.log("📦 Login payloadga ketayotgan device_id:", device_id);

    const payload = {
      phone_number,
      password,
      device_id, // ✅ Serverga yuborilmoqda
      firebase_token: "string", // TODO: Agar kerak bo‘lsa, Firebase tokenni ham dinamik oling
    };

    console.log("📦 Login payload:", payload); // 👈 QO‘SHILDI: yuborilayotgan barcha ma'lumotlar

    const response = await axios.post(
      "https://gps.mxsoft.uz/account/login/",
      payload,
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
      console.log("✅ Login muvaffaqiyatli, tokenlar saqlandi");
      return true;
    }

    console.warn("⚠️ Tokenlar qaytmadi");
    return false;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("❌ Login xatosi:", error.response?.data || error.message);
    } else {
      console.error("❌ Noma'lum xatolik:", error);
    }
    return false;
  }
}


// 🔄 Access tokenni tekshirish va yangilash
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

          // ⚠️ Demo user
          const phone_number = "+998973433006";
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

// 🚪 Logout qilish
export function logoutUser() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  document.cookie = "loggedIn=; path=/; max-age=0";
  console.log("🔒 Logout bajarildi");
}
