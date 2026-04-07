/*
 * migrateSlugDocs.js
 *
 * Migrates old eventspot documents that used slug IDs
 * (e.g., "renfrew", "pne") into the new MP### ID format.
 *
 * For each slug doc:
 *  - Reads its top‑level fields
 *  - Copies all update-history entries into the MP### doc
 *  - Updates latest_status / last_updated on the MP### doc
 *  - Deletes the old slug doc (unless DRY_RUN is true)
 *
 * Used once during the ID system transition.
 */


import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebaseConfig.node.js";

// Toggle this to false to apply changes
const DRY_RUN = true;

// Map slug → MP### IDs
const SITE_MAP = {
  "renfrew": ["MP026"],
  "pne": ["MP025"],
  "stadium-chinatown": ["MP024"],
  "commercial-broadway": ["MP023"],
  "bc-place": ["MP022"],
  // Add more if needed
};

async function migrate() {
  console.log("Starting migration… DRY_RUN =", DRY_RUN);

  for (const [slug, mpIds] of Object.entries(SITE_MAP)) {
    console.log(`\nProcessing slug doc: ${slug}`);

    const slugRef = doc(db, "eventspots", slug);
    const slugSnap = await getDoc(slugRef);

    if (!slugSnap.exists()) {
      console.warn(`  ⚠ Slug doc '${slug}' does not exist. Skipping.`);
      continue;
    }

    const slugData = slugSnap.data();
    const updatesRef = collection(db, "eventspots", slug, "updates");
    const updatesSnap = await getDocs(updatesRef);

    for (const mpId of mpIds) {
      const mpRef = doc(db, "eventspots", mpId);
      const mpSnap = await getDoc(mpRef);

      if (!mpSnap.exists()) {
        console.log(`  → Creating new MP doc: ${mpId}`);

        if (!DRY_RUN) {
          await setDoc(mpRef, {
            name: slugData.name,
            description: slugData.description,
            location: slugData.location,
            latest_status: slugData.latest_status ?? null,
            last_updated: slugData.last_updated ?? null,
          });
        }
      }

      // Update top-level fields
      console.log(`  → Would update ${mpId} with { latest_status: ${slugData.latest_status}, last_updated: ${slugData.last_updated} }`);

      if (!DRY_RUN) {
        await updateDoc(mpRef, {
          latest_status: slugData.latest_status ?? null,
          last_updated: slugData.last_updated ?? serverTimestamp(),
        });
      }

      // Copy update history
      for (const updateDocSnap of updatesSnap.docs) {
        const updateData = updateDocSnap.data();
        console.log(`  → Would copy update ${updateDocSnap.id} to ${mpId}`);

        if (!DRY_RUN) {
          await addDoc(collection(db, "eventspots", mpId, "updates"), updateData);
        }
      }
    }

    // Delete slug doc
    if (updatesSnap.empty) {
      console.log(`  → No updates found. Safe to delete slug doc: ${slug}`);
    }

    if (!DRY_RUN) {
      console.log(`  → Deleting slug doc: ${slug}`);
      await deleteDoc(slugRef);
    } else {
      console.log(`  ⚠ DRY_RUN: Would delete slug doc: ${slug}`);
    }
  }

  console.log("\n🎉 Migration complete.");
}

migrate().catch((err) => console.error("Migration failed:", err));
