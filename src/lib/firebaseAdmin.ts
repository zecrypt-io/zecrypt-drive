import { getApp, getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

declare global {
  var __FIREBASE_ADMIN_DB_CONFIGURED__: boolean | undefined;
}

function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

const privateKey = requiredEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");

const adminApp =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: cert({
          projectId: requiredEnv("FIREBASE_PROJECT_ID"),
          clientEmail: requiredEnv("FIREBASE_CLIENT_EMAIL"),
          privateKey,
        }),
      });

let cachedAuth: ReturnType<typeof getAuth> | null = null;
let cachedDb: ReturnType<typeof getFirestore> | null = null;

export function getAdminAuth() {
  if (!cachedAuth) {
    cachedAuth = getAuth(adminApp);
  }
  return cachedAuth;
}

export function getAdminDb() {
  if (!cachedDb) {
    try {
      const projectId = requiredEnv("FIREBASE_PROJECT_ID");
      console.log(`[Firestore] Initializing for project: ${projectId}`);
      
      // Try to get the default database
      cachedDb = getFirestore(adminApp);
      if (!globalThis.__FIREBASE_ADMIN_DB_CONFIGURED__) {
        cachedDb.settings({ ignoreUndefinedProperties: true });
        globalThis.__FIREBASE_ADMIN_DB_CONFIGURED__ = true;
        console.log("[Firestore] Settings configured");
      }
    } catch (error) {
      console.error("Error initializing Firestore:", error);
      const projectId = process.env.FIREBASE_PROJECT_ID || "unknown";
      throw new Error(
        `Failed to initialize Firestore for project "${projectId}". Please ensure:\n` +
        `1. Firestore is enabled in Firebase Console\n` +
        `2. A Firestore database has been created\n` +
        `3. Your FIREBASE_PROJECT_ID matches your Firebase project\n` +
        `4. Your service account has Firestore permissions`,
      );
    }
  }
  return cachedDb;
}

export async function verifySessionToken(token: string) {
  return getAdminAuth().verifyIdToken(token);
}


