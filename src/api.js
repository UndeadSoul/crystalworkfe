import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";

const baseURL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const api = axios.create({ baseURL });

// Adjunta el token de acceso a cada peticion.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Si una peticion falla con 401, intenta refrescar el token una sola vez
// y reintenta de forma transparente.
let refreshing = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response ? error.response.status : null;

    if (status === 401 && original && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem(REFRESH_TOKEN);
      if (!refresh) return Promise.reject(error);

      try {
        if (!refreshing) {
          refreshing = axios.post(`${baseURL}/api/token/refresh/`, { refresh });
        }
        const res = await refreshing;
        refreshing = null;
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        original.headers.Authorization = `Bearer ${res.data.access}`;
        return api(original);
      } catch (refreshError) {
        refreshing = null;
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
