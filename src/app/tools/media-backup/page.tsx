"use client";

import { useState } from 'react';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function MediaBackupPage() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [backupData, setBackupData] = useState<any>(null);

    const handleBackup = async () => {
        setLoading(true);
        setStatus('Fetching data...');
        try {
            const querySnapshot = await getDocs(collection(db, 'billboards'));
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setBackupData(data);

            // Create and download JSON file
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `media_inventory_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setStatus(`Successfully backed up ${data.length} items.`);
        } catch (error) {
            console.error("Backup failed:", error);
            setStatus('Backup failed. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    const [confirmingClear, setConfirmingClear] = useState(false);

    const handleClear = async () => {
        if (!confirmingClear) {
            setConfirmingClear(true);
            return;
        }

        setLoading(true);
        setStatus('Clearing database...');
        try {
            const querySnapshot = await getDocs(collection(db, 'billboards'));
            const batch = writeBatch(db);

            querySnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();

            setStatus(`Successfully deleted ${querySnapshot.size} items.`);
            setConfirmingClear(false);
        } catch (error) {
            console.error("Clear failed:", error);
            setStatus('Clear failed. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Media Inventory Tools</h1>
                <p className="text-gray-500">Utilities for managing database records.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
                <div>
                    <h2 className="text-lg font-medium text-gray-900">1. Backup Data</h2>
                    <p className="text-sm text-gray-500 mb-4">Download all current media inventory records as a JSON file.</p>
                    <button
                        onClick={handleBackup}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
                    >
                        Download Backup JSON
                    </button>
                    {backupData && (
                        <p className="mt-2 text-sm text-green-600">
                            Backup ready! ({backupData.length} items found)
                        </p>
                    )}
                </div>

                <div className="border-t pt-6">
                    <h2 className="text-lg font-medium text-red-600">2. Danger Zone: Clear Data</h2>
                    <p className="text-sm text-gray-500 mb-4">Permanently delete all media inventory records from the database.</p>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleClear}
                            disabled={loading}
                            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${confirmingClear
                                    ? 'bg-red-800 hover:bg-red-900 focus:ring-red-900'
                                    : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                }`}
                        >
                            {confirmingClear ? 'CONFIRM DELETE ALL?' : 'Clear All Media'}
                        </button>
                        {confirmingClear && (
                            <button
                                onClick={() => setConfirmingClear(false)}
                                className="text-sm text-gray-600 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>

                {status && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium text-gray-900">Status: {status}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
