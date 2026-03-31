import { auth, db } from "./firebaseConfig.js";
import { doc, setDoc } from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

/* loginUser(email, password) */
export async function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

/* Creates a Firebase Auth user and a matching Firestore document*/
export async function signupUser(name, email, password) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const user = userCredential.user;

  await updateProfile(user, { displayName: name });

  try {
    await setDoc(doc(db, "users", user.uid), {
      name,
      email,
      country: "",
      school: "",
    });
    console.log("Firestore user document created successfully!");
  } catch (error) {
    alert(
      `Error creating user document:\n${error.code || ""}\n${error.message || error}`,
    );
  }

  return user;
}

// logoutUser()
export async function logoutUser() {
  await signOut(auth);
  window.location.href = "index.html";
}

/* onAuthReady(callback) */
export function onAuthReady(callback) {
  return onAuthStateChanged(auth, callback);
}

/* authErrorMessage(error) */
export function authErrorMessage(error) {
  const code = (error?.code || "").toLowerCase();

  const errorMap = {
    "auth/invalid-credential": "Wrong email or password.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/email-already-in-use": "Email is already in use.",
    "auth/weak-password": "Password too weak (min 6 characters).",
    "auth/missing-password": "Password cannot be empty.",
    "auth/network-request-failed": "Network error. Try again.",
  };

  return errorMap[code] || "Something went wrong. Please try again.";
}
