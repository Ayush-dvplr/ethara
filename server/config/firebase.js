const admin = require("firebase-admin");
const { getAuth } = require("firebase-admin/auth");

const normalizePrivateKey = (key) => {
  if (!key) return key;
  return key.replace(/\n/g, "\\n").replace(/\\n/g, "\n");
};

const initFirebase = () => {
  if (admin.apps.length > 0) return; // already initialized

  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("⚠️  Firebase Admin credentials missing in .env — Google sign-in will not work");
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });

  console.log("Firebase Admin initialized ✓");
};

module.exports = { admin, getAuth, initFirebase };
