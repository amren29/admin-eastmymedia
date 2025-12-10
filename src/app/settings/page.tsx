"use client";

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { SystemSettings, getSystemSettings, updateSystemSettings } from '@/lib/settings';
import { app } from '@/lib/firebase';
import { Loader2, Save, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [settings, setSettings] = useState<SystemSettings>({
        enablePackages: true, // Default
        // Initialize other fields to avoid uncontrolled input warnings
        websiteName: '',
        siteLogo: '',
        favicon: '',
        footerDescription: '',
        copyrightText: '',
        officeAddress: '',
        officialEmail: '',
        officePhone: '',
        whatsappNumber: '',
        googleMapsEmbed: '',
        packagesMenuLabel: 'Packages',
        heroTitle: '',
        heroSubtitle: '',
        facebookUrl: '',
        instagramUrl: '',
        tiktokUrl: '',
        linkedinUrl: '',
        whatsappMessage: ''
    });

    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push('/login');
                return;
            }
            setUser(currentUser);
            loadSettings();
        });

        return () => unsubscribe();
    }, [router]);

    const loadSettings = async () => {
        try {
            const data = await getSystemSettings();
            setSettings(prev => ({ ...prev, ...data }));
        } catch (error) {
            console.error("Failed to load settings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateSystemSettings(settings);
            alert("Settings saved successfully!");
        } catch (error) {
            console.error("Failed to save settings", error);
            alert("Failed to save settings. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    // Placeholder until image upload is ready
    const handleImageUpload = (field: 'siteLogo' | 'favicon') => {
        const url = prompt(`Enter URL for ${field}:`, settings[field]);
        if (url !== null) {
            setSettings(prev => ({ ...prev, [field]: url }));
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#01a981]" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto pb-32">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
                    <p className="text-slate-500 mt-1">Manage website content, branding, and contact details.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-[#01a981] hover:bg-[#008f6d] text-white px-6 py-3 rounded-lg font-bold shadow-md transition-all disabled:opacity-50"
                >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    Save Changes
                </button>
            </div>

            <div className="space-y-8">
                {/* Section 1: My Account */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">My Account</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">Name</label>
                            <input
                                type="text"
                                value={user?.displayName || 'Admin User'}
                                disabled
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-600 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">Email</label>
                            <input
                                type="text"
                                value={user?.email || ''}
                                disabled
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-600 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">Position</label>
                            <input
                                type="text"
                                value="Administrator"
                                disabled
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-600 cursor-not-allowed"
                            />
                        </div>
                    </div>
                </section>

                {/* Section 2: General & Branding */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">General & Branding</h2>
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Website Name</label>
                            <input
                                type="text"
                                name="websiteName"
                                value={settings.websiteName}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#01a981] focus:border-transparent outline-none transition-all"
                                placeholder="EastMy Media"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Site Logo</label>
                                <div className="flex items-center gap-4">
                                    {settings.siteLogo && (
                                        <img src={settings.siteLogo} alt="Logo" className="h-12 w-auto border rounded bg-slate-50" />
                                    )}
                                    <button
                                        onClick={() => handleImageUpload('siteLogo')}
                                        className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-300"
                                    >
                                        Set Logo URL
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Recommended height: 40-60px</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Favicon</label>
                                <div className="flex items-center gap-4">
                                    {settings.favicon && (
                                        <img src={settings.favicon} alt="Favicon" className="h-8 w-8 border rounded bg-slate-50" />
                                    )}
                                    <button
                                        onClick={() => handleImageUpload('favicon')}
                                        className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-300"
                                    >
                                        Set Favicon URL
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Recommended size: 32x32px or 64x64px</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Footer Description</label>
                            <textarea
                                name="footerDescription"
                                value={settings.footerDescription}
                                onChange={handleChange}
                                rows={3}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#01a981] focus:border-transparent outline-none transition-all resize-none"
                                placeholder="Brief description about the company..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Copyright Text</label>
                            <input
                                type="text"
                                name="copyrightText"
                                value={settings.copyrightText}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#01a981] focus:border-transparent outline-none transition-all"
                                placeholder="© 2026 EastMy Media. All rights reserved."
                            />
                        </div>
                    </div>
                </section>

                {/* Section 3: Contact Information */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Contact Information</h2>
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Office Address</label>
                            <textarea
                                name="officeAddress"
                                value={settings.officeAddress}
                                onChange={handleChange}
                                rows={3}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#01a981] focus:border-transparent outline-none transition-all resize-none"
                                placeholder="Full office address..."
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Official Email</label>
                                <input
                                    type="email"
                                    name="officialEmail"
                                    value={settings.officialEmail}
                                    onChange={handleChange}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#01a981] focus:border-transparent outline-none transition-all"
                                    placeholder="info@eastmymedia.my"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Office Phone</label>
                                <input
                                    type="text"
                                    name="officePhone"
                                    value={settings.officePhone}
                                    onChange={handleChange}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#01a981] focus:border-transparent outline-none transition-all"
                                    placeholder="+60 88-123 456"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile/WhatsApp Number</label>
                            <input
                                type="text"
                                name="whatsappNumber"
                                value={settings.whatsappNumber}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#01a981] focus:border-transparent outline-none transition-all"
                                placeholder="60189023676 (No + or spaces for best results)"
                            />
                            <p className="text-xs text-slate-400 mt-1">This number controls the WhatsApp button destination.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Google Maps Embed Link (src URL only)</label>
                            <textarea
                                name="googleMapsEmbed"
                                value={settings.googleMapsEmbed}
                                onChange={handleChange}
                                rows={3}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#01a981] focus:border-transparent outline-none transition-all font-mono text-sm"
                                placeholder="https://www.google.com/maps/embed?pb=..."
                            />
                            <p className="text-xs text-slate-400 mt-1">Paste the 'src' attribute from the Google Maps iframe code.</p>
                        </div>
                    </div>
                </section>

                {/* Section 4: Menu & Frontend Control */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 border-l-4 border-l-[#01a981]">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Menu & Frontend Control</h2>
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">"Packages" Menu Label</label>
                            <input
                                type="text"
                                name="packagesMenuLabel"
                                value={settings.packagesMenuLabel}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#01a981] focus:border-transparent outline-none transition-all"
                                placeholder="Packages"
                            />
                            <p className="text-xs text-slate-400 mt-1">Change this to "Bundles", "Deals", etc. Updates immediately.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Hero Section Title</label>
                            <input
                                type="text"
                                name="heroTitle"
                                value={settings.heroTitle}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#01a981] focus:border-transparent outline-none transition-all"
                                placeholder="East Malaysia's Largest Integrated Media Network"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Hero Section Sub-Title</label>
                            <textarea
                                name="heroSubtitle"
                                value={settings.heroSubtitle}
                                onChange={handleChange}
                                rows={2}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#01a981] focus:border-transparent outline-none transition-all resize-none"
                                placeholder="From static billboards to digital LED screens..."
                            />
                        </div>
                    </div>
                </section>

                {/* Section 5: Social Media Links */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Social Media Links</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Facebook URL</label>
                            <input
                                type="url"
                                name="facebookUrl"
                                value={settings.facebookUrl}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#01a981] focus:border-transparent outline-none transition-all"
                                placeholder="https://facebook.com/..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Instagram URL</label>
                            <input
                                type="url"
                                name="instagramUrl"
                                value={settings.instagramUrl}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#01a981] focus:border-transparent outline-none transition-all"
                                placeholder="https://instagram.com/..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">TikTok URL</label>
                            <input
                                type="url"
                                name="tiktokUrl"
                                value={settings.tiktokUrl}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#01a981] focus:border-transparent outline-none transition-all"
                                placeholder="https://tiktok.com/..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">LinkedIn URL</label>
                            <input
                                type="url"
                                name="linkedinUrl"
                                value={settings.linkedinUrl}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#01a981] focus:border-transparent outline-none transition-all"
                                placeholder="https://linkedin.com/..."
                            />
                        </div>
                    </div>
                    <p className="text-sm text-slate-400 mt-4 italic">Leave blank to hide the icon on the website.</p>
                </section>

                {/* Section 6: WhatsApp Settings */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">WhatsApp Settings</h2>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Pre-filled Message</label>
                        <textarea
                            name="whatsappMessage"
                            value={settings.whatsappMessage}
                            onChange={handleChange}
                            rows={3}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#01a981] focus:border-transparent outline-none transition-all resize-none"
                            placeholder="Hi EastMy Media, I saw your website and want to inquire about..."
                        />
                        <p className="text-xs text-slate-400 mt-1">This message will appear when users click the WhatsApp button.</p>
                    </div>
                </section>

            </div>
        </div>
    );
}
