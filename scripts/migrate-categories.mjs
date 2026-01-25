// Firestore migration: normalize expense categories
// Maps old categories to new ones and updates documents.

import 'dotenv/config';
import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  updateDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CATEGORY_MAP = {
  Fun: "Entertainment",
  Life: "Living",
  Other: "Others",
};

async function migrateCategories() {
  const summary = { scanned: 0, updated: 0 };
  console.log("🚀 Starting category migration...");

  // Top-level collection: expenses/{groupId}/expenses/{expenseId}
  const groupsSnap = await getDocs(collection(db, "expenses"));
  for (const groupDoc of groupsSnap.docs) {
    const groupId = groupDoc.id;
    console.log(`\n🔎 Group ${groupId}: scanning expenses...`);
    const expensesSnap = await getDocs(
      collection(db, "expenses", groupId, "expenses")
    );
    for (const expDoc of expensesSnap.docs) {
      summary.scanned += 1;
      const data = expDoc.data();
      const current = data.category;
      const mapped = CATEGORY_MAP[current] || null;
      if (mapped && mapped !== current) {
        await updateDoc(doc(db, "expenses", groupId, "expenses", expDoc.id), {
          category: mapped,
        });
        summary.updated += 1;
        console.log(`  ✅ ${expDoc.id}: ${current} → ${mapped}`);
      }
    }
  }

  console.log("\n✅ Migration complete");
  console.log(`   Expenses scanned: ${summary.scanned}`);
  console.log(`   Documents updated: ${summary.updated}`);
}

migrateCategories().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
