import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebaseConfig.js";
import Papa from "papaparse";
import monitorPointsCSV from "../data/monitor_points.csv?raw";

function parseMonitorPoints() {
  const parsed = Papa.parse(monitorPointsCSV, {
    header: true,
    skipEmptyLines: true,
  });
  return parsed.data;
}

export async function seedEventSpotsFromCSV() {
  const rows = parseMonitorPoints();
  const colRef = collection(db, "eventspots");

  for (const row of rows) {
    if (!row.id) continue;

    const docRef = doc(colRef, row.id);

    await setDoc(
      docRef,
      {
        name: row.monitor_point,
        description: row.category,
        location: {
          lat: Number(row.lat),
          lng: Number(row.lng),
        },
        latest_status: null,
        last_updated: serverTimestamp(),
      },
      { merge: true }
    );

    //console.log("Seeded:", row.monitor_point); //Uncomment if you want to see the console log the seeded spots!
  }

  console.log("Done seeding CSV spots!");
}