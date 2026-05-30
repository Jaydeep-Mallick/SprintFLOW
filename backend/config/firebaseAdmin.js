import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID || 'mock-project-id';
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const isProduction = process.env.NODE_ENV === 'production';
let firebaseAdminStatus = {
  credentialSource: 'none',
  projectId,
  initialized: false,
  error: null,
};

const parseServiceAccountJson = (rawJson) => {
  try {
    return JSON.parse(rawJson);
  } catch (firstError) {
    try {
      return JSON.parse(rawJson.replace(/\n/g, '\\n'));
    } catch {
      throw firstError;
    }
  }
};

const initializeWithProjectOnly = (source, error = null) => {
  admin.initializeApp({ projectId });
  firebaseAdminStatus = {
    credentialSource: source,
    projectId,
    initialized: true,
    error: error?.message || null,
  };
};

const initializeWithServiceAccount = (serviceAccount, source) => {
  const resolvedProjectId = process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id || projectId;
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: resolvedProjectId,
  });
  firebaseAdminStatus = {
    credentialSource: source,
    projectId: resolvedProjectId,
    initialized: true,
    error: null,
  };
};

// Auto-configure emulator only for local development.
if (!isProduction && !serviceAccountPath && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON && !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
}

// Initialize Firebase Admin
if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  // If Auth Emulator is enabled, we only need to specify the project ID
  initializeWithProjectOnly('emulator');
  console.log('🔧 Firebase Admin SDK initialized for Emulator. Host:', process.env.FIREBASE_AUTH_EMULATOR_HOST);
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    const serviceAccount = parseServiceAccountJson(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    initializeWithServiceAccount(serviceAccount, 'env-json');
    console.log('✅ Firebase Admin SDK initialized with service account JSON env variable.');
  } catch (err) {
    console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON env variable:', err.message);
    initializeWithProjectOnly('env-json-fallback', err);
  }
} else {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      initializeWithServiceAccount(serviceAccount, 'file');
      console.log('✅ Firebase Admin SDK initialized with service account certificate.');
    } catch (err) {
      console.error('❌ Failed to parse service account JSON:', err.message);
      initializeWithProjectOnly('file-fallback', err);
    }
  } else {
    // Fallback to project ID only. This works automatically if FIREBASE_AUTH_EMULATOR_HOST is set,
    // or logs a warning so the developer knows they need to set up credentials.
    initializeWithProjectOnly('project-only');
    console.warn('⚠️ Firebase Admin initialized without service account certificate. Operations will fail unless running against the Firebase Auth Emulator.');
  }
}

export const getFirebaseAdminStatus = () => firebaseAdminStatus;
export default admin;
