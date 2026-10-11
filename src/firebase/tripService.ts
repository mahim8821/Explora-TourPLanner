/**
 * tripService.ts
 * Firestore CRUD for the `trips` collection.
 *
 * Schema: trips/{tripId}
 *   id, title, location, durationDays, budget, slotsAvailable, totalSlots,
 *   description, category, imageUrl (string URI), createdAt
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  orderBy,
  query,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firestore';
import { TripCategory } from '../data/trips';

export interface FirestoreTrip {
  id: string;
  title: string;
  location: string;
  durationDays: number;
  budget: number;
  slotsAvailable: number;
  totalSlots: number;
  description: string;
  category: TripCategory;
  imageUrl: string;
  createdAt?: any;
}

const TRIPS_COL = 'trips';

/** Real-time subscription to all trips */
export function subscribeToTrips(
  callback: (trips: FirestoreTrip[]) => void
): Unsubscribe {
  const q = query(collection(db, TRIPS_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    const trips: FirestoreTrip[] = snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<FirestoreTrip, 'id'>),
    }));
    callback(trips);
  });
}

/** Fetch all trips once */
export async function getAllTrips(): Promise<FirestoreTrip[]> {
  const snap = await getDocs(collection(db, TRIPS_COL));
  return snap.docs.map(d => ({
    id: d.id,
    ...(d.data() as Omit<FirestoreTrip, 'id'>),
  }));
}

/** Admin: add a new trip */
export async function addTrip(
  data: Omit<FirestoreTrip, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, TRIPS_COL), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Admin: update a trip */
export async function updateTrip(
  id: string,
  updates: Partial<Omit<FirestoreTrip, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, TRIPS_COL, id), updates as any);
}

/** Admin: delete a trip */
export async function deleteTrip(id: string): Promise<void> {
  await deleteDoc(doc(db, TRIPS_COL, id));
}

/**
 * Seed default trips from local data if Firestore has no trips yet.
 * Call once from the Admin dashboard.
 */
export async function seedTripsIfEmpty(
  localTrips: Array<Omit<FirestoreTrip, 'id' | 'createdAt'>>
): Promise<void> {
  const existing = await getDocs(collection(db, TRIPS_COL));
  if (!existing.empty) return;
  for (const trip of localTrips) {
    await addDoc(collection(db, TRIPS_COL), {
      ...trip,
      createdAt: serverTimestamp(),
    });
  }
}
