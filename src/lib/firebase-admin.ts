import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    try {
        if (privateKey && clientEmail && projectId) {
            try {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        clientEmail,
                        privateKey: privateKey.replace(/\\n/g, '\n'),
                    }),
                });
                console.log("Firebase Admin initialized successfully.");
            } catch (initError) {
                console.error("Firebase Admin initialization failed:", initError);
            }
        } else {
            console.warn(`Firebase Admin credentials missing:
                Client Email: ${clientEmail ? 'Found' : 'Missing (checked FIREBASE_CLIENT_EMAIL & NEXT_PUBLIC_...)'}
                Private Key: ${privateKey ? 'Found' : 'Missing (checked FIREBASE_PRIVATE_KEY & NEXT_PUBLIC_...)'}
                Project ID: ${projectId ? 'Found' : 'Missing'}
            `);
        }
    } catch (error) {
        console.error('Firebase admin initialization error', error);
    }
}

export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminDb = admin.apps.length ? admin.firestore() : null;
