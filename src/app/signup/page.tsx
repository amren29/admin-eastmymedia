"use client";

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export default function SignUpPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [position, setPosition] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Registration Form, 2: OTP
    const [otp, setOtp] = useState('');
    const router = useRouter();

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Generate 6-digit OTP
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            // Save to Firestore
            await setDoc(doc(db, 'otps', email), {
                otp: generatedOtp,
                expiresAt: expiresAt.toISOString()
            });

            // Try to send email, but continue even if it fails
            try {
                const emailBody = `Hello,

Thank you for registering with Eastmy Media Admin Panel.

Your verification code is: ${generatedOtp}

This code will expire in 10 minutes.

⚠️ IMPORTANT: Please do not share this code with anyone. Our team will never ask for your verification code.

If you did not request this code, please ignore this email.

Regards,
Verification Team of Eastmy Media`;

                const res = await fetch('/api/email/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: email,
                        subject: 'Your Verification Code - Eastmy Media',
                        text: emailBody
                    })
                });

                if (!res.ok) {
                    console.warn('Email failed, showing OTP in console');
                    console.log('\n===========================================');
                    console.log('📧 OTP EMAIL (Console Mode)');
                    console.log('===========================================');
                    console.log(`To: ${email}`);
                    console.log(`Code: ${generatedOtp}`);
                    console.log(`Expires: ${new Date(expiresAt).toLocaleString()}`);
                    console.log('===========================================\n');

                    // Show OTP in alert for easy access
                    alert(`⚠️ Email failed to send!\n\nYour OTP Code: ${generatedOtp}\n\nEnter this code in the next step.`);
                }
            } catch (emailError) {
                // Email failed, show in console
                console.log('\n===========================================');
                console.log('📧 OTP EMAIL (Console Mode - Email Failed)');
                console.log('===========================================');
                console.log(`To: ${email}`);
                console.log(`Code: ${generatedOtp}`);
                console.log(`Expires: ${new Date(expiresAt).toLocaleString()}`);
                console.log('===========================================\n');
            }

            setStep(2);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to send verification code.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Verify OTP
            const docRef = doc(db, 'otps', email);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                throw new Error('Verification code expired or invalid.');
            }

            const data = docSnap.data();
            if (data.otp !== otp) {
                throw new Error('Invalid verification code.');
            }

            if (new Date(data.expiresAt) < new Date()) {
                throw new Error('Verification code expired.');
            }

            // Create Account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save user data to Firestore with pending status
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: email,
                fullName: fullName,
                phoneNumber: phoneNumber,
                role: position.toLowerCase(),
                status: 'pending',
                createdAt: new Date().toISOString()
            });

            // Cleanup OTP
            await deleteDoc(docRef);

            router.push('/pending-approval');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to verify code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">Create Admin Account</h2>
                <p className="mt-2 text-sm text-gray-600">Create the first admin user</p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={step === 1 ? handleSendOTP : handleVerifyAndSignUp}>
                <div className="space-y-4 rounded-md shadow-sm">
                    {step === 1 ? (
                        <>
                            <div>
                                <label htmlFor="full-name" className="sr-only">Full Name</label>
                                <input
                                    id="full-name"
                                    name="fullName"
                                    type="text"
                                    required
                                    className="relative block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="Full Name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="email-address" className="sr-only">Email address</label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="relative block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="phone-number" className="sr-only">Phone Number</label>
                                <input
                                    id="phone-number"
                                    name="phoneNumber"
                                    type="tel"
                                    required
                                    className="relative block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="Phone Number (e.g. +60123456789)"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="position" className="sr-only">Position</label>
                                <select
                                    id="position"
                                    name="position"
                                    required
                                    className="relative block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                >
                                    <option value="">Select Position</option>
                                    <option value="Administrator">Administrator</option>
                                    <option value="Director">Director</option>
                                    <option value="Chief">Chief</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Sales">Sales</option>
                                    <option value="Admin">Admin (Basic)</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className="relative block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </>
                    ) : (
                        <div>
                            <label htmlFor="otp" className="sr-only">Verification Code</label>
                            <input
                                id="otp"
                                name="otp"
                                type="text"
                                required
                                className="relative block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                placeholder="Enter 6-digit code sent to your email"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                            />
                            <p className="text-xs text-center mt-2 text-gray-500">
                                Code sent to {email}
                            </p>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="text-sm text-red-600 text-center">
                        {error}
                    </div>
                )}

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : (step === 1 ? 'Send Verification Code' : 'Verify & Create Account')}
                    </button>
                    {step === 2 && (
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="mt-2 w-full text-sm text-gray-500 hover:text-gray-700"
                        >
                            Back to Email
                        </button>
                    )}
                </div>

                <div className="text-center text-sm">
                    <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                        Back to Login
                    </Link>
                </div>
            </form>
        </div>
    );
}
