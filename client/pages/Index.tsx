import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Users, 
  Heart, 
  Shield, 
  MessageCircle, 
  Star,
  CheckCircle2,
  UserPlus,
  Search,
  Filter,
  Zap
} from "lucide-react";

// Import Firebase authentication helpers. Using static imports instead of
// require ensures the modules are properly bundled by Vite.
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Subscribe to auth state. This ensures the landing page reflects whether
  // the user is logged in. When authenticated we show quick links to
  // Matches and Profile instead of sign‑in/up actions.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Smart Match</h1>
                <p className="text-xs text-blue-600">AUN Housing</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {!isAuthenticated ? (
                <>
                  <Link to="/signin">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm">Get Started</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/matches">
                    <Button variant="ghost" size="sm">Matches</Button>
                  </Link>
                <Link to="/profile/me">
                    <Button variant="ghost" size="sm">Profile</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-8 bg-blue-100 text-blue-700 hover:bg-blue-200">
              American University of Nigeria
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Find Your Perfect
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500">
                Roommate Match
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
              Smart Match connects AUN students with compatible roommates for off-campus housing. 
              Using lifestyle preferences and compatibility factors, we help reduce conflicts and 
              create harmonious living arrangements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* If not signed in, lead to sign‑up; otherwise go to matches */}
              <Link to={isAuthenticated ? "/matches" : "/signup"}>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="h-5 w-5 mr-2" />
                  Start Matching
                </Button>
              </Link>
              {/* Browse profiles takes authenticated users to matches; unauthenticated users to sign‑in */}
              <Link to={isAuthenticated ? "/matches" : "/signin"}>
                <Button size="lg" variant="outline">
                  <Search className="h-5 w-5 mr-2" />
                  Browse Profiles
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-orange-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How Smart Match Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our intelligent matching system considers multiple factors to find you the most compatible roommate
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserPlus className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Create Profile</h3>
              <p className="text-gray-600">
                Tell us about your lifestyle, preferences, study habits, and what you're looking for in a roommate
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Smart Matching</h3>
              <p className="text-gray-600">
                Our algorithm analyzes compatibility across lifestyle, cleanliness, social preferences, and more
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Connect & Chat</h3>
              <p className="text-gray-600">
                Review matches, chat with potential roommates, and find the perfect living arrangement
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Matching Categories */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              What We Match On
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our comprehensive matching considers all aspects of student life
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Home, label: "Living Habits", desc: "Cleanliness, organization, noise levels" },
              { icon: Users, label: "Social Style", desc: "Introvert/extrovert, guest policies" },
              { icon: Star, label: "Study Patterns", desc: "Late night studying, quiet hours" },
              { icon: Heart, label: "Lifestyle", desc: "Exercise, cooking, sleep schedule" },
              { icon: Shield, label: "Values", desc: "Respect, communication, boundaries" },
              { icon: Filter, label: "Preferences", desc: "Budget, location, room setup" },
              { icon: CheckCircle2, label: "Compatibility", desc: "Conflict resolution, compromise" },
              { icon: MessageCircle, label: "Communication", desc: "How you prefer to interact" }
            ].map((item, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className={`font-semibold text-gray-900 mb-2 ${item.label === "Communication" ? "ml-[-3px]" : ""}`}>{item.label}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              AUN Student Success Stories
            </h2>
            <p className="text-lg text-gray-600">
              Real experiences from students who found their perfect roommate match
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Amina & Sarah",
                program: "Computer Science & Business",
                quote: "Smart Match helped us find each other based on our study habits and cleanliness preferences. Best roommate experience ever!",
                match: "95% compatibility"
              },
              {
                name: "David & Michael",
                program: "Engineering & Architecture", 
                quote: "We both love late-night study sessions and early morning workouts. Perfect match for our final year!",
                match: "92% compatibility"
              },
              {
                name: "Fatima & Grace",
                program: "Medicine & Pharmacy",
                quote: "The lifestyle matching was spot-on. We share the same values about quiet study time and healthy living.",
                match: "97% compatibility"
              }
            ].map((story, index) => (
              <Card key={index} className="p-6">
                <CardHeader>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white"></div>
                      <div className="w-8 h-8 bg-orange-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{story.name}</CardTitle>
                      <CardDescription>{story.program}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="w-fit">{story.match}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 italic">"{story.quote}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-orange-500">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Find Your Perfect Roommate?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of AUN students who've found their ideal living situation through Smart Match
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/profile">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <UserPlus className="h-5 w-5 mr-2" />
                Create Your Profile
              </Button>
            </Link>
            <Link to="/matches">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Browse Matches
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold">Smart Match</h3>
                  <p className="text-xs text-gray-400">AUN Housing</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Connecting AUN students with compatible roommates for better off-campus living.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/how-it-works" className="hover:text-white">How It Works</Link></li>
                <li><Link to="/safety" className="hover:text-white">Safety & Privacy</Link></li>
                <li><Link to="/success-stories" className="hover:text-white">Success Stories</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link to="/guidelines" className="hover:text-white">Community Guidelines</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link to="/aun-policies" className="hover:text-white">AUN Guidelines</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 Smart Match. Built for American University of Nigeria students.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
