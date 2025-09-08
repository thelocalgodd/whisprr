import { auth, signInAnonymously, onAuthStateChanged, User } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export interface FirebaseAuthUser {
  uid: string;
  isAnonymous: boolean;
  email?: string | null;
  displayName?: string | null;
}

export const signInAnonymouslyFirebase = async (): Promise<FirebaseAuthUser> => {
  try {
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    return {
      uid: user.uid,
      isAnonymous: user.isAnonymous,
      email: user.email,
      displayName: user.displayName,
    };
  } catch (error: any) {
    console.error("Error signing in anonymously:", error);
    throw new Error(error.message || "Failed to sign in anonymously");
  }
};

export const signOutFirebase = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error("Error signing out:", error);
    throw new Error(error.message || "Failed to sign out");
  }
};

export const getCurrentFirebaseUser = (): FirebaseAuthUser | null => {
  const user = auth.currentUser;
  if (!user) return null;
  
  return {
    uid: user.uid,
    isAnonymous: user.isAnonymous,
    email: user.email,
    displayName: user.displayName,
  };
};

export const onFirebaseAuthStateChanged = (
  callback: (user: FirebaseAuthUser | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      callback({
        uid: user.uid,
        isAnonymous: user.isAnonymous,
        email: user.email,
        displayName: user.displayName,
      });
    } else {
      callback(null);
    }
  });
};