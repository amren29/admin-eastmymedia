"use client";

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { usePathname } from 'next/navigation';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
    const { user, userData, loading } = useAuth();
    const pathname = usePathname();
    const isLoginPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/setup' || pathname === '/reset-password';
    const isPendingPage = pathname === '/pending-approval';

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    if (isLoginPage || isPendingPage) {
        return <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100">{children}</main>;
    }

    if (!user) {
        return null; // AuthContext will redirect
    }

    // Hide sidebar for pending users
    if (userData?.status === 'pending') {
        return <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100">{children}</main>;
    }

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}

import { ModalProvider } from '@/context/ModalContext';

export function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ModalProvider>
                <AdminLayoutContent>{children}</AdminLayoutContent>
            </ModalProvider>
        </AuthProvider>
    );
}
