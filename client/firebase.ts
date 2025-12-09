import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase configuration
 *
 * The values for these keys should be provided via environment variables. When
 * using Vite, any variables prefixed with `VITE_` will be available on
 * `import.meta.env` at build time. See the README for instructions on
 * provisioning your Firebase project and populating the `.env` file.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

// Initialize Firebase only once. If the app has already been initialized in
// another module, calling initializeApp again will return the existing instance.
const app = initializeApp(firebaseConfig);

/**
 * Exported Firebase services. These can be imported throughout your app to
 * authenticate users and persist data. For example:
 *
 * ```ts
 * import { auth, db } from "@/firebase";
 * import { createUserWithEmailAndPassword } from "firebase/auth";
 * import { setDoc, doc } from "firebase/firestore";
 *
 * await createUserWithEmailAndPassword(auth, email, password);
 * await setDoc(doc(db, "users", userId), { firstName, lastName });
 * ```
 */
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;