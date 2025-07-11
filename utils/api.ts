// src/utils/api.ts
import axios from "axios";

// axios instance yaratamiz
const api = axios.create({
  baseURL: "http://83.149.105.190:8000/",
  headers: {
    "Content-Type": "application/json",
  },
});

// Har bir so‘rovga access token qo‘shish
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Agar token muddati tugagan bo‘lsa, refresh token orqali yangilaymiz
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        console.log("❌ Refresh token yo'q.");
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          "http://83.149.105.190:8000/account/token/refresh/",
          { refresh: refreshToken }
        );

        const newAccessToken = res.data.access;

        // Yangilangan access tokenni localStorage'ga saqlaymiz
        localStorage.setItem("access_token", newAccessToken);

        // So‘rovga yangi tokenni qo‘shamiz
        api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        return api(originalRequest); // So‘rovni qaytadan yuboramiz
      } catch (refreshError) {
        console.log("❌ Refresh token ham muddati tugagan. Logout qilish kerak.");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
