import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { Mail, Lock, Building2, MapPin, Clock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";

const LoginSignup = () => {
  const { signup, login } = useAuth();
  const navigate = useNavigate();

  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fields only for admins
  const [cafeteriaName, setCafeteriaName] = useState("");
  const [location, setLocation] = useState("");
  const [openingHours, setOpeningHours] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        // ✅ Sign up new user
        const userCredential = await signup(email, password, role);
        const user = userCredential.user;

        // ✅ Store user data
        await setDoc(doc(db, "users", user.uid), {
          email,
          role,
        });

        // ✅ If role = admin, create a cafeteria automatically
        if (role === "admin") {
          // Generate a unique cafeteriaId
          const cafeteriaId = `cafeteria-${Date.now()}`;

          await setDoc(doc(db, "cafeterias", cafeteriaId), {
            name: cafeteriaName || "Unnamed Cafeteria",
            location: location || "Not specified",
            openingHours: openingHours || "Not specified",
            cafeteriaId,
            adminEmail: email,
          });

          console.log("✅ Cafeteria created with ID:", cafeteriaId);
          navigate("/admin-dashboard");
        } else {
          navigate("/user-dashboard");
        }

        alert("Account created successfully!");
      } else {
        // ✅ Log in existing user
        const userCredential = await login(email, password);
        const user = userCredential.user;

        // ✅ Fetch role from Firestore
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData.role === "admin") navigate("/admin-dashboard");
          else navigate("/user-dashboard");
        } else {
          console.warn("No user role found, redirecting to user dashboard.");
          navigate("/user-dashboard");
        }
      }
    } catch (err) {
      console.error("Signup/Login error:", err);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden backdrop-blur-sm border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10">
            <h1 className="text-4xl font-bold text-white mb-2">
              {isSignup ? "Get Started" : "Welcome Back"}
            </h1>
            <p className="text-blue-100 text-sm">
              {isSignup ? "Create your account to manage cafeteria services" : "Sign in to your account"}
            </p>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-gray-900 placeholder-gray-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-gray-900"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Role */}
              {isSignup && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Account Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {["user", "admin"].map((r) => (
                      <label
                        key={r}
                        className={`relative flex items-center cursor-pointer p-3 border rounded-lg transition ${
                          role === r
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={r}
                          checked={role === r}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-4 h-4 accent-blue-600"
                          disabled={loading}
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700 capitalize">{r}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin fields */}
              {isSignup && role === "admin" && (
                <div className="pt-4 border-t border-gray-200 space-y-5">
                  <p className="text-xs text-gray-600 font-medium">Cafeteria Information</p>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Cafeteria Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-gray-900 placeholder-gray-400"
                        value={cafeteriaName}
                        onChange={(e) => setCafeteriaName(e.target.value)}
                        placeholder="e.g. Main Cafeteria"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-gray-900 placeholder-gray-400"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Block A, Floor 2"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Operating Hours</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-gray-900 placeholder-gray-400"
                        value={openingHours}
                        onChange={(e) => setOpeningHours(e.target.value)}
                        placeholder="e.g. 9:00 AM - 6:00 PM"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    {isSignup ? "Create Account" : "Sign In"}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Toggle auth mode */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-600 text-sm">
                {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  onClick={() => setIsSignup(!isSignup)}
                  disabled={loading}
                  className="font-semibold text-blue-600 hover:text-blue-700 transition disabled:opacity-50"
                >
                  {isSignup ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-gray-500 text-xs mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default LoginSignup;