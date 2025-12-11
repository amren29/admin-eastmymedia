import { collection, getDocs, doc, getDoc, query, where, DocumentSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { Billboard } from './data';

export type { Billboard };

// Helper to safely process a single billboard document
function processBillboardDoc(docSnap: any): Billboard | null {
    try {
        const data = docSnap.data();
        if (!data) return null;

        // safe defaults
        const width = data.width || 0;
        const height = data.height || 0;
        const unit = data.unit || 'ft';

        // Safer traffic parsing
        let trafficDaily = 0;
        if (typeof data.traffic === 'number') {
            trafficDaily = data.traffic;
        } else if (typeof data.traffic === 'string') {
            const rawTraffic = data.traffic.toLowerCase().trim();
            const numericPart = parseFloat(rawTraffic.replace(/[^0-9.]/g, '') || '0');

            if (rawTraffic.includes('k')) {
                trafficDaily = numericPart * 1000;
            } else if (rawTraffic.includes('m') || rawTraffic.includes('million')) {
                trafficDaily = numericPart * 1000000;
            } else {
                trafficDaily = numericPart;
            }
        }

        // Safer GPS parsing
        let lat = data.latitude || 0;
        let lng = data.longitude || 0;
        if (!lat && !lng && data.gps && typeof data.gps === 'string') {
            const parts = data.gps.split(',');
            if (parts.length === 2) {
                lat = parseFloat(parts[0].trim());
                lng = parseFloat(parts[1].trim());
            }
        }

        return {
            id: docSnap.id,
            ...data,
            // Ensure essential UI fields exist
            name: data.name || 'Untitled',
            location: data.location || 'Unknown Location',
            type: data.type || 'Static',
            image: data.image || '', // Empty string will be handled by UI placeholder

            code: data.skuId || data.code || 'N/A',
            size: data.size || (width && height ? `${width}${unit} × ${height}${unit}` : 'N/A'),
            priceMonthly: data.price ? `RM ${Number(data.price).toLocaleString()}/mo` : 'Contact for Price',
            trafficDaily: trafficDaily,
            region: data.region || 'Sabah',
            traffic: data.traffic || 'N/A',
            latitude: lat,
            longitude: lng,
            trafficProfile: data.trafficProfile || 'commuter', // Default to commuter
        } as Billboard;
    } catch (err) {
        console.error(`Error processing billboard doc ${docSnap.id}:`, err);
        return null;
    }
}

export async function getBillboards(): Promise<Billboard[]> {
    try {
        const querySnapshot = await getDocs(collection(db, 'billboards'));
        const billboards: Billboard[] = [];

        querySnapshot.forEach(doc => {
            const processed = processBillboardDoc(doc);
            if (processed) {
                billboards.push(processed);
            }
        });

        return billboards;
    } catch (error) {
        console.error("Error fetching billboards:", error);
        return [];
    }
}

export async function getBillboardById(id: string): Promise<Billboard | null> {
    try {
        const docRef = doc(db, 'billboards', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return processBillboardDoc(docSnap);
        }
        return null;
    } catch (error) {
        console.error("Error fetching billboard:", error);
        return null;
    }
}
