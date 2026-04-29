import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyCNY4NdUf0dTwNh7VC-PN2BYndYLzJKPNM',
  authDomain: 'wood-50571.firebaseapp.com',
  projectId: 'wood-50571',
  storageBucket: 'wood-50571.firebasestorage.app',
  messagingSenderId: '29628674257',
  appId: '1:29628674257:web:7e71d371d96ec90d4555f0',
  measurementId: 'G-F4K3ZYY2Z2',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Firestore — force long polling. WebChannel's /Listen endpoint is commonly
// blocked by adblockers, privacy extensions, corporate proxies, and even some
// browser features. Long polling uses plain HTTPS POSTs that look like regular
// API calls and gets through almost everything.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// Functions region — default 'us-central1'. Match the region we deploy to.
export const functions = getFunctions(app, 'us-central1');
export const storage = getStorage(app);

// Razorpay public key (test). Safe to expose in client.
export const RAZORPAY_KEY_ID = 'rzp_test_SiGfOtgHDoW6mF';

// Analytics — only initialise on browsers that support it (skips unsupported envs).
isSupported()
  .then(supported => {
    if (supported) getAnalytics(app);
  })
  .catch(() => {
    /* ignore — analytics is best-effort */
  });
