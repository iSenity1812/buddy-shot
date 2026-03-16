export const AUTH_ENDPOINTS = {
  register: "/auth/register",
  login: "/auth/login",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
  me: "/auth/me",
  updateEmail: "/auth/me/email",
  changePassword: "/auth/me/password",
} as const;
