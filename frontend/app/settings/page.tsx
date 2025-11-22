"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "../components/DashboardHeader";
import { useUser } from "../context/UserContext";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading, login } = useUser();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [selectedFile]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    );
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please choose an image to upload.");
      return;
    }
    setError("");
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => null);
        throw new Error(data?.error || "Upload failed");
      }
      const uploadData = await uploadRes.json();
      const imageUrl = uploadData?.url
        ? `${API_BASE_URL}${uploadData.url}`
        : "";
      if (!imageUrl) {
        throw new Error("Upload did not return an image URL");
      }

      // Update user profile image based on role
      const patchBody = { profileImage: imageUrl };
      const endpoint =
        user.role === "PATIENT"
          ? `${API_BASE_URL}/api/patients/${user.userId}`
          : `${API_BASE_URL}/api/caregivers/${user.userId}`;

      const patchRes = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });

      if (!patchRes.ok) {
        const data = await patchRes.json().catch(() => null);
        throw new Error(data?.error || "Failed to update profile");
      }

      // Update local user context
      login({ ...user, profileImage: imageUrl });
      setSelectedFile(null);
      setPreview(null);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold overflow-hidden">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : user.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profileImage.startsWith("http") ? user.profileImage : `${API_BASE_URL}${user.profileImage}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                user.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-gray-900 font-semibold">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email || user.role}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Upload profile image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-700"
            />
            <p className="text-xs text-gray-500">Images are stored and used for your profile avatar.</p>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            className="px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-sm hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isUploading ? "Uploading..." : "Save"}
          </button>
        </div>
      </main>
    </div>
  );
}
