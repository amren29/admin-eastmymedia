"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArrowLeft, Download, Trash2, Mail, Phone, Calendar, MapPin, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { generatePDF } from '@/lib/generatePDF';

interface Proposal {
    id: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    message?: string;
    status: 'new' | 'contacted' | 'closed';
    createdAt: string;
    billboards: any[];
    totalAmount?: number;
}

export default function ProposalDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (id) fetchProposal();
    }, [id]);

    const fetchProposal = async () => {
        try {
            const docRef = doc(db, 'proposals', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setProposal({ id: docSnap.id, ...docSnap.data() } as Proposal);
            } else {
                alert('Proposal not found');
                router.push('/proposals');
            }
        } catch (error) {
            console.error("Error fetching proposal:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this proposal?')) {
            try {
                await deleteDoc(doc(db, 'proposals', id));
                router.push('/proposals');
            } catch (error) {
                console.error("Error deleting proposal:", error);
                alert('Failed to delete proposal');
            }
        }
    };

    const handleStatusChange = async (newStatus: 'new' | 'contacted' | 'closed') => {
        try {
            await updateDoc(doc(db, 'proposals', id), { status: newStatus });
            setProposal(prev => prev ? { ...prev, status: newStatus } : null);
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleDownloadPDF = async () => {
        if (!proposal) return;
        setGenerating(true);
        try {
            // Fetch settings
            let settings = {};
            try {
                const settingsSnap = await getDoc(doc(db, 'settings', 'company_profile'));
                if (settingsSnap.exists()) {
                    settings = settingsSnap.data();
                }
            } catch (err) {
                console.warn("Could not fetch settings for PDF", err);
            }

            await generatePDF(proposal, settings);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF");
        } finally {
            setGenerating(false);
        }
    };

    const handleSendEmail = async () => {
        if (!proposal) return;

        const email = prompt("Enter recipient email:", proposal.clientEmail);
        if (!email) return;

        setSending(true);
        try {
            // 1. Fetch settings
            let settings = {};
            try {
                const settingsSnap = await getDoc(doc(db, 'settings', 'company_profile'));
                if (settingsSnap.exists()) {
                    settings = settingsSnap.data();
                }
            } catch (err) {
                console.warn("Could not fetch settings for PDF", err);
            }

            // 2. Generate PDF Blob
            // @ts-ignore
            const pdfDoc = await generatePDF(proposal, settings, true);
            if (!pdfDoc) throw new Error("Failed to generate PDF document");
            const pdfBase64 = pdfDoc.output('datauristring').split(',')[1];

            // 3. Send Email API
            const response = await fetch('/api/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: email,
                    subject: `Proposal for ${proposal.clientName}`,
                    text: `Dear Client,\n\nPlease find attached the proposal for ${proposal.clientName}.\n\nBest regards,\nSBH Outdoor Media`,
                    attachments: [
                        {
                            filename: `Proposal_${proposal.clientName.replace(/\s+/g, '_')}.pdf`,
                            content: pdfBase64
                        }
                    ]
                })
            });

            const data = await response.json();
            if (response.ok) {
                alert("Email sent successfully!");
            } else {
                throw new Error(data.error || "Failed to send email");
            }

        } catch (error) {
            console.error("Error sending email:", error);
            alert("Failed to send email: " + (error as Error).message);
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading proposal...</div>;
    if (!proposal) return <div className="p-8 text-center">Proposal not found</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/proposals" className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">{proposal.clientName}</h2>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                            <span className="flex items-center"><Mail className="h-3 w-3 mr-1" /> {proposal.clientEmail}</span>
                            <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {new Date(proposal.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={generating}
                        className="flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-70 transition-colors"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        {generating ? 'Generating...' : 'Download PDF'}
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex items-center justify-center rounded-md bg-white border border-red-200 px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 transition-colors"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Status Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Proposal Status</h3>
                        <div className="flex gap-2">
                            {['new', 'contacted', 'closed'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => handleStatusChange(s as any)}
                                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium border transition-all ${proposal.status === s
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Message Card */}
                    {proposal.message && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Message</h3>
                            <p className="text-slate-700 whitespace-pre-wrap">{proposal.message}</p>
                        </div>
                    )}

                    {/* Media Items */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900">Included Media ({proposal.billboards.length})</h3>
                        {proposal.billboards.map((item, index) => (
                            <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col sm:flex-row">
                                <div className="sm:w-48 h-48 sm:h-auto bg-slate-200 relative">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-slate-400">No Image</div>
                                    )}
                                </div>
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-900">{item.name}</h4>
                                            <p className="text-slate-500 text-sm flex items-center mt-1">
                                                <MapPin className="h-3 w-3 mr-1" /> {item.location}
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                                            {item.type}
                                        </span>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-slate-500 block">Size</span>
                                            <span className="font-medium text-slate-900">{item.width ? `${item.width}ft x ${item.height}ft` : 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">Traffic</span>
                                            <span className="font-medium text-slate-900">{item.traffic || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-slate-500 text-sm">Monthly Rate</span>
                                        <span className="text-xl font-bold text-primary">RM {item.price?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-8">
                        <h3 className="text-lg font-semibold text-slate-900 mb-6">Summary</h3>

                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Total Items</span>
                                <span className="font-medium text-slate-900">{proposal.billboards.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Created</span>
                                <span className="font-medium text-slate-900">{new Date(proposal.createdAt).toLocaleDateString()}</span>
                            </div>

                            <div className="border-t border-slate-100 pt-4 mt-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-medium text-slate-700">Total Value</span>
                                    <span className="text-2xl font-bold text-slate-900">
                                        RM {proposal.totalAmount?.toLocaleString() || proposal.billboards.reduce((sum, i) => sum + (Number(i.price) || 0), 0).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1 text-right">Estimated monthly total</p>
                            </div>
                        </div>

                        <div className="mt-8 space-y-3">
                            <button
                                onClick={handleDownloadPDF}
                                disabled={generating}
                                className="w-full flex items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-70 transition-colors"
                            >
                                {generating ? 'Generating...' : 'Download Proposal (PDF)'}
                            </button>

                            <button
                                onClick={handleSendEmail}
                                disabled={sending}
                                className="w-full flex items-center justify-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-70 transition-colors"
                            >
                                <Mail className="h-4 w-4" />
                                {sending ? 'Sending...' : 'Send via Email'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
