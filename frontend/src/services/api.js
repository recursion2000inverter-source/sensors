import axios from "axios";

// SAME-ORIGIN calls (works locally + Render)
const api = axios.create({
  baseURL: "",
  timeout: 5000,
});

export const checkServerHealth = () => api.get("/health");
export const fetchLatestData = () => api.get("/latest");

export default api;
