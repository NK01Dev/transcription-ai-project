import { api } from "./api";
import { AuthResponse, User } from "../types";

const register = (name: string, email: string, password: string): Promise<AuthResponse> => {
  return api.post<AuthResponse>("/auth/register", { name, email, password });
};

const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/login", { email, password });
  if (response.token) {
    localStorage.setItem("token", response.token);
    localStorage.setItem("user", JSON.stringify(response.user));
  }
  return response;
};

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

const getMe = (): Promise<User> => {
  return api.get<User>("/auth/me");
};

export const AuthService = {
  register,
  login,
  logout,
  getCurrentUser,
  getMe,
};