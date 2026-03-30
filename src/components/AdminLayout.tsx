"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ModalProvider } from "@/context/ModalContext";
import { Sidebar } from "@/components/Sidebar";

const AUTH_PAGES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/setup",
  "/reset-password",
];

function AdminLayoutContent({ children }: { children: ReactNode }) {
  const { loading, user, userData } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  const isAuthPage = AUTH_PAGES.includes(pathname);
  const isPendingPage = pathname === "/pending-approval";

  if (isAuthPage || isPendingPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        {children}
      </div>
    );
  }

  if (user && userData?.status === "approved") {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">{children}</main>
      </div>
    );
  }

  return <>{children}</>;
}

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ModalProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </ModalProvider>
    </AuthProvider>
  );
}
