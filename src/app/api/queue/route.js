import { NextResponse } from "next/server";
import { db, getTodayKey, firestoreHelpers } from "@/lib/firebase";

const {
  doc,
  collection,
  getDocs,
  deleteDoc,
  orderBy,
  query,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} = firestoreHelpers;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedDate = searchParams.get("date");
    const dateKey = requestedDate || getTodayKey();
    const dayRef = doc(db, "queues", dateKey);
    const ticketsCol = collection(dayRef, "tickets");

    const q = query(ticketsCol, orderBy("basePosition", "asc"));
    const snapshot = await getDocs(q);

    const tickets = [];
    snapshot.forEach((docSnap) => {
      tickets.push({ id: docSnap.id, ...docSnap.data() });
    });

    return NextResponse.json({ dateKey, tickets }, { status: 200 });
  } catch (err) {
    console.error("Error in /api/queue GET:", err);
    return NextResponse.json(
      { error: "Failed to fetch queue" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const dateKey = getTodayKey();
    const dayRef = doc(db, "queues", dateKey);
    const ticketsCol = collection(dayRef, "tickets");

    const snapshot = await getDocs(ticketsCol);

    const deletions = [];
    let totalChaiRestore = 0;
    let totalBunRestore = 0;

    snapshot.forEach((docSnap) => {
      const ticketData = docSnap.data();
      // Only delete tickets with status "waiting", preserve "ready" (served) tickets
      if (ticketData.status === "waiting") {
        deletions.push(deleteDoc(docSnap.ref));
        
        // Calculate inventory to restore
        const items = Array.isArray(ticketData.items) ? ticketData.items : [];
        items.forEach((item) => {
          const qty = Number(item.qty) || 0;
          if (item.name === "Irani Chai") {
            totalChaiRestore += qty;
          } else if (item.name === "Bun") {
            totalBunRestore += qty;
          }
        });
      }
    });

    await Promise.all(deletions);

    // Restore inventory for all deleted waiting tickets
    if (totalChaiRestore > 0 || totalBunRestore > 0) {
      const settingsRef = doc(db, "config", "app-settings");
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        const currentSettings = settingsSnap.data();
        const currentInventory = currentSettings.inventory || { chai: 0, bun: 0 };
        
        // Update only inventory field (more efficient than updating entire settings doc)
        await updateDoc(settingsRef, {
          "inventory.chai": (currentInventory.chai || 0) + totalChaiRestore,
          "inventory.bun": (currentInventory.bun || 0) + totalBunRestore,
          updatedAt: serverTimestamp(),
        });
      }
    }

    return NextResponse.json({ dateKey, cleared: true }, { status: 200 });
  } catch (err) {
    console.error("Error in /api/queue DELETE:", err);
    return NextResponse.json(
      { error: "Failed to clear queue" },
      { status: 500 }
    );
  }
}




