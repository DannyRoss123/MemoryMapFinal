'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '../../../context/UserContext';
import CaregiverLayout from '../components/CaregiverLayout';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');

export default function CaregiverSettingsPage() {
  const { user } = useUser();
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasPendingFile, setHasPendingFile] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.userId) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/caregivers/${user.userId}`);
        if (response.ok) {
          const data = await response.json();
          const image = data.profileImage;
          if (image) {
            const resolved = image.startsWith('http') ? image : `${API_BASE_URL}${image}`;
            setProfilePicture(image);
            setPreviewUrl(resolved);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setHasPendingFile(true);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0] || !user?.userId) return;

    setUploading(true);
    setMessage(null);

    try {
      // Upload file first
      const uploadData = new FormData();
      uploadData.append('file', fileInputRef.current.files[0]);
      const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: uploadData
      });

      if (!uploadRes.ok) {
        const error = await uploadRes.json().catch(() => null);
        throw new Error(error?.error || 'Failed to upload file');
      }

      const uploadJson = await uploadRes.json();
      const imageUrl = uploadJson?.url ? uploadJson.url : null;
      if (!imageUrl) {
        throw new Error('Upload did not return an image URL');
      }

      // Patch caregiver profile with profileImage
      const patchRes = await fetch(`${API_BASE_URL}/api/caregivers/${user.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImage: imageUrl })
      });

      if (!patchRes.ok) {
        const err = await patchRes.json().catch(() => null);
        throw new Error(err?.error || err?.message || 'Failed to update profile');
      }

      const resolved = imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
      setProfilePicture(imageUrl);
      setPreviewUrl(resolved);
      setHasPendingFile(false);
      setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      setMessage({ type: 'error', text: error?.message || 'An error occurred while uploading' });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!user?.userId) return;

    setUploading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/caregivers/${user.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImage: null })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || error?.message || 'Failed to remove profile picture');
      }

      setProfilePicture('');
      setPreviewUrl('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setMessage({ type: 'success', text: 'Profile picture removed successfully!' });
    } catch (error) {
      console.error('Error removing profile picture:', error);
      setMessage({ type: 'error', text: 'An error occurred while removing' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <CaregiverLayout>
      <div className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

          {/* Profile Picture Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h2>

            {message && (
              <div
                className={`mb-4 p-3 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex items-start space-x-6">
              {/* Profile Picture Preview */}
              <div className="flex-shrink-0">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                    <svg
                      className="w-16 h-16 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-4">
                  Upload a profile picture that will be visible to your patients on their care team card.
                  Recommended size: 200x200px. Max size: 5MB.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex space-x-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : previewUrl ? 'Replace Image' : 'Choose Image'}
                  </button>

                  {hasPendingFile && previewUrl && (
                    <button
                      onClick={handleUpload}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      disabled={uploading}
                    >
                      {uploading ? 'Saving...' : 'Save Picture'}
                    </button>
                  )}

                  {profilePicture && (
                    <button
                      onClick={handleRemove}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      disabled={uploading}
                    >
                      Remove Picture
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Information Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={user?.name || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input
                  type="text"
                  value="Caregiver"
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </CaregiverLayout>
  );
}
