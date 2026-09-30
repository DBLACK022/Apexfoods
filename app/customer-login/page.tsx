"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setMessage(error.message);
        return;
      }
      if (!data.user) {
        setMessage("Login did not return an authenticated user. Please try again.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        await supabase.auth.signOut();
        setMessage(`We could not verify your customer account: ${profileError.message}`);
        return;
      }
      if (profile?.role === "admin") {
        await supabase.auth.signOut();
        setMessage("This is an admin account. Please use Admin Login.");
        return;
      }
      if (!profile) {
        const { error: insertError } = await supabase.from("profiles").insert({
          id: data.user.id,
          email: data.user.email,
          role: "customer",
          full_name: data.user.user_metadata?.full_name || "",
          phone: data.user.user_metadata?.phone || "",
          profile_picture_url: null,
        });
        if (insertError) {
          console.error("Customer profile creation error:", insertError);
          setMessage(`Your account is signed in, but the profile record needs attention: ${insertError.message}`);
        }
      }
      router.replace("/profile");
      router.refresh();
    } catch (error) {
      console.error("Customer login failed:", error);
      setMessage("We could not reach the authentication service. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-md sm:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-green-700">APEX GREEN GLOBAL FOODS</h1>
          <p className="mt-2 text-gray-600">Customer Login</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="customer-email" className="mb-2 block font-medium">Email</label>
            <input id="customer-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600" />
          </div>
          <div>
            <label htmlFor="customer-password" className="mb-2 block font-medium">Password</label>
            <input id="customer-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600" />
          </div>
          {message && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-green-700 px-6 py-3 font-bold text-white transition hover:bg-green-800 disabled:bg-gray-400">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600">
          Don&apos;t have an account? <a href="/signup" className="font-bold text-green-700 hover:underline">Create Account</a>
        </p>
      </div>
    </main>
  );
}
