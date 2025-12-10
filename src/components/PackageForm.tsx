"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PackageItem, createPackage, updatePackage, getMediaItems, MediaItem } from '@/lib/packages';
import { ArrowLeft, Save, ShoppingBag, Plus, Minus, Search, CheckSquare, Square } from 'lucide-react';
import Link from 'next/link';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useRef } from 'react';

interface PackageFormProps {
    initialData?: PackageItem;
    isEditing?: boolean;
}

export default function PackageForm({ initialData, isEditing = false }: PackageFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [inventory, setInventory] = useState<MediaItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const uploadTaskRef = useRef<any>(null);

    const [formData, setFormData] = useState<Partial<PackageItem>>({
        name: '',
        description: '',
        validFrom: '',
        validTo: '',
        items: [],
        standardTotal: 0,
        packagePrice: 0,
        status: 'active',
        ...initialData
    });

    useEffect(() => {
        loadInventory();
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const loadInventory = async () => {
        const items = await getMediaItems();
        setInventory(items);
    };

    // Calculate Standard Total whenever items change
    useEffect(() => {
        const calculateTotal = () => {
            if (!formData.items || !inventory.length) return 0;

            const selectedItems = inventory.filter(item => formData.items?.includes(item.id));
            const total = selectedItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

            setFormData(prev => ({ ...prev, standardTotal: total }));
        };
        calculateTotal();
    }, [formData.items, inventory]);

    const toggleItem = (itemId: string) => {
        const currentItems = formData.items || [];
        const exists = currentItems.includes(itemId);

        let newItems;
        if (exists) {
            newItems = currentItems.filter(id => id !== itemId);
        } else {
            newItems = [...currentItems, itemId];
        }

        setFormData({ ...formData, items: newItems });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        setUploading(true);
        setUploadProgress(0);

        const storageRef = ref(storage, `packages/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTaskRef.current = uploadTask;

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (error) => {
                console.error("Upload error:", error);
                setUploading(false);
                setPreviewUrl(null);
                alert("Upload failed");
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                setFormData(prev => ({ ...prev, image: downloadURL }));
                setUploading(false);
                setPreviewUrl(null);
            }
        );
    };

    const handleCancelUpload = () => {
        if (uploadTaskRef.current) {
            uploadTaskRef.current.cancel();
            setUploading(false);
            setPreviewUrl(null);
            setUploadProgress(0);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEditing && initialData?.id) {
                await updatePackage(initialData.id, formData);
            } else {
                await createPackage(formData as Omit<PackageItem, 'id' | 'createdAt' | 'updatedAt'>);
            }
            router.push('/packages');
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Failed to save package');
        } finally {
            setLoading(false);
        }
    };

    const filteredInventory = inventory
        .filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.skuId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.code || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
            }

            const aString = String(aValue || '').toLowerCase();
            const bString = String(bValue || '').toLowerCase();

            if (aString < bString) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aString > bString) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

    const savings = (formData.standardTotal || 0) - (formData.packagePrice || 0);

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Header / Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/packages" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft className="h-5 w-5 text-slate-500" />
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {isEditing ? 'Edit Package' : 'Create New Package'}
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Link href="/packages" className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-[#009b4d] hover:bg-[#008a44] text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {loading ? 'Saving...' : 'Save Package'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Basic Info & Pricing */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Basic Details Card */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <h2 className="font-semibold text-lg text-slate-900 mb-4">Package Details</h2>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Package Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                placeholder="e.g., Summer Bundle Deal"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                required
                                rows={4}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                placeholder="Describe what makes this package special..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Package Image</label>
                            <div className="mt-1 flex items-center space-x-4">
                                {(previewUrl || formData.image) && (
                                    <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                                        <img
                                            src={previewUrl || formData.image}
                                            alt="Preview"
                                            className="h-full w-full object-cover"
                                        />
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-1"></div>
                                                <button
                                                    onClick={(e) => { e.preventDefault(); handleCancelUpload(); }}
                                                    className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        disabled={uploading}
                                        onChange={handleImageUpload}
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                    />
                                    {uploading && (
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                                            <div
                                                className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Valid From</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.validFrom}
                                    onChange={e => setFormData({ ...formData, validFrom: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Valid To</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.validTo}
                                    onChange={e => setFormData({ ...formData, validTo: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200"
                            >
                                <option value="active">Active (Published)</option>
                                <option value="inactive">Inactive (Draft)</option>
                            </select>
                        </div>
                    </div>

                    {/* Pricing Card */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <h2 className="font-semibold text-lg text-slate-900 flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-emerald-600" />
                            Pricing Logic
                        </h2>

                        <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Selected Items Value:</span>
                                <span className="font-medium">RM {formData.standardTotal?.toLocaleString()}</span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-900 mb-1">Package Price (Override)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">RM</span>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.packagePrice}
                                        onChange={e => setFormData({ ...formData, packagePrice: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-emerald-100 focus:border-emerald-500 focus:ring-0 outline-none text-lg font-bold text-emerald-700"
                                    />
                                </div>
                            </div>

                            {savings > 0 && (
                                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-green-600">
                                    <span className="text-xs font-bold uppercase tracking-wider">Total Savings</span>
                                    <span className="font-bold">RM {savings.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Inventory Selector */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[600px] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="font-semibold text-lg text-slate-900">Select Inventory</h2>
                                <p className="text-sm text-slate-500">Pick items to include in this bundle.</p>
                            </div>
                            <div className="text-sm bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium">
                                {formData.items?.length || 0} items selected
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, location, or SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        {/* Sort */}
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                            {['name', 'location', 'price', 'type'].map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setSortConfig({ key, direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${sortConfig.key === key ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {key.charAt(0).toUpperCase() + key.slice(1)} {sortConfig.key === key && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </button>
                            ))}
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto border border-slate-100 rounded-lg">
                            {filteredInventory.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    No items found.
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {filteredInventory.map(item => {
                                        const isSelected = formData.items?.includes(item.id);
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => toggleItem(item.id)}
                                                className={`p-4 flex items-center gap-4 cursor-pointer transition-colors hover:bg-slate-50 ${isSelected ? 'bg-emerald-50 hover:bg-emerald-100' : ''}`}
                                            >
                                                <div className={`flex-shrink-0 `}>
                                                    {isSelected ? (
                                                        <CheckSquare className="h-6 w-6 text-emerald-600" />
                                                    ) : (
                                                        <Square className="h-6 w-6 text-slate-300" />
                                                    )}
                                                </div>

                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="h-16 w-24 object-cover rounded-md bg-slate-200" />
                                                ) : (
                                                    <div className="h-16 w-24 bg-slate-200 rounded-md flex items-center justify-center text-xs text-slate-400">No Img</div>
                                                )}

                                                <div className="flex-1">
                                                    <h4 className={`font-medium ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`}>{item.name}</h4>
                                                    <p className="text-sm text-slate-500">{item.location}</p>
                                                    <p className="text-xs text-slate-400 mt-1">{item.type} • {item.width}x{item.height}{item.unit}</p>
                                                </div>

                                                <div className="text-right">
                                                    <div className="font-semibold text-slate-700">RM {Number(item.price)?.toLocaleString()}</div>
                                                    <span className="text-xs text-slate-400">Standard Rate</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
