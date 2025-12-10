
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface SystemSettings {
    enablePackages: boolean;
    // Branding
    websiteName?: string;
    siteLogo?: string; // URL
    favicon?: string; // URL
    footerDescription?: string;
    copyrightText?: string;

    // Contact
    officeAddress?: string;
    officialEmail?: string;
    officePhone?: string;
    whatsappNumber?: string;
    googleMapsEmbed?: string;

    // Frontend Control
    packagesMenuLabel?: string; // Default: "Packages"
    heroTitle?: string;
    heroSubtitle?: string;

    // Socials
    facebookUrl?: string;
    instagramUrl?: string;
    tiktokUrl?: string;
    linkedinUrl?: string;

    // WhatsApp
    whatsappMessage?: string;
}

export async function getSystemSettings(): Promise<SystemSettings> {
    try {
        const docRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as SystemSettings;
        }
        // Default settings if not found
        return { enablePackages: true };
    } catch (error) {
        console.error("Error fetching settings:", error);
        return { enablePackages: true };
    }
}

export async function updateSystemSettings(data: Partial<SystemSettings>): Promise<void> {
    const docRef = doc(db, 'settings', 'general');
    // using setDoc with merge: true to ensure document exists
    await setDoc(docRef, data, { merge: true });
}
