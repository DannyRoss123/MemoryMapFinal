"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CaregiverLayout from "../../../components/CaregiverLayout";
import { useUser } from "../../../../../context/UserContext";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");

interface Patient {
  _id: string;
  name: string;
  email?: string;
  location?: string;
}

interface Contact {
  _id?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  phoneNumber?: string;
  relationship: string;
  profilePicture?: string;
}

export default function PatientContactsPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = useMemo(() => {
    const val = (params as any)?.patientId;
    return Array.isArray(val) ? val[0] : val;
  }, [params]);
  const { user, isLoading } = useUser();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "CAREGIVER")) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!patientId) return;
      setLoading(true);
      setError("");
      try {
        const [pRes, cRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/patients/${patientId}`),
          fetch(`${API_BASE_URL}/api/contacts/patient/${patientId}`)
        ]);

        if (!pRes.ok) {
          const data = await pRes.json().catch(() => null);
          throw new Error(data?.error || "Failed to load patient");
        }
        if (!cRes.ok) {
          const data = await cRes.json().catch(() => null);
          throw new Error(data?.error || "Failed to load contacts");
        }

        const patientData = await pRes.json();
        const contactsData = await cRes.json();

        setPatient({
          _id: patientData._id,
          name: patientData.name,
          email: patientData.email,
          location: patientData.location
        });
        setContacts(
          (contactsData || []).map((c: any) => ({
            ...c,
            _id: c._id?.toString ? c._id.toString() : c._id
          }))
        );
      } catch (err: any) {
        setError(err?.message || "Failed to load contacts");
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading && user?.role === "CAREGIVER") {
      fetchData();
    }
  }, [patientId, user, isLoading]);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setMiddleName("");
    setRelationship("");
    setEmail("");
    setPhoneNumber("");
    setProfilePictureUrl("");
    setEditingId(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (contact: Contact) => {
    setFirstName(contact.firstName || "");
    setLastName(contact.lastName || "");
    setMiddleName(contact.middleName || "");
    setRelationship(contact.relationship || "");
    setEmail(contact.email || "");
    setPhoneNumber(contact.phoneNumber || "");
    setProfilePictureUrl(contact.profilePicture || "");
    setEditingId(contact._id || null);
    setShowForm(true);
  };

  const saveContact = async () => {
    if (!patientId) {
      setError("Invalid patient id");
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !relationship.trim()) {
      setError("First name, last name, and relationship are required");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const isEdit = !!editingId;
      const res = await fetch(
        isEdit ? `${API_BASE_URL}/api/contacts/${editingId}` : `${API_BASE_URL}/api/contacts`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            middleName: middleName.trim(),
            relationship: relationship.trim(),
            email: email.trim(),
            phoneNumber: phoneNumber.trim(),
            profilePicture: profilePictureUrl
          })
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || (isEdit ? "Failed to update contact" : "Failed to create contact"));
      }

      const refreshed = await fetch(`${API_BASE_URL}/api/contacts/patient/${patientId}`);
      if (refreshed.ok) {
        const list = await refreshed.json();
        setContacts(
          (list || []).map((c: any) => ({
            ...c,
            _id: c._id?.toString ? c._id.toString() : c._id
          }))
        );
      }
      setShowForm(false);
      resetForm();
    } catch (err: any) {
      setError(err?.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const uploadProfilePicture = async (file: File) => {
    setIsUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Upload failed");
      }
      const data = await res.json();
      setProfilePictureUrl(data.url);
    } catch (err: any) {
      setError(err?.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteContact = async (id?: string) => {
    if (!id) return;
    if (!confirm("Delete this contact?")) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/contacts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to delete contact");
      }
      setContacts((prev) => prev.filter((c) => c._id !== id));
    } catch (err: any) {
      setError(err?.message || "Delete failed");
    }
  };

  if (isLoading || !user || user.role !== "CAREGIVER") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <CaregiverLayout>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 cursor-pointer" onClick={() => router.push("/caregiver/patients")}>
                ← Back to Patients
              </p>
              <h1 className="text-2xl font-bold text-gray-900">Family Contacts</h1>
              {patient && (
                <p className="text-sm text-gray-600 mt-1">
                  {patient.name}
                  {patient.email ? ` • ${patient.email}` : ""}
                  {patient.location ? ` • ${patient.location}` : ""}
                </p>
              )}
            </div>
            <button
              onClick={openCreateForm}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
              </svg>
              <span>Add Contact</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {error && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}

          {loading ? (
            <div className="text-gray-600">Loading contacts...</div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No family contacts yet</h3>
              <p className="text-sm text-gray-600 mb-4">Add family members so the care team can stay in touch.</p>
              <button
                onClick={openCreateForm}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Add Contact
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((c) => (
                <div key={c._id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                        {c.profilePicture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`${API_BASE_URL}${c.profilePicture}`} alt={c.firstName} className="w-full h-full object-cover" />
                        ) : (
                          `${c.firstName?.charAt(0) || ""}${c.lastName?.charAt(0) || ""}` || "?"
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {c.firstName} {c.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{c.relationship || "Family"}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditForm(c)}
                        className="text-gray-500 hover:text-blue-600"
                        title="Edit contact"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => deleteContact(c._id)}
                        className="text-gray-500 hover:text-red-600"
                        title="Delete contact"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                  {c.email && <p className="text-sm text-gray-700 truncate">{c.email}</p>}
                  {c.phoneNumber && <p className="text-sm text-gray-700">{c.phoneNumber}</p>}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? "Edit Contact" : patient ? `Add Contact for ${patient.name}` : "Add Contact"}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                  setError("");
                }}
                className="text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">First name</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Last name</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Middle name</label>
              <input
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Relationship</label>
              <input
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Daughter, Son, Spouse"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="family@email.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Profile picture</label>
              <div className="flex items-center space-x-3">
                {profilePictureUrl ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${API_BASE_URL}${profilePictureUrl}`} alt="Contact" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-500">
                    No photo
                  </div>
                )}
                <label className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadProfilePicture(file);
                    }}
                  />
                  {isUploading ? "Uploading..." : profilePictureUrl ? "Change photo" : "Upload photo"}
                </label>
                {profilePictureUrl && (
                  <button
                    type="button"
                    onClick={() => setProfilePictureUrl("")}
                    className="text-xs text-gray-500 hover:text-gray-800"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                  setError("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={saveContact}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : editingId ? "Save Contact" : "Create Contact"}
              </button>
            </div>
          </div>
        </div>
      )}
    </CaregiverLayout>
  );
}
