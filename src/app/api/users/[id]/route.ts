import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!adminAuth) {
            const missingVars = [];
            if (!process.env.FIREBASE_CLIENT_EMAIL && !process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL) missingVars.push('FIREBASE_CLIENT_EMAIL');
            if (!process.env.FIREBASE_PRIVATE_KEY && !process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY) missingVars.push('FIREBASE_PRIVATE_KEY');
            if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) missingVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');

            return NextResponse.json({
                error: `Server configuration error: Firebase Admin not initialized. Missing: ${missingVars.join(', ')}`
            }, { status: 500 });
        }

        const { id } = await params;
        await adminAuth.deleteUser(id);
        return NextResponse.json({ message: 'User deleted from Auth' });
    } catch (error: any) {
        console.error("Error deleting user from Auth:", error);
        return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
    }
}
