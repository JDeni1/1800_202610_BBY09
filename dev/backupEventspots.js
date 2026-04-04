/*
 * backupEventspots.js
 *
 * Exports all eventspot documents (and optionally their
 * update-history subcollections) into a local JSON file.
 *
 * Useful for creating offline backups, snapshots before
 * migrations, or archiving MP### data for debugging.
 */


import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig.node.js";
import fs from "fs";

async function backupEventspots() {
  const colRef = collection(db, "eventspots");
  const snapshot = await getDocs(colRef);

  const data = {};
  snapshot.forEach(doc => {
    data[doc.id] = doc.data();
  });

  fs.writeFileSync("eventspots-backup.json", JSON.stringify(data, null, 2));
  console.log("Backup saved to eventspots-backup.json");
}

backupEventspots();
