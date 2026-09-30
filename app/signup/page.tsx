"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [picture, setPicture] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function choosePicture(file?: File) {
    setMessage("");
    if (!file) {
      setPicture(null);
      setPreview("");
      return;
    }
    if (!IMAGE_TYPES[file.type]) {
      setMessage("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setMessage("The profile picture must be 5 MB or smaller.");
      return;
    }
    setPicture(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    if (!fullName.trim() || !phone.trim() || !email.trim() || !password) {
      setMessage("Please complete your name, phone, email, and password.");
      return;
    }
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim(), phone: phone.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }
      if (!data.user) {
        setMessage("Supabase did not return a user account. Please try again.");
        return;
      }
      if (data.user.identities?.length === 0) {
        setMessage("An account with this email address already exists. Sign in instead or use a different email address.");
        return;
      }
      if (!data.session) {
        setMessage("Your account was created, but Supabase did not sign you in. Email confirmation is still required. In Supabase, turn off Confirm email under Authentication → Providers → Email, then try again or confirm the email to continue.");
        return;
      }

      let profilePictureUrl: string | null = null;
      let pictureWarning = "";
      if (picture) {
        const path = `${data.user.id}.${IMAGE_TYPES[picture.type]}`;
        const { error: uploadError } = await supabase.storage
          .from("customer-profiles")
          .upload(path, picture, { contentType: picture.type, cacheControl: "3600", upsert: true });
        if (uploadError) {
          console.error("Signup profile picture upload error:", uploadError);
          pictureWarning = " Your account was created, but the picture could not be uploaded. You can try again from your profile.";
        } else {
          profilePictureUrl = supabase.storage.from("customer-profiles").getPublicUrl(path).data.publicUrl;
          const { error: metadataError } = await supabase.auth.updateUser({
            data: { profile_picture_url: profilePictureUrl },
          });
          if (metadataError) console.error("Signup picture metadata update error:", metadataError);
        }
      }

      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: data.user.email,
        role: "customer",
        full_name: fullName.trim(),
        phone: phone.trim(),
        profile_picture_url: profilePictureUrl,
      });
      if (profileError) {
        console.error("Signup profile creation error:", profileError);
        const setupMessage = `Your account is signed in, but its customer profile could not be saved: ${profileError.message}. Check the profiles table permissions in Supabase.${pictureWarning}`;
        setMessage(setupMessage);
        window.alert(setupMessage);
      } else if (pictureWarning) {
        setMessage(pictureWarning.trim());
        window.alert(pictureWarning.trim());
      }

      router.replace("/profile");
      router.refresh();
    } catch (error) {
      console.error("Signup failed:", error);
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
          <p className="mt-2 text-gray-600">Create your customer account</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label htmlFor="full-name" className="mb-2 block font-medium">Full Name</label>
            <input id="full-name" type="text" autoComplete="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600" />
          </div>
          <div>
            <label htmlFor="phone" className="mb-2 block font-medium">Phone Number</label>
            <input id="phone" type="tel" autoComplete="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter your phone number" className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600" />
          </div>
          <div>
            <label htmlFor="email" className="mb-2 block font-medium">Email Address</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600" />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block font-medium">Password</label>
            <input id="password" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600" />
          </div>
          <div>
            <label htmlFor="profile-picture" className="mb-2 block font-medium">Profile Picture <span className="font-normal text-gray-500">(optional, JPG/PNG/WebP up to 5 MB)</span></label>
            <input id="profile-picture" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => choosePicture(e.target.files?.[0])} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm" />
            {preview && <img src={preview} alt="Profile picture preview" className="mt-3 h-20 w-20 rounded-full border-2 border-green-100 object-cover" />}
          </div>

          {message && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-green-700 px-6 py-3 font-bold text-white transition hover:bg-green-800 disabled:bg-gray-400">
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Already have an account? <a href="/customer-login" className="font-bold text-green-700 hover:underline">Login</a>
        </p>
      </div>
    </main>
  );
}
