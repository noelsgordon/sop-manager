import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setIsSignup(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = isSignup
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.error("❌ Auth error:", error);
        setMessage(error.message || "Authentication failed.");
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user?.id) {
        console.warn("⚠️ No user ID yet — waiting on email confirmation.");
        setShowConfirmationModal(true);
        return;
      }

      if (isSignup) {
        const profilePayload = {
          user_id: user.id,
          display_name: fullName || "",
          email: user.email,
          is_superadmin: false,
        };
        await supabase.from("user_profiles").insert(profilePayload);
        setShowConfirmationModal(true);
        return;
      }

      onLogin();
    } catch (err) {
      console.error("❌ Unexpected error:", err);
      setMessage(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-4 text-center">
          {isSignup ? "Sign Up" : "Login"}
        </h2>

        <input
          className="border w-full p-2 mb-2 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          disabled={loading}
        />
        <input
          className="border w-full p-2 mb-2 rounded"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          disabled={loading}
        />

        {isSignup && (
          <input
            className="border w-full p-2 mb-2 rounded"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            type="text"
            disabled={loading}
          />
        )}

        <Button type="submit" className="w-full flex items-center justify-center" disabled={loading}>
          {loading ? <><Loader2 className="animate-spin mr-2" size={16} />Please wait...</> : isSignup ? "Create Account" : "Login"}
        </Button>

        {message && <p className="text-red-500 text-sm mt-2">{message}</p>}

        <p className="mt-4 text-center text-sm text-gray-600">
          {isSignup ? (
            <>Already have an account? <button type="button" onClick={() => setIsSignup(false)} className="text-blue-600 underline">Log in</button></>
          ) : (
            <>Don’t have an account? <button type="button" onClick={() => setIsSignup(true)} className="text-blue-600 underline">Sign up</button></>
          )}
        </p>
      </form>

      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-3">Check Your Email</h2>
            <p className="text-sm text-gray-700 mb-4">
              Your account has been created. Please confirm your email address before logging in.
            </p>
            <Button className="w-full" onClick={() => { setShowConfirmationModal(false); resetForm(); }}>
              Back to Login
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
