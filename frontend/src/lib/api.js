import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api/v1`;
export const ROOT_API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("hrl_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const HRL_LOGO = "/hrl-logo.png";
