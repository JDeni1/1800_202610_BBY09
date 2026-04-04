/*
 * Initializes Firebase for Node.js scripts using the Admin SDK.
 * This is used by backend tools (migrations, CSV importers,
 * batch update scripts) that need full Firestore access.
 * 
 * needs a .env.local, but I already put it into gitignore so that it wouldn't leak out sensitive info.
 * You will probably need to put this into the project root in order to use it.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
