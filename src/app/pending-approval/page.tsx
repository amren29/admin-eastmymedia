"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Clock, Mail } from 'lucide-react';

export default function PendingApprovalPage() {
    const { user, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Redirect to login if not authenticated
        if (!user) {
            router.push('/login');
        }
    }, [user, router]);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-24 w-24 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Clock className="h-12 w-12 text-yellow-600" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Account Pending Approval
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Your registration was successful!
                    </p>
                </div>

                <div className="bg-white shadow-lg rounded-lg p-6 space-y-4">
                    <div className="flex items-start space-x-3">
                        <Mail className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-medium text-gray-900">
                                What happens next?
                            </h3>
                            <p className="mt-1 text-sm text-gray-600">
                                Your account is currently pending approval from an administrator.
                                You'll receive an email notification once your account has been approved.
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <p className="text-xs text-gray-500">
                            <strong>Note:</strong> This process typically takes 1-2 business days.
                            If you have any questions, please contact your administrator.
                        </p>
                    </div>
                </div>

                <div className="text-center">
                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Logout
                    </button>
                </div>

                <div className="text-center">
                    <p className="text-xs text-gray-500">
                        Registered as: <span className="font-medium">{user?.email}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
