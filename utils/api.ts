// src/utils/api.ts
import axios from "axios";

// axios instance yaratamiz
const api = axios.create({
  baseURL: "https://gps.mxsoft.uz/",
  headers: {
    "Content-Type": "application/json",
  },
});

// Har bir so‘rovga access token qo‘shish
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 401 xatolik bo‘lsa, tokenni yangilash
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      typeof window !== "undefined" &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        console.log("❌ Refresh token topilmadi.");
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          "https://gps.mxsoft.uz/account/token/refresh/",
          { refresh: refreshToken },
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        const newAccessToken = res.data.access;

        localStorage.setItem("access_token", newAccessToken);

        // Yangi tokenni so‘rovga qo‘shamiz
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.log("❌ Refresh token ham yaroqsiz. Foydalanuvchini logout qilish kerak.");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
