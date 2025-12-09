import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Home, 
  Clock, 
  Users, 
  Volume2, 
  Utensils,
  GraduationCap,
  MapPin,
  DollarSign,
  ArrowRight,
  ArrowLeft
} from "lucide-react";

// Firebase imports
import { auth, db } from "@/firebase";
import {
  setDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { generateMatchesForUser } from "@/lib/matching";

export default function Profile() {
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState({
    // Basic Info
    name: "",
    year: "",
    program: "",

    // Personal identity
    preferredGender: "",
    
    // Living Preferences  
    cleanliness: [7],
    noiseLevel: [4],
    // Importance weights for preferences (1 = low importance, 5 = high)
    cleanlinessWeight: [3],
    noiseLevelWeight: [3],
    guestPolicy: "",
    smokingPolicy: "",
    petPolicy: "",
    
    // Study Habits
    studyTime: "",
    quietHours: "",
    studyLocation: "",
    
    // Lifestyle
    sleepSchedule: "",
    exercise: "",
    cooking: "",
    socialLevel: [5],
    socialLevelWeight: [3],
    
    // Housing
    budget: [500],
    budgetWeight: [3],
    location: "",
    roomType: "",
    
    // Personal
    bio: "",
    dealBreakers: [],
    interests: []
  });

  // React Router navigate helper. We'll redirect returning users directly
  // to their dashboard view if a profile already exists.
  const navigate = useNavigate();

  // On mount, if the current user already has a profile, prefill the form
  // fields with their saved values. This allows users to edit their
  // preferences using the same onboarding wizard. We do not redirect
  // automatically so that users can intentionally revisit this page to
  // update their profile.
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "profiles", user.uid));
        if (snap.exists()) {
          const data: any = snap.data();
          // Convert numeric values into array form expected by the sliders
          setProfileData((prev) => ({
            ...prev,
            name: data.name ?? prev.name,
            year: data.year ?? prev.year,
            program: data.program ?? prev.program,
            cleanliness: [Number(data.cleanliness) || prev.cleanliness[0]],
            cleanlinessWeight: [Number(data.cleanlinessWeight) || prev.cleanlinessWeight[0]],
            noiseLevel: [Number(data.noiseLevel) || prev.noiseLevel[0]],
            noiseLevelWeight: [Number(data.noiseLevelWeight) || prev.noiseLevelWeight[0]],
            guestPolicy: data.guestPolicy ?? prev.guestPolicy,
            smokingPolicy: data.smokingPolicy ?? prev.smokingPolicy,
            petPolicy: data.petPolicy ?? prev.petPolicy,
            studyTime: data.studyTime ?? prev.studyTime,
            quietHours: data.quietHours ?? prev.quietHours,
            studyLocation: data.studyLocation ?? prev.studyLocation,
            sleepSchedule: data.sleepSchedule ?? prev.sleepSchedule,
            exercise: data.exercise ?? prev.exercise,
            cooking: data.cooking ?? prev.cooking,
            socialLevel: [Number(data.socialLevel) || prev.socialLevel[0]],
            socialLevelWeight: [Number(data.socialLevelWeight) || prev.socialLevelWeight[0]],
            budget: [Number(data.budget) || prev.budget[0]],
            budgetWeight: [Number(data.budgetWeight) || prev.budgetWeight[0]],
            location: data.location ?? prev.location,
            roomType: data.roomType ?? prev.roomType,
            bio: data.bio ?? prev.bio,
            interests: Array.isArray(data.interests) ? data.interests : prev.interests,
            dealBreakers: Array.isArray(data.dealBreakers) ? data.dealBreakers : prev.dealBreakers,
            preferredGender: data.preferredGender ?? prev.preferredGender,
          }));
        }
      } catch (err) {
        console.error("Failed to load existing profile:", err);
      }
    })();
  }, []);

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  /**
   * Persist the collected profile data to Firestore. The profile is saved in
   * a top‑level `profiles` collection keyed by the currently authenticated
   * user's UID. If no user is authenticated, the function does nothing.
   */
  const handleCompleteProfile = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.warn("Cannot save profile: no authenticated user");
      return;
    }
    try {
      await setDoc(
        doc(db, "profiles", user.uid),
        {
          ...profileData,
          // Flatten slider arrays into single numbers for storage
          cleanliness: profileData.cleanliness[0],
          cleanlinessWeight: profileData.cleanlinessWeight[0],
          noiseLevel: profileData.noiseLevel[0],
          noiseLevelWeight: profileData.noiseLevelWeight[0],
          socialLevel: profileData.socialLevel[0],
          socialLevelWeight: profileData.socialLevelWeight[0],
          budget: profileData.budget[0],
          budgetWeight: profileData.budgetWeight[0],
          completedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      console.log("Profile saved for", user.uid);
      // After successfully saving the profile, generate matches for this user
      await generateMatchesForUser(user.uid);
      console.log("Matches generated for", user.uid);
      // After generating matches, take the user to the matches page
      navigate("/matches");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error saving profile:", err);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Just the basics (1–2 mins)
              </CardTitle>
              <CardDescription>
                We’ll ask the rest later. You’ll still get instant matches.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="name">Name</Label>
                <input
                  id="name"
                  className="w-full p-2 border rounded-md mt-1"
                  placeholder="Enter your name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Academic Year</Label>
                  <Select onValueChange={(value) => setProfileData({ ...profileData, year: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freshman">Freshman</SelectItem>
                      <SelectItem value="sophomore">Sophomore</SelectItem>
                      <SelectItem value="junior">Junior</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="graduate">Graduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Program of Study</Label>
                  <Select onValueChange={(value) => setProfileData({ ...profileData, program: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="computer-science">Computer Science</SelectItem>
                      <SelectItem value="business">Business Administration</SelectItem>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="medicine">Medicine</SelectItem>
                      <SelectItem value="law">Law</SelectItem>
                      <SelectItem value="arts">Arts & Humanities</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Living Preferences & Policies
              </CardTitle>
              <CardDescription>
                Rate your cleanliness and noise tolerance, and set your guest, smoking and pet policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Cleanliness Level (1 = Very messy, 10 = Extremely tidy)</Label>
                <div className="mt-2">
                  <Slider
                    value={profileData.cleanliness}
                    onValueChange={(value) => setProfileData({...profileData, cleanliness: value})}
                    max={10}
                    min={1}
                    step={1}
                  />
                  <p className="text-sm text-gray-600 mt-1">Current: {profileData.cleanliness[0]}/10</p>
                </div>
                <div className="mt-2">
                  <Label>Importance of Cleanliness (1 = Low, 5 = High)</Label>
                  <Slider
                    value={profileData.cleanlinessWeight}
                    onValueChange={(value) => setProfileData({...profileData, cleanlinessWeight: value})}
                    max={5}
                    min={1}
                    step={1}
                  />
                  <p className="text-xs text-gray-600 mt-1">Importance: {profileData.cleanlinessWeight[0]}/5</p>
                </div>
              </div>

              <div>
                <Label>Comfortable Noise Level (1 = Very quiet, 10 = Very loud)</Label>
                <div className="mt-2">
                  <Slider
                    value={profileData.noiseLevel}
                    onValueChange={(value) => setProfileData({...profileData, noiseLevel: value})}
                    max={10}
                    min={1}
                    step={1}
                  />
                  <p className="text-sm text-gray-600 mt-1">Current: {profileData.noiseLevel[0]}/10</p>
                </div>
                <div className="mt-2">
                  <Label>Importance of Noise Level (1 = Low, 5 = High)</Label>
                  <Slider
                    value={profileData.noiseLevelWeight}
                    onValueChange={(value) => setProfileData({...profileData, noiseLevelWeight: value})}
                    max={5}
                    min={1}
                    step={1}
                  />
                  <p className="text-xs text-gray-600 mt-1">Importance: {profileData.noiseLevelWeight[0]}/5</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Guest Policy</Label>
                  <Select onValueChange={(value) => setProfileData({...profileData, guestPolicy: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select policy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-guests">No overnight guests</SelectItem>
                      <SelectItem value="occasional">Occasional guests OK</SelectItem>
                      <SelectItem value="frequent">Frequent guests welcome</SelectItem>
                      <SelectItem value="discuss">Discuss case by case</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Smoking Policy</Label>
                  <Select onValueChange={(value) => setProfileData({...profileData, smokingPolicy: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select policy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-smoking">No smoking</SelectItem>
                      <SelectItem value="outside-only">Outside only</SelectItem>
                      <SelectItem value="smoking-ok">Smoking OK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Pet Policy</Label>
                  <Select onValueChange={(value) => setProfileData({...profileData, petPolicy: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select policy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-pets">No pets</SelectItem>
                      <SelectItem value="small-pets">Small pets OK</SelectItem>
                      <SelectItem value="all-pets">All pets welcome</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Study Habits
              </CardTitle>
              <CardDescription>
                Your study preferences help us match you with someone compatible
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Preferred Study Time</Label>
                  <Select onValueChange={(value) => setProfileData({...profileData, studyTime: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="When do you study?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="early-morning">Early morning (5-8 AM)</SelectItem>
                      <SelectItem value="morning">Morning (8-12 PM)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (12-5 PM)</SelectItem>
                      <SelectItem value="evening">Evening (5-9 PM)</SelectItem>
                      <SelectItem value="late-night">Late night (9 PM-1 AM)</SelectItem>
                      <SelectItem value="very-late">Very late (1-5 AM)</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Quiet Hours Needed</Label>
                  <Select onValueChange={(value) => setProfileData({...profileData, quietHours: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="When do you need quiet?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-quiet">No specific quiet time</SelectItem>
                      <SelectItem value="night-only">Night time only</SelectItem>
                      <SelectItem value="study-times">During study sessions</SelectItem>
                      <SelectItem value="strict-schedule">Strict quiet schedule</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Preferred Study Location</Label>
                <Select onValueChange={(value) => setProfileData({...profileData, studyLocation: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Where do you like to study?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bedroom">In my bedroom</SelectItem>
                    <SelectItem value="common-areas">Common areas at home</SelectItem>
                    <SelectItem value="library">Library/campus</SelectItem>
                    <SelectItem value="quiet-spaces">Dedicated quiet spaces</SelectItem>
                    <SelectItem value="anywhere">Anywhere is fine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Lifestyle & Social Preferences
              </CardTitle>
              <CardDescription>
                Understanding your lifestyle helps create better living situations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Social Level (1 = Very introverted, 10 = Very extroverted)</Label>
                <div className="mt-2">
                  <Slider
                    value={profileData.socialLevel}
                    onValueChange={(value) => setProfileData({ ...profileData, socialLevel: value })}
                    max={10}
                    min={1}
                    step={1}
                  />
                  <p className="text-sm text-gray-600 mt-1">Current: {profileData.socialLevel[0]}/10</p>
                </div>
                <div className="mt-2">
                  <Label>Importance of Social Level (1 = Low, 5 = High)</Label>
                  <Slider
                    value={profileData.socialLevelWeight}
                    onValueChange={(value) => setProfileData({ ...profileData, socialLevelWeight: value })}
                    max={5}
                    min={1}
                    step={1}
                  />
                  <p className="text-xs text-gray-600 mt-1">Importance: {profileData.socialLevelWeight[0]}/5</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Sleep Schedule</Label>
                  <Select onValueChange={(value) => setProfileData({...profileData, sleepSchedule: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="When do you sleep?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="early-bird">Early bird (sleep by 10 PM)</SelectItem>
                      <SelectItem value="normal">Normal (sleep by 12 AM)</SelectItem>
                      <SelectItem value="night-owl">Night owl (sleep after 1 AM)</SelectItem>
                      <SelectItem value="irregular">Irregular schedule</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Exercise Habits</Label>
                  <Select onValueChange={(value) => setProfileData({...profileData, exercise: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="How often do you exercise?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily exerciser</SelectItem>
                      <SelectItem value="regular">Regular (3-4x/week)</SelectItem>
                      <SelectItem value="occasional">Occasional (1-2x/week)</SelectItem>
                      <SelectItem value="rarely">Rarely exercise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Cooking Habits</Label>
                  <Select onValueChange={(value) => setProfileData({...profileData, cooking: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="How often do you cook?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Cook daily</SelectItem>
                      <SelectItem value="regular">Cook regularly</SelectItem>
                      <SelectItem value="occasional">Occasional cooking</SelectItem>
                      <SelectItem value="rarely">Rarely cook</SelectItem>
                      <SelectItem value="takeout">Mostly takeout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Housing Preferences
              </CardTitle>
              <CardDescription>
                Let us know your housing requirements and budget
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Monthly Budget (₦)</Label>
                <div className="mt-2">
                  <Slider
                    value={profileData.budget}
                    onValueChange={(value) => setProfileData({ ...profileData, budget: value })}
                    max={200000}
                    min={50000}
                    step={10000}
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    ₦{profileData.budget[0].toLocaleString()}/month
                  </p>
                </div>
                <div className="mt-2">
                  <Label>Importance of Budget (1 = Low, 5 = High)</Label>
                  <Slider
                    value={profileData.budgetWeight}
                    onValueChange={(value) => setProfileData({ ...profileData, budgetWeight: value })}
                    max={5}
                    min={1}
                    step={1}
                  />
                  <p className="text-xs text-gray-600 mt-1">Importance: {profileData.budgetWeight[0]}/5</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Preferred Location</Label>
                  <Select onValueChange={(value) => setProfileData({...profileData, location: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Where would you like to live?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="near-campus">Near campus (walking distance)</SelectItem>
                      <SelectItem value="yola-central">Yola Central</SelectItem>
                      <SelectItem value="jimeta">Jimeta</SelectItem>
                      <SelectItem value="karewa">Karewa</SelectItem>
                      <SelectItem value="other-yola">Other areas in Yola</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Room Type</Label>
                  <Select onValueChange={(value) => setProfileData({...profileData, roomType: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="What type of room?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shared-room">Shared room</SelectItem>
                      <SelectItem value="own-room">Own room, shared apartment</SelectItem>
                      <SelectItem value="studio">Studio apartment</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                About You
              </CardTitle>
              <CardDescription>
                Tell potential roommates about yourself and what you're looking for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="bio">Bio / About Yourself</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself, your interests, and what kind of living situation you're looking for..."
                  className="mt-1 min-h-[120px]"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                />
              </div>

              {/* Preferred roommate gender selection */}
              <div>
                <Label>Preferred Roommate Gender</Label>
                <Select
                  onValueChange={(value) => setProfileData({ ...profileData, preferredGender: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select preferred gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-preference">No preference</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Interests & Hobbies</Label>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    "Sports", "Reading", "Music", "Gaming", "Cooking", "Travel", 
                    "Movies", "Art", "Technology", "Photography", "Fitness", "Dancing"
                  ].map((interest) => (
                    <Badge
                      key={interest}
                      variant={profileData.interests.includes(interest) ? "default" : "outline"}
                      className="cursor-pointer justify-center py-2"
                      onClick={() => {
                        const interests = profileData.interests.includes(interest)
                          ? profileData.interests.filter(i => i !== interest)
                          : [...profileData.interests, interest];
                        setProfileData({...profileData, interests});
                      }}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Deal Breakers</Label>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    "Smoking indoors", "Loud music", "Excessive messiness", "No overnight guests",
                    "Pets", "Late night noise", "Poor communication", "Disrespect for boundaries"
                  ].map((dealBreaker) => (
                    <Badge
                      key={dealBreaker}
                      variant={profileData.dealBreakers.includes(dealBreaker) ? "destructive" : "outline"}
                      className="cursor-pointer justify-center py-2"
                      onClick={() => {
                        const dealBreakers = profileData.dealBreakers.includes(dealBreaker)
                          ? profileData.dealBreakers.filter(d => d !== dealBreaker)
                          : [...profileData.dealBreakers, dealBreaker];
                        setProfileData({...profileData, dealBreakers});
                      }}
                    >
                      {dealBreaker}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <Navigation currentPage="profile" />
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Your Profile</h1>
          <p className="text-gray-600 mt-1">Help us find your perfect roommate match</p>
          
          {/* Progress */}
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-500 mt-2">Step {currentStep} of {totalSteps}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {renderStep()}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep === totalSteps ? (
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleCompleteProfile}
            >
              Complete Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={nextStep}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              {/* Allow skipping all steps after the first but before the final step. This lets users opt out at any point once they've provided the basics. */}
              {currentStep > 1 && currentStep < totalSteps && (
                <Button
                  variant="ghost"
                  type="button"
                  onClick={handleCompleteProfile}
                >
                  Skip for now (I’ll finish later)
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Generate roommate matches for a given user. This helper queries all
 * profiles in the `profiles` collection, computes a compatibility score
 * against the current user's profile, and writes match documents into
 * the `matches` collection. The match document ID combines the user
 * and other user's IDs to ensure uniqueness. A snapshot of the other
 * user's profile fields is stored so that the matches page can render
 * quickly without joining across collections.
 *
 * NOTE: For large datasets this algorithm would be more efficient on
 * the server (e.g. a Cloud Function). Here we implement it on the
 * client for demonstration purposes. Security rules should ensure
 * users can only write their own matches.
 */
// Removed duplicate matching helpers. See client/lib/matching.ts for the
// implementation of generateMatchesForUser() and computeCompatibility().
