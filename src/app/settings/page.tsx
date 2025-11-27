"use client";

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile, updatePassword } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { Save, User, Lock } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const { userData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        address: '',
        phone: '',
        website: '',
        email: '',
        logoUrl: '',
        sstRate: 8,
        footerText: '',
        bankName: '',
        bankAccountName: '',
        bankAccountNumber: ''
    });

    // User Account State
    const [displayName, setDisplayName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [updatingProfile, setUpdatingProfile] = useState(false);

    // Check if user is allowed to edit company settings
    const canEditCompanySettings = userData?.role && ['administrator', 'director', 'chief', 'manager'].includes(userData.role.toLowerCase());

    useEffect(() => {
        if (auth.currentUser?.displayName) {
            setDisplayName(auth.currentUser.displayName);
        }
    }, [auth.currentUser]);

    useEffect(() => {
        if (canEditCompanySettings) {
            fetchSettings();
        }
    }, [canEditCompanySettings]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const docRef = doc(db, 'settings', 'company_profile');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setFormData({ ...formData, ...docSnap.data() } as any);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canEditCompanySettings) return;

        setSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'company_profile'), {
                ...formData,
                updatedAt: new Date().toISOString()
            });
            alert('Settings saved successfully!');
        } catch (error) {
            console.error("Error saving settings:", error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser) return;

        setUpdatingProfile(true);
        try {
            // Update Display Name
            if (displayName !== auth.currentUser.displayName) {
                await updateProfile(auth.currentUser, {
                    displayName: displayName
                });
            }

            // Update Password
            if (newPassword) {
                if (newPassword !== confirmPassword) {
                    alert("Passwords do not match!");
                    setUpdatingProfile(false);
                    return;
                }
                if (newPassword.length < 6) {
                    alert("Password must be at least 6 characters.");
                    setUpdatingProfile(false);
                    return;
                }
                await updatePassword(auth.currentUser, newPassword);
                setNewPassword('');
                setConfirmPassword('');
            }

            alert('Profile updated successfully!');
        } catch (error: any) {
            console.error("Error updating profile:", error);
            if (error.code === 'auth/requires-recent-login') {
                alert("For security, please logout and login again to change your password.");
            } else {
                alert('Failed to update profile: ' + error.message);
            }
        } finally {
            setUpdatingProfile(false);
        }
    };

    if (loading && canEditCompanySettings) {
        return <div className="p-8 text-center">Loading settings...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h2>
                <p className="text-slate-500">
                    Manage your profile{canEditCompanySettings ? ' and company configuration' : ''}.
                </p>
            </div>

            <div className="space-y-8">
                {/* Company Details - Only for Admins/Managers */}
                {canEditCompanySettings && (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="bg-white p-6 rounded-xl shadow space-y-6">
                            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4">Company Profile</h3>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={formData.companyName}
                                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                        placeholder="e.g. SBH OUTDOOR MEDIA"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                    <textarea
                                        rows={3}
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Full company address"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+60 12-345 6789"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        placeholder="www.example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="contact@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Logo Text / URL</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={formData.logoUrl}
                                        onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                                        placeholder="Text to display as logo (e.g. SBH MEDIA)"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Currently using text-based logo in PDF.</p>
                                </div>
                            </div>
                        </div>

                        {/* PDF Configuration */}
                        <div className="bg-white p-6 rounded-xl shadow space-y-6">
                            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4">PDF Configuration</h3>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">SST Rate (%)</label>
                                    <input
                                        type="number"
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={formData.sstRate}
                                        onChange={(e) => setFormData({ ...formData, sstRate: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Footer Text</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={formData.footerText}
                                        onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                                        placeholder="e.g. Your Gateway to East Malaysia's Audience"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bank Account Details */}
                        <div className="bg-white p-6 rounded-xl shadow space-y-6">
                            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4">Bank Account Details</h3>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={formData.bankName}
                                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                        placeholder="e.g. Maybank"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Account Name</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={formData.bankAccountName}
                                        onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                                        placeholder="Account Holder Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={formData.bankAccountNumber}
                                        onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                                        placeholder="1234567890"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 transition-colors"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                )}

                {/* User Account - For Everyone */}
                <div className="bg-white p-6 rounded-xl shadow space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4">User Account</h3>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                            <div className="flex gap-4">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="pl-10 w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Your Name"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleUpdateProfile}
                                    disabled={updatingProfile}
                                    className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
                                >
                                    {updatingProfile ? 'Updating...' : 'Update Profile'}
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-6">
                            <h4 className="text-sm font-medium text-slate-900 mb-4">Change Password</h4>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="password"
                                            className="pl-10 w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="New Password"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="password"
                                            className="pl-10 w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm Password"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
}
