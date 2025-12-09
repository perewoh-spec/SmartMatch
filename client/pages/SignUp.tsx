import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { 
  Eye, 
  EyeOff, 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  GraduationCap,
  Calendar,
  Phone,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

// Firebase imports
import { auth, db } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formData, setFormData] = useState({
    // Single name field makes registration less intimidating. We'll split this
    // into first and last names on submit.
    name: "",
    email: "",
    phone: "",
    studentId: "",
    year: "",
    program: "",
    // Collect gender up front so the system knows each user's identity. This can
    // later be used for roommate preference matching.
    gender: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Router navigate helper for redirecting after successful sign‑up
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    // Require a name so we can address the user properly. We'll split this into
    // first and last name on submit.
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!formData.email.includes("@")) newErrors.email = "Please enter a valid email";
    if (!formData.studentId.trim()) newErrors.studentId = "Student ID is required";
    if (!formData.year) newErrors.year = "Academic year is required";
    if (!formData.program) newErrors.program = "Program is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    // Only require confirmPassword to match if the user has typed it. If left
    // blank, we treat it as optional. This makes registration less
    // intimidating while still preventing accidental typos.
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    if (!acceptedTerms) newErrors.terms = "You must accept the terms and conditions";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    // Destructure fields used for authentication and profile creation
    const { name, email, password, phone, studentId, year, program, gender } = formData;
    try {
      // Create a new user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Split the full name into first and last names for storage. If the user
      // enters only one word, it becomes the first name and last name is empty.
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts.shift() ?? "";
      const lastName = nameParts.join(" ");
      // Persist additional user details to Firestore under a `users` collection.
      await setDoc(doc(db, "users", user.uid), {
        firstName,
        lastName,
        name,
        email,
        phone,
        studentId,
        year,
        program,
        gender,
        createdAt: new Date().toISOString(),
      });
      // Also seed the user's profile with their name and gender. This allows the
      // profile wizard to pre-fill these fields for them. Use merge:true so
      // existing profile fields are not overwritten if they already exist.
      await setDoc(
        doc(db, "profiles", user.uid),
        {
          name,
          gender,
          year,
          program,
        },
        { merge: true },
      );
      console.log("Account created successfully for", user.uid);
      // Redirect the user to the profile page so they can complete their profile
      navigate("/profile");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error creating account:", err);
      // In production, surface this error to the user via a toast or alert component
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <Navigation currentPage="signup" />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200">
            American University of Nigeria
          </Badge>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Join Smart Match
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Create your account to start finding compatible roommates at AUN
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <UserPlus className="h-6 w-6 text-blue-600" />
              Create Account
            </CardTitle>
            <CardDescription>
              Answer a few quick questions—see matches immediately. You can finish the rest later.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Personal Information
                </h3>
                
                {/* Full Name */}
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {/* Inform users that they can change their name later. This
                      reassurance reduces friction during sign‑up. */}
                  <p className="text-xs text-gray-500 mt-1">
                    You can edit your name later in your profile.
                  </p>
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@student.aun.edu.ng"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+234 XXX XXX XXXX"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Gender Selection */}
                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select onValueChange={(value) => updateFormData("gender", value)}>
                    <SelectTrigger className={errors.gender ? "border-red-500" : "mt-1"}>
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-sm text-red-500 mt-1">{errors.gender}</p>
                  )}
                </div>
              </div>

              {/* Academic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  Academic Information
                </h3>
                
                <div>
                  <Label htmlFor="studentId">Student ID *</Label>
                  <Input
                    id="studentId"
                    type="text"
                    placeholder="e.g., AUN/XXX/XXX/XXXX"
                    value={formData.studentId}
                    onChange={(e) => updateFormData("studentId", e.target.value)}
                    className={errors.studentId ? "border-red-500" : ""}
                  />
                  {errors.studentId && (
                    <p className="text-sm text-red-500 mt-1">{errors.studentId}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Academic Year *</Label>
                    <Select onValueChange={(value) => updateFormData("year", value)}>
                      <SelectTrigger className={errors.year ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select your year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="freshman">Freshman (Year 1)</SelectItem>
                        <SelectItem value="sophomore">Sophomore (Year 2)</SelectItem>
                        <SelectItem value="junior">Junior (Year 3)</SelectItem>
                        <SelectItem value="senior">Senior (Year 4)</SelectItem>
                        <SelectItem value="graduate">Graduate Student</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.year && (
                      <p className="text-sm text-red-500 mt-1">{errors.year}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Program of Study *</Label>
                    <Select onValueChange={(value) => updateFormData("program", value)}>
                      <SelectTrigger className={errors.program ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select your program" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="computer-science">Computer Science</SelectItem>
                        <SelectItem value="business">Business Administration</SelectItem>
                        <SelectItem value="engineering">Engineering</SelectItem>
                        <SelectItem value="medicine">Medicine</SelectItem>
                        <SelectItem value="law">Law</SelectItem>
                        <SelectItem value="arts">Arts & Humanities</SelectItem>
                        <SelectItem value="social-sciences">Social Sciences</SelectItem>
                        <SelectItem value="natural-sciences">Natural Sciences</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.program && (
                      <p className="text-sm text-red-500 mt-1">{errors.program}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-600" />
                  Account Security
                </h3>
                
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => updateFormData("password", e.target.value)}
                      className={`pl-10 pr-10 ${errors.password ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Must be at least 8 characters with letters and numbers
                  </p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                      className={`pl-10 pr-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => {
                      setAcceptedTerms(checked as boolean);
                      if (errors.terms) {
                        setErrors(prev => ({ ...prev, terms: "" }));
                      }
                    }}
                    className={errors.terms ? "border-red-500" : ""}
                  />
                  <div className="text-sm">
                    <Label htmlFor="terms" className="text-gray-700 cursor-pointer">
                      I agree to the{" "}
                      <Link to="/terms" className="text-blue-600 hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                    {errors.terms && (
                      <p className="text-red-500 mt-1">{errors.terms}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                disabled={!acceptedTerms}
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Create Account
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link to="/signin" className="text-blue-600 hover:underline font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center p-4">
            <CardContent className="pt-4">
              <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Verified Students</h4>
              <p className="text-sm text-gray-600">
                Only verified AUN students can join our platform
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center p-4">
            <CardContent className="pt-4">
              <User className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Smart Matching</h4>
              <p className="text-sm text-gray-600">
                Find roommates based on lifestyle compatibility
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center p-4">
            <CardContent className="pt-4">
              <Lock className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Safe & Secure</h4>
              <p className="text-sm text-gray-600">
                Your privacy and data security are our priority
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
