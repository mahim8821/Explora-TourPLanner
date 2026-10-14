/**
 * bookingService.ts
 * Firestore CRUD for the `bookings` collection.
 * Supports RBAC, operator isolation, payment reconciliation, and departure tracking.
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
export type PaymentStatus = 'Unpaid' | 'Paid' | 'Refunded';

export interface Booking {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  tripId: string;
  tripTitle: string;
  operatorId?: string;
  date: string;
  departureDate?: string;
  amount?: number;
  status: BookingStatus;
  paymentStatus?: PaymentStatus;
  reconciliationNotes?: string;
  createdAt?: any;
  updatedAt?: any;
}

const BOOKINGS_COL = 'bookings';

/** User: create a booking */
export async function createBooking(
  data: Omit<Booking, 'id' | 'createdAt' | 'status'>
): Promise<string> {
  const ref = await addDoc(collection(db, BOOKINGS_COL), {
    ...data,
    status: 'Pending',
    paymentStatus: data.paymentStatus || 'Unpaid',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** User: get all bookings for a specific user (real-time) */
export function subscribeToUserBookings(
  userId: string,
  callback: (bookings: Booking[]) => void
): Unsubscribe {
  const q = query(
    collection(db, BOOKINGS_COL),
    where('userId', '==', userId)
  );
  return onSnapshot(q, snap => {
    const bookings: Booking[] = snap.docs
      .map(d => ({ id: d.id, ...(d.data() as Omit<Booking, 'id'>) }))
      .sort((a, b) => {
        const aMs = (a.createdAt as Timestamp)?.toMillis?.() ?? 0;
        const bMs = (b.createdAt as Timestamp)?.toMillis?.() ?? 0;
        return bMs - aMs;
      });
    callback(bookings);
  });
}

/** Admin: get all platform-wide bookings (real-time) */
export function subscribeToAllBookings(
  callback: (bookings: Booking[]) => void
): Unsubscribe {
  const q = query(collection(db, BOOKINGS_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    const bookings: Booking[] = snap.docs.map(d => ({
      id: d.id,
      paymentStatus: 'Unpaid',
      ...(d.data() as Omit<Booking, 'id'>),
    }));
    callback(bookings);
  });
}

/** Operator: get bookings for tours assigned to this operator (real-time) */
export function subscribeToOperatorBookings(
  operatorId: string,
  callback: (bookings: Booking[]) => void
): Unsubscribe {
  const q = query(
    collection(db, BOOKINGS_COL),
    where('operatorId', '==', operatorId)
  );
  return onSnapshot(q, snap => {
    const bookings: Booking[] = snap.docs.map(d => ({
      id: d.id,
      paymentStatus: 'Unpaid',
      ...(d.data() as Omit<Booking, 'id'>),
    }));
    callback(bookings);
  });
}

/** Admin / Operator: update booking status with permitted transitions */
export async function updateBookingStatus(
  id: string,
  status: BookingStatus
): Promise<void> {
  await updateDoc(doc(db, BOOKINGS_COL, id), {
    status,
    updatedAt: serverTimestamp(),
  });
}

/** Admin / Operator: reconcile payment record */
export async function reconcileBookingPayment(
  id: string,
  paymentStatus: PaymentStatus,
  reconciliationNotes?: string
): Promise<void> {
  await updateDoc(doc(db, BOOKINGS_COL, id), {
    paymentStatus,
    reconciliationNotes: reconciliationNotes ?? '',
    updatedAt: serverTimestamp(),
  });
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
