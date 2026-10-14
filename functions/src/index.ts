/**
 * functions/src/index.ts
 * Cloud Functions for Firebase providing trusted, server-controlled Custom Claims assignment.
 *
 * This function ensures that roles ('admin', 'operator', 'moderator', 'traveler')
 * CANNOT be set by arbitrary client-side writes. It validates that the calling user
 * possesses the 'admin' custom claim before mutating claims and recording an immutable audit log.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

export type AllowedRole = 'traveler' | 'operator' | 'moderator' | 'admin';

interface SetRoleRequest {
  targetUid: string;
  role: AllowedRole;
  reason?: string;
}

/**
 * Callable Cloud Function: setUserRoleWithClaim
 * Usage:
 *   const setRole = httpsCallable(functions, 'setUserRoleWithClaim');
 *   await setRole({ targetUid: '12345', role: 'operator', reason: 'Assigned Sajek operations' });
 */
export const setUserRoleWithClaim = functions.https.onCall(
  async (data: SetRoleRequest, context) => {
    // 1. Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication required to perform administrative role management.'
      );
    }

    // 2. Authorization check: Only caller with 'admin' custom claim can promote/demote
    const callerClaims = context.auth.token;
    const isCallerAdmin = callerClaims.role === 'admin';

    if (!isCallerAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Access denied: Only platform administrators can assign roles.'
      );
    }

    const { targetUid, role, reason } = data;

    if (!targetUid || !['traveler', 'operator', 'moderator', 'admin'].includes(role)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Valid targetUid and role (traveler, operator, moderator, admin) are required.'
      );
    }

    try {
      // 3. Set Custom User Claims on Firebase Authentication
      await admin.auth().setCustomUserClaims(targetUid, {
        role,
        updatedAt: Date.now(),
      });

      // 4. Update the Firestore user document mirror
      const db = admin.firestore();
      await db.collection('users').doc(targetUid).set(
        {
          role,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // 5. Append immutable entry to admin_audit_logs
      await db.collection('admin_audit_logs').add({
        actorId: context.auth.uid,
        actorName: context.auth.token.name || context.auth.token.email || 'Admin',
        actorRole: 'admin',
        action: 'ASSIGN_ROLE',
        targetId: targetUid,
        details: `Assigned role "${role}". Reason: ${reason || 'Administrative update'}`,
        createdAt: Date.now(),
      });

      return {
        success: true,
        message: `Successfully set role "${role}" on user ${targetUid}`,
      };
    } catch (error: any) {
      console.error('Error setting custom claims:', error);
      throw new functions.https.HttpsError('internal', error.message || 'Failed to update user role');
    }
  }
);
