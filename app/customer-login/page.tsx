"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function CustomerLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Customer login error:", error);
      alert(error.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      alert("Login failed. Please try again.");
      setLoading(false);
      return;
    }

    const userId = data.user.id;

    // Check the user's profile.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Profile check error:", profileError);
    }

    // If this is an admin account, don't allow it through
    // the customer login.
    if (profile?.role === "admin") {
      await supabase.auth.signOut();
      alert("Please use the Admin Login page.");
      setLoading(false);
      return;
    }

    // If the customer profile does not exist yet,
    // create it from the information saved during signup.
    const pendingProfile = localStorage.getItem(
      "apex-pending-profile"
    );

    if (!profile && pendingProfile) {
      const savedProfile = JSON.parse(pendingProfile);

      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email: savedProfile.email,
          role: "customer",
          full_name: savedProfile.fullName,
          phone: savedProfile.phone,
          profile_picture_url: null,
        });

      if (insertError) {
        console.error("Profile creation error:", insertError);
        alert(
          "You logged in, but your customer profile could not be created."
        );
        setLoading(false);
        return;
      }

      localStorage.removeItem("apex-pending-profile");
    }

    alert("Login successful!");

    router.push("/");

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-green-700">
            Apex Foods
          </h1>

          <p className="mt-2 text-gray-600">
            Customer Login
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">

          <div>
            <label className="mb-2 block font-medium">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-green-700 px-6 py-3 font-bold text-white transition hover:bg-green-800 disabled:bg-gray-400"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <p className="mt-6 text-center text-gray-600">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="font-bold text-green-700 hover:underline"
          >
            Create Account
          </button>
        </p>

      </div>
    </main>
  );
}