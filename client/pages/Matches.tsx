import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, 
  X, 
  MessageCircle, 
  MapPin, 
  GraduationCap, 
  Clock,
  Users,
  Home,
  Filter,
  Star,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

// Firebase imports
import { auth, db } from "@/firebase";
// Consolidate Firestore imports to avoid redeclaring identifiers like onSnapshot
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
// Use shared matching helpers for computing matches
import { generateMatchesForUser } from "@/lib/matching";

export default function Matches() {
  const [activeTab, setActiveTab] = useState("matches");
  // Firestore‑backed lists. Initially empty; will be populated in useEffect.
  const [matches, setMatches] = useState<any[]>([]);
  const [liked, setLiked] = useState<any[]>([]);
  const [passed, setPassed] = useState<any[]>([]);

  // Filter state: minimum compatibility percentage. Default 0 shows all.
  const [minCompatibility, setMinCompatibility] = useState(0);
  const [showFilter, setShowFilter] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Regenerate matches for the current user each time the matches page loads. This
    // ensures that new profiles created after initial onboarding are considered
    // when calculating potential roommates.
    generateMatchesForUser(user.uid).catch((err) => console.error(err));
    // Query the `matches` collection for this user. Each document should
    // contain fields: userId (current user), otherUserId, status (match|liked|passed),
    // and optionally additional info like compatibility and a snapshot of the matched profile.
    const matchesQuery = query(
      collection(db, "matches"),
      where("userId", "==", user.uid),
      where("status", "==", "match"),
    );
    const likesQuery = query(
      collection(db, "matches"),
      where("userId", "==", user.uid),
      where("status", "==", "liked"),
    );
    const passesQuery = query(
      collection(db, "matches"),
      where("userId", "==", user.uid),
      where("status", "==", "passed"),
    );
    const unsubMatches = onSnapshot(matchesQuery, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMatches(data);
    });
    const unsubLikes = onSnapshot(likesQuery, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setLiked(data);
    });
    const unsubPasses = onSnapshot(passesQuery, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPassed(data);
    });
    return () => {
      unsubMatches();
      unsubLikes();
      unsubPasses();
    };
  }, []);

  // Listen for changes in the profiles collection. Whenever a new profile is
  // added or an existing profile is updated, regenerate matches for the
  // current user so they can see new potential roommates automatically.
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const unsubProfiles = onSnapshot(collection(db, "profiles"), () => {
      generateMatchesForUser(user.uid).catch((err) => console.error(err));
    });
    return () => unsubProfiles();
  }, []);

  /**
   * Move a match to the passed list by updating its status in Firestore. The
   * match document is identified by its document ID. When the status changes
   * to "passed" the listeners above automatically move it into the passed
   * state via `setPassed`.
   */
  const handlePass = async (match: any) => {
    try {
      await updateMatchStatus(match.id, "passed");
    } catch (err) {
      console.error("Failed to pass profile:", err);
    }
  };

  /**
   * Move a match to the liked list by updating its status in Firestore.
   */
  const handleLike = async (match: any) => {
    try {
      await updateMatchStatus(match.id, "liked");
    } catch (err) {
      console.error("Failed to like profile:", err);
    }
  };

  /**
   * Helper to update a match document's status in Firestore. Uses the
   * authenticated user's UID for namespacing.
   */
  const updateMatchStatus = async (docId: string, status: string) => {
    const user = auth.currentUser;
    if (!user) return;
    const ref = doc(db, "matches", docId);
    await setDoc(ref, { status }, { merge: true });
  };

  /**
   * Create a conversation between the current user and the specified match if
   * one does not already exist. After ensuring a conversation exists, the
   * user is navigated to the chat page. Conversations store an array of
   * participant UIDs and optional metadata like names and compatibility.
   */
  const startChat = async (match: any) => {
    const user = auth.currentUser;
    if (!user || !match.otherUserId) {
      navigate("/signin");
      return;
    }
    try {
      // Query existing conversations for this user
      const convQuery = query(
        collection(db, "conversations"),
        where("participants", "array-contains", user.uid),
      );
      const convSnap = await getDocs(convQuery);
      // Check if a conversation already exists with the match
      let existingConv = null;
      convSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (Array.isArray(data.participants) && data.participants.includes(match.otherUserId)) {
          existingConv = docSnap;
        }
      });
      if (!existingConv) {
        // Create a new conversation
        await addDoc(collection(db, "conversations"), {
          participants: [user.uid, match.otherUserId],
          // Name can be the other user's name for the current user
          name: match.name ?? "", 
          // Additional metadata for preview
          compatibility: match.compatibility ?? null,
          lastMessage: "",
          updatedAt: serverTimestamp(),
        });
      }
      // Navigate to chat page
      navigate("/chat");
    } catch (err) {
      console.error("Failed to start chat:", err);
    }
  };

  const MatchCard = ({ match }: { match: any }) => (
    // Wrap card in a div instead of a Link. Clicking the card navigates to the profile.
    <div
      className="block cursor-pointer"
      onClick={() => {
        if (match.otherUserId) {
          navigate(`/profile/${match.otherUserId}`);
        }
      }}
    >
      <Card className="w-full max-w-md mx-auto overflow-hidden">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center space-x-2">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg bg-blue-100 text-blue-600">
              {match.avatar}
            </AvatarFallback>
          </Avatar>
          {match.verified && (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
        </div>
        <div>
          <CardTitle className="text-xl">{match.name}</CardTitle>
          <CardDescription>{match.year} • {match.program}</CardDescription>
        </div>
        
        <div className="flex items-center justify-center space-x-2 mt-2">
          <div className="flex items-center space-x-1">
            <Heart className="h-4 w-4 text-red-500" />
            <span className="font-semibold text-lg">{match.compatibility}%</span>
          </div>
          <span className="text-gray-500">Match</span>
        </div>
        
        <Progress value={match.compatibility} className="h-2 mt-2" />
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center space-x-1">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span>{match.location}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Home className="h-4 w-4 text-gray-500" />
            <span>{match.budget}</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-3">{match.bio}</p>
        
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Interests</h4>
            <div className="flex flex-wrap gap-1">
              {(match.interests ?? []).slice(0, 4).map((interest: string) => (
                <Badge key={interest} variant="secondary" className="text-xs">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            <div>
              <p className="text-gray-500">Study Time</p>
              <p className="font-medium">{match.studyTime}</p>
            </div>
            <div>
              <p className="text-gray-500">Cleanliness</p>
              <p className="font-medium">{match.cleanliness}/10</p>
            </div>
            <div>
              <p className="text-gray-500">Social Level</p>
              <p className="font-medium">{match.socialLevel}/10</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Deal Breakers</h4>
            <div className="flex flex-wrap gap-1">
              {(match.dealBreakers ?? []).slice(0, 2).map((dealBreaker: string) => (
                <Badge key={dealBreaker} variant="outline" className="text-xs">
                  {dealBreaker}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              handlePass(match);
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Pass
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={(e) => {
              e.stopPropagation();
              handleLike(match);
            }}
          >
            <Heart className="h-4 w-4 mr-1" />
            Like
          </Button>
          {/* Start a chat by creating the conversation first. We stop propagation so the outer Link doesn't trigger navigation. */}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              startChat(match);
            }}
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <Navigation currentPage="matches" />
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Matches</h1>
              <p className="text-gray-600 mt-1">Find your perfect roommate at AUN</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilter(!showFilter)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      {showFilter && (
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="bg-white border shadow rounded-lg p-4 max-w-md mx-auto">
            <h3 className="text-lg font-medium mb-3">Filter Matches</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Compatibility: {minCompatibility}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={minCompatibility}
                onChange={(e) => setMinCompatibility(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilter(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="matches" className="flex items-center space-x-2">
              <Star className="h-4 w-4" />
              <span>New Matches ({matches.length})</span>
            </TabsTrigger>
            <TabsTrigger value="liked" className="flex items-center space-x-2">
              <Heart className="h-4 w-4" />
              <span>Liked ({liked.length})</span>
            </TabsTrigger>
            <TabsTrigger value="passed" className="flex items-center space-x-2">
              <X className="h-4 w-4" />
              <span>Passed ({passed.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matches" className="space-y-6">
            {matches.filter((m) => m.compatibility >= minCompatibility).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches
                  .filter((m) => m.compatibility >= minCompatibility)
                  .map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No new matches</h3>
                <p className="text-gray-600">Check back later for new potential roommates!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="liked" className="space-y-6">
            {liked.filter((p) => p.compatibility >= minCompatibility).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liked
                  .filter((p) => p.compatibility >= minCompatibility)
                  .map((person) => (
                    <Card key={person.id}>
                      <CardHeader className="text-center">
                        <Avatar className="h-16 w-16 mx-auto">
                          <AvatarFallback className="text-lg bg-blue-100 text-blue-600">
                            {person.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <CardTitle>{person.name}</CardTitle>
                        <CardDescription>
                          {person.year} • {person.program}
                        </CardDescription>
                        {person.status === "mutual" && (
                          <Badge className="bg-green-100 text-green-700">
                            <Heart className="h-3 w-3 mr-1" />
                            Mutual Match!
                          </Badge>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-center space-x-1 mb-4">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span className="font-semibold">
                            {person.compatibility}% Match
                          </span>
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => startChat(person)}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Start Chat
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No liked profiles yet</h3>
                <p className="text-gray-600">Start swiping to find your perfect roommate!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="passed" className="space-y-6">
            {passed.length > 0 ? (
              <div className="space-y-4">
                {passed.map((person) => (
                  <Card key={person.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-gray-100 text-gray-600">
                            {person.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{person.name}</p>
                          <p className="text-sm text-gray-500">{person.reason}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Reconsider
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <X className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No passed profiles</h3>
                <p className="text-gray-600">Profiles you pass on will appear here.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/**
 * Regenerate matches for a user when the matches page is visited. This is
 * similar to the matching logic used during profile creation and editing. It
 * computes compatibility against all other profiles and writes match
 * documents into the `matches` collection.
 */
// local matching helpers removed; using shared helpers from @/lib/matching
