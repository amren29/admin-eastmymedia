import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Billboard } from '@/lib/data';

// Helper to calculate distance between two coordinates (Haversine formula)
// Used to find a "destination" point 1km away for the traffic check
function getDestinationPoint(lat: number, lng: number, distanceKm: number = 1.0): { lat: number, lng: number } {
    // Simple approximation: add ~0.01 degrees for ~1km (rough, but enough for traffic sampling)
    // In a real scenario, we might want a specific road segment, but 
    // simulating a trip "past" the billboard is a good proxy.
    return {
        lat: lat + (distanceKm / 111), // 1 deg lat ~ 111km
        lng: lng // Keep longitude same for simplicity (North/South flow)
    };
}

export async function GET(req: NextRequest) {
    // 1. Authenticate
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        if (!adminDb) throw new Error('Firebase Admin not initialized');

        // 2. Fetch all billboards
        const billboardsSnap = await adminDb.collection('billboards').get();
        const updates = [];
        const timestamp = new Date().toISOString();
        const dateKey = timestamp.split('T')[0]; // YYYY-MM-DD
        const hour = new Date().getHours();
        let lastError = null;

        for (const doc of billboardsSnap.docs) {
            const billboard = doc.data() as Billboard;
            const billboardId = doc.id;

            // Safe GPS parsing (Copied from firestore-data.ts logic)
            let lat = billboard.latitude || 0;
            let lng = billboard.longitude || 0;

            if ((!lat || !lng) && billboard.gps && typeof billboard.gps === 'string') {
                const parts = billboard.gps.split(',');
                if (parts.length === 2) {
                    lat = parseFloat(parts[0].trim());
                    lng = parseFloat(parts[1].trim());
                }
            }

            if (!lat || !lng) {
                console.log(`Skipping ${billboardId}: No valid GPS data`);
                continue;
            }

            // 3. Call Google Maps Routes API
            // We simulate a short 1km drive passing the billboard location
            const origin = { lat: lat, lng: lng };
            const dest = getDestinationPoint(lat, lng, 2.0); // 2km route

            const apiKey = process.env.GOOGLE_MAPS_API_KEY;

            if (!apiKey) {
                console.error("GOOGLE_MAPS_API_KEY missing");
                break;
            }

            const url = `https://routes.googleapis.com/directions/v2:computeRoutes`;

            const body = {
                origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
                destination: { location: { latLng: { latitude: dest.lat, longitude: dest.lng } } },
                travelMode: "DRIVE",
                routingPreference: "TRAFFIC_AWARE",
                computeAlternativeRoutes: false,
                routeModifiers: {
                    avoidTolls: false,
                    avoidHighways: false,
                    avoidFerries: false
                },
                languageCode: "en-US",
                units: "METRIC"
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask': 'routes.duration,routes.staticDuration,routes.distanceMeters'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`Google API Error for ${billboardId}:`, errText);
                continue;
            }

            const data = await response.json();
            const route = data.routes?.[0];

            if (!route) continue;

            const durationSeconds = parseInt(route.duration.replace('s', ''));
            const staticDurationSeconds = parseInt(route.staticDuration.replace('s', '')); // Free flow

            // 4. Calculate Congestion
            // Ratio > 1.0 means traffic. 
            // 1.0 - 1.2 = Low/Free Flow
            // 1.2 - 1.5 = Moderate
            // 1.5 - 2.0 = High
            // > 2.0 = Severe
            const delayRatio = durationSeconds / staticDurationSeconds;

            let congestionLevel = 'Low';
            let speed = 60; // Default assumption

            if (delayRatio > 2.0) {
                congestionLevel = 'Severe';
                speed = 10;
            } else if (delayRatio > 1.5) {
                congestionLevel = 'High';
                speed = 25;
            } else if (delayRatio > 1.2) {
                congestionLevel = 'Moderate';
                speed = 40;
            } else {
                congestionLevel = 'Low';
                speed = 70;
            }

            // Estimate Volume using the delay as a proxy
            // More Traffic = More Cars (roughly, until gridlock)
            // Base volume * multiplier
            const baseHourlyVolume = (billboard.trafficDaily || 50000) / 15; // Rough hourly avg
            let volume = Math.round(baseHourlyVolume * delayRatio);

            const trafficData = {
                billboardId,
                timestamp,
                date: dateKey,
                hour,
                trafficVolume: volume,
                congestionLevel,
                averageSpeed: speed,
                rawDuration: durationSeconds,
                rawStaticDuration: staticDurationSeconds
            };

            // 5. Store in Firestore
            // Path: billboards/{id}/traffic_history/{timestamp_doc}
            updates.push(
                adminDb.collection('billboards').doc(billboardId)
                    .collection('traffic_history').doc(timestamp)
                    .set(trafficData)
            );
        }

        await Promise.all(updates);
        return NextResponse.json({ success: true, updates: updates.length });

    } catch (error: any) { // Explicitly type error as 'any' or 'unknown'
        console.error('Cron job error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
