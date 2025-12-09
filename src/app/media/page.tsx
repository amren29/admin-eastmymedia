"use client";

import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit, Trash2, Upload, Filter, X, Check } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, writeBatch, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';

interface Billboard {
    id: string;
    name: string;
    location: string;
    region?: string;
    type: string;
    price: number;
    available: boolean;
    verificationStatus?: 'draft' | 'pending' | 'published';
    size?: string;
    rentalRates?: {
        id: string;
        duration: string;
        rateType: string;
        rentalPrice: number;
        productionCost: number;
        sst: number;
        total: number;
        discount: number;
    }[];
    [key: string]: any;
}

export default function MediaPage() {
    const [media, setMedia] = useState<Billboard[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);
    const { userData } = useAuth();
    const { showConfirm, showAlert, showModal } = useModal();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Filters
    // Filters
    const [filterType, setFilterType] = useState('All');
    const [filterRegion, setFilterRegion] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterVerification, setFilterVerification] = useState('All');
    const [filterPrice, setFilterPrice] = useState('All');
    const [filterSize, setFilterSize] = useState('All');

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Derived unique values for dropdowns
    const uniqueTypes = ['All', ...Array.from(new Set(media.map(m => m.type || 'Unspecified'))).sort()];
    const uniqueRegions = ['All', 'Sabah', 'Sarawak'];
    const uniqueSizes = ['All', ...Array.from(new Set(media.map(m => m.size || 'Unspecified'))).sort()];


    const getSortValue = (item: Billboard, key: string) => {
        switch (key) {
            case 'price':
                return Number(item.price) || 0;
            case 'skuId':
                const id = item.skuId || item.code || '';
                // Try to extract numeric part for natural sort if possible, else return string
                return id.toLowerCase();
            case 'status':
                return item.available ? 1 : 0; // Booked (0) vs Available (1)
            case 'approval':
                // Custom order: pending < draft < published
                const status = item.verificationStatus || 'published';
                const order = { 'pending': 0, 'draft': 1, 'published': 2 };
                return order[status as keyof typeof order] ?? 2;
            case 'location':
            case 'name':
            case 'type':
            default:
                return (item[key] || '').toString().toLowerCase();
        }
    };

    const filteredMedia = media.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
            item.name.toLowerCase().includes(searchLower) ||
            item.location.toLowerCase().includes(searchLower) ||
            (item.region && item.region.toLowerCase().includes(searchLower)) ||
            (item.skuId && item.skuId.toLowerCase().includes(searchLower)) ||
            (item.code && item.code.toLowerCase().includes(searchLower)) ||
            item.type.toLowerCase().includes(searchLower)
        );

        const matchesType = filterType === 'All' || item.type === filterType;
        const matchesRegion = filterRegion === 'All' || (item.region || 'Sabah') === filterRegion;
        const matchesSize = filterSize === 'All' || (item.size || 'Unspecified') === filterSize;
        const matchesStatus = filterStatus === 'All'
            ? true
            : filterStatus === 'Available' ? item.available
                : !item.available; // Booked

        const matchesVerification = filterVerification === 'All' || (item.verificationStatus || 'published') === filterVerification;

        let matchesPrice = true;
        if (filterPrice !== 'All') {
            const price = Number(item.price) || 0;
            switch (filterPrice) {
                case 'Under 1000': matchesPrice = price < 1000; break;
                case '1000-5000': matchesPrice = price >= 1000 && price <= 5000; break;
                case '5000-10000': matchesPrice = price > 5000 && price <= 10000; break;
                case 'Above 10000': matchesPrice = price > 10000; break;
            }
        }

        return matchesSearch && matchesType && matchesRegion && matchesStatus && matchesPrice && matchesSize && matchesVerification;
    }).sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        const valA = getSortValue(a, key);
        const valB = getSortValue(b, key);

        if (valA < valB) {
            return direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
            return direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    useEffect(() => {
        fetchMedia();
    }, []);

    const fetchMedia = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'billboards'));
            const mediaList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Billboard));
            setMedia(mediaList);
        } catch (error) {
            console.error("Error fetching media:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        if (userData?.role?.toLowerCase() !== 'administrator') return;

        try {
            await updateDoc(doc(db, 'billboards', id), {
                verificationStatus: 'published',
                updatedAt: new Date().toISOString()
            });

            setMedia(media.map(item =>
                item.id === id ? { ...item, verificationStatus: 'published' } : item
            ));

            showModal({
                title: 'Success',
                message: 'Media approved and published successfully',
                type: 'success'
            });
        } catch (error) {
            console.error("Error approving media:", error);
            showModal({
                title: 'Error',
                message: 'Failed to approve media',
                type: 'danger'
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (userData?.role?.toLowerCase() !== 'administrator') {
            showAlert('Access Denied', 'Only Administrators can delete media.', 'warning');
            return;
        }

        showConfirm(
            'Delete Media',
            'Are you sure you want to delete this media? This action cannot be undone.',
            async () => {
                try {
                    await deleteDoc(doc(db, 'billboards', id));
                    setMedia(media.filter(item => item.id !== id));
                    setSelectedIds(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(id);
                        return newSet;
                    });
                    showAlert('Success', 'Media deleted successfully', 'success');
                } catch (error) {
                    console.error("Error deleting media:", error);
                    showAlert('Error', 'Failed to delete media', 'danger');
                }
            },
            'danger'
        );
    };

    const handleBulkDelete = async () => {
        if (userData?.role?.toLowerCase() !== 'administrator') return;

        showConfirm(
            'Delete Selected Media',
            `Are you sure you want to delete ${selectedIds.size} selected items? This cannot be undone.`,
            async () => {
                try {
                    const batch = writeBatch(db);
                    selectedIds.forEach(id => {
                        const docRef = doc(db, 'billboards', id);
                        batch.delete(docRef);
                    });
                    await batch.commit();

                    setMedia(media.filter(item => !selectedIds.has(item.id)));
                    setSelectedIds(new Set());
                    showAlert('Success', 'Selected items deleted successfully', 'success');
                } catch (error) {
                    console.error("Error deleting selected media:", error);
                    showAlert('Error', 'Failed to delete selected media', 'danger');
                }
            },
            'danger'
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredMedia.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredMedia.map(item => item.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const bstr = event.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                console.log("Importing data:", data);

                let count = 0;
                // Process in chunks
                const batchSize = 400;
                for (let i = 0; i < data.length; i += batchSize) {
                    const chunk = data.slice(i, i + batchSize);
                    const batch = writeBatch(db);

                    chunk.forEach((item: any) => {
                        const docRef = doc(collection(db, 'billboards'));
                        // Ensure defaults for all required fields
                        const billboardData = {
                            name: item.name || 'Untitled',
                            location: item.location || '',
                            region: item.region || 'Sabah',
                            type: item.type || 'Static',
                            price: Number(item.price) || 0,
                            available: item.available === 'true' || item.available === true,
                            width: Number(item.width) || 0,
                            height: Number(item.height) || 0,
                            size: item.size || '',
                            traffic: item.traffic || '',
                            latitude: Number(item.latitude) || 0,
                            longitude: Number(item.longitude) || 0,
                            gps: item.gps || '',
                            code: item.code || item.skuId || '',
                            skuId: item.skuId || item.code || '',
                            image: item.image || '',
                            verificationStatus: userData?.role?.toLowerCase() === 'administrator' ? 'published' : 'pending',
                            createdAt: new Date().toISOString(),
                            ...item
                        };
                        delete billboardData.id;

                        batch.set(docRef, billboardData);
                        count++;
                    });

                    await batch.commit();
                }

                showModal({
                    title: 'Import Successful',
                    message: `Successfully imported ${count} items!`,
                    type: 'success'
                });
                fetchMedia();
            } catch (error) {
                console.error("Error importing file:", error);
                showModal({
                    title: 'Import Failed',
                    message: 'Failed to import file',
                    type: 'danger'
                });
            } finally {
                setImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };

        reader.readAsBinaryString(file);
    };

    const handleDownload = () => {
        const worksheet = XLSX.utils.json_to_sheet(media);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Media");
        XLSX.writeFile(workbook, "media_inventory.xlsx");
    };

    const clearFilters = () => {
        setFilterType('All');
        setFilterRegion('All');
        setFilterStatus('All');
        setFilterPrice('All');
        setFilterSize('All');
        setSearchTerm('');
    };

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) return <span className="text-slate-300 opacity-50 ml-1">⇅</span>;
        return <span className="text-blue-600 ml-1">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Media Inventory</h2>
                    <p className="text-slate-500 mt-1">Manage your billboard listings and availability.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {userData?.role?.toLowerCase() === 'administrator' && selectedIds.size > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Selected ({selectedIds.size})
                        </button>
                    )}

                    <button
                        onClick={handleDownload}
                        className="flex items-center justify-center rounded-md bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                    >
                        <Upload className="mr-2 h-4 w-4 rotate-180" />
                        Export
                    </button>
                    <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importing}
                        className="flex items-center justify-center rounded-md bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        {importing ? 'Importing...' : 'Import'}
                    </button>
                    <Link
                        href="/media/new"
                        className="flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 transition-colors"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Media
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-4">
                    {/* Search and Filters Container */}
                    <div className="flex flex-col xl:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name or location..."
                                className="w-full rounded-lg border border-slate-300 pl-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-2 items-center">
                            <select
                                className="rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                {uniqueTypes.map(type => (
                                    <option key={type} value={type}>{type === 'All' ? 'All Types' : type}</option>
                                ))}
                            </select>

                            <select
                                className="rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white max-w-[150px]"
                                value={filterRegion}
                                onChange={(e) => setFilterRegion(e.target.value)}
                            >
                                {uniqueRegions.map(reg => (
                                    <option key={reg} value={reg}>{reg === 'All' ? 'All Regions' : reg}</option>
                                ))}
                            </select>

                            <select
                                className="rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white max-w-[150px]"
                                value={filterSize}
                                onChange={(e) => setFilterSize(e.target.value)}
                            >
                                {uniqueSizes.map(size => (
                                    <option key={size} value={size}>{size === 'All' ? 'All Sizes' : size}</option>
                                ))}
                            </select>

                            {/* Verification Status Filter */}
                            <select
                                className="rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
                                value={filterVerification}
                                onChange={(e) => setFilterVerification(e.target.value)}
                            >
                                <option value="All">All Verification</option>
                                <option value="published">Published</option>
                                <option value="pending">Pending Approval</option>
                                <option value="draft">Drafts</option>
                            </select>

                            <select
                                className="rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
                                value={filterPrice}
                                onChange={(e) => setFilterPrice(e.target.value)}
                            >
                                <option value="All">All Prices</option>
                                <option value="Under 1000">Under RM 1,000</option>
                                <option value="1000-5000">RM 1,000 - RM 5,000</option>
                                <option value="5000-10000">RM 5,000 - RM 10,000</option>
                                <option value="Above 10000">Above RM 10,000</option>
                            </select>

                            <select
                                className="rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="All">All Status</option>
                                <option value="Available">Available</option>
                                <option value="Booked">Booked</option>
                            </select>

                            {(filterType !== 'All' || filterRegion !== 'All' || filterStatus !== 'All' || filterPrice !== 'All' || filterSize !== 'All' || searchTerm) && (
                                <button
                                    onClick={clearFilters}
                                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Clear Filters"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                {userData?.role?.toLowerCase() === 'administrator' && (
                                    <th className="h-12 px-6 align-middle font-semibold text-slate-600 w-12">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                            checked={filteredMedia.length > 0 && selectedIds.size === filteredMedia.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                )}
                                <th
                                    className="h-12 px-6 align-middle font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() => requestSort('skuId')}
                                >
                                    <div className="flex items-center gap-1">
                                        SKU ID <SortIcon columnKey="skuId" />
                                    </div>
                                </th>
                                <th
                                    className="h-12 px-6 align-middle font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() => requestSort('name')}
                                >
                                    <div className="flex items-center gap-1">
                                        Name <SortIcon columnKey="name" />
                                    </div>
                                </th>
                                <th
                                    className="h-12 px-6 align-middle font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() => requestSort('location')}
                                >
                                    <div className="flex items-center gap-1">
                                        Location <SortIcon columnKey="location" />
                                    </div>
                                </th>
                                <th
                                    className="h-12 px-6 align-middle font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() => requestSort('type')}
                                >
                                    <div className="flex items-center gap-1">
                                        Type <SortIcon columnKey="type" />
                                    </div>
                                </th>
                                <th
                                    className="h-12 px-6 align-middle font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() => requestSort('price')}
                                >
                                    <div className="flex items-center gap-1">
                                        Price <SortIcon columnKey="price" />
                                    </div>
                                </th>
                                <th
                                    className="h-12 px-6 align-middle font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() => requestSort('approval')}
                                >
                                    <div className="flex items-center gap-1">
                                        Approval <SortIcon columnKey="approval" />
                                    </div>
                                </th>
                                <th
                                    className="h-12 px-6 align-middle font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() => requestSort('status')}
                                >
                                    <div className="flex items-center gap-1">
                                        Status <SortIcon columnKey="status" />
                                    </div>
                                </th>
                                <th className="h-12 px-6 align-middle font-semibold text-slate-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-slate-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                                            Loading media...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredMedia.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-500">
                                            <Search className="h-12 w-12 mb-4 text-slate-300" />
                                            <p className="text-lg font-medium text-slate-900">No media found</p>
                                            <p className="text-sm">Try adjusting your search or add new media.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredMedia.map((item) => (
                                    <tr key={item.id} className={`transition-colors hover:bg-slate-50/80 ${selectedIds.has(item.id) ? 'bg-blue-50' : ''}`}>
                                        {userData?.role?.toLowerCase() === 'administrator' && (
                                            <td className="p-4 px-6 align-middle">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                                    checked={selectedIds.has(item.id)}
                                                    onChange={() => toggleSelect(item.id)}
                                                />
                                            </td>
                                        )}
                                        <td className="p-4 px-6 align-middle font-medium text-slate-600">
                                            {item.skuId || item.code || '-'}
                                        </td>
                                        <td className="p-4 px-6 align-middle font-medium text-slate-900">{item.name}</td>
                                        <td className="p-4 px-6 align-middle text-slate-600">{item.location}</td>
                                        <td className="p-4 px-6 align-middle">
                                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="p-4 px-6 align-middle font-medium text-slate-900">
                                            <div>
                                                RM {item.price.toLocaleString()}
                                                {item.rentalRates && item.rentalRates.length > 0 && (
                                                    <div className="text-xs text-blue-600 font-normal mt-0.5">
                                                        {item.rentalRates.length} rental options
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 px-6 align-middle">
                                            {/* Verification Status Badge */}
                                            {(() => {
                                                const status = item.verificationStatus || 'published';
                                                switch (status) {
                                                    case 'draft':
                                                        return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">Draft</span>;
                                                    case 'pending':
                                                        return <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">Pending</span>;
                                                    case 'published':
                                                        return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Published</span>;
                                                    default:
                                                        return null;
                                                }
                                            })()}
                                        </td>
                                        <td className="p-4 px-6 align-middle">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${item.available ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'}`}>
                                                <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${item.available ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                                {item.available ? 'Available' : 'Booked'}
                                            </span>
                                        </td>
                                        <td className="p-4 px-6 align-middle text-right">
                                            <div className="flex justify-end gap-2">
                                                {/* Approve Button for Admins on Pending items */}
                                                {userData?.role?.toLowerCase() === 'administrator' && item.verificationStatus === 'pending' && (
                                                    <button
                                                        onClick={(e) => handleApprove(item.id, e)}
                                                        className="p-2 hover:bg-green-50 text-slate-400 hover:text-green-600 rounded-md transition-colors"
                                                        title="Approve & Publish"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                )}

                                                <Link href={`/media/${item.id}`} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-md transition-colors">
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                                {userData?.role?.toLowerCase() === 'administrator' && (
                                                    <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-md transition-colors">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
