import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDoc } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
    const dataPath = path.join(__dirname, '../../data/proposals.json');

    if (!fs.existsSync(dataPath)) {
        console.error(`Data file not found at ${dataPath}`);
        return;
    }

    const proposals = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`Found ${proposals.length} proposals to migrate.`);

    for (const proposal of proposals) {
        const docRef = doc(db, 'proposals', proposal.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log(`Proposal ${proposal.id} already exists. Skipping.`);
        } else {
            await setDoc(docRef, proposal);
            console.log(`Migrated proposal ${proposal.id}.`);
        }
    }
    console.log('Migration complete.');
    process.exit(0);
}

migrate().catch(console.error);
