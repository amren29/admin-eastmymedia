"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useModal } from '@/context/ModalContext';
import { Mail, Phone, User, Search, Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Customer {
    id: string;
    name: string;
    email: string;
    phone?: string;
    totalProposals: number;
    lastActiveAt: string;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const { showConfirm, showAlert, showModal } = useModal();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const q = query(collection(db, 'customers'), orderBy('lastActiveAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const list = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Customer));

            setCustomers(list);
        } catch (error) {
            console.error("Error fetching customers:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        showConfirm('Sync Customers', 'This will scan all proposals and update the customer database. Continue?', async () => {
            setSyncing(true);
            try {
                const q = query(collection(db, 'proposals'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);

                const customerMap = new Map<string, any>();

                querySnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    const email = data.clientEmail?.toLowerCase();

                    if (email) {
                        if (!customerMap.has(email)) {
                            customerMap.set(email, {
                                name: data.clientName,
                                email: data.clientEmail,
                                phone: data.clientPhone,
                                lastActiveAt: data.createdAt,
                                totalProposals: 1
                            });
                        } else {
                            const existing = customerMap.get(email);
                            existing.totalProposals += 1;
                            // Keep the latest date (first one found due to desc sort)
                        }
                    }
                });

                // Batch writes would be better but for simplicity we'll loop
                for (const [email, data] of customerMap.entries()) {
                    await setDoc(doc(db, 'customers', email), data, { merge: true });
                }

                showAlert('Synced', `Synced ${customerMap.size} customers successfully!`, 'success');
                fetchCustomers();
            } catch (error) {
                console.error("Error syncing customers:", error);
                showModal({ title: 'Error', message: 'Failed to sync customers', type: 'danger' });
            } finally {
                setSyncing(false);
            }
        }, 'confirm');
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center">Loading customers...</div>;

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Customers</h2>
                    <p className="text-slate-500">Manage your client base.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Syncing...' : 'Sync'}
                    </button>
                    <Link
                        href="/customers/new"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
                    >
                        <Plus className="h-4 w-4" />
                        New Customer
                    </Link>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search customers..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Contact Info</th>
                                <th className="px-6 py-4 text-center">Proposals</th>
                                <th className="px-6 py-4 text-right">Last Active</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                        No customers found.
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                {customer.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center text-slate-600">
                                                    <Mail className="h-3 w-3 mr-2 text-slate-400" />
                                                    {customer.email}
                                                </div>
                                                {customer.phone && (
                                                    <div className="flex items-center text-slate-600">
                                                        <Phone className="h-3 w-3 mr-2 text-slate-400" />
                                                        {customer.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                {customer.totalProposals}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500">
                                            {new Date(customer.lastActiveAt).toLocaleDateString()}
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
