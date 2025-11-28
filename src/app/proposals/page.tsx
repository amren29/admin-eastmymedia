"use client";

import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Calendar, User, Mail, MoreHorizontal, Eye, Trash2 } from 'lucide-react';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useModal } from '@/context/ModalContext';
import Link from 'next/link';

interface Proposal {
    id: string;
    clientName: string;
    clientEmail: string;
    status: 'new' | 'contacted' | 'closed';
    createdAt: string;
    billboards: any[];
    message?: string;
}

export default function ProposalsPage() {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { showConfirm, showModal } = useModal();

    useEffect(() => {
        fetchProposals();
    }, []);

    const fetchProposals = async () => {
        try {
            const q = query(collection(db, 'proposals'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const list = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Proposal));
            setProposals(list);
        } catch (error) {
            console.error("Error fetching proposals:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        showConfirm('Delete Proposal', 'Are you sure you want to delete this proposal?', async () => {
            try {
                await deleteDoc(doc(db, 'proposals', id));
                setProposals(proposals.filter(item => item.id !== id));
            } catch (error) {
                console.error("Error deleting proposal:", error);
                showModal({ title: 'Error', message: 'Failed to delete proposal', type: 'danger' });
            }
        }, 'danger');
    };

    const filteredProposals = proposals.filter(item =>
        item.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-50 text-blue-700 ring-blue-600/20';
            case 'contacted': return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20';
            case 'closed': return 'bg-green-50 text-green-700 ring-green-600/20';
            default: return 'bg-slate-50 text-slate-700 ring-slate-600/20';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Proposals</h2>
                    <p className="text-slate-500 mt-1">Manage client proposals and requests.</p>
                </div>
                <Link
                    href="/proposals/new"
                    className="flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 transition-colors"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Proposal
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by client name or email..."
                            className="w-full rounded-lg border border-slate-300 pl-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="h-12 px-6 align-middle font-semibold text-slate-600">Client</th>
                                <th className="h-12 px-6 align-middle font-semibold text-slate-600">Items</th>
                                <th className="h-12 px-6 align-middle font-semibold text-slate-600">Date</th>
                                <th className="h-12 px-6 align-middle font-semibold text-slate-600">Status</th>
                                <th className="h-12 px-6 align-middle font-semibold text-slate-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                                            Loading proposals...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredProposals.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-500">
                                            <FileText className="h-12 w-12 mb-4 text-slate-300" />
                                            <p className="text-lg font-medium text-slate-900">No proposals found</p>
                                            <p className="text-sm">Create a new proposal to get started.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredProposals.map((item) => (
                                    <tr key={item.id} className="transition-colors hover:bg-slate-50/80">
                                        <td className="p-4 px-6 align-middle">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900">{item.clientName || 'Unknown Client'}</span>
                                                <span className="text-xs text-slate-500 flex items-center mt-0.5">
                                                    <Mail className="h-3 w-3 mr-1" />
                                                    {item.clientEmail}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 px-6 align-middle text-slate-600">
                                            {item.billboards?.length || 0} items
                                        </td>
                                        <td className="p-4 px-6 align-middle text-slate-600">
                                            <div className="flex items-center">
                                                <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-4 px-6 align-middle">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(item.status)}`}>
                                                {item.status?.toUpperCase() || 'NEW'}
                                            </span>
                                        </td>
                                        <td className="p-4 px-6 align-middle text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/proposals/${item.id}`} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-md transition-colors">
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                                <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-md transition-colors">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
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
