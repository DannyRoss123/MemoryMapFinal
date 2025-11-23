"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "../components/DashboardHeader";
import { useUser } from "../context/UserContext";

type Memory = {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  title?: string;
  createdAt: Date;
  description?: string;
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");

export default function MemoriesPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchMemories = async () => {
      if (!user?.userId) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/memories?patientId=${user.userId}`);
        if (!res.ok) throw new Error("Failed to fetch memories");
        const data = await res.json();
        const mapped: Memory[] = (data || []).map((m: any) => ({
          id: m._id,
          url: m.url.startsWith("http") ? m.url : `${API_BASE_URL}${m.url}`,
          type: m.type,
          title: m.title,
          description: m.description,
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
        }));
        setMemories(mapped);
      } catch (err: any) {
        setError(err?.message || "Could not load memories.");
      } finally {
        setLoadingMemories(false);
      }
    };

    if (user?.userId) {
      fetchMemories();
    }
  }, [user?.userId]);

  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setSelectedFiles(files);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFiles || selectedFiles.length === 0 || !user) return;
    setUploadError("");
    setUploading(true);
    try {
      const isMultiple = selectedFiles.length > 1;
      const formData = new FormData();
      Array.from(selectedFiles).forEach((file) => formData.append(isMultiple ? "files" : "file", file));

      const uploadEndpoint = isMultiple
        ? `${API_BASE_URL}/api/upload/multiple`
        : `${API_BASE_URL}/api/upload`;

      const uploadRes = await fetch(uploadEndpoint, { method: "POST", body: formData });

      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => null);
        throw new Error(data?.error || "Upload failed");
      }

      const uploadData = await uploadRes.json();
      const uploadedFiles = Array.isArray(uploadData) ? uploadData : [uploadData];

      const creationPromises = uploadedFiles.map((fileInfo: any) => {
        const mime = fileInfo?.mimeType || fileInfo?.mimetype || "";
        const type = mime.includes("video") ? "VIDEO" : "IMAGE";
        const body = {
          patientId: user.userId,
          caregiverId: null,
          type,
          url: fileInfo.url,
          title: uploadTitle || fileInfo.originalName || "",
          description: uploadDescription || "",
          fileSize: fileInfo.size,
          mimeType: mime,
        };
        return fetch(`${API_BASE_URL}/api/memories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      });

      const results = await Promise.all(creationPromises);
      for (const res of results) {
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || "Failed to save memory");
        }
      }

      const res = await fetch(`${API_BASE_URL}/api/memories?patientId=${user.userId}`);
      if (res.ok) {
        const data = await res.json();
        const mapped: Memory[] = (data || []).map((m: any) => ({
          id: m._id,
          url: m.url.startsWith("http") ? m.url : `${API_BASE_URL}${m.url}`,
          type: m.type,
          title: m.title,
          description: m.description,
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
        }));
        setMemories(mapped);
      }

      setShowUploadModal(false);
      setSelectedFiles(null);
      setUploadTitle("");
      setUploadDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setUploadError(err?.message || "Something went wrong while uploading memories.");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Memories</h2>
            <p className="text-gray-600">Upload and revisit photos or videos.</p>
          </div>
          <button
            type="button"
            onClick={handleUploadClick}
            className="px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-sm hover:bg-blue-700 transition-all"
            disabled={uploading}
          >
            Add Memory
          </button>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            ref={fileInputRef}
            onChange={(e) => handleFilesSelected(e.target.files)}
            className="hidden"
          />
        </div>

        {uploadError && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {uploadError}
          </div>
        )}
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {loadingMemories ? (
          <div className="text-gray-600">Loading memories...</div>
        ) : memories.length === 0 ? (
          <div className="text-gray-500">No memories yet. Add your first one!</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {memories.map((memory) => (
              <button
                key={memory.id}
                type="button"
                onClick={() => setSelectedMemory(memory)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-left"
              >
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  {memory.type === "VIDEO" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <video src={memory.url} controls className="w-full h-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={memory.url} alt={memory.title || "Memory"} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {memory.title || (memory.type === "VIDEO" ? "Video memory" : "Photo memory")}
                  </p>
                  <p className="text-xs text-gray-500">{memory.createdAt.toLocaleDateString()}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Add Memory</h3>
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFiles(null);
                  setUploadTitle("");
                  setUploadDescription("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Title</label>
              <input
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional description"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Files</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:border-blue-300"
                >
                  Choose files
                </button>
                <span className="text-sm text-gray-500">
                  {selectedFiles ? `${selectedFiles.length} file(s) selected` : "No files chosen"}
                </span>
              </div>
            </div>

            {uploadError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {uploadError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFiles(null);
                  setUploadTitle("");
                  setUploadDescription("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:border-gray-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadSubmit}
                disabled={uploading}
                className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploading ? "Uploading..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMemory && (
        <div className="fixed inset-0 bg-black/60 z-30 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-5xl h-[80vh] overflow-hidden flex">
            <div className="flex-1 bg-black flex items-center justify-center">
              {selectedMemory.type === "VIDEO" ? (
                <video src={selectedMemory.url} controls className="max-h-full max-w-full object-contain" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedMemory.url} alt={selectedMemory.title || "Memory"} className="max-h-full max-w-full object-contain" />
              )}
            </div>
            <div className="w-full max-w-sm border-l border-gray-200 p-5 flex flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500">
                    {selectedMemory.createdAt.toLocaleDateString()}
                  </p>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedMemory.title || "Memory"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMemory(null)}
                  className="text-gray-500 hover:text-gray-800"
                >
                  ✕
                </button>
              </div>
              <div className="mt-4 overflow-y-auto text-gray-700 text-sm leading-relaxed pr-1">
                {selectedMemory.description || "No description provided."}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
