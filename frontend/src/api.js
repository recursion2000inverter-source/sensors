import axios from "axios";

const api = axios.create({
  baseURL: "/", // SAME ORIGIN (FastAPI serves frontend)
  timeout: 5000
});

export const checkHealth = () => api.get("/health");
export const fetchLatest = () => api.get("/api/latest");

export default api;
