"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "../../context/UserContext";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");

interface Caregiver {
  _id: string;
  name: string;
  location: string;
  patients?: string[];
  createdAt: string;
}

interface Patient {
  _id: string;
  name: string;
  email: string;
  location: string;
  caregiverId?: string;
  caregiverName?: string;
}

export default function AdminCaregiversPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [filteredCaregivers, setFilteredCaregivers] = useState<Caregiver[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [patientCounts, setPatientCounts] = useState<Record<string, number>>({});
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [assigningCaregiver, setAssigningCaregiver] = useState<string | null>(null);
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.replace('/admin/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchCaregivers();
      fetchAllPatients();
    }
  }, [user]);

  useEffect(() => {
    filterCaregivers();
  }, [searchTerm, caregivers]);

  const fetchAllPatients = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/patients`);
      if (response.ok) {
        const data = await response.json();
        setAllPatients(data);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const fetchCaregivers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/caregivers`);
      if (response.ok) {
        const data = await response.json();
        setCaregivers(data);

        // Fetch patient counts for each caregiver
        const counts: Record<string, number> = {};
        await Promise.all(
          data.map(async (caregiver: Caregiver) => {
            try {
              const patientsRes = await fetch(
                `${API_BASE_URL}/api/assignments/caregiver/${caregiver._id}/patients`
              );
              if (patientsRes.ok) {
                const patients = await patientsRes.json();
                counts[caregiver._id] = patients.length;
              } else {
                counts[caregiver._id] = 0;
              }
            } catch {
              counts[caregiver._id] = 0;
            }
          })
        );
        setPatientCounts(counts);
      }
    } catch (error) {
      console.error("Error fetching caregivers:", error);
    }
  };

  const handleAssignPatients = async (caregiverId: string) => {
    if (selectedPatients.length === 0) {
      alert("Please select at least one patient to assign.");
      return;
    }

    try {
      await Promise.all(
        selectedPatients.map(async (patientId) => {
          const response = await fetch(`${API_BASE_URL}/api/assignments/assign`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ patientId, caregiverId }),
          });
          if (!response.ok) {
            console.error(`Failed to assign patient ${patientId}`);
          }
        })
      );

      // Refresh data
      await fetchCaregivers();
      await fetchAllPatients();
      setAssigningCaregiver(null);
      setSelectedPatients([]);
    } catch (error) {
      console.error("Error assigning patients:", error);
    }
  };

  const handleUnassignPatient = async (patientId: string) => {
    if (!confirm("Are you sure you want to unassign this patient?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/assignments/unassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId }),
      });

      if (response.ok) {
        await fetchCaregivers();
        await fetchAllPatients();
      }
    } catch (error) {
      console.error("Error unassigning patient:", error);
    }
  };

  const getUnassignedPatients = () => {
    return allPatients.filter((p) => !p.caregiverId);
  };

  const togglePatientSelection = (patientId: string) => {
    setSelectedPatients((prev) =>
      prev.includes(patientId)
        ? prev.filter((id) => id !== patientId)
        : [...prev, patientId]
    );
  };

  const filterCaregivers = () => {
    let filtered = [...caregivers];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCaregivers(filtered);
  };

  if (isLoading || !user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard" className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Manage Caregivers</h1>
                <p className="text-xs text-gray-500">View and manage all caregivers</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Caregivers</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or location..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-600">Total Caregivers</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{caregivers.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-600">With Patients</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {Object.values(patientCounts).filter((count) => count > 0).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-600">Total Patients</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {Object.values(patientCounts).reduce((sum, count) => sum + count, 0)}
            </p>
          </div>
        </div>

        {/* Caregivers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Caregiver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Patients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCaregivers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No caregivers found
                    </td>
                  </tr>
                ) : (
                  filteredCaregivers.map((caregiver) => (
                    <tr key={caregiver._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold">
                            {caregiver.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{caregiver.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{caregiver.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {patientCounts[caregiver._id] || 0}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">patients</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(caregiver.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {assigningCaregiver === caregiver._id ? (
                          <div className="space-y-3">
                            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                              {getUnassignedPatients().length === 0 ? (
                                <p className="text-sm text-gray-500">No unassigned patients</p>
                              ) : (
                                getUnassignedPatients().map((patient) => (
                                  <label
                                    key={patient._id}
                                    className="flex items-center space-x-2 py-1 hover:bg-gray-100 rounded px-2 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedPatients.includes(patient._id)}
                                      onChange={() => togglePatientSelection(patient._id)}
                                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    />
                                    <span className="text-sm text-gray-900">{patient.name}</span>
                                  </label>
                                ))
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleAssignPatients(caregiver._id)}
                                disabled={selectedPatients.length === 0}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Assign Selected ({selectedPatients.length})
                              </button>
                              <button
                                onClick={() => {
                                  setAssigningCaregiver(null);
                                  setSelectedPatients([]);
                                }}
                                className="text-gray-500 hover:text-gray-700 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAssigningCaregiver(caregiver._id)}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
                          >
                            Assign Patients
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
