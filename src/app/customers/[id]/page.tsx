"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useModal } from '@/context/ModalContext';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function EditCustomerPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { showAlert, showModal } = useModal();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        address: ''
    });

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                // Determine ID (params might be a promise in newer Next.js versions, but typically string here for this setup)
                // If using standard pages router or older app router, params is available.
                const customerId = decodeURIComponent(params.id);
                const docRef = doc(db, 'customers', customerId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData({
                        name: data.name || '',
                        email: data.email || '',
                        phone: data.phone || '',
                        companyName: data.companyName || '',
                        address: data.address || ''
                    });
                } else {
                    showAlert('Error', 'Customer not found', 'danger');
                    router.push('/customers');
                }
            } catch (error) {
                console.error("Error fetching customer:", error);
                showAlert('Error', 'Failed to fetch customer details', 'danger');
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchCustomer();
        }
    }, [params.id, router, showAlert]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email || !formData.name) {
            showAlert('Missing Information', 'Name and Email are required', 'warning');
            return;
        }

        setSaving(true);
        try {
            const customerId = decodeURIComponent(params.id);
            const customerRef = doc(db, 'customers', customerId);

            await updateDoc(customerRef, {
                ...formData,
                email: formData.email.toLowerCase(), // Ensure consistency
                updatedAt: new Date().toISOString(),
            });

            showAlert('Success', 'Customer updated successfully', 'success');
            router.push('/customers');
        } catch (error) {
            console.error("Error updating customer:", error);
            showModal({ title: 'Error', message: 'Failed to update customer', type: 'danger' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading customer details...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/customers" className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Edit Customer</h2>
                    <p className="text-slate-500 mt-1">Update client information.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                        <input
                            type="email"
                            required
                            disabled
                            className="w-full rounded-md border border-slate-300 px-3 py-2 bg-slate-100 text-slate-500 cursor-not-allowed"
                            value={formData.email}
                            title="Email cannot be changed as it is the unique identifier"
                        />
                        <p className="text-xs text-slate-500 mt-1">Email cannot be changed once created.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+60 12-345 6789"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                        <input
                            type="text"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            placeholder="Acme Corp"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                        <textarea
                            rows={3}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Client's address..."
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-70 transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Update Customer'}
                    </button>
                </div>
            </form>
        </div>
    );
}
