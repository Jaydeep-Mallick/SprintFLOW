import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID || 'mock-project-id';
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

// Auto-configure emulator host if no credentials file exists and not already set
if (!serviceAccountPath && !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
}

// Initialize Firebase Admin
if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  // If Auth Emulator is enabled, we only need to specify the project ID
  admin.initializeApp({
    projectId: projectId,
  });
  console.log('🔧 Firebase Admin SDK initialized for Emulator. Host:', process.env.FIREBASE_AUTH_EMULATOR_HOST);
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: projectId,
    });
    console.log('✅ Firebase Admin SDK initialized with service account JSON env variable.');
  } catch (err) {
    console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON env variable:', err.message);
    admin.initializeApp({
      projectId: projectId,
    });
  }
} else {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId,
      });
      console.log('✅ Firebase Admin SDK initialized with service account certificate.');
    } catch (err) {
      console.error('❌ Failed to parse service account JSON:', err.message);
      // Fallback
      admin.initializeApp({
        projectId: projectId,
      });
    }
  } else {
    // Fallback to project ID only. This works automatically if FIREBASE_AUTH_EMULATOR_HOST is set,
    // or logs a warning so the developer knows they need to set up credentials.
    admin.initializeApp({
      projectId: projectId,
    });
    console.warn('⚠️ Firebase Admin initialized without service account certificate. Operations will fail unless running against the Firebase Auth Emulator.');
  }
}

export default admin;
