"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, getDocs, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useModal } from '@/context/ModalContext';
// import { Button } from '@/components/ui/button'; // Assuming you might have UI components, if not use standard HTML
import { Search, Plus, X, MapPin, Check, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

// Reuse Billboard interface roughly
interface MediaItem {
    id: string;
    name: string;
    location: string;
    type: string;
    price: number;
    image: string;
    [key: string]: any;
}

export default function CreateProposalPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const { showAlert, showModal } = useModal();

    // Form State
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [message, setMessage] = useState('');

    // Media Selection State
    const [availableMedia, setAvailableMedia] = useState<MediaItem[]>([]);
    const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [mediaLoading, setMediaLoading] = useState(true);

    useEffect(() => {
        fetchMedia();
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'customers'));
            const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCustomers(list);
        } catch (error) {
            console.error("Error fetching customers:", error);
        }
    };

    const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const customerId = e.target.value;
        setSelectedCustomerId(customerId);

        if (customerId) {
            const customer = customers.find(c => c.id === customerId);
            if (customer) {
                setClientName(customer.name);
                setClientEmail(customer.email);
                setClientPhone(customer.phone || '');
            }
        } else {
            setClientName('');
            setClientEmail('');
            setClientPhone('');
        }
    };

    const fetchMedia = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'billboards'));
            const list = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as MediaItem));
            setAvailableMedia(list);
        } catch (error) {
            console.error("Error fetching media:", error);
        } finally {
            setMediaLoading(false);
        }
    };

    const handleAddMedia = (item: MediaItem) => {
        if (!selectedMedia.find(m => m.id === item.id)) {
            setSelectedMedia([...selectedMedia, item]);
        }
    };

    const handleRemoveMedia = (id: string) => {
        setSelectedMedia(selectedMedia.filter(m => m.id !== id));
    };

    const handleSubmit = async () => {
        if (!clientName || !clientEmail) {
            showAlert('Missing Information', 'Please fill in client details', 'warning');
            return;
        }
        if (selectedMedia.length === 0) {
            showAlert('Missing Information', 'Please select at least one media item', 'warning');
            return;
        }

        setLoading(true);
        try {
            const proposalData = {
                clientName,
                clientEmail,
                clientPhone,
                message,
                billboards: selectedMedia,
                status: 'new',
                createdAt: new Date().toISOString(),
                totalAmount: selectedMedia.reduce((sum, item) => sum + (Number(item.price) || 0), 0)
            };

            // 1. Save Proposal
            await addDoc(collection(db, 'proposals'), proposalData);

            // 2. Save/Update Customer
            const customerId = clientEmail.toLowerCase();
            const customerRef = doc(db, 'customers', customerId);
            const customerSnap = await getDoc(customerRef);

            if (customerSnap.exists()) {
                // Update existing customer
                await setDoc(customerRef, {
                    name: clientName, // Update name if changed
                    phone: clientPhone || customerSnap.data().phone,
                    lastActiveAt: new Date().toISOString(),
                    totalProposals: (customerSnap.data().totalProposals || 0) + 1
                }, { merge: true });
            } else {
                // Create new customer
                await setDoc(customerRef, {
                    name: clientName,
                    email: clientEmail,
                    phone: clientPhone,
                    createdAt: new Date().toISOString(),
                    lastActiveAt: new Date().toISOString(),
                    totalProposals: 1
                });
            }

            router.push('/proposals');
        } catch (error) {
            console.error("Error creating proposal:", error);
            showModal({ title: 'Error', message: 'Failed to create proposal', type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    const filteredMedia = availableMedia.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/proposals" className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Create Proposal</h2>
                    <p className="text-slate-500 mt-1">Draft a new proposal for a client.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form & Selection */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Client Details Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Client Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="col-span-1 sm:col-span-2">
                                <label className="text-sm font-medium text-slate-700">Select Customer</label>
                                <div className="flex gap-2 mt-1">
                                    <select
                                        className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={selectedCustomerId}
                                        onChange={handleCustomerSelect}
                                    >
                                        <option value="">-- Select a Customer --</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                                        ))}
                                    </select>
                                    <Link href="/customers/new" className="flex items-center justify-center px-3 py-2 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200" title="Create New Customer">
                                        <Plus className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Client Name</label>
                                <input
                                    type="text"
                                    readOnly
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-slate-50 text-slate-500"
                                    value={clientName}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Email Address</label>
                                <input
                                    type="email"
                                    readOnly
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-slate-50 text-slate-500"
                                    value={clientEmail}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Phone</label>
                                <input
                                    type="tel"
                                    readOnly
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-slate-50 text-slate-500"
                                    value={clientPhone}
                                />
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <label className="text-sm font-medium text-slate-700">Notes / Message</label>
                            <textarea
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[100px]"
                                placeholder="Additional notes for the proposal..."
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Media Selection Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h3 className="text-lg font-semibold text-slate-900">Select Media</h3>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search media..."
                                    className="w-full rounded-md border border-slate-300 pl-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="max-h-[500px] overflow-y-auto p-4">
                            {mediaLoading ? (
                                <div className="text-center py-8 text-slate-500">Loading media...</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {filteredMedia.slice(0, 20).map(item => {
                                        const isSelected = selectedMedia.some(m => m.id === item.id);
                                        return (
                                            <div
                                                key={item.id}
                                                className={`relative border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 hover:border-blue-300'}`}
                                                onClick={() => isSelected ? handleRemoveMedia(item.id) : handleAddMedia(item)}
                                            >
                                                <div className="flex gap-3">
                                                    <div className="h-16 w-16 bg-slate-200 rounded-md flex-shrink-0 overflow-hidden">
                                                        {item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-slate-900 truncate text-sm">{item.name}</h4>
                                                        <p className="text-xs text-slate-500 truncate flex items-center mt-1">
                                                            <MapPin className="h-3 w-3 mr-1" />
                                                            {item.location}
                                                        </p>
                                                        <p className="text-sm font-bold text-blue-600 mt-2">RM {item.price?.toLocaleString()}</p>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center text-white">
                                                            <Check className="h-3 w-3" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-8">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Proposal Summary</h3>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Client</span>
                                <span className="font-medium text-slate-900 truncate max-w-[150px]">{clientName || '-'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Selected Items</span>
                                <span className="font-medium text-slate-900">{selectedMedia.length}</span>
                            </div>
                            <div className="border-t border-slate-100 pt-4 flex justify-between items-end">
                                <span className="text-sm font-medium text-slate-700">Total Value</span>
                                <span className="text-2xl font-bold text-slate-900">
                                    RM {selectedMedia.reduce((sum, item) => sum + (Number(item.price) || 0), 0).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Selected Items</h4>
                            {selectedMedia.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">No items selected</p>
                            ) : (
                                <ul className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                    {selectedMedia.map(item => (
                                        <li key={item.id} className="flex justify-between items-center text-sm bg-slate-50 p-2 rounded-md">
                                            <span className="truncate flex-1 mr-2">{item.name}</span>
                                            <button onClick={() => handleRemoveMedia(item.id)} className="text-slate-400 hover:text-red-500">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="mt-8">
                            <button
                                onClick={handleSubmit}
                                disabled={loading || selectedMedia.length === 0 || !clientName}
                                className="w-full flex items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Saving...' : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Create Proposal
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
