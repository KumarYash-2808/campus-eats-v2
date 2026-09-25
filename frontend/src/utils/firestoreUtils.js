import { collection, getDoc, doc, getDocs } from "firebase/firestore"; // ⬅️ Added getDoc, doc
import { db } from "../firebase";

/**
 * Optimized: Fetches items by directly referencing the cafeteria document ID.
 *
 * @param {string} cafeteriaId - The cafeteria ID (document ID) whose items we want.
 * @returns {Promise<Array>} - List of menu items belonging to that cafeteria.
 */
export const getItemsByCafeteria = async (cafeteriaId) => {
  try {
    if (!cafeteriaId) {
      console.warn("⚠️ getItemsByCafeteria called without cafeteriaId");
      return [];
    }

    console.log("🔍 Fetching cafeteria for ID:", cafeteriaId);

    // ✅ Step 1: Directly fetch the specific cafeteria document by ID (Optimized)
    const cafeteriaRef = doc(db, "cafeterias", cafeteriaId);
    const cafeteriaSnap = await getDoc(cafeteriaRef);

    if (!cafeteriaSnap.exists()) {
      console.warn(`⚠️ No cafeteria found for ID: ${cafeteriaId}`);
      return [];
    }

    const matchedCafeteria = { id: cafeteriaSnap.id, ...cafeteriaSnap.data() };
    console.log("✅ Found cafeteria:", matchedCafeteria.name || matchedCafeteria.id);

    // ✅ Step 2: Fetch items from its subcollection
    const menuSnap = await getDocs(
      collection(db, "cafeterias", matchedCafeteria.id, "items")
    );
    const items = menuSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`✅ Fetched ${items.length} items for cafeteria: ${matchedCafeteria.id}`);
    return items;
  } catch (error) {
    console.error("❌ Error fetching items:", error);
    return [];
  }
};
