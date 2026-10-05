"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export default function ProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [profileExists, setProfileExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!active) return;
      if (authError || !user) {
        setLoading(false);
        router.replace("/customer-login");
        return;
      }

      setUserId(user.id);
      setEmail(user.email || "");
      setFullName(user.user_metadata?.full_name || "");
      setPhone(user.user_metadata?.phone || "");
      setProfilePictureUrl(user.user_metadata?.profile_picture_url || "");

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, full_name, phone, profile_picture_url")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      if (error) {
        console.error("Profile loading error:", error);
        setMessage(`We could not load the saved profile details: ${error.message}`);
      } else if (profile) {
        if (profile.role === "admin") {
          router.replace("/admin");
          return;
        }
        setProfileExists(true);
        setFullName(profile.full_name || user.user_metadata?.full_name || "");
        setPhone(profile.phone || user.user_metadata?.phone || "");
        setProfilePictureUrl(profile.profile_picture_url || user.user_metadata?.profile_picture_url || "");
      } else {
        setMessage("Your account is signed in, but its profile record is missing. Save your details to create it if your Supabase profile policy allows it.");
      }
      setLoading(false);
    }
    void loadProfile();
    return () => { active = false; };
  }, [router]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId || !fullName.trim() || !phone.trim()) {
      setMessage("Enter your full name and phone number.");
      return;
    }
    setSaving(true);
    setMessage("");
    const values = {
      full_name: fullName.trim(),
      phone: phone.trim(),
      profile_picture_url: profilePictureUrl || null,
    };
    const result = profileExists
      ? await supabase.from("profiles").update(values).eq("id", userId)
      : await supabase.from("profiles").insert({
          id: userId,
          email,
          role: "customer",
          ...values,
        });
    const { error } = result;
    if (error) {
      setMessage(`Could not save your profile: ${error.message}`);
      setSaving(false);
      return;
    }
    const { error: metadataError } = await supabase.auth.updateUser({
      data: { full_name: values.full_name, phone: values.phone },
    });
    if (metadataError) console.error("Profile auth metadata update error:", metadataError);
    setProfileExists(true);
    setMessage("Your profile details have been saved.");
    setSaving(false);
  }

  async function handleProfilePictureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userId) return;
    setMessage("");
    if (!IMAGE_TYPES[file.type]) {
      setMessage("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setMessage("The profile picture must be 5 MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      if (!profileExists) {
        const { error: createError } = await supabase.from("profiles").insert({
          id: userId,
          email,
          role: "customer",
          full_name: fullName.trim(),
          phone: phone.trim(),
          profile_picture_url: null,
        });
        if (createError) {
          setMessage(`Your profile record must be saved before a picture can be attached: ${createError.message}`);
          return;
        }
        setProfileExists(true);
      }
      const path = `${userId}.${IMAGE_TYPES[file.type]}`;
      const { error: uploadError } = await supabase.storage
        .from("customer-profiles")
        .upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: true });
      if (uploadError) {
        console.error("Profile picture upload error:", uploadError);
        setMessage(`Could not upload your picture: ${uploadError.message}. Check the customer-profiles bucket and its authenticated upload policy.`);
        return;
      }

      const imageUrl = supabase.storage.from("customer-profiles").getPublicUrl(path).data.publicUrl;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_picture_url: imageUrl })
        .eq("id", userId);
      if (updateError) {
        setMessage(`The image uploaded, but your profile could not be updated: ${updateError.message}`);
        return;
      }
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { profile_picture_url: imageUrl },
      });
      if (metadataError) console.error("Profile picture metadata update error:", metadataError);
      setProfilePictureUrl(imageUrl);
      setMessage("Profile picture updated.");
    } catch (error) {
      console.error("Profile picture upload failed:", error);
      setMessage("We could not reach image storage. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setMessage(`Could not sign out: ${error.message}`);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-gray-50"><p className="text-gray-500">Loading your account...</p></main>;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl bg-white p-5 shadow-md sm:p-8">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-extrabold text-green-700 sm:text-3xl">My Account</h1>
              <p className="mt-1 text-gray-600">Manage your APEX GREEN GLOBAL FOODS LIMITED account</p>
            </div>
            <Link href="/" className="min-h-11 rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50">Back to Shop</Link>
          </div>

          <div className="mb-8 flex flex-col items-center">
            {profilePictureUrl ? (
              <img src={profilePictureUrl} alt={`${fullName || "Your"} profile`} className="h-32 w-32 rounded-full border-4 border-green-100 object-cover" />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-green-100 text-4xl font-bold text-green-700">{fullName ? fullName.charAt(0).toUpperCase() : "A"}</div>
            )}
            <label className="mt-4 cursor-pointer rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800">
              {uploading ? "Uploading..." : "Change Profile Picture"}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProfilePictureUpload} disabled={uploading} className="sr-only" />
            </label>
            <p className="mt-2 text-xs text-gray-500">JPG, PNG, or WebP up to 5 MB</p>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label htmlFor="profile-name" className="mb-2 block font-medium">Full Name</label>
              <input id="profile-name" type="text" autoComplete="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-3" />
            </div>
            <div>
              <label htmlFor="profile-phone" className="mb-2 block font-medium">Phone Number</label>
              <input id="profile-phone" type="tel" autoComplete="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-3" />
            </div>
            <div>
              <label htmlFor="profile-email" className="mb-2 block font-medium">Email Address</label>
              <input id="profile-email" type="email" readOnly value={email} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-600" />
            </div>
            {message && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>}
            <button type="submit" disabled={saving} className="w-full rounded-xl bg-green-700 px-6 py-3 font-bold text-white hover:bg-green-800 disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
          </form>

          <button onClick={handleLogout} className="mt-4 w-full rounded-xl border border-red-300 px-6 py-3 font-bold text-red-600 hover:bg-red-50">Sign Out</button>
        </div>
      </div>
    </main>
  );
}
