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

export const HRL_LOGO =
  "https://customer-assets-lqy194kg.emergentagent.net/job_dde0188d-6e2d-47cb-8ad3-74a88b66706d/artifacts/iupb5zcm_new_logo_nbgnd.png";
