import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BASEURL } from "@/utils/config";
import { safeFetch } from "@/utils/safeFetch";

const useELibraryAuthStore = create(
  persist(
    (set, get) => ({
      eLibraryUser: null,
      isELibraryAuthenticated: false,
      eLibraryLoading: false,

      // Set eLibrary user
      setELibraryUser: (user) => {
        set({
          eLibraryUser: user,
          isELibraryAuthenticated: !!user,
        });
      },

      // Login eLibrary user
      loginELibrary: async (email, password) => {
        set({ eLibraryLoading: true });
        try {
          const response = await safeFetch(`${BASEURL}/api/elibrary/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            credentials: "include",
          });

          const result = await response.json();

          if (result.success) {
            set({
              eLibraryUser: result.user,
              isELibraryAuthenticated: true,
              eLibraryLoading: false,
            });
            return { success: true, user: result.user };
          } else {
            set({ eLibraryLoading: false });
            return { success: false, message: result.message };
          }
        } catch (error) {
          set({ eLibraryLoading: false });
          return { success: false, message: error.message };
        }
      },

      // Verify eLibrary session
      verifyELibrarySession: async () => {
        set({ eLibraryLoading: true });
        try {
          const response = await safeFetch(`${BASEURL}/api/elibrary/auth/verify`, {
            method: "GET",
            credentials: "include",
          });

          const result = await response.json();

          if (response.ok) {
            set({
              eLibraryUser: result.user,
              isELibraryAuthenticated: true,
              eLibraryLoading: false,
            });
            return true;
          } else {
            set({
              eLibraryUser: null,
              isELibraryAuthenticated: false,
              eLibraryLoading: false,
            });
            return false;
          }
        } catch (error) {
          set({
            eLibraryUser: null,
            isELibraryAuthenticated: false,
            eLibraryLoading: false,
          });
          return false;
        }
      },

      // Logout eLibrary user
      logoutELibrary: async () => {
        try {
          await safeFetch(`${BASEURL}/api/elibrary/auth/logout`, {
            method: "POST",
            credentials: "include",
          });

          set({
            eLibraryUser: null,
            isELibraryAuthenticated: false,
          });
        } catch (error) {
          console.error("Logout error:", error);
        }
      },

      // Clear eLibrary auth state
      clearELibraryAuth: () => {
        set({
          eLibraryUser: null,
          isELibraryAuthenticated: false,
        });
      },
    }),
    {
      name: "elibrary-auth-storage",
      partialize: (state) => ({
        eLibraryUser: state.eLibraryUser,
        isELibraryAuthenticated: state.isELibraryAuthenticated,
      }),
    },
  ),
);

export default useELibraryAuthStore;
