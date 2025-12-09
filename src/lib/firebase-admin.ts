import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            try {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    }),
                });
                console.log("Firebase Admin initialized successfully.");
            } catch (initError) {
                console.error("Firebase Admin initialization failed:", initError);
            }
        } else {
            console.warn(`Firebase Admin credentials missing:
                Client Email: ${process.env.FIREBASE_CLIENT_EMAIL ? 'Found' : 'Missing'}
                Private Key: ${process.env.FIREBASE_PRIVATE_KEY ? 'Found' : 'Missing'}
            `);
        }
    } catch (error) {
        console.error('Firebase admin initialization error', error);
    }
}

export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminDb = admin.apps.length ? admin.firestore() : null;
