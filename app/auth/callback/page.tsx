"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Completing your sign-in...");

  useEffect(() => {
    let active = true;
    const finishAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const authError = params.get("error_description") || params.get("error") || hashParams.get("error_description") || hashParams.get("error");
      if (authError) {
        if (active) setMessage(`Email confirmation failed: ${authError}`);
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) {
        setMessage(`Could not complete sign-in: ${error.message}`);
      } else if (data.session) {
        const user = data.session.user;
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", user.id)
          .maybeSingle();
        if (profileError) {
          setMessage(`Your email is confirmed, but the customer profile could not be checked: ${profileError.message}`);
          return;
        }
        if (profile?.role === "admin") {
          setMessage("This is an administrator account. Use the separate Admin Login page.");
          return;
        }
        if (!profile) {
          const { error: insertError } = await supabase.from("profiles").insert({
            id: user.id,
            email: user.email,
            role: "customer",
            full_name: user.user_metadata?.full_name || "",
            phone: user.user_metadata?.phone || "",
            profile_picture_url: null,
          });
          if (insertError) {
            setMessage(`Your email is confirmed, but the customer profile could not be created: ${insertError.message}`);
            return;
          }
        }
        router.replace("/profile");
        router.refresh();
      } else {
        setMessage("No authenticated session was returned. If email confirmation is required, open the confirmation link again after setting the production Site URL and allowed redirect URL in Supabase.");
      }
    };

    void finishAuth();
    return () => { active = false; };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-center shadow-md sm:p-8">
        <h1 className="text-2xl font-extrabold text-green-700">APEX GREEN GLOBAL FOODS LIMITED</h1>
        <p role="status" className="mt-4 text-gray-700">{message}</p>
        {message.startsWith("Email confirmation failed:") || message.startsWith("Could not") || message.startsWith("No authenticated") ? (
          <a href="/customer-login" className="mt-6 inline-block font-bold text-green-700 hover:underline">Go to customer login</a>
        ) : null}
      </div>
    </main>
  );
}
