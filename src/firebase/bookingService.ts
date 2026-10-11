/**
 * bookingService.ts
 * Firestore CRUD for the `bookings` collection.
 *
 * Schema: bookings/{bookingId}
 *   id, userId, userEmail, userName, tripId, tripTitle,
 *   date (ISO string), status ('Pending' | 'Confirmed' | 'Cancelled'),
 *   createdAt
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy,
  Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firestore';

export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled';

export interface Booking {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  tripId: string;
  tripTitle: string;
  date: string;
  status: BookingStatus;
  createdAt?: any;
}

const BOOKINGS_COL = 'bookings';

/** User: create a booking */
export async function createBooking(
  data: Omit<Booking, 'id' | 'createdAt' | 'status'>
): Promise<string> {
  const ref = await addDoc(collection(db, BOOKINGS_COL), {
    ...data,
    status: 'Pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** User: get all bookings for a specific user (real-time) */
export function subscribeToUserBookings(
  userId: string,
  callback: (bookings: Booking[]) => void
): Unsubscribe {
  // NOTE: combining where() + orderBy() on different fields requires a
  // composite index. We avoid that by sorting client-side after the query.
  const q = query(
    collection(db, BOOKINGS_COL),
    where('userId', '==', userId)
  );
  return onSnapshot(q, snap => {
    const bookings: Booking[] = snap.docs
      .map(d => ({ id: d.id, ...(d.data() as Omit<Booking, 'id'>) }))
      .sort((a, b) => {
        // Firestore Timestamps have .toMillis(); fallback to 0 if missing
        const aMs = (a.createdAt as Timestamp)?.toMillis?.() ?? 0;
        const bMs = (b.createdAt as Timestamp)?.toMillis?.() ?? 0;
        return bMs - aMs; // newest first
      });
    callback(bookings);
  });
}

/** Admin: get all bookings (real-time) */
export function subscribeToAllBookings(
  callback: (bookings: Booking[]) => void
): Unsubscribe {
  const q = query(collection(db, BOOKINGS_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    const bookings: Booking[] = snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<Booking, 'id'>),
    }));
    callback(bookings);
  });
}

/** Admin: update booking status */
export async function updateBookingStatus(
  id: string,
  status: BookingStatus
): Promise<void> {
  await updateDoc(doc(db, BOOKINGS_COL, id), { status });
}

/** Admin: delete a booking */
export async function deleteBooking(id: string): Promise<void> {
  await deleteDoc(doc(db, BOOKINGS_COL, id));
}

/** Check if user has already booked a trip */
export async function hasUserBookedTrip(
  userId: string,
  tripId: string
): Promise<boolean> {
  const q = query(
    collection(db, BOOKINGS_COL),
    where('userId', '==', userId),
    where('tripId', '==', tripId)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}
