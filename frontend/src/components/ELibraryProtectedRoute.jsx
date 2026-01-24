"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useELibraryAuthStore from "@/store/useELibraryAuthStore";

export default function ELibraryProtectedRoute({ children }) {
  const router = useRouter();
  const { isELibraryAuthenticated, verifyELibrarySession, eLibraryLoading } =
    useELibraryAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      if (!isELibraryAuthenticated) {
        const isValid = await verifyELibrarySession();
        if (!isValid) {
          router.push("/elibrary/login");
        }
      }
    };

    checkAuth();
  }, [isELibraryAuthenticated, verifyELibrarySession, router]);

  if (eLibraryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isELibraryAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
