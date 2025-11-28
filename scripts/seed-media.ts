import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { VOOH_PACKAGES } from '../src/lib/voohPackages';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const billboardsPath = path.join(process.cwd(), '../data/billboards.json');

async function seedMedia() {
    let count = 0;

    // 1. Import Billboards (from JSON)
    if (fs.existsSync(billboardsPath)) {
        const data = JSON.parse(fs.readFileSync(billboardsPath, 'utf-8'));
        console.log(`Found ${data.length} billboards to import.`);

        for (const item of data) {
            try {
                const docId = item.id || doc(collection(db, 'billboards')).id;
                const billboardData = {
                    ...item,
                    price: Number(item.price) || 0,
                    width: Number(item.width) || 0,
                    height: Number(item.height) || 0,
                    updatedAt: new Date().toISOString(),
                };
                delete billboardData.id;

                await setDoc(doc(db, 'billboards', docId), billboardData, { merge: true });
                count++;
                if (count % 10 === 0) console.log(`Imported ${count} billboards...`);
            } catch (error) {
                console.error(`Error importing billboard ${item.id}:`, error);
            }
        }
    } else {
        console.log("Billboards JSON not found, skipping...");
    }


    // 3. Import VOOH Packages
    console.log(`Found ${VOOH_PACKAGES.length} VOOH packages to import.`);
    for (const pkg of VOOH_PACKAGES) {
        const docId = pkg.id;

        // Parse price string "RM 2,500" -> 2500
        const priceNum = Number(pkg.price.replace(/[^0-9]/g, ''));

        const voohData = {
            name: pkg.name,
            location: pkg.coverage,
            region: 'Kota Kinabalu', // Default
            type: 'VOOH',
            price: priceNum,
            traffic: pkg.trafficLevel,
            trafficDaily: 50000, // Estimate
            size: pkg.carCount, // Store car count in size for now
            width: 0,
            height: 0,
            image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=800&auto=format&fit=crop', // Generic car/traffic image
            available: true,
            description: pkg.description,
            duration: pkg.duration,
            estimatedImpressions: pkg.estimatedImpressions,
            updatedAt: new Date().toISOString(),
        };

        try {
            await setDoc(doc(db, 'billboards', docId), voohData, { merge: true });
            count++;
        } catch (error) {
            console.error(`Error importing VOOH ${pkg.id}:`, error);
        }
    }

    console.log(`Successfully imported total ${count} items to Firestore.`);
}

seedMedia().catch(console.error);
