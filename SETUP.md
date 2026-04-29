# Wooden Heritage — Setup & Deployment

Frontend: Vite + React + TypeScript + Tailwind v4
Backend: Firebase Cloud Functions + Firestore + Auth
Payments: Razorpay (test mode)

---

## 1. One-time Firebase setup

```bash
# Install Firebase CLI globally (only first time)
npm install -g firebase-tools

# Sign in
firebase login

# Confirm project (already wired in .firebaserc)
firebase use wood-50571
```

## 2. Enable Firebase services in the console
Go to https://console.firebase.google.com/project/wood-50571 and enable:

1. **Authentication → Sign-in method**
   - Enable **Phone** (primary sign-in method)
   - Under *Phone numbers for testing* (optional): add your own number with a fixed code like `123456` so you don't burn SMS quota during dev
   - Add your dev domains to *Authorized domains*: `localhost`, your Vercel/Hosting domain
2. **Firestore Database** → Create database → Production mode → asia-south1 (Mumbai) recommended
3. **Functions** → upgrade project to **Blaze plan** (pay-as-you-go, free tier still applies)
4. **App Check** (optional but recommended for production phone auth) — enable reCAPTCHA Enterprise to prevent OTP abuse

## 3. Set Razorpay secrets in Cloud Functions

```bash
# From the project root
firebase functions:secrets:set RAZORPAY_KEY_ID
# paste: rzp_test_SiEizjBt0WwCD9

firebase functions:secrets:set RAZORPAY_KEY_SECRET
# paste: AGv47T0KPHhcbBDeEQ4vQg6Y

firebase functions:secrets:set RAZORPAY_WEBHOOK_SECRET
# paste any random string for now (you'll set it in Razorpay dashboard later)
```

## 4. Deploy

```bash
# Deploy Firestore rules + indexes
firebase deploy --only firestore

# Deploy Cloud Functions
cd functions && npm install && cd ..
firebase deploy --only functions

# Deploy frontend (after npm run build)
npm run build
firebase deploy --only hosting
```

After hosting deploy, your site will be at `https://wood-50571.web.app`.

## 5. Configure Razorpay webhook (one-time, after first functions deploy)

After the first deploy, your webhook URL will be:
```
https://us-central1-wood-50571.cloudfunctions.net/razorpayWebhook
```

In Razorpay dashboard → Settings → Webhooks → Add new:
- **URL**: above
- **Secret**: the same value you used in step 3 for `RAZORPAY_WEBHOOK_SECRET`
- **Events**: `payment.captured`, `payment.failed`, `order.paid`

---

## Local development

### Frontend only (uses live Firebase project)
```bash
npm run dev
# http://localhost:5173
```

### Frontend + Functions emulator (no live calls)
```bash
# terminal 1 — emulators
cd functions && npm run build && cd ..
firebase emulators:start --only functions,firestore,auth

# terminal 2 — frontend (with emulator env var)
VITE_USE_EMULATORS=1 npm run dev
```

(Add emulator wiring to `src/firebase/config.ts` if you want to switch automatically.)

---

## Testing payments (test mode)

Use these in the Razorpay modal:

| Method | Value |
|---|---|
| Card success | `4111 1111 1111 1111`, any CVV, any future expiry |
| Card failure | `5104 0600 0000 0008` |
| UPI success | `success@razorpay` |
| UPI failure | `failure@razorpay` |

---

## Data model (Firestore)

```
users/{uid}
  phone           (E.164 format, e.g. +919876543210 — primary identity)
  displayName     (collected at sign-up)
  email           (optional)
  addresses[]     ({ id, name, phone, line1, line2, city, state, pincode, isDefault })
  createdAt

orders/{orderId}
  userId, userPhone, userEmail (optional)
  items: [{ productId, name, image, price, qty, category, wood }]
  subtotal, shipping, tax, total
  shippingAddress: { name, phone, line1, line2, city, state, pincode }
  status: pending | paid | failed | shipped | delivered | cancelled
  paymentStatus: pending | paid | failed
  razorpay: { orderId, paymentId?, signature? }
  createdAt, paidAt, updatedAt
  statusHistory: [{ status, at, note }]
```

## Auth flow

- **Sign up / Sign in** are the same flow — the user enters their **10-digit mobile number** (we add `+91`), Firebase sends an OTP, they enter it. Existing users land on their account; new users are prompted for **name** + an **optional email** to complete profile.
- **Email is never required.** Profile saves `email: ''` if not provided.
- Phone number cannot be changed from the Account page (would require Firebase re-auth + verification).
- Auth runs through Firebase invisible reCAPTCHA — no UI for the user to interact with.

When you build the admin portal later, hit the `orders` collection directly — everything is structured for it (filter by status, sort by createdAt, search by userId).

---

## Going live (later)

1. Razorpay KYC → switch to live keys
2. `firebase functions:secrets:set RAZORPAY_KEY_ID` (live key)
3. `firebase functions:secrets:set RAZORPAY_KEY_SECRET` (live secret)
4. Update webhook URL in Razorpay dashboard with the live `key_secret`
5. Add custom domain to Firebase Hosting
6. Add `min instances = 1` on `createOrder` to eliminate cold starts (paid feature)
