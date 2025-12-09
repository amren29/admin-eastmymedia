"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useModal } from '@/context/ModalContext';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewCustomerPage() {
    const router = useRouter();
    const { showAlert, showModal } = useModal();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '', // Used for Person In Charge/Main Display Name
        email: '',
        phone: '',
        companyName: '',
        registrationNo: '',
        category: '',
        address: '',
        officeNo: '',
        personInCharge: '',
        position: '',
        sst: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Ensure name is synced with personInCharge if empty or update it
        const finalName = formData.personInCharge || formData.name;

        if (!formData.email || !finalName || !formData.companyName) {
            showAlert('Missing Information', 'Company Name, PIC Name and Email are required', 'warning');
            return;
        }

        setSaving(true);
        try {
            const customerId = formData.email.toLowerCase();
            const customerRef = doc(db, 'customers', customerId);
            const customerSnap = await getDoc(customerRef);

            if (customerSnap.exists()) {
                showAlert('Duplicate', 'A customer with this email already exists.', 'warning');
                setSaving(false);
                return;
            }

            await setDoc(customerRef, {
                ...formData,
                name: finalName, // Main display name = PIC
                email: customerId, // Ensure lowercase email is stored
                createdAt: new Date().toISOString(),
                lastActiveAt: new Date().toISOString(),
                totalProposals: 0
            });

            router.push('/customers');
        } catch (error) {
            console.error("Error creating customer:", error);
            showModal({ title: 'Error', message: 'Failed to create customer', type: 'danger' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/customers" className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">New Customer</h2>
                    <p className="text-slate-500 mt-1">Add a new client to your database.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Company Information</h3>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            placeholder="Acme Sdn Bhd"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Registration / SSM No.</label>
                        <input
                            type="text"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formData.registrationNo}
                            onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
                            placeholder="202301001234 (1234567-X)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                        <select
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="">Select Industry</option>
                            <option value="Food & Beverage">Food & Beverage (F&B)</option>
                            <option value="Retail & E-commerce">Retail & E-commerce</option>
                            <option value="Technology & Software">Technology & Software</option>
                            <option value="Healthcare & Wellness">Healthcare & Wellness</option>
                            <option value="Property & Real Estate">Property & Real Estate</option>
                            <option value="Education & Training">Education & Training</option>
                            <option value="Manufacturing & Industrial">Manufacturing & Industrial</option>
                            <option value="Finance & Insurance">Finance & Insurance</option>
                            <option value="Professional Services">Professional Services</option>
                            <option value="Travel & Hospitality">Travel & Hospitality</option>
                            <option value="Government & NGO">Government & NGO</option>
                            <option value="Automotive">Automotive</option>
                            <option value="Others">Others</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
                        <textarea
                            required
                            rows={3}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Full business address..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Office Number</label>
                        <input
                            type="tel"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formData.officeNo}
                            onChange={(e) => setFormData({ ...formData, officeNo: e.target.value })}
                            placeholder="+60 3-1234 5678"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">SST Registration No. (Optional)</label>
                        <input
                            type="text"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formData.sst}
                            onChange={(e) => setFormData({ ...formData, sst: e.target.value })}
                            placeholder="W10-2008-12345678"
                        />
                    </div>

                    {/* Contact Person */}
                    <div className="md:col-span-2 mt-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Person In Charge (PIC)</h3>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name (PIC) *</label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formData.personInCharge}
                            onChange={(e) => setFormData({ ...formData, personInCharge: e.target.value })} // Map to personInCharge, main name field will store this or company name? Usually Name is the contact person main name. Let's keep name as PIC name to be consistent or add logic.
                            placeholder="Jane Doe"
                        />
                        <p className="text-xs text-slate-500 mt-1">This will be the primary contact name.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                        <input
                            type="text"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            placeholder="Marketing Manager"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number *</label>
                        <input
                            type="tel"
                            required
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+60 12-345 6789"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                        <input
                            type="email"
                            required
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="jane@company.com"
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
                        {saving ? 'Saving...' : 'Create Customer'}
                    </button>
                </div>
            </form>
        </div>
    );
}
