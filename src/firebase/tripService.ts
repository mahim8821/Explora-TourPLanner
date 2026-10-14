/**
 * tripService.ts
 * Firestore CRUD for the `trips` collection.
 * Supports RBAC with operator assignment, draft/published status, and scheduled departures.
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
  where,
  QueryConstraint,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firestore';
import { TripCategory } from '../data/trips';

export type TourStatus = 'Draft' | 'Published';

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
  status: TourStatus;
  operatorId?: string;
  operatorName?: string;
  departureDates?: string[];
  itinerary?: string[];
  createdAt?: any;
  updatedAt?: any;
}

const TRIPS_COL = 'trips';

/** Real-time subscription to all trips (or published-only for public) */
export function subscribeToTrips(
  callback: (trips: FirestoreTrip[]) => void,
  publishedOnly: boolean = false
): Unsubscribe {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
  if (publishedOnly) {
    constraints.unshift(where('status', '==', 'Published'));
  }
  const q = query(collection(db, TRIPS_COL), ...constraints);
  return onSnapshot(
    q,
    snap => {
      const trips: FirestoreTrip[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          status: data.status || 'Published',
          ...data,
        } as FirestoreTrip;
      });
      callback(trips);
    },
    err => {
      console.warn('Error subscribing to trips:', err);
      callback([]);
    }
  );
}

/** Operator: Real-time subscription to trips assigned to an operator */
export function subscribeToOperatorTrips(
  operatorId: string,
  callback: (trips: FirestoreTrip[]) => void
): Unsubscribe {
  const q = query(
    collection(db, TRIPS_COL),
    where('operatorId', '==', operatorId)
  );
  return onSnapshot(
    q,
    snap => {
      const trips: FirestoreTrip[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          status: data.status || 'Draft',
          ...data,
        } as FirestoreTrip;
      });
      callback(trips);
    },
    err => {
      console.warn('Error subscribing to operator trips:', err);
      callback([]);
    }
  );
}

/** Fetch all trips once */
export async function getAllTrips(): Promise<FirestoreTrip[]> {
  const snap = await getDocs(collection(db, TRIPS_COL));
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      status: data.status || 'Published',
      ...data,
    } as FirestoreTrip;
  });
}

/** Admin / Operator: add a new trip */
export async function addTrip(
  data: Omit<FirestoreTrip, 'id' | 'createdAt' | 'status'> & { status?: TourStatus }
): Promise<string> {
  const ref = await addDoc(collection(db, TRIPS_COL), {
    ...data,
    status: data.status || 'Published',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Admin / Operator: update a trip */
export async function updateTrip(
  id: string,
  updates: Partial<Omit<FirestoreTrip, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, TRIPS_COL, id), {
    ...updates,
    updatedAt: serverTimestamp(),
  } as any);
}

/** Toggle published status */
export async function setTripPublishStatus(
  id: string,
  status: TourStatus
): Promise<void> {
  await updateDoc(doc(db, TRIPS_COL, id), {
    status,
    updatedAt: serverTimestamp(),
  });
}

/** Admin / Operator: delete a trip */
export async function deleteTrip(id: string): Promise<void> {
  await deleteDoc(doc(db, TRIPS_COL, id));
}

/**
 * Seed default trips from local data if Firestore has no trips yet.
 */
export async function seedTripsIfEmpty(
  localTrips: Array<Omit<FirestoreTrip, 'id' | 'createdAt' | 'status'>>
): Promise<void> {
  const existing = await getDocs(collection(db, TRIPS_COL));
  if (!existing.empty) return;
  for (const trip of localTrips) {
    await addDoc(collection(db, TRIPS_COL), {
      ...trip,
      status: 'Published',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}
