"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { getPackages, deletePackage, PackageItem } from '@/lib/packages';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Settings } from 'lucide-react';

export default function PackagesPage() {
    const [packages, setPackages] = useState<PackageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [featureEnabled, setFeatureEnabled] = useState(true);

    useEffect(() => {
        loadPackages();
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const docRef = doc(db, 'settings', 'general');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setFeatureEnabled(docSnap.data().enablePackages);
            }
        } catch (error) {
            console.error("Error loading settings:", error);
        }
    };

    const toggleFeature = async () => {
        const newState = !featureEnabled;
        setFeatureEnabled(newState);
        try {
            const docRef = doc(db, 'settings', 'general');
            await setDoc(docRef, { enablePackages: newState }, { merge: true });
        } catch (error) {
            console.error("Error saving settings:", error);
            setFeatureEnabled(!newState); // Revert on error
            alert('Failed to update setting');
        }
    };

    const loadPackages = async () => {
        setLoading(true);
        const data = await getPackages();
        setPackages(data);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this package?')) {
            await deletePackage(id);
            await loadPackages();
        }
    };

    const filteredPackages = packages.filter(pkg =>
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Package className="h-8 w-8 text-[#01a981]" />
                        Package Management
                    </h1>
                    <p className="text-slate-500 mt-1">Create and manage bundled media packages.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                        <span className="text-sm font-medium text-slate-700">Public Page:</span>
                        <button
                            onClick={toggleFeature}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#01a981] ${featureEnabled ? 'bg-[#01a981]' : 'bg-slate-200'
                                }`}
                            title={featureEnabled ? "Feature Enabled" : "Feature Disabled"}
                        >
                            <span
                                className={`${featureEnabled ? 'translate-x-6' : 'translate-x-1'
                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                        </button>
                        <span className={`text-xs font-bold ${featureEnabled ? 'text-[#01a981]' : 'text-slate-400'}`}>
                            {featureEnabled ? 'ON' : 'OFF'}
                        </span>
                    </div>
                    <Link
                        href="/packages/new"
                        className="flex items-center justify-center gap-2 bg-[#01a981] hover:bg-[#01906d] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                    >
                        <Plus className="h-5 w-5" />
                        Create New Package
                    </Link>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search packages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#01a981] focus:border-transparent shadow-sm bg-white"
                />
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#01a981]"></div>
                </div>
            ) : filteredPackages.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-slate-100">
                    <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No packages found</h3>
                    <p className="text-slate-500 mt-2 mb-6">Get started by creating your first media package.</p>
                    <Link
                        href="/packages/new"
                        className="inline-flex items-center gap-2 text-[#01a981] font-medium hover:text-[#01906d] hover:underline"
                    >
                        <Plus className="h-4 w-4" />
                        Create Package
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredPackages.map((pkg) => (
                        <div key={pkg.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 transition-all hover:shadow-md">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-slate-900">{pkg.name}</h3>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${pkg.status === 'active'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {pkg.status}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">{pkg.description}</p>

                                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-700">{pkg.items.length}</span> Items Included
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span>Valid:</span>
                                            <span className="text-slate-700">
                                                {new Date(pkg.validFrom).toLocaleDateString()} - {new Date(pkg.validTo).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2 md:min-w-[200px]">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400 line-through">RM {pkg.standardTotal.toLocaleString()}</p>
                                        <p className="text-2xl font-bold text-[#01a981]">{pkg.packagePrice > 0 ? `RM ${pkg.packagePrice.toLocaleString()}` : 'Free'}</p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Link
                                            href={`/packages/${pkg.id}`}
                                            className="p-2 text-slate-400 hover:text-[#01a981] hover:bg-emerald-50 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(pkg.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
