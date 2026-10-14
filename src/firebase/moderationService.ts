/**
 * moderationService.ts
 * Manages community moderation reports and administrator audit logs.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
  where,
  limit,
} from 'firebase/firestore';
import { db } from './firestore';

export type ReportReason = 'spam' | 'inappropriate' | 'scam' | 'harassment' | 'misleading' | 'other';
export type ReportStatus = 'Pending' | 'Action_Taken' | 'Dismissed';

export interface ModerationReport {
  id: string;
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
  targetTitle?: string;
  targetAuthorName?: string;
  targetSnippet?: string;
  reporterId: string;
  reporterName: string;
  reason: ReportReason;
  details?: string;
  status: ReportStatus;
  createdAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
  actionTaken?: string;
}

export interface AdminAuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action:
    | 'ASSIGN_ROLE'
    | 'PUBLISH_TRIP'
    | 'UNPUBLISH_TRIP'
    | 'CONFIRM_BOOKING'
    | 'CANCEL_BOOKING'
    | 'RECONCILE_PAYMENT'
    | 'REMOVE_COMMUNITY_CONTENT'
    | 'DISMISS_REPORT';
  targetId?: string;
  targetTitle?: string;
  details: string;
  createdAt: number;
}

const REPORTS_COL = 'moderation_reports';
const AUDIT_LOGS_COL = 'admin_audit_logs';

/** Any authenticated user: submit a moderation report */
export async function submitModerationReport(
  data: Omit<ModerationReport, 'id' | 'createdAt' | 'status'>
): Promise<string> {
  const ref = await addDoc(collection(db, REPORTS_COL), {
    ...data,
    status: 'Pending',
    createdAt: Date.now(),
  });
  return ref.id;
}

/** Moderator / Admin: subscribe to real-time reports */
export function subscribeToModerationReports(
  callback: (reports: ModerationReport[]) => void
): Unsubscribe {
  const q = query(collection(db, REPORTS_COL), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(
    q,
    snapshot => {
      const reports = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<ModerationReport, 'id'>),
      }));
      callback(reports);
    },
    err => {
      console.warn('Error subscribing to moderation reports:', err);
      callback([]);
    }
  );
}

/** Moderator / Admin: resolve a report */
export async function resolveModerationReport(
  reportId: string,
  status: 'Action_Taken' | 'Dismissed',
  moderatorName: string,
  actionTaken?: string
): Promise<void> {
  const ref = doc(db, REPORTS_COL, reportId);
  await updateDoc(ref, {
    status,
    resolvedAt: Date.now(),
    resolvedBy: moderatorName,
    actionTaken: actionTaken || (status === 'Action_Taken' ? 'Content hidden/removed' : 'Report dismissed'),
  });
}

/** Moderator / Admin: delete report */
export async function deleteModerationReport(reportId: string): Promise<void> {
  await deleteDoc(doc(db, REPORTS_COL, reportId));
}

/** Staff: log an administrative action for audit trail */
export async function logAdminAction(
  data: Omit<AdminAuditLog, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, AUDIT_LOGS_COL), {
      ...data,
      createdAt: Date.now(),
    });
    return ref.id;
  } catch (err) {
    console.warn('Could not record admin audit log:', err);
    return '';
  }
}

/** Admin: subscribe to audit logs */
export function subscribeToAuditLogs(
  callback: (logs: AdminAuditLog[]) => void
): Unsubscribe {
  const q = query(collection(db, AUDIT_LOGS_COL), orderBy('createdAt', 'desc'), limit(40));
  return onSnapshot(
    q,
    snapshot => {
      const logs = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<AdminAuditLog, 'id'>),
      }));
      callback(logs);
    },
    err => {
      console.warn('Error subscribing to audit logs:', err);
      callback([]);
    }
  );
}
