// Run: node scripts/setAdmin.mjs <USER_UID>
// Gets the UID from Firebase Console → Authentication → your user
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const uid = process.argv[2];
if (!uid) {
  console.error('Usage: node scripts/setAdmin.mjs <USER_UID>');
  process.exit(1);
}

// Uses Application Default Credentials (set by `firebase login` / gcloud auth)
initializeApp({ projectId: 'wood-50571' });
const db = getFirestore();

await db.collection('users').doc(uid).update({ role: 'admin' });
console.log(`✅  Set role=admin for user ${uid}`);
process.exit(0);
