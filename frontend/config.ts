export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";
export const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL ?? "http://localhost:3000/api";

// Auth Redirect URLs
export const LOGIN_PAGE_URL = import.meta.env.VITE_LOGIN_PAGE_URL ?? "http://localhost:3000/login";
export const REGISTER_PAGE_URL = import.meta.env.VITE_REGISTER_PAGE_URL ?? "http://localhost:3000/register";
export const LOGOUT_API_URL = import.meta.env.VITE_LOGOUT_API_URL ?? "http://localhost:3000/api/user/logout";