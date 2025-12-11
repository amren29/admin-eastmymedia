
import * as dotenv from 'dotenv';

// Load env vars BEFORE importing firebase-admin
dotenv.config({ path: '.env.local' });

// Helper function
function getDestinationPoint(lat: number, lng: number, distanceKm: number = 1.0): { lat: number, lng: number } {
    return {
        lat: lat + (distanceKm / 111),
        lng: lng
    };
}

(async () => {
    try {
        // Dynamic import to ensure env vars are loaded
        const { adminDb } = await import('../src/lib/firebase-admin');

        // Need the interface but it's just a type, can import dynamically or define locally if needed.
        // Actually Billboard is an interface, can't be imported via 'await import' for runtime usage if it was a class.
        // But since it is likely just an interface in data.ts, we can skip importing it for runtime logic 
        // or just cast to 'any' to avoid complexity.

        console.log("Starting Manual Traffic Update...");

        if (!adminDb) {
            console.error("Firebase Admin not initialized. Check credentials.");
            process.exit(1);
        }

        const billboardsSnap = await adminDb.collection('billboards').get();
        console.log(`Found ${billboardsSnap.size} billboards.`);

        const timestamp = new Date().toISOString();
        const dateKey = timestamp.split('T')[0];
        const hour = new Date().getHours();

        for (const doc of billboardsSnap.docs) {
            const billboard = doc.data();
            const billboardId = doc.id;

            // GPS Parsing
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
                console.log(`Skipping ${billboard.name}: No GPS`);
                continue;
            }

            console.log(`Fetching data for ${billboard.name} (${lat}, ${lng})...`);

            const origin = { latitude: lat, longitude: lng };
            const destPoint = getDestinationPoint(lat, lng, 2.0);
            const dest = { latitude: destPoint.lat, longitude: destPoint.lng };
            const apiKey = process.env.GOOGLE_MAPS_API_KEY;

            if (!apiKey) throw new Error("Missing GOOGLE_MAPS_API_KEY");

            const url = `https://routes.googleapis.com/directions/v2:computeRoutes`;
            const body = {
                origin: { location: { latLng: origin } },
                destination: { location: { latLng: dest } },
                travelMode: "DRIVE",
                routingPreference: "TRAFFIC_AWARE",
                computeAlternativeRoutes: false,
                routeModifiers: { avoidTolls: false, avoidHighways: false, avoidFerries: false },
                languageCode: "en-US",
                units: "METRIC"
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask': 'routes.duration,routes.staticDuration',
                    'Referer': 'http://localhost:3000/'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                console.error(`API Error: ${await response.text()}`);
                continue;
            }

            const data = await response.json();
            const route = data.routes?.[0];

            if (!route) {
                console.log("No route found.");
                continue;
            }

            const durationSeconds = parseInt(route.duration.replace('s', ''));
            const staticDurationSeconds = parseInt(route.staticDuration.replace('s', ''));
            const delayRatio = durationSeconds / staticDurationSeconds;

            // Simplified Logic for Test
            let congestion = 'Low';
            let speed = 70;
            if (delayRatio > 2.0) { congestion = 'Severe'; speed = 10; }
            else if (delayRatio > 1.5) { congestion = 'High'; speed = 25; }
            else if (delayRatio > 1.2) { congestion = 'Moderate'; speed = 40; }

            const baseHourlyVolume = (billboard.trafficDaily || 50000) / 15;
            let volume = Math.round(baseHourlyVolume * delayRatio);

            const trafficData = {
                billboardId,
                timestamp,
                date: dateKey,
                hour,
                trafficVolume: volume,
                congestionLevel: congestion,
                averageSpeed: speed,
                rawDuration: durationSeconds,
                rawStaticDuration: staticDurationSeconds,
                source: 'real-time-test'
            };

            await adminDb.collection('billboards').doc(billboardId)
                .collection('traffic_history').doc(timestamp)
                .set(trafficData);

            console.log(`Saved update for ${billboard.name}: ${congestion} Traffic`);
        }

        console.log("Manual update complete!");

    } catch (error) {
        console.error("Script failed:", error);
    }
})();
