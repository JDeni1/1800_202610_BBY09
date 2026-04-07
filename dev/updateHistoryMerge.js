// ------------------------------------------------------------
// updateHistoryMerge.js
// ------------------------------------------------------------
//
// Merges update history from one eventspot into another.
// Useful when consolidating duplicate locations or renaming IDs.
//
// Usage:
//   node updateHistoryMerge.js MP023 renfrew
//
// ------------------------------------------------------------

import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebaseConfig.node.js";

// Toggle this to false to apply changes
const DRY_RUN = true;

// Read CLI args
const [,, TARGET_ID, SOURCE_ID] = process.argv;

if (!TARGET_ID || !SOURCE_ID) {
  console.error("Usage: node updateHistoryMerge.js <TARGET_ID> <SOURCE_ID>");
  process.exit(1);
}

async function mergeUpdateHistory() {
  console.log(`\n=== Merging update history ===`);
  console.log(`Source: ${SOURCE_ID}`);
  console.log(`Target: ${TARGET_ID}`);
  console.log(`DRY_RUN = ${DRY_RUN}`);

  const sourceRef = doc(db, "eventspots", SOURCE_ID);
  const targetRef = doc(db, "eventspots", TARGET_ID);

  const sourceSnap = await getDoc(sourceRef);
  const targetSnap = await getDoc(targetRef);

  if (!sourceSnap.exists()) {
    console.error(`❌ Source doc '${SOURCE_ID}' does not exist.`);
    return;
  }
  if (!targetSnap.exists()) {
    console.error(`❌ Target doc '${TARGET_ID}' does not exist.`);
    return;
  }

  // Fetch update history from source
  const updatesRef = collection(db, "eventspots", SOURCE_ID, "updates");
  const updatesSnap = await getDocs(updatesRef);

  console.log(`\nFound ${updatesSnap.size} updates to merge.`);

  let newestStatus = null;
  let newestTimestamp = 0;

  for (const updateDocSnap of updatesSnap.docs) {
    const updateData = updateDocSnap.data();

    console.log(`→ Would copy update ${updateDocSnap.id} to ${TARGET_ID}`);

    if (!DRY_RUN) {
      await addDoc(collection(db, "eventspots", TARGET_ID, "updates"), updateData);
    }

    // Track newest update for top-level fields
    const ts = updateData.timestamp?.toMillis?.() ?? 0;
    if (ts > newestTimestamp) {
      newestTimestamp = ts;
      newestStatus = updateData.status;
    }
  }

  // Update top-level fields on target
  if (newestStatus !== null) {
    console.log(
      `\n→ Would update ${TARGET_ID} with latest_status=${newestStatus}, last_updated=${new Date(newestTimestamp)}`
    );

    if (!DRY_RUN) {
      await updateDoc(targetRef, {
        latest_status: newestStatus,
        last_updated: serverTimestamp(),
      });
    }
  }

  // Delete source doc
  console.log(`\n→ Would delete source doc: ${SOURCE_ID}`);

  if (!DRY_RUN) {
    await deleteDoc(sourceRef);
  }

  console.log("\n🎉 Merge complete.");
}

mergeUpdateHistory().catch((err) => console.error("Merge failed:", err));
