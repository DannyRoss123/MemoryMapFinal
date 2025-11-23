"use client";

import { useEffect, useState } from "react";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  location: string;
  caregiverId?: string;
  caregiverName?: string;
}

export default function AssignPage() {
  const [patients, setPatients] = useState<User[]>([]);
  const [caregivers, setCaregivers] = useState<User[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedCaregiver, setSelectedCaregiver] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
    fetchCaregivers();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/patients`);
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
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
      }
    } catch (error) {
      console.error("Error fetching caregivers:", error);
    }
  };

  const handleAssign = async () => {
    if (!selectedPatient || !selectedCaregiver) {
      setMessage("Please select both a patient and a caregiver");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/assignments/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: selectedPatient,
          caregiverId: selectedCaregiver,
        }),
      });

      if (response.ok) {
        setMessage("✓ Patient assigned to caregiver successfully!");
        setSelectedPatient("");
        setSelectedCaregiver("");
        fetchPatients(); // Refresh the list
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error || "Failed to assign"}`);
      }
    } catch (error) {
      console.error("Error assigning patient:", error);
      setMessage("Error: Failed to assign patient to caregiver");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassign = async (patientId: string) => {
    if (!confirm("Are you sure you want to unassign this patient from their caregiver?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/assignments/unassign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ patientId }),
      });

      if (response.ok) {
        setMessage("✓ Patient unassigned successfully!");
        fetchPatients(); // Refresh the list
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error || "Failed to unassign"}`);
      }
    } catch (error) {
      console.error("Error unassigning patient:", error);
      setMessage("Error: Failed to unassign patient");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Patient-Caregiver Assignment</h1>

        {/* Assignment Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Assign Patient to Caregiver</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Select Patient */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Patient</label>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose Patient --</option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.name} - {patient.location}
                    {patient.caregiverName && ` (Currently with ${patient.caregiverName})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Caregiver */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Caregiver</label>
              <select
                value={selectedCaregiver}
                onChange={(e) => setSelectedCaregiver(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose Caregiver --</option>
                {caregivers.map((caregiver) => (
                  <option key={caregiver._id} value={caregiver._id}>
                    {caregiver.name} - {caregiver.location}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleAssign}
            disabled={isLoading || !selectedPatient || !selectedCaregiver}
            className="w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            {isLoading ? "Assigning..." : "Assign"}
          </button>

          {message && (
            <div className={`mt-4 p-3 rounded-lg ${message.startsWith("✓") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {message}
            </div>
          )}
        </div>

        {/* Current Assignments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Assignments</h2>

          <div className="space-y-3">
            {patients.filter((p) => p.caregiverId).length === 0 ? (
              <p className="text-gray-500 text-center py-8">No assignments yet</p>
            ) : (
              patients
                .filter((p) => p.caregiverId)
                .map((patient) => (
                  <div
                    key={patient._id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{patient.name}</p>
                          <p className="text-sm text-gray-500">{patient.location}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Assigned to</p>
                        <p className="font-medium text-gray-900">{patient.caregiverName}</p>
                      </div>

                      <button
                        onClick={() => handleUnassign(patient._id)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                      >
                        Unassign
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">Total Patients</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{patients.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">Total Caregivers</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{caregivers.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">Assigned Patients</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {patients.filter((p) => p.caregiverId).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
