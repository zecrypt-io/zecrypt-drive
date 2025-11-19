## ZeCrypt Drive

Zero-knowledge, Google Drive–style storage built with Next.js (App Router) + Firebase Auth, Firestore, and DigitalOcean Spaces. Files are encrypted client-side before upload and decrypted only on the client after download.

### Key Capabilities
- Firebase-authenticated users manage folders, upload/download encrypted files, and share via links or targeted ACLs.
- File blobs live in DigitalOcean Spaces; metadata and sharing graph live in Firestore (MongoDB Atlas later for audits).
- Frontend prioritizes mobile screens first, progressively enhancing for larger viewports.

### Architecture & Roadmap
- See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the system design, security model, and milestone plan.

### Getting Started
```bash
npm install
npm run dev
# open http://localhost:3000
```

### Environment Variables
Create a `.env.local` with the following keys:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
DO_SPACES_KEY=
DO_SPACES_SECRET=
DO_SPACES_REGION=nyc3
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=zecrypt-drive
# Optional CDN/Custom Domain that fronts your Space (omit to use bucket URL)
DO_SPACES_CDN_ENDPOINT=https://cdn.your-domain.com
```

- Public keys configure the client SDK; the private key / client email powers the Admin SDK for token verification.
- DigitalOcean Spaces credentials allow the API route to stream uploads to your bucket. The CDN endpoint is optional—fall back to the default bucket domain when omitted.

### Firestore Setup

**Important:** You must create a Firestore database in your Firebase project before using this app.

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`zecrypt-server`)
3. Navigate to **Firestore Database** in the left sidebar
4. Click **Create database**
5. Choose **Start in production mode** (we'll use security rules)
6. Select a location for your database (choose the closest region)
7. Click **Enable**

**Security Rules:**
Add these rules in Firestore → Rules:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /folders/{id} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /files/{id} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

**Note:** Collections (`folders`, `files`) are created automatically when you add the first document. No manual collection creation needed.
