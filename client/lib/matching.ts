import { db } from "@/firebase";
import {
  collection,
  getDocs,
  setDoc,
  doc,
} from "firebase/firestore";

/**
 * Normalize numeric preferences to a 0–1 scale. Cleanliness, noise and
 * social levels are on a 1–10 scale. Budgets range from ₦50,000 to ₦200,000.
 * This helper returns a value between 0 and 1 representing the position
 * within the allowable range. If the value is undefined or NaN, 0.5 is
 * returned as a neutral fallback.
 */
function normalizeMetric(metric: string, value: number): number {
  if (typeof value !== "number" || isNaN(value)) return 0.5;
  switch (metric) {
    case "cleanliness":
    case "noiseLevel":
    case "socialLevel":
      // Values are between 1 and 10
      return Math.min(Math.max((value - 1) / 9, 0), 1);
    case "budget": {
      // Budgets range from ₦50,000 to ₦200,000
      const min = 50000;
      const max = 200000;
      return Math.min(Math.max((value - min) / (max - min), 0), 1);
    }
    default:
      return 0.5;
  }
}

/**
 * Compute a weighted compatibility score between two profiles. Each
 * preference metric contributes a similarity score between 0 and 1 based
 * on how close the users' values are. This similarity is scaled by the
 * importance weight specified by the current user. The overall score
 * ranges from 0 to 100.
 *
 * @param a Current user's profile (includes weight fields).
 * @param b Other user's profile.
 */
export function computeCompatibility(a: any, b: any): number {
  // Define the metrics to compare along with their corresponding weight
  const metrics: Array<{
    key: string;
    weightKey: string;
  }> = [
    { key: "cleanliness", weightKey: "cleanlinessWeight" },
    { key: "noiseLevel", weightKey: "noiseLevelWeight" },
    { key: "socialLevel", weightKey: "socialLevelWeight" },
    { key: "budget", weightKey: "budgetWeight" },
  ];
  let weightedSum = 0;
  let weightTotal = 0;
  for (const { key, weightKey } of metrics) {
    const aVal = normalizeMetric(key, Number(a[key]));
    const bVal = normalizeMetric(key, Number(b[key]));
    const difference = Math.abs(aVal - bVal); // 0..1
    const similarity = 1 - difference; // 1 is perfect match
    // Default weight of 3 if missing (mid‑importance)
    const weight = Number(a[weightKey] ?? 3);
    weightedSum += similarity * weight;
    weightTotal += weight;
  }
  if (weightTotal === 0) return 0;
  return Math.round((weightedSum / weightTotal) * 100);
}

/**
 * Generate roommate matches for a given user. This function queries all
 * profiles in the `profiles` collection, computes a compatibility score
 * against the current user's profile using the weighted algorithm and
 * writes match documents into the `matches` collection. The match
 * document ID combines the user and other user's IDs to ensure uniqueness.
 *
 * NOTE: For large datasets this algorithm should run on the server
 * (e.g. via a Cloud Function). Here we implement it on the client for
 * demonstration. Security rules should ensure users can only write
 * their own matches.
 */
export async function generateMatchesForUser(userId: string): Promise<void> {
  try {
    // Fetch all profiles
    const snap = await getDocs(collection(db, "profiles"));
    const profiles: any[] = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    const current = profiles.find((p) => p.id === userId);
    if (!current) return;
    for (const profile of profiles) {
      if (profile.id === userId) continue;
      const compatibility = computeCompatibility(current, profile);
      const matchId = `${userId}_${profile.id}`;
      await setDoc(
        doc(db, "matches", matchId),
        {
          userId,
          otherUserId: profile.id,
          compatibility,
          status: "match",
          name: profile.name ?? "",
          year: profile.year ?? "",
          program: profile.program ?? "",
          location: profile.location ?? "",
          budget: profile.budget ?? null,
          bio: profile.bio ?? "",
          cleanliness: profile.cleanliness,
          noiseLevel: profile.noiseLevel,
          socialLevel: profile.socialLevel,
          studyTime: profile.studyTime ?? "",
          interests: profile.interests ?? [],
          dealBreakers: profile.dealBreakers ?? [],
        },
        { merge: true },
      );
    }
  } catch (err) {
    console.error("Failed to generate matches:", err);
  }
}