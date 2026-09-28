"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function ProfilePage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/customer-login");
      return;
    }

    setUserId(user.id);
    setEmail(user.email || "");

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Profile loading error:", error);
      setLoading(false);
      return;
    }

    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setProfilePictureUrl(profile.profile_picture_url || "");
    }

    setLoading(false);
  }

  async function handleProfilePictureUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file || !userId) return;
    const {
  data: { session },
} = await supabase.auth.getSession();

console.log("UPLOAD SESSION:", session);
console.log("UPLOAD USER:", session?.user?.email);

    setUploading(true);

    const fileExtension =
      file.name.split(".").pop() || "jpg";

    const fileName = `${userId}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
  .from("customer-profiles")
  .upload(fileName, file);

    if (uploadError) {
      console.error("Profile picture upload error:", uploadError);
      alert("Could not upload profile picture.");
      setUploading(false);
      return;
    }

    const { data: imageData } = supabase.storage
      .from("customer-profiles")
      .getPublicUrl(fileName);

    const imageUrl = imageData.publicUrl;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        profile_picture_url: imageUrl,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Profile picture database error:", updateError);
      alert("Picture uploaded, but profile could not be updated.");
      setUploading(false);
      return;
    }

    setProfilePictureUrl(imageUrl);

    alert("Profile picture updated successfully!");

    setUploading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/customer-login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">
          Loading profile...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">

        <div className="rounded-2xl bg-white p-5 shadow-md sm:p-8">

          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-extrabold text-green-700 sm:text-3xl">
                My Profile
              </h1>

              <p className="mt-1 text-gray-600">
                Manage your Apex Foods account
              </p>
            </div>

            <button
              onClick={() => router.push("/")}
              className="min-h-11 rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50"
            >
              Back to Shop
            </button>
          </div>

          {/* PROFILE PICTURE */}
          <div className="mb-8 flex flex-col items-center">

            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt="Profile"
                className="h-32 w-32 rounded-full object-cover border-4 border-green-100"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-green-100 text-4xl font-bold text-green-700">
                {fullName
                  ? fullName.charAt(0).toUpperCase()
                  : "A"}
              </div>
            )}

            <label className="mt-4 cursor-pointer rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800">
              {uploading
                ? "Uploading..."
                : "Change Profile Picture"}

              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>

          </div>

          {/* PROFILE INFORMATION */}
          <div className="space-y-5">

            <div>
              <label className="mb-2 block font-medium">
                Full Name
              </label>

              <div className="break-words rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                {fullName || "Not provided"}
              </div>
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Phone Number
              </label>

              <div className="break-words rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                {phone || "Not provided"}
              </div>
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Email
              </label>

              <div className="break-words rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                {email}
              </div>
            </div>

          </div>

          <button
            onClick={handleLogout}
            className="mt-8 w-full rounded-xl border border-red-300 px-6 py-3 font-bold text-red-600 hover:bg-red-50"
          >
            Logout
          </button>

        </div>

      </div>
    </main>
  );
}
