"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function ClockIcon() {
  return (
    <svg
      className="mx-auto h-16 w-16 text-yellow-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export default function PendingApprovalPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md text-center">
        <ClockIcon />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Account Pending Approval
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          Your account (<span className="font-medium">{user.email}</span>) has
          been created and is awaiting approval from an administrator. You will
          be able to access the admin panel once your account has been approved.
        </p>
        <button
          onClick={logout}
          className="mt-6 rounded-md bg-gray-600 px-6 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
