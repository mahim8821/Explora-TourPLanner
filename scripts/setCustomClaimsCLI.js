/**
 * scripts/setCustomClaimsCLI.js
 * Admin SDK CLI script for bootstrapping the first administrator or setting operator/moderator claims.
 *
 * Usage:
 *   node scripts/setCustomClaimsCLI.js <user-uid-or-email> <traveler|operator|moderator|admin>
 *
 * Prerequisite:
 *   Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

async function setRole() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node scripts/setCustomClaimsCLI.js <uid-or-email> <role>');
    console.error('Allowed roles: traveler, operator, moderator, admin');
    process.exit(1);
  }

  const [identifier, role] = args;
  const validRoles = ['traveler', 'operator', 'moderator', 'admin'];
  if (!validRoles.includes(role)) {
    console.error(`Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  try {
    let userRecord;
    if (identifier.includes('@')) {
      userRecord = await admin.auth().getUserByEmail(identifier);
    } else {
      userRecord = await admin.auth().getUser(identifier);
    }

    console.log(`Found user: ${userRecord.email} (${userRecord.uid})`);
    console.log(`Current claims:`, userRecord.customClaims);

    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role,
      assignedAt: Date.now(),
    });

    // Mirror to Firestore user doc
    const db = admin.firestore();
    await db.collection('users').doc(userRecord.uid).set(
      {
        role,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Write audit log
    await db.collection('admin_audit_logs').add({
      actorId: 'system_cli',
      actorName: 'Admin CLI',
      actorRole: 'admin',
      action: 'ASSIGN_ROLE',
      targetId: userRecord.uid,
      details: `Bootstrap/CLI assigned role "${role}" to ${userRecord.email}`,
      createdAt: Date.now(),
    });

    console.log(`✅ Success! Custom claim { role: "${role}" } applied to ${userRecord.email}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to set custom claims:', err);
    process.exit(1);
  }
}

setRole();
