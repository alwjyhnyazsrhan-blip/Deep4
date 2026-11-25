import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  enableNetwork,
  doc,
  type Firestore,
  type FirestoreSettings,
} from 'firebase/firestore';
import firebaseAppletConfig from '../firebase-applet-config.json';

export const firebaseConfig = {
  ...firebaseAppletConfig,
  firestoreDatabaseId: firebaseAppletConfig.firestoreDatabaseId || '(default)',
  recaptchaSiteKey: firebaseAppletConfig.recaptchaSiteKey || '',
};

// Initialize Firebase App only once
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics when supported in the browser
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics not supported in current environment
    });
}

// Initialize Firebase Auth and Cloud Firestore instances strictly once
export const auth = getAuth(app);

const customDbId =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

const firestoreSettings: FirestoreSettings =
  typeof window !== 'undefined'
    ? {
        experimentalForceLongPolling: true,
        experimentalLongPollingOptions: {
          timeoutSeconds: 15,
        },
      }
    : {};

let dbInstance: Firestore;
try {
  dbInstance = customDbId
    ? initializeFirestore(app, firestoreSettings, customDbId)
    : initializeFirestore(app, firestoreSettings);
} catch {
  dbInstance = customDbId ? getFirestore(app, customDbId) : getFirestore(app);
}

export const db: Firestore = dbInstance;

// Validate live connection to Firestore at startup
export async function testConnection() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }
  try {
    const { getDocFromServer } = await import('firebase/firestore');
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (firstError) {
      if (
        firstError instanceof Error &&
        firstError.message.includes('the client is offline')
      ) {
        await enableNetwork(db).catch(() => {});
        await getDocFromServer(doc(db, 'test', 'connection'));
      } else {
        throw firstError;
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Info: ', JSON.stringify(errInfo));
  return errInfo;
}
