import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!adminAuth) {
            return NextResponse.json({ error: 'Server configuration error: Firebase Admin not initialized. Please add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to .env.local' }, { status: 500 });
        }

        const { id } = await params;
        await adminAuth.deleteUser(id);
        return NextResponse.json({ message: 'User deleted from Auth' });
    } catch (error: any) {
        console.error("Error deleting user from Auth:", error);
        return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
    }
}
