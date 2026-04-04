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
  /* creates userCredential object which puushes a user object to firebase.*/
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
    });
  } catch (error) {
    alert(
      `Error creating user document:\n${error.code || ""}\n${error.message || error}`,
    );
  }

  return user;
}

/* logs out user by telling firebase to signout before redirecting. */
export async function logoutUser() {
  await signOut(auth);
  window.location.href = "index.html";
}

/* Registers the call back with firebase from app.js  */
export function onAuthReady(callback) {
  return onAuthStateChanged(auth, callback);
}

/* A hashmap of potential errors that may occur.  */
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
