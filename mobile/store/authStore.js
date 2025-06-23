import { create } from 'zustand';
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://192.168.1.4:5000/api";

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,

  register: async (username, email, password, key) => {
    set({ isLoading: true });

    try {
      const response = await fetch(`http://192.168.1.4:5000/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password, key }),
      });

      const data = await response.json();

      if (!response.ok) {
        set({ isLoading: false });
        throw new Error(data.message || "Something went wrong");
      }

      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      await AsyncStorage.setItem("token", data.token);

      set({ user: data.user, token: data.token, isLoading: false });

      return {
        success: true,
        message: "Account created successfully",
      };
    } catch (error) {
      set({ isLoading: false });
      console.error("Registration error:", error);
      return {
        success: false,
        message: error.message || "Something went wrong",
      };
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      await AsyncStorage.setItem("token", data.token);

      set({ token: data.token, user: data.user, isLoading: false });

      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.message };
    }
  },

  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userJson = await AsyncStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      set({ token, user });
    } catch (error) {
      console.log("AUTH Check Failed", error);
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      set({ token: null, user: null });
    } catch (error) {
      console.log("Logout Failed", error);
    }
  },

  // ✅ New: setUser method for updating profile locally
  setUser: async (updatedUser) => {
    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
    set({ user: updatedUser });
  }
}));
