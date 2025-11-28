"use client";

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useModal } from '@/context/ModalContext';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const { showAlert, showModal } = useModal();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Submitting forgot password for:", email);
        setLoading(true);
        setError('');

        try {
            console.log("Calling sendPasswordResetEmail...");
            await sendPasswordResetEmail(auth, email);
            console.log("Email sent successfully");
            setSubmitted(true);
            showAlert('Email Sent', `We have sent a password reset link to ${email}.`, 'success');
        } catch (err: any) {
            console.error("Error sending reset email:", err);
            let errorMessage = 'Failed to send reset email';
            if (err.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email address.';
            } else {
                errorMessage = 'Failed to send reset email: ' + err.message;
            }
            setError(errorMessage);
            showModal({ title: 'Error', message: errorMessage, type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Reset Password</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                {submitted ? (
                    <div className="mt-8 text-center space-y-6">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="text-sm text-gray-600">
                            <p className="font-medium text-gray-900">Check your email</p>
                            <p className="mt-1">We have sent a password reset link to <strong>{email}</strong>.</p>
                        </div>
                        <Link
                            href="/login"
                            className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                            Return to Login
                        </Link>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-sm text-red-600 text-center bg-red-50 p-2 rounded-md">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                            >
                                {loading ? 'Sending Link...' : 'Send Reset Link'}
                            </button>
                        </div>

                        <div className="text-center">
                            <Link href="/login" className="flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-900">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
