"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { use } from 'react';
import { useModal } from '@/context/ModalContext';
import { useAuth } from '@/context/AuthContext';
import { MapPin } from 'lucide-react';
import MapPicker from '@/components/MapPicker';

interface MediaFormProps {
    params: Promise<{ id?: string }>;
}

interface RentalRate {
    id: string;
    duration: string;
    rentalPrice: number;
    productionCost: number;
    sst: number;
    total: number;
    discount: number;
    rateType: string;
}

export default function MediaFormPage({ params }: MediaFormProps) {
    const router = useRouter();
    const resolvedParams = use(params);
    const isEditMode = !!resolvedParams.id;
    const { userData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const uploadTaskRef = useRef<any>(null);
    const { showAlert, showModal } = useModal();
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const TARGET_MARKET_OPTIONS = [
        'Tourist', 'Business Community', 'Student', 'Residential',
        'Shoppers', 'Commuters', 'Luxury', 'Youth', 'Family',
        'Working Professionals', 'Expatriates', 'Foodies'
    ];

    const TIME_OPTIONS = [
        "12:00 AM", "12:30 AM", "1:00 AM", "1:30 AM", "2:00 AM", "2:30 AM",
        "3:00 AM", "3:30 AM", "4:00 AM", "4:30 AM", "5:00 AM", "5:30 AM",
        "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM",
        "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
        "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
        "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
        "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM",
        "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"
    ];

    const generateSuggestions = () => {
        if (!formData.gps) {
            // Random suggestions if no GPS
            const shuffled = [...TARGET_MARKET_OPTIONS].sort(() => 0.5 - Math.random());
            setSuggestions(shuffled.slice(0, 4));
            return;
        }

        // Deterministic "random" based on GPS numbers to seem intelligent but consistent
        const gpsSum = formData.gps.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const shuffled = [...TARGET_MARKET_OPTIONS].sort((a, b) => {
            const scoreA = (a.length + gpsSum) % 13;
            const scoreB = (b.length + gpsSum) % 17;
            return scoreA - scoreB;
        });

        setSuggestions(shuffled.slice(0, 5));
    };

    const addSuggestion = (tag: string) => {
        const currentTags = formData.targetMarket
            ? formData.targetMarket.split(',').map(t => t.trim()).filter(Boolean)
            : [];

        if (!currentTags.includes(tag)) {
            const newTags = [...currentTags, tag].join(', ');
            setFormData({ ...formData, targetMarket: newTags });
        }
    };

    const handleCancelUpload = () => {
        if (uploadTaskRef.current) {
            uploadTaskRef.current.cancel();
            setUploading(false);
            setPreviewUrl(null);
            setUploadProgress(0);
            setUploadProgress(0);
            showAlert('Cancelled', 'Upload cancelled', 'info');
        }
    };

    const [showMapPicker, setShowMapPicker] = useState<{ field: 'gps' | 'startPoint' | 'endPoint' } | null>(null);

    const [formData, setFormData] = useState({
        // Media Info
        skuId: '',
        name: '',
        location: '',
        type: 'Static', // Static, LED Screen, Roadside Bunting, Car Wrap
        available: true,
        availabilityStatus: 'available',
        verificationStatus: 'published', // Default, will be handled by logic
        totalPanel: 1,

        // Technical Info
        width: 0,
        height: 0,
        unit: 'ft', // ft, m, inch
        image: '',

        // Screen Info (LED Only)
        operatingTime: '',
        durationPerAd: '',
        noOfAdvertiser: '',
        loopPerHr: '',
        minLoopPerDay: '',
        fileFormat: '',

        // Description
        description: '',

        // Location Details
        gps: '',
        startPoint: '', // For Roadside Bunting
        endPoint: '',   // For Roadside Bunting
        district: '',   // For Car Wrap
        landmark: '',
        targetMarket: '',
        targetMarket: '',
        traffic: '',
        trafficProfile: 'commuter', // Default profile

        // Pricing
        rentalRates: [] as RentalRate[]
    });

    useEffect(() => {
        if (isEditMode && resolvedParams.id) {
            fetchMedia(resolvedParams.id);
        }
    }, [isEditMode, resolvedParams.id]);

    const fetchMedia = async (id: string) => {
        try {
            const docSnap = await getDoc(doc(db, 'billboards', id));
            if (docSnap.exists()) {
                const data = docSnap.data();
                setFormData({
                    ...formData,
                    ...data,
                    rentalRates: data.rentalRates || [],
                    availabilityStatus: data.availabilityStatus || (data.available ? 'available' : 'booked')
                } as any);
                // If existing media has no status, default to published for UI
                if (!data.verificationStatus) {
                    setFormData(prev => ({ ...prev, verificationStatus: 'published' }));
                }
            }
        } catch (error) {
            console.error("Error fetching media:", error);
        }
    };

    const addRentalRate = () => {
        const newRate: RentalRate = {
            id: crypto.randomUUID(),
            duration: '1 Month',
            rentalPrice: 0,
            productionCost: 0,
            sst: 0,
            total: 0,
            discount: 0,
            rateType: 'Standard'
        };
        setFormData({
            ...formData,
            rentalRates: [...formData.rentalRates, newRate]
        });
    };

    const removeRentalRate = (id: string) => {
        setFormData({
            ...formData,
            rentalRates: formData.rentalRates.filter(rate => rate.id !== id)
        });
    };

    const updateRentalRate = (id: string, field: keyof RentalRate, value: any) => {
        setFormData(prev => {
            const updatedRates = prev.rentalRates.map(rate => {
                if (rate.id !== id) return rate;

                const updatedRate = { ...rate, [field]: value };

                // Auto-calc logic
                if (field === 'rateType') {
                    if (value === 'Offer') updatedRate.discount = 10;
                    else if (value === 'Agency') updatedRate.discount = 15;
                    else if (value === 'Referral') updatedRate.discount = 5;
                    else updatedRate.discount = 0;
                }

                // Recalculate totals if relevant fields change
                if (['rentalPrice', 'productionCost', 'discount', 'rateType'].includes(field as string)) {
                    const subtotal = Number(updatedRate.rentalPrice) + Number(updatedRate.productionCost);
                    const discountAmount = subtotal * (Number(updatedRate.discount) / 100);
                    const afterDiscount = subtotal - discountAmount;
                    updatedRate.sst = Math.round(afterDiscount * 0.08 * 100) / 100; // 8% SST
                    updatedRate.total = Math.round((afterDiscount + updatedRate.sst) * 100) / 100;
                }

                return updatedRate;
            });
            return { ...prev, rentalRates: updatedRates };
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Set local preview immediately
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        console.log('Starting upload for:', file.name, 'Size:', file.size);
        setUploading(true);
        setUploadProgress(0);

        try {
            const storageRef = ref(storage, `media/${Date.now()}_${file.name}`);
            console.log('Storage ref created:', storageRef.fullPath);

            const uploadTask = uploadBytesResumable(storageRef, file);
            uploadTaskRef.current = uploadTask;

            uploadTask.on('state_changed',
                (snapshot: any) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                    console.log('Upload is ' + progress + '% done');
                },
                (error: any) => {
                    console.error("Error during upload:", error);
                    showModal({
                        title: 'Upload Failed',
                        message: `Upload failed: ${error.message}`,
                        type: 'danger'
                    });
                    setUploading(false);
                    setPreviewUrl(null); // Clear preview on error
                },
                async () => {
                    console.log('Upload complete, getting download URL...');
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    console.log('Download URL obtained:', downloadURL);
                    setFormData(prev => ({ ...prev, image: downloadURL }));
                    showModal({
                        title: 'Success',
                        message: 'Image uploaded successfully!',
                        type: 'success'
                    });
                    setUploading(false);
                    setPreviewUrl(null); // Clear preview as we now have the real URL (though we could keep it until save)
                }
            );
        } catch (error: any) {
            console.error("Error initiating upload:", error);
            showModal({
                title: 'Upload Error',
                message: `Failed to initiate upload: ${error.message || 'Unknown error'}`,
                type: 'danger'
            });
            setUploading(false);
            setPreviewUrl(null);
        }
    };

    const handleMapSelect = (lat: number, lng: number) => {
        if (!showMapPicker) return;

        const coordString = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

        if (showMapPicker.field === 'gps') {
            setFormData(prev => ({ ...prev, gps: coordString }));
        } else if (showMapPicker.field === 'startPoint') {
            setFormData(prev => ({ ...prev, startPoint: coordString }));
        } else if (showMapPicker.field === 'endPoint') {
            setFormData(prev => ({ ...prev, endPoint: coordString }));
        }
    };

    const handleSubmit = async (e: React.FormEvent | null, targetStatus: 'draft' | 'pending' | 'published' = 'published') => {
        if (e) e.preventDefault();
        setLoading(true);

        try {
            // Parse GPS string to lat/lng
            let latitude = 0;
            let longitude = 0;
            if (formData.gps) {
                const parts = formData.gps.split(',').map(p => p.trim());
                if (parts.length === 2) {
                    latitude = parseFloat(parts[0]);
                    longitude = parseFloat(parts[1]);
                }
            }

            // Use the first rental rate price as the base price for listing display
            const basePrice = formData.rentalRates.length > 0 ? formData.rentalRates[0].rentalPrice : 0;

            // Determine Status Logic based on Role
            let finalStatus = targetStatus;

            // Non-admins cannot publish directly, default to pending if they try (though UI should prevent)
            if (userData?.role?.toLowerCase() !== 'administrator' && targetStatus === 'published') {
                finalStatus = 'pending';
            }

            const dataToSave = {
                ...formData,
                price: basePrice, // Maintain backward compatibility for listing
                width: Number(formData.width),
                height: Number(formData.height),
                latitude,
                longitude,
                verificationStatus: finalStatus,
                availabilityStatus: formData.availabilityStatus,
                updatedAt: new Date().toISOString(),
            };

            if (isEditMode && resolvedParams.id) {
                await setDoc(doc(db, 'billboards', resolvedParams.id), dataToSave, { merge: true });
            } else {
                await addDoc(collection(db, 'billboards'), {
                    ...dataToSave,
                    createdAt: new Date().toISOString(),
                });
            }

            showModal({
                title: 'Success',
                message: targetStatus === 'draft' ? 'Saved as Draft' : targetStatus === 'pending' ? 'Submitted for Approval' : 'Media Published',
                type: 'success'
            });

            router.push('/media');
        } catch (error) {
            console.error("Error saving media:", error);
            showModal({
                title: 'Save Failed',
                message: 'Failed to save media',
                type: 'danger'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                    {isEditMode ? 'Edit Media Inventory' : 'Add New Media Inventory'}
                </h2>
                <p className="text-muted-foreground">
                    Fill in the details below to update your media inventory.
                </p>
            </div>

            <form className="space-y-8">
                {/* 1. Media Information */}
                <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Media Information</h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">SKU ID</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                value={formData.skuId}
                                onChange={(e) => setFormData({ ...formData, skuId: e.target.value })}
                                placeholder="e.g. FB0001012SBH"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Location</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Type</label>
                            <select
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="Static">Static</option>
                                <option value="LED Screen">LED Screen</option>
                                <option value="Roadside Bunting">Roadside Bunting</option>
                                <option value="Car Wrap">Car Wrap</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Total Panel</label>
                            <input
                                type="number"
                                min="1"
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                value={formData.totalPanel}
                                onChange={(e) => setFormData({ ...formData, totalPanel: parseInt(e.target.value) || 1 })}
                            />
                        </div>
                        <div className="flex items-center pt-6">
                            <div className="flex items-center pt-1">
                                {/* Status Selector */}
                                <label className="block text-sm font-medium text-gray-700 mr-4">Availability Status</label>
                                <div className="flex items-center gap-3">
                                    {[
                                        { value: 'available', label: 'Available', color: 'bg-green-500', hover: 'hover:bg-green-600' },
                                        { value: 'tbc', label: 'TBC', color: 'bg-amber-400', hover: 'hover:bg-amber-500' },
                                        { value: 'booked', label: 'Booked', color: 'bg-red-500', hover: 'hover:bg-red-600' }
                                    ].map(status => {
                                        const isSelected = (formData.availabilityStatus || (formData.available ? 'available' : 'booked')) === status.value;
                                        return (
                                            <button
                                                key={status.value}
                                                type="button"
                                                onClick={() => {
                                                    setFormData({
                                                        ...formData,
                                                        availabilityStatus: status.value,
                                                        available: status.value !== 'booked'
                                                    });
                                                }}
                                                className={`
                                                    relative group flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all
                                                    ${isSelected
                                                        ? 'bg-white border-gray-300 ring-2 ring-offset-2 ring-blue-500 shadow-sm'
                                                        : 'bg-gray-50 border-transparent hover:bg-gray-100'
                                                    }
                                                `}
                                            >
                                                <span className={`w-3 h-3 rounded-full ${status.color}`}></span>
                                                <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                                                    {status.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Technical Information */}
                <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Technical Information</h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Width</label>
                            <input
                                type="number"
                                required
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                value={formData.width || ''}
                                onChange={(e) => setFormData({ ...formData, width: e.target.value === '' ? 0 : Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Height</label>
                            <input
                                type="number"
                                required
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                value={formData.height || ''}
                                onChange={(e) => setFormData({ ...formData, height: e.target.value === '' ? 0 : Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Unit</label>
                            <select
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            >
                                <option value="ft">Feet (ft)</option>
                                <option value="m">Meters (m)</option>
                                <option value="inch">Inches (in)</option>
                            </select>
                        </div>
                        <div className="col-span-3">
                            <label className="block text-sm font-medium text-gray-700">Image</label>
                            <div className="mt-1 flex items-center space-x-4">
                                {(previewUrl || formData.image) && (
                                    <div className="relative h-20 w-20 rounded-md overflow-hidden border border-gray-200">
                                        <img
                                            src={previewUrl || formData.image}
                                            alt="Preview"
                                            className="h-full w-full object-cover"
                                        />
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center flex-col">
                                                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-1"></div>
                                                <span className="text-white text-xs font-bold">{Math.round(uploadProgress)}%</span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleCancelUpload();
                                                    }}
                                                    className="mt-2 text-[10px] bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
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
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                                    />
                                    {uploading && <p className="text-xs text-teal-600 mt-1">Uploading...</p>}
                                </div>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Recommended size: 1920x1080 for Digital, High Res for Print.</p>
                        </div>
                    </div>
                </div>

                {/* 3. Screen Information (Conditional) */}
                {formData.type === 'LED Screen' && (
                    <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Screen Information</h3>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="col-span-1 sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Screening Hours</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500 mb-1 block">From</label>
                                        <select
                                            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                            value={formData.operatingTime.split(' - ')[0] || ''}
                                            onChange={(e) => {
                                                const currentEnd = formData.operatingTime.split(' - ')[1] || '12:00 AM';
                                                setFormData({ ...formData, operatingTime: `${e.target.value} - ${currentEnd}` });
                                            }}
                                        >
                                            <option value="">Select Start Time</option>
                                            {TIME_OPTIONS.map(time => (
                                                <option key={time} value={time}>{time}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <span className="text-gray-400 mt-6">-</span>
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500 mb-1 block">To</label>
                                        <select
                                            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                            value={formData.operatingTime.split(' - ')[1] || ''}
                                            onChange={(e) => {
                                                const currentStart = formData.operatingTime.split(' - ')[0] || '7:00 AM';
                                                setFormData({ ...formData, operatingTime: `${currentStart} - ${e.target.value}` });
                                            }}
                                        >
                                            <option value="">Select End Time</option>
                                            {TIME_OPTIONS.map(time => (
                                                <option key={time} value={time}>{time}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Duration Per Ad</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    value={formData.durationPerAd}
                                    onChange={(e) => setFormData({ ...formData, durationPerAd: e.target.value })}
                                    placeholder="e.g. 15 Seconds"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">No. of Advertiser</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    value={formData.noOfAdvertiser}
                                    onChange={(e) => setFormData({ ...formData, noOfAdvertiser: e.target.value })}
                                    placeholder="e.g. 9 Ads"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">No. of Loop Per Hr</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    value={formData.loopPerHr}
                                    onChange={(e) => setFormData({ ...formData, loopPerHr: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Min. No. of Loop Per Day</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    value={formData.minLoopPerDay}
                                    onChange={(e) => setFormData({ ...formData, minLoopPerDay: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Format</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    value={formData.fileFormat}
                                    onChange={(e) => setFormData({ ...formData, fileFormat: e.target.value })}
                                    placeholder="e.g. MP4, MOV & JPEG"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Description */}
                <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Description</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">About the Media</label>
                        <textarea
                            rows={4}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe location, visibility, surroundings..."
                        />
                    </div>
                </div>

                {/* 5. Location Details */}
                <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Location Details</h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

                        {formData.type === 'Roadside Bunting' ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Start Point (Lamp Post)</label>
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <input
                                            type="text"
                                            className="block w-full rounded-l-md border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                            value={formData.startPoint || ''}
                                            onChange={(e) => setFormData({ ...formData, startPoint: e.target.value })}
                                            placeholder="e.g. 3.148093, 101.716821"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowMapPicker({ field: 'startPoint' })}
                                            className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 hover:bg-gray-100"
                                        >
                                            <MapPin className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">End Point (Lamp Post)</label>
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <input
                                            type="text"
                                            className="block w-full rounded-l-md border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                            value={formData.endPoint || ''}
                                            onChange={(e) => setFormData({ ...formData, endPoint: e.target.value })}
                                            placeholder="e.g. 3.149093, 101.717821"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowMapPicker({ field: 'endPoint' })}
                                            className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 hover:bg-gray-100"
                                        >
                                            <MapPin className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : formData.type === 'Car Wrap' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">District</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    value={formData.district || ''}
                                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                    placeholder="e.g. Kota Kinabalu, Penampang"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Coordinate</label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <input
                                        type="text"
                                        className="block w-full rounded-l-md border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                        value={formData.gps}
                                        onChange={(e) => setFormData({ ...formData, gps: e.target.value })}
                                        placeholder="e.g. 3.148093, 101.716821"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowMapPicker({ field: 'gps' })}
                                        className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 hover:bg-gray-100"
                                    >
                                        <MapPin className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Landmark</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                value={formData.landmark}
                                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Target Market</label>
                            <div className="flex gap-2 mt-1">
                                <input
                                    type="text"
                                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    value={formData.targetMarket}
                                    onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
                                    placeholder="e.g. Tourist, Business Community"
                                />
                                <button
                                    type="button"
                                    onClick={generateSuggestions}
                                    className="px-3 py-2 bg-teal-50 text-teal-700 rounded-md border border-teal-200 hover:bg-teal-100 text-sm font-medium whitespace-nowrap"
                                >
                                    Suggest
                                </button>
                            </div>
                            {suggestions.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {suggestions.map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => addSuggestion(tag)}
                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                                        >
                                            + {tag}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <p className="mt-1 text-xs text-gray-500">Click "Suggest" to get AI-powered recommendations based on location.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Traffic Volume</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                value={formData.traffic}
                                onChange={(e) => setFormData({ ...formData, traffic: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Traffic Profile (AI Model)</label>
                            <select
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                value={formData.trafficProfile || 'commuter'}
                                onChange={(e) => setFormData({ ...formData, trafficProfile: e.target.value })}
                            >
                                <option value="commuter">Commuter Route (Peak 7-9am, 5-7pm)</option>
                                <option value="retail">Shopping/Retail (Peak Wknd 11am-9pm)</option>
                                <option value="highway">Highway (Steady Flow + Holiday Spikes)</option>
                                <option value="tourist">Tourist Spot (Seasonal/Wknd Spikes)</option>
                                <option value="residential">Residential (Morning Out / Evening In)</option>
                            </select>
                            <p className="mt-1 text-xs text-gray-500">Used for predictive analytics calculations.</p>
                        </div>
                    </div>
                </div>

                {/* 6. Rental Pricing */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50/50">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">Rental Pricing</h3>
                            <p className="text-sm text-gray-500 mt-1">Configure rental rates and discounts.</p>
                        </div>
                        <button
                            type="button"
                            onClick={addRentalRate}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
                        >
                            <svg className="mr-2 -ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Rate
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[160px]">Duration</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[140px]">Rental (RM)</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[140px]">
                                        {formData.type === 'LED Screen' ? 'Content Mgmt' : 'Production'}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[160px]">Rate Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[100px]">Disc %</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[120px]">SST (8%)</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[140px]">Total</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {formData.rentalRates.map((rate) => (
                                    <tr key={rate.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <select
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm px-3 py-2"
                                                value={rate.duration}
                                                onChange={(e) => updateRentalRate(rate.id, 'duration', e.target.value)}
                                            >
                                                <option value="1 Month">1 Month</option>
                                                <option value="3 Months">3 Months</option>
                                                <option value="6 Months">6 Months</option>
                                                <option value="12 Months">12 Months</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm px-3 py-2 no-spinner"
                                                value={rate.rentalPrice || ''}
                                                onChange={(e) => updateRentalRate(rate.id, 'rentalPrice', e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm px-3 py-2 no-spinner"
                                                value={rate.productionCost || ''}
                                                onChange={(e) => updateRentalRate(rate.id, 'productionCost', e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm px-3 py-2"
                                                value={rate.rateType}
                                                onChange={(e) => updateRentalRate(rate.id, 'rateType', e.target.value)}
                                            >
                                                <option value="Standard">Standard</option>
                                                <option value="Offer">Offer</option>
                                                <option value="Agency">Agency</option>
                                                <option value="Referral">Referral</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm px-3 py-2 no-spinner"
                                                value={rate.discount || ''}
                                                onChange={(e) => updateRentalRate(rate.id, 'discount', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            RM {rate.sst?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            RM {rate.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => removeRentalRate(rate.id)}
                                                className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50"
                                            >
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {formData.rentalRates.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-sm text-gray-500">No rental rates configured.</p>
                                <button
                                    type="button"
                                    onClick={addRentalRate}
                                    className="mt-2 text-teal-600 hover:text-teal-700 text-sm font-medium"
                                >
                                    Add your first rate
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                    >
                        Cancel
                    </button>

                    {/* Save as Draft Button */}
                    <button
                        type="button"
                        onClick={(e) => handleSubmit(e, 'draft')}
                        disabled={loading}
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        Save as Draft
                    </button>

                    {/* Submit/Publish Button */}
                    {userData?.role?.toLowerCase() === 'administrator' ? (
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, 'published')}
                            disabled={loading}
                            className="inline-flex justify-center rounded-md border border-transparent bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Publish'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, 'pending')}
                            disabled={loading}
                            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit for Approval'}
                        </button>
                    )}
                </div>
            </form>
            <style jsx global>{`
                /* Hide number input spinners */
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
                input[type=number] {
                    -moz-appearance: textfield;
                }
            `}</style>

            {showMapPicker && (
                <MapPicker
                    onSelect={handleMapSelect}
                    onClose={() => setShowMapPicker(null)}
                />
            )}
        </div>
    );
}
