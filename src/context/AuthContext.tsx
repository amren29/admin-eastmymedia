"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { useRouter, usePathname } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';

// Ensure Firebase is initialized (it should be from lib/firebase, but good to be safe or import app)
import { auth, db } from '@/lib/firebase';

interface UserData {
    uid: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    role: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

interface AuthContextType {
    user: User | null;
    userData: UserData | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userData: null,
    loading: true,
    logout: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);

            if (user) {
                // Fetch user data from Firestore
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data() as UserData;
                        setUserData(data);

                        // Check user status and redirect accordingly
                        if (data.status === 'pending' && pathname !== '/pending-approval') {
                            router.push('/pending-approval');
                        } else if (data.status === 'rejected') {
                            await signOut(auth);
                            alert('Your account has been rejected. Please contact an administrator.');
                            router.push('/login');
                        } else if (data.status === 'approved' && (pathname === '/login' || pathname === '/signup' || pathname === '/pending-approval')) {
                            router.push('/');
                        }
                    } else {
                        // User exists in Auth but not in Firestore (shouldn't happen with new flow)
                        setUserData(null);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    setUserData(null);
                }
            } else {
                setUserData(null);
                if (pathname !== '/login' && pathname !== '/signup' && pathname !== '/forgot-password' && pathname !== '/setup' && pathname !== '/reset-password') {
                    router.push('/login');
                }
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [pathname, router]);

    const logout = async () => {
        await signOut(auth);
        setUserData(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, userData, loading, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
