import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { auth, db } from "@/firebase";
import { getDoc, doc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import Navigation from "@/components/Navigation";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Displays a read‑only view of a user's profile. The profile document is
 * retrieved from the `profiles` collection using the provided UID param.
 * If `uid` is "me" or undefined the current authenticated user's UID
 * is used instead. Basic user details (first/last name, email) are also
 * loaded from the `users` collection. This component renders a simple
 * dashboard summarizing all the preferences captured during profile
 * creation.
 */
export default function ProfileView() {
  const params = useParams<{ uid?: string }>();
  const [profile, setProfile] = useState<any | null>(null);
  const [userDetails, setUserDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine which UID to load: "me" or explicit param
  const uid = params.uid === "me" || !params.uid ? auth.currentUser?.uid : params.uid;

  useEffect(() => {
    const fetchData = async () => {
      if (!uid) {
        setLoading(false);
        return;
      }
      try {
        const profileSnap = await getDoc(doc(db, "profiles", uid));
        const userSnap = await getDoc(doc(db, "users", uid));
        setProfile(profileSnap.exists() ? profileSnap.data() : null);
        setUserDetails(userSnap.exists() ? userSnap.data() : null);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [uid]);

  const isOwnProfile = uid === auth.currentUser?.uid;

  /**
   * Report a user for inappropriate behaviour or other issues. When called,
   * prompts the current user for a reason and saves a report document to
   * Firestore. Reports are stored in the `reports` collection with
   * fields: reporterId, reportedId, reason, createdAt. If no reason is
   * provided the report is not submitted.
   */
  const reportUser = async (reportedId: string) => {
    const reporterId = auth.currentUser?.uid;
    if (!reporterId) {
      alert("You must be logged in to report a user.");
      return;
    }
    const reason = window.prompt("Please describe the reason for reporting this user:");
    if (!reason || !reason.trim()) {
      // User cancelled or provided empty reason
      return;
    }
    try {
      await addDoc(collection(db, "reports"), {
        reporterId,
        reportedId,
        reason: reason.trim(),
        createdAt: serverTimestamp(),
      });
      alert("Thank you for your report. Our team will review it shortly.");
    } catch (err) {
      console.error("Failed to submit report:", err);
      alert("Failed to submit report. Please try again later.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <Navigation currentPage="profile" />
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <Navigation currentPage="profile" />
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
          <p className="text-gray-600">The requested profile could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <Navigation currentPage="profile" />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">
                {userDetails?.firstName} {userDetails?.lastName}
              </CardTitle>
              <CardDescription>
                {profile.year} • {profile.program}
              </CardDescription>
            </div>
            {isOwnProfile ? (
              <Link
                to="/profile"
                className="text-sm text-blue-600 hover:underline"
              >
                Edit Profile
              </Link>
            ) : (
              <button
                onClick={() => reportUser(uid as string)}
                className="text-sm text-red-600 hover:underline"
              >
                Report
              </button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Living Preferences */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Living Preferences</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Cleanliness: {profile.cleanliness}/10</p>
                <p>Noise Level: {profile.noiseLevel}/10</p>
                <p>Guest Policy: {profile.guestPolicy}</p>
                <p>Smoking Policy: {profile.smokingPolicy}</p>
                <p>Pet Policy: {profile.petPolicy}</p>
              </div>
            </div>
            {/* Study Habits */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Study Habits</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Preferred Study Time: {profile.studyTime}</p>
                <p>Quiet Hours: {profile.quietHours}</p>
                <p>Study Location: {profile.studyLocation}</p>
              </div>
            </div>
            {/* Lifestyle */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Lifestyle</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Sleep Schedule: {profile.sleepSchedule}</p>
                <p>Exercise: {profile.exercise}</p>
                <p>Cooking: {profile.cooking}</p>
                <p>Social Level: {profile.socialLevel}/10</p>
              </div>
            </div>
            {/* Housing */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Housing Preferences</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Budget: {profile.budget}</p>
                <p>Location: {profile.location}</p>
                <p>Room Type: {profile.roomType}</p>
              </div>
            </div>
            {/* Personal */}
            <div>
              <h3 className="font-semibold text-lg mb-2">About Me</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-2">{profile.bio}</p>
                <div className="mt-3">
                  <h4 className="font-semibold text-md mb-1">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(profile.interests) && profile.interests.length > 0 ? (
                      profile.interests.map((interest: string) => (
                        <Badge key={interest} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-600">No interests specified</p>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <h4 className="font-semibold text-md mb-1">Deal Breakers</h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(profile.dealBreakers) && profile.dealBreakers.length > 0 ? (
                      profile.dealBreakers.map((item: string) => (
                        <Badge key={item} variant="outline" className="text-xs">
                          {item}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-600">No deal breakers specified</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Local matching helpers removed; use generateMatchesForUser from '@/lib/matching'