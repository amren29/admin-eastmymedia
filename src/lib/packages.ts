import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface PackageItem {
    id: string;
    name: string;
    description: string;
    validFrom: string;
    validTo: string;
    items: string[]; // Array of Billboard IDs
    standardTotal: number;
    packagePrice: number;
    status: 'active' | 'inactive';
    image?: string;
    createdAt: string;
    updatedAt: string;
}

export interface MediaItem {
    id: string;
    name: string;
    location: string;
    type: string;
    price: number;
    width?: number;
    height?: number;
    unit?: string;
    image?: string;
    [key: string]: any;
}

const COLLECTION_NAME = 'packages';
const MEDIA_COLLECTION = 'billboards';

// Get all media items for inventory selector
export const getMediaItems = async (): Promise<MediaItem[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, MEDIA_COLLECTION));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaItem));
    } catch (error) {
        console.error("Error fetching media items:", error);
        return [];
    }
};

// Get all packages
export const getPackages = async (): Promise<PackageItem[]> => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PackageItem));
    } catch (error) {
        console.error("Error fetching packages:", error);
        return [];
    }
};

// Get single package
export const getPackage = async (id: string): Promise<PackageItem | null> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as PackageItem;
        }
        return null;
    } catch (error) {
        console.error("Error fetching package:", error);
        return null;
    }
};

// Create package
export const createPackage = async (data: Omit<PackageItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
        const now = new Date().toISOString();
        await addDoc(collection(db, COLLECTION_NAME), {
            ...data,
            createdAt: now,
            updatedAt: now,
        });
        return true;
    } catch (error) {
        console.error("Error creating package:", error);
        throw error;
    }
};

// Update package
export const updatePackage = async (id: string, data: Partial<PackageItem>) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date().toISOString(),
        });
        return true;
    } catch (error) {
        console.error("Error updating package:", error);
        throw error;
    }
};

// Delete package
export const deletePackage = async (id: string) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        return true;
    } catch (error) {
        console.error("Error deleting package:", error);
        throw error;
    }
};
