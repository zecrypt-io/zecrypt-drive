# ZeCrypt Drive – Technical Architecture

## 1. Product Pillars
- **Zero-knowledge UX**: Users never upload plaintext. All encryption/decryption happens client-side with keys derived from Firebase Auth credentials plus user-chosen secrets.
- **Mobile-first**: All UX flows prioritize small screens (90% of users) with responsive enhancements for tablets/desktop.
- **Progressive delivery**: Core flows (auth + upload/download) ship first, then collaboration/sharing, search, and governance.

## 2. High-Level System Diagram
```
Client (Next.js App Router, React, Service Worker)
    ↕ HTTPS (REST + signed URLs)
Edge API (Next.js Route Handlers / Vercel Functions)
    ↔ Firebase Auth Admin SDK
    ↔ Firestore (metadata + sharing graph)
    ↔ MongoDB Atlas (activity logs / auditing) [optional later]
    ↔ DigitalOcean Spaces (object storage)
```

- **Client**: Performs AES-GCM encryption using Web Crypto. Manages keychain in IndexedDB + session memory. Uploads ciphertext via signed PUT to Spaces, stores metadata (ciphertext hashes, folder tree, sharing ACLs) via API.
- **Edge API**: Issues short-lived auth tokens, validates sharing permissions, generates DO Spaces signed URLs, writes metadata to Firestore, and queues background jobs (future: share notifications, virus scans).

## 3. Core Services
### Authentication
- Firebase Auth (Email/Password + OAuth providers later).
- Uses Firebase JS SDK client-side; server uses Admin SDK for session validation.
- Session cookie stored as HttpOnly secure cookie; client uses `firebase/auth` for token refresh; API verifies ID token per request.

### Storage & Metadata
- **DigitalOcean Spaces**: Buckets per environment (`zecrypt-drive-dev`, etc.). Files stored as encrypted blobs `{userId}/{fileId}` with `content-type` preserved in metadata but no plaintext names.
- **Firestore**: Collections:
  - `users`: profile + key metadata (public key, salt, KDF params).
  - `files`: doc per file with encrypted name, parentId, version, DO object key, sharing ACL.
  - `folders`: tree structure referencing parent folder.
  - `shares`: link tokens / per-user ACL records.
- **MongoDB Atlas** (Phase 4+): Append-only audit + download history for compliance.

### Encryption / Key Management
- Master password (user secret) + Firebase UID → `HKDF(salt, uid)` to derive File Encryption Key (FEK) envelope.
- Each file has unique AES-GCM key + IV; FEK encrypts file key, stored with metadata.
- Optional share tokens derive key from FEK using asymmetric (WebCrypto RSA/ECDH) in later phases.

## 4. Frontend Application Structure
- Next.js App Router (`/src/app`).
- Feature slices: `auth`, `dashboard`, `upload`, `viewer`, `settings`.
- Stateful logic uses React Query or Server Actions for data fetching; file uploads handled via `UploadManager` hook with resumable chunks.
- Offline-ready: local queue for uploads/downloads when offline; service worker (later).

## 5. API Routes (Edge Functions)
| Route | Purpose |
|-------|---------|
| `POST /api/auth/session` | Exchange Firebase ID token for secure session cookie. |
| `POST /api/files` | Register encrypted file metadata; request signed upload URL. |
| `GET /api/files` | List folder contents with pagination + search. |
| `GET /api/files/{id}/download` | Permission check + signed download URL. |
| `POST /api/folders` | Create/update folders. |
| `POST /api/shares` | Create share links or user-specific access. |

All routes enforce Firebase token validation, role checks, and rate limiting (Upstash Redis or Vercel Edge Config later).

## 6. Deployment / Environments
- **Dev**: Vercel preview deployments, Firebase project `zecrypt-drive-dev`, DO Spaces dev bucket.
- **Staging**: Same stack with staging resources; manual QA.
- **Prod**: Main branch auto deploy to Vercel prod. Secrets managed via Vercel + 1Password.

## 7. Roadmap & Milestones
1. **Foundation**: Clean Next.js app, Tailwind, shadcn/ui, global theming, auth scaffolding, Firebase configs, basic dashboard shell.
2. **Core Storage**: Client crypto utils, upload/download flows, Firestore metadata, DO Spaces integration.
3. **Folders & Search**: Nested tree, breadcrumbs, filters, full-text via Firestore indexes.
4. **Sharing & Collaboration**: Link-based sharing, per-user ACL, notifications.
5. **Security Hardening**: Key rotation, auditing via MongoDB, service worker offline, automated backups.

Each milestone ships behind feature flags. Automated tests (Playwright + Vitest) guard flows, with focus on encryption correctness and access control.


