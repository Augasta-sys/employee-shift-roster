
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import api from "../services/api";
import type { User, AuthContextType } from "../types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "shiftsync_user";

const getStoredUser = (): User | null => {
  try {
    const savedUser = localStorage.getItem(STORAGE_KEY);
    return savedUser ? (JSON.parse(savedUser) as User) : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(getStoredUser);

  const isAuthenticated = Boolean(user);

  const login = async (email: string, password: string) => {
    const response = await api.get<User[]>("/users");

    const matchedUser = response.data.find(
      (item) =>
        item.email.toLowerCase() === email.trim().toLowerCase() &&
        item.password === password
    );

    if (!matchedUser) {
      throw new Error("Invalid email address or password.");
    }

    setUser(matchedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matchedUser));

    return matchedUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
