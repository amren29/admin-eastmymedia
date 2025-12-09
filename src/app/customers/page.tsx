"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useModal } from '@/context/ModalContext';
import { Mail, Phone, User, Search, Plus, Trash2, Edit, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Customer {
    id: string;
    name: string;
    email: string;
    phone?: string;
    totalProposals: number;
    lastActiveAt: string;
    [key: string]: any;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const { showConfirm, showAlert, showModal } = useModal();
    const [searchTerm, setSearchTerm] = useState('');
    const { userData } = useAuth();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

    const handleDelete = async (id: string) => {
        if (userData?.role?.toLowerCase() !== 'administrator') {
            showAlert('Access Denied', 'Only Administrators can delete customers.', 'warning');
            return;
        }

        showConfirm(
            'Delete Customer',
            'Are you sure you want to delete this customer? This action cannot be undone.',
            async () => {
                try {
                    await deleteDoc(doc(db, 'customers', id));
                    setCustomers(customers.filter(item => item.id !== id));
                    setSelectedIds(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(id);
                        return newSet;
                    });
                    showAlert('Success', 'Customer deleted successfully', 'success');
                } catch (error) {
                    console.error("Error deleting customer:", error);
                    showAlert('Error', 'Failed to delete customer', 'danger');
                }
            },
            'danger'
        );
    };

    const handleBulkDelete = async () => {
        if (userData?.role?.toLowerCase() !== 'administrator') return;

        showConfirm(
            'Delete Selected Customers',
            `Are you sure you want to delete ${selectedIds.size} selected customers? This cannot be undone.`,
            async () => {
                try {
                    const batch = writeBatch(db);
                    selectedIds.forEach(id => {
                        const docRef = doc(db, 'customers', id);
                        batch.delete(docRef);
                    });
                    await batch.commit();

                    setCustomers(customers.filter(item => !selectedIds.has(item.id)));
                    setSelectedIds(new Set());
                    showAlert('Success', 'Selected customers deleted successfully', 'success');
                } catch (error) {
                    console.error("Error deleting selected customers:", error);
                    showAlert('Error', 'Failed to delete selected customers', 'danger');
                }
            },
            'danger'
        );
    };

    const handleCopyLink = () => {
        const path = '/client-form';
        navigator.clipboard.writeText(path);
        showAlert('Link Copied', 'Copied "/client-form" to clipboard. Append this to your main website domain.', 'success');
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredCustomers.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredCustomers.map(item => item.id)));
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
                        onClick={handleCopyLink}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
                        title="Copy Public Registration Page Link"
                    >
                        <LinkIcon className="h-4 w-4" />
                        Registration Link
                    </button>
                    {userData?.role?.toLowerCase() === 'administrator' && selectedIds.size > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Selected ({selectedIds.size})
                        </button>
                    )}
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
                                {userData?.role?.toLowerCase() === 'administrator' && (
                                    <th className="h-12 px-6 align-middle font-semibold text-slate-600 w-12">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                            checked={filteredCustomers.length > 0 && selectedIds.size === filteredCustomers.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                )}
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Contact Info</th>
                                <th className="px-6 py-4 text-center">Proposals</th>
                                <th className="px-6 py-4 text-right">Last Active</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No customers found.
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(customer.id) ? 'bg-blue-50' : ''}`}>
                                        {userData?.role?.toLowerCase() === 'administrator' && (
                                            <td className="px-6 py-4 align-middle">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                                    checked={selectedIds.has(customer.id)}
                                                    onChange={() => toggleSelect(customer.id)}
                                                />
                                            </td>
                                        )}
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
                                        <td className="px-6 py-4 text-right">
                                            {userData?.role?.toLowerCase() === 'administrator' && (
                                                <div className="flex justify-end gap-2">
                                                    <Link href={`/customers/${customer.id}`} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-md transition-colors">
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                    <button onClick={() => handleDelete(customer.id)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-md transition-colors">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
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
