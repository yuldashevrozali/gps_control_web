// src/utils/api.ts
import axios from "axios";
import { getValidAccessToken } from "./auth";

const api = axios.create({
  baseURL: "https://gps.mxsoft.uz/",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: har bir so‘rovga access token qo‘shiladi
api.interceptors.request.use(
  async (config) => {
    if (typeof window !== "undefined") {
      const token = await getValidAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: agar 401 bo‘lsa, tokenni refresh qiladi
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== "undefined"
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        console.warn("❌ Refresh token yo‘q. Login kerak.");
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          "https://gps.mxsoft.uz/account/token/refresh/",
          { refresh: refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        const newAccessToken = res.data.access;
        localStorage.setItem("access_token", newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
