"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useModal } from "@/context/ModalContext";

function CheckCircleIcon() {
  return (
    <svg
      className="mx-auto h-16 w-16 text-green-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { showAlert } = useModal();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        showAlert("Error", error.message, "danger");
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      showAlert(
        "Error",
        "An unexpected error occurred. Please try again.",
        "danger"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        {sent ? (
          <div className="space-y-4 text-center">
            <CheckCircleIcon />
            <h2 className="text-xl font-semibold text-gray-900">
              Check Your Email
            </h2>
            <p className="text-sm text-gray-600">
              A password reset link has been sent to{" "}
              <span className="font-medium">{email}</span>. Please check your
              inbox.
            </p>
            <div>
              <Link
                href="/login"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Back to login
              </Link>
            </div>
          </div>
        ) : (
          <>
            <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
              Forgot Password
            </h1>
            <p className="mb-6 text-center text-sm text-gray-600">
              Enter your email to receive a password reset link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Back to login
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
