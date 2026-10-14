/**
 * userService.ts
 * Firestore CRUD and profile management for the `users` collection.
 *
 * Roles:
 * - traveler: default user, can browse, save, post, manage own bookings
 * - operator: manage assigned tours and permitted bookings
 * - moderator: review reports and moderate community content
 * - admin: manage platform-wide content, roles, operations, and audit logs
 */

import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firestore';
import { UserRole } from '../store/slices/authSlice';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  coverPhotoURL?: string | null;
  bio: string;
  role: UserRole;
  operatorLicense?: string;
  assignedTourIds?: string[];
  interests: string[];
  tripsJoined: number;
  countriesVisited: number;
  createdAt?: any;
  updatedAt?: any;
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
      bio: 'Explorer discovering Bangladesh 🌏',
      role: 'traveler',
      interests: ['Hills', 'Rivers', 'Beaches', 'Culture'],
      tripsJoined: 0,
      countriesVisited: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

/** Fetch a single user profile */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  // Normalize legacy 'user' role to 'traveler'
  const role: UserRole = data.role === 'user' ? 'traveler' : (data.role || 'traveler');
  return {
    ...data,
    role,
  } as UserProfile;
}

/** Update fields in user profile */
export async function updateUserProfile(
  uid: string,
  updates: Partial<Omit<UserProfile, 'uid' | 'createdAt' | 'role'>>
): Promise<void> {
  const ref = doc(db, 'users', uid);
  const cleaned: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };
  for (const [key, val] of Object.entries(updates)) {
    if (val !== undefined) {
      cleaned[key] = val;
    }
  }
  await setDoc(ref, cleaned, { merge: true });
}

/** Admin / Staff: fetch all users */
export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => {
    const data = d.data();
    const role: UserRole = data.role === 'user' ? 'traveler' : (data.role || 'traveler');
    return {
      ...data,
      role,
    } as UserProfile;
  });
}

/** Admin: delete a user document */
export async function deleteUserDocument(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid));
}

/**
 * Assign user role (Admin SDK endpoint / Cloud Function simulated locally).
 * In production, this calls the Cloud Function `setCustomUserClaims`.
 */
export async function setUserRole(
  uid: string,
  role: UserRole
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    role,
    updatedAt: serverTimestamp(),
  });
}
