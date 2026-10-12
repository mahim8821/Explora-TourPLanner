/**
 * userService.ts
 * Firestore CRUD for the `users` collection.
 *
 * Schema: users/{uid}
 *   uid, email, displayName, photoURL, bio, role ('user' | 'admin'),
 *   interests: string[], tripsJoined: number, countriesVisited: number,
 *   createdAt: Timestamp
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  coverPhotoURL?: string | null;
  bio: string;
  role: 'user' | 'admin';
  interests: string[];
  tripsJoined: number;
  countriesVisited: number;
  createdAt?: any;
}

/** Create or merge user profile on first sign-in */
export async function createUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      email: data.email ?? null,
      displayName: data.displayName ?? null,
      photoURL: data.photoURL ?? null,
      bio: 'Adventure seeker & travel enthusiast 🌏',
      role: 'user',
      interests: ['Mountains', 'Beaches', 'Nature'],
      tripsJoined: 0,
      countriesVisited: 0,
      createdAt: serverTimestamp(),
    });
  }
}

/** Fetch a single user profile */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

/** Update fields in user profile */
export async function updateUserProfile(
  uid: string,
  updates: Partial<Omit<UserProfile, 'uid' | 'createdAt' | 'role'>>
): Promise<void> {
  const ref = doc(db, 'users', uid);
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(updates)) {
    if (val !== undefined) {
      cleaned[key] = val;
    }
  }
  await setDoc(ref, cleaned, { merge: true });
}

/** Admin: fetch all users */
export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => d.data() as UserProfile);
}

/** Admin: delete a user document (does NOT delete from Auth) */
export async function deleteUserDocument(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid));
}

/** Admin: promote / demote a user's role */
export async function setUserRole(
  uid: string,
  role: 'user' | 'admin'
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { role });
}
