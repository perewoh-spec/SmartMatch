import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Navigation from "@/components/Navigation";
import { auth } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

/**
 * A simple sign‑in page that allows users to authenticate with their email
 * address and password. On successful sign‑in the user is redirected to
 * the matches page. Errors are surfaced as simple messages for now but
 * could be improved with a toast or alert component.
 */
export default function SignIn() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { email, password } = formData;
    if (!email.trim() || !password) {
      setError("Please enter both email and password");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // On success redirect to matches
      navigate("/matches");
    } catch (err: any) {
      // Basic error handling. In production map Firebase errors to user friendly
      // messages or use a toast component
      setError(err.message ?? "Failed to sign in");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <Navigation currentPage="signin" />
      <div className="max-w-md mx-auto px-4 py-12">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your Smart Match account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@student.aun.edu.ng"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => updateFormData("password", e.target.value)}
                />
              </div>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Sign In
              </Button>
            </form>
            <p className="text-sm text-gray-600 mt-4 text-center">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-600 hover:underline">
                Sign Up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}