import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

// Import Firebase auth and listen to authentication state. This allows the
// navigation to reflect whether the user is signed in or not. Without this
// hook the nav always assumes the user is logged out.
import { auth, db } from "@/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";

interface NavigationProps {
  currentPage?: string;
}

export default function Navigation({ currentPage }: NavigationProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Subscribe to auth state changes. When the user logs in or out the
  // `isAuthenticated` state is updated accordingly.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setIsAuthenticated(!!user);
      if (user) {
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          setIsAdmin(snap.exists() && snap.data().role === "admin");
        } catch (err) {
          console.error("Failed to load user role:", err);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to sign out:", err);
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-orange-500 rounded-lg flex items-center justify-center">
              <Home className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Smart Match</h1>
              <p className="text-xs text-blue-600">AUN Housing</p>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                {/* When logged out, provide links to sign‑in and sign‑up */}
                <Link to="/signin">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            ) : (
              <>
                {/* When logged in, show navigation to core app pages */}
                <Link to="/matches">
                  <Button
                    variant={currentPage === "matches" ? "default" : "ghost"}
                    size="sm"
                  >
                    Matches
                  </Button>
                </Link>
                <Link to="/chat">
                  <Button
                    variant={currentPage === "chat" ? "default" : "ghost"}
                    size="sm"
                  >
                    Messages
                  </Button>
                </Link>
                <Link to="/profile/me">
                  <Button
                    variant={currentPage === "profile" ? "default" : "ghost"}
                    size="sm"
                  >
                    Profile
                  </Button>
                </Link>
            {isAdmin && (
              <Link to="/admin">
                <Button
                  variant={currentPage === "admin" ? "default" : "ghost"}
                  size="sm"
                >
                  Admin
                </Button>
              </Link>
            )}
                {/* Provide a simple sign‑out button */}
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
