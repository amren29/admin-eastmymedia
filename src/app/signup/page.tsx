"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useModal } from "@/context/ModalContext";

const POSITIONS = [
  "Administrator",
  "Director",
  "Chief",
  "Manager",
  "Sales",
  "Admin",
];

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [position, setPosition] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showAlert } = useModal();

  const handleStep1 = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const otpCode = generateOTP();
      setGeneratedOtp(otpCode);

      // Save OTP to supabase (upsert on email)
      const { error: otpError } = await supabase.from("otps").upsert(
        {
          email,
          otp: otpCode,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

      if (otpError) {
        setError("Failed to generate OTP. Please try again.");
        setLoading(false);
        return;
      }

      // Send OTP via email
      try {
        const res = await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email,
            subject: "Your Verification Code",
            text: `Your OTP verification code is: ${otpCode}`,
          }),
        });

        if (!res.ok) {
          throw new Error("Email send failed");
        }
      } catch {
        // If email fails, show OTP in modal as fallback
        showAlert(
          "Verification Code",
          `Unable to send email. Your OTP code is: ${otpCode}`,
          "warning"
        );
      }

      setStep(2);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Verify OTP
      const { data: otpData, error: otpFetchError } = await supabase
        .from("otps")
        .select("otp")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (otpFetchError || !otpData || otpData.otp !== otp) {
        setError("Invalid OTP. Please try again.");
        setLoading(false);
        return;
      }

      // Create auth account
      const { data: authData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (signUpError || !authData.user) {
        setError(signUpError?.message || "Failed to create account.");
        setLoading(false);
        return;
      }

      // Save user data to users table
      const { error: userError } = await supabase.from("users").insert({
        uid: authData.user.id,
        email,
        full_name: fullName,
        phone_number: phoneNumber,
        role: position.toLowerCase(),
        status: "pending",
      });

      if (userError) {
        setError("Account created but failed to save profile. Contact admin.");
        setLoading(false);
        return;
      }

      // Clean up OTPs
      await supabase.from("otps").delete().eq("email", email);

      router.push("/pending-approval");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
          Create Account
        </h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleStep1} className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="John Doe"
              />
            </div>

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
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="phoneNumber"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="+60 12-345 6789"
              />
            </div>

            <div>
              <label
                htmlFor="position"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Position
              </label>
              <select
                id="position"
                required
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">Select a position</option>
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Min. 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Sending OTP..." : "Continue"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleStep2} className="space-y-4">
            <p className="text-center text-sm text-gray-600">
              A verification code has been sent to{" "}
              <span className="font-medium">{email}</span>
            </p>

            <div>
              <label
                htmlFor="otp"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-center text-lg tracking-widest focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="000000"
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOtp("");
                setError("");
              }}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Back to form
            </button>
          </form>
        )}

        <div className="mt-4 text-center text-sm">
          <Link href="/login" className="text-green-600 hover:text-green-800">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
