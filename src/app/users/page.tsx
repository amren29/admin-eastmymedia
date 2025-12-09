"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, updateDoc, query, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CheckCircle, XCircle, Clock, User, Mail, Phone, Briefcase, Trash2 } from 'lucide-react';

interface UserData {
    uid: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    role: string;
    status: 'pending' | 'approved' | 'rejected' | 'deleted';
    createdAt: string;
    [key: string]: any;
}

export default function UsersPage() {
    const { userData } = useAuth();
    const { showConfirm, showAlert, showModal } = useModal();
    const router = useRouter();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);

    useEffect(() => {
        // Only administrators can access this page
        if (userData && userData.role !== 'administrator') {
            router.push('/');
            return;
        }

        fetchUsers();
    }, [userData, router]);

    const fetchUsers = async () => {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            // Filter out already deleted users from the view if you want
            const usersData = snapshot.docs
                .map(doc => doc.data() as UserData)
                .filter(u => u.status !== 'deleted');
            setUsers(usersData);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (uid: string) => {
        try {
            await updateDoc(doc(db, 'users', uid), {
                status: 'approved',
                approvedBy: userData?.uid,
                approvedAt: new Date().toISOString()
            });

            // Refresh users list
            fetchUsers();
            showAlert('Approved', 'User approved successfully!', 'success');
        } catch (error) {
            console.error('Error approving user:', error);
            showModal({ title: 'Error', message: 'Failed to approve user', type: 'danger' });
        }
    };

    const handleReject = async (uid: string) => {
        showConfirm('Reject User', 'Are you sure you want to reject this user?', async () => {
            try {
                await updateDoc(doc(db, 'users', uid), {
                    status: 'rejected',
                    rejectedBy: userData?.uid,
                    rejectedAt: new Date().toISOString()
                });

                fetchUsers();
                showAlert('Rejected', 'User rejected', 'info');
            } catch (error) {
                console.error('Error rejecting user:', error);
                showModal({ title: 'Error', message: 'Failed to reject user', type: 'danger' });
            }
        }, 'danger');
    };

    const handleChangeRole = async (uid: string, newRole: string) => {
        if (!newRole || newRole === '') return;

        try {
            await updateDoc(doc(db, 'users', uid), {
                role: newRole.toLowerCase(),
                roleChangedBy: userData?.uid,
                roleChangedAt: new Date().toISOString()
            });

            fetchUsers();
            showAlert('Role Updated', 'User role updated successfully!', 'success');
        } catch (error) {
            console.error('Error changing role:', error);
            showModal({ title: 'Error', message: 'Failed to change user role', type: 'danger' });
        }
    };

    const handleDelete = async (uid: string, userEmail: string) => {
        showConfirm(
            'Delete User',
            `⚠️ WARNING: This will permanently delete the user account for "${userEmail}".\n\nThis action CANNOT be undone.\n\nAre you absolutely sure?`,
            async () => {
                try {
                    // Delete from Auth (Server-side)
                    const response = await fetch(`/api/users/${uid}`, { method: 'DELETE' });
                    if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.error || 'Failed to delete from Auth');
                    }

                    // Delete from Firestore (Mark as deleted)
                    await updateDoc(doc(db, 'users', uid), {
                        status: 'deleted',
                        deletedBy: userData?.uid,
                        deletedAt: new Date().toISOString()
                    });

                    fetchUsers();
                    showAlert('Deleted', 'User deleted successfully from System and Authentication', 'success');
                } catch (error: any) {
                    console.error('Error deleting user:', error);
                    showModal({ title: 'Error', message: 'Failed to delete user: ' + error.message, type: 'danger' });
                }
            },
            'danger'
        );
    };

    const handleBulkDelete = async () => {
        showConfirm(
            'Bulk Delete Users',
            `⚠️ WARNING: This will permanently delete ${selectedIds.size} selected user accounts.\n\nThis action CANNOT be undone.\n\nAre you absolutely sure?`,
            async () => {
                setBulkDeleting(true);
                try {
                    let successCount = 0;
                    let failCount = 0;

                    // Process sequentially to be safe
                    for (const uid of selectedIds) {
                        try {
                            const response = await fetch(`/api/users/${uid}`, { method: 'DELETE' });
                            if (response.ok) {
                                // Mark as deleted in Firestore
                                await updateDoc(doc(db, 'users', uid), {
                                    status: 'deleted',
                                    deletedBy: userData?.uid,
                                    deletedAt: new Date().toISOString()
                                });
                                successCount++;
                            } else {
                                failCount++;
                            }
                        } catch (e) {
                            console.error(`Failed to delete user ${uid}`, e);
                            failCount++;
                        }
                    }

                    fetchUsers();
                    setSelectedIds(new Set());

                    if (failCount > 0) {
                        showAlert('Completed with Errors', `Deleted ${successCount} users. Failed to delete ${failCount} users. Check console/logs.`, 'warning');
                    } else {
                        showAlert('Success', `Successfully deleted ${successCount} users.`, 'success');
                    }

                } catch (error: any) {
                    console.error('Error bulk deleting users:', error);
                    showModal({ title: 'Error', message: 'Failed to bulk delete users', type: 'danger' });
                } finally {
                    setBulkDeleting(false);
                }
            },
            'danger'
        );
    }

    const handleDeactivate = async (uid: string) => {
        showConfirm(
            'Deactivate User',
            'Are you sure you want to deactivate this user? They will be logged out and unable to access the system.',
            async () => {
                try {
                    await updateDoc(doc(db, 'users', uid), {
                        status: 'rejected',
                        deactivatedBy: userData?.uid,
                        deactivatedAt: new Date().toISOString()
                    });

                    fetchUsers();
                    showAlert('Deactivated', 'User deactivated', 'info');
                } catch (error) {
                    console.error('Error deactivating user:', error);
                    showModal({ title: 'Error', message: 'Failed to deactivate user', type: 'danger' });
                }
            },
            'warning'
        );
    };

    const filteredUsers = users.filter(user => {
        if (filter === 'all') return true;
        return user.status === filter;
    });

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredUsers.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredUsers.map(u => u.uid)));
        }
    };

    const toggleSelect = (uid: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(uid)) {
            newSet.delete(uid);
        } else {
            newSet.add(uid);
        }
        setSelectedIds(newSet);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                </span>;
            case 'approved':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approved
                </span>;
            case 'rejected':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircle className="w-3 h-3 mr-1" />
                    Rejected
                </span>;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">User Management</h2>
                    <p className="text-muted-foreground">Manage user registrations and permissions</p>
                </div>
                {selectedIds.size > 0 && (
                    <button
                        onClick={handleBulkDelete}
                        disabled={bulkDeleting}
                        className="flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedIds.size})`}
                    </button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-2 border-b border-gray-200">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${filter === tab
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab} ({users.filter(u => tab === 'all' || u.status === tab).length})
                    </button>
                ))}
            </div>

            {/* Users List */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                        <User className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                        <p className="mt-1 text-sm text-gray-500">No users match the selected filter.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 w-12">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                            checked={filteredUsers.length > 0 && selectedIds.size === filteredUsers.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredUsers.map((user) => (
                                    <tr key={user.uid} className={`hover:bg-gray-50 ${selectedIds.has(user.uid) ? 'bg-blue-50' : ''}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                                checked={selectedIds.has(user.uid)}
                                                onChange={() => toggleSelect(user.uid)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <User className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                                                    <div className="text-sm text-gray-500 flex items-center">
                                                        <Mail className="h-3 w-3 mr-1" />
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 flex items-center">
                                                <Phone className="h-3 w-3 mr-1" />
                                                {user.phoneNumber}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 flex items-center">
                                                <Briefcase className="h-3 w-3 mr-1" />
                                                {user.role}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(user.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            {user.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(user.uid)}
                                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(user.uid)}
                                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                                    >
                                                        <XCircle className="h-4 w-4 mr-1" />
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {user.status === 'approved' && (
                                                <div className="flex items-center space-x-2">
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleChangeRole(user.uid, e.target.value)}
                                                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="administrator">Administrator</option>
                                                        <option value="director">Director</option>
                                                        <option value="chief">Chief</option>
                                                        <option value="manager">Manager</option>
                                                        <option value="sales">Sales</option>
                                                        <option value="admin">Admin (Basic)</option>
                                                    </select>
                                                    <button
                                                        onClick={() => handleDeactivate(user.uid)}
                                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                                                    >
                                                        Deactivate
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.uid, user.email)}
                                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                            {user.status === 'rejected' && (
                                                <button
                                                    onClick={() => handleApprove(user.uid)}
                                                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                >
                                                    Re-approve
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
