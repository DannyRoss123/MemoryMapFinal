"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../../context/UserContext";
import CaregiverLayout from "../components/CaregiverLayout";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");

interface Patient {
  _id: string;
  name: string;
  email?: string;
  location: string;
  createdAt: string;
}

interface PatientDetail {
  patient: Patient;
  memories?: any[];
  journal?: any[];
  mood?: { mood: string; date?: string; notes?: string }[];
  tasks?: any[];
}

export default function CaregiverPatientsPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientDetail, setPatientDetail] = useState<PatientDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");
const [predictedMood, setPredictedMood] = useState<{ predictedMood: string; shift: string; rationale: string } | null>(null);
const [showTaskModal, setShowTaskModal] = useState(false);
const [newTaskTitle, setNewTaskTitle] = useState("");
const [newTaskDescription, setNewTaskDescription] = useState("");
const [newTaskDue, setNewTaskDue] = useState("");
const [newTaskStatus, setNewTaskStatus] = useState<'PENDING' | 'COMPLETED'>('PENDING');
const [creatingTask, setCreatingTask] = useState(false);
const [taskError, setTaskError] = useState("");
const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'CAREGIVER')) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchAssignedPatients = async () => {
      if (!user?.userId) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/assignments/caregiver/${user.userId}/patients`);
        if (response.ok) {
          const data = await response.json();
          setPatients(data);
          setFilteredPatients(data);
        }
      } catch (error) {
        console.error('Error fetching assigned patients:', error);
      }
    };

    if (user?.userId && user?.role === 'CAREGIVER') {
      fetchAssignedPatients();
    }
  }, [user]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = patients.filter((patient) =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchTerm, patients]);

  if (isLoading || !user || user.role !== 'CAREGIVER') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
    <CaregiverLayout>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
              <p className="text-sm text-gray-600 mt-1">Manage and view all your assigned patients</p>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Patients</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{patients.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Today</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{Math.min(patients.length, 2)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Needs Attention</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Patients List */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">All Patients</h2>
              <p className="text-sm text-gray-600 mt-1">
                {filteredPatients.length} {filteredPatients.length === 1 ? 'patient' : 'patients'} found
              </p>
            </div>

            {filteredPatients.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No patients found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search criteria' : 'You don\'t have any patients assigned to you yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredPatients.map((patient) => (
                  <div
                  key={patient._id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {patient.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
                          <div className="flex items-center space-x-4 mt-1">
                            {patient.email && (
                              <div className="flex items-center text-sm text-gray-600">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {patient.email}
                              </div>
                            )}
                            <div className="flex items-center text-sm text-gray-600">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {patient.location}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right mr-4">
                          <p className="text-sm text-gray-500">Member since</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(patient.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={async () => {
                              setSelectedPatient(patient);
                              setLoadingDetail(true);
                              setDetailError("");
                              setPatientDetail(null);
                              try {
                                const res = await fetch(`${API_BASE_URL}/api/patients/${patient._id}/dashboard`);
                                if (!res.ok) {
                                  const data = await res.json().catch(() => null);
                                  throw new Error(data?.error || "Failed to load details");
                                }
                                const data = await res.json();
                                setPatientDetail({
                                  patient: {
                                    _id: data.patient._id,
                                    name: data.patient.name,
                                    email: data.patient.email,
                                    location: data.patient.location,
                                    createdAt: data.patient.createdAt
                                  },
                                  memories: data.memories?.recent || [],
                                  journal: data.journal?.recent || [],
                                  mood: data.mood?.recent ? [data.mood.recent[0]].filter(Boolean) : [],
                                  tasks: (data.tasks?.recent || []).map((t: any) => ({
                                    ...t,
                                    _id: t._id?.toString ? t._id.toString() : t._id
                                  }))
                                });
                                setPredictedMood(null);
                                const latestMood = data.mood?.recent?.[0]?.mood;
                                if (latestMood) {
                                  const moodRes = await fetch(`${API_BASE_URL}/api/mood/predict-shift`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      patientId: patient._id,
                                      selectedMood: latestMood
                                    })
                                  });
                                  if (moodRes.ok) {
                                    const moodData = await moodRes.json();
                                    setPredictedMood({
                                      predictedMood: moodData.predictedMood,
                                      shift: moodData.shift,
                                      rationale: moodData.rationale
                                    });
                                  }
                                }
                              } catch (err: any) {
                                setDetailError(err?.message || "Failed to load details");
                              } finally {
                                setLoadingDetail(false);
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => router.push(`/caregiver/patients/${patient._id}/contacts`)}
                            className="px-4 py-2 border border-gray-300 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                          >
                            View Contacts
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </CaregiverLayout>
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-5xl max-h-[90vh] overflow-hidden flex">
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{patientDetail?.patient.name || selectedPatient.name}</h3>
                  <p className="text-sm text-gray-600">{patientDetail?.patient.email || selectedPatient.email || 'No email'}</p>
                  <p className="text-sm text-gray-600">{patientDetail?.patient.location || selectedPatient.location || 'No location'}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedPatient(null);
                    setPatientDetail(null);
                    setDetailError("");
                  }}
                  className="text-gray-500 hover:text-gray-800"
                >
                  ✕
                </button>
              </div>

              {detailError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                  {detailError}
                </div>
              )}
              {loadingDetail && <div className="text-sm text-gray-500">Loading details...</div>}

              {patientDetail && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Recent Memories</h4>
                    {patientDetail.memories && patientDetail.memories.length > 0 ? (
                      <div className="space-y-3">
                        {patientDetail.memories.map((m: any) => (
                          <div key={m._id} className="flex items-center space-x-3 border border-gray-200 rounded-lg p-3">
                            <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                              {m.type === 'VIDEO' ? (
                                <div className="w-full h-full bg-black text-white flex items-center justify-center text-xs">Video</div>
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={m.url?.startsWith('http') ? m.url : `${API_BASE_URL}${m.url}`} alt={m.title || 'Memory'} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{m.title || 'Memory'}</p>
                              <p className="text-xs text-gray-500">
                                {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No memories yet.</p>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Recent Journal Entries</h4>
                    {patientDetail.journal && patientDetail.journal.length > 0 ? (
                      <div className="space-y-3">
                        {patientDetail.journal.map((j: any) => (
                          <div key={j._id} className="border border-gray-200 rounded-lg p-3">
                            <p className="text-sm font-semibold text-gray-900 mb-1">{j.title || 'Journal entry'}</p>
                            <p className="text-xs text-gray-500 mb-2">
                              {j.date ? new Date(j.date).toLocaleDateString() : ''}
                            </p>
                            <p className="text-sm text-gray-700 line-clamp-2">{j.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No journal entries yet.</p>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Latest Mood</h4>
                      {patientDetail.mood && patientDetail.mood.length > 0 ? (
                        <div className="space-y-2">
                          {patientDetail.mood.map((m: any) => (
                            <div key={m._id} className="border border-gray-200 rounded-lg p-3">
                              <p className="text-sm font-semibold text-gray-900">
                                {m.mood || 'Mood'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {m.date ? new Date(m.date).toLocaleDateString() : ''}
                              </p>
                              {m.notes && <p className="text-sm text-gray-700 mt-1 line-clamp-2">{m.notes}</p>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No mood entries yet.</p>
                      )}
                    </div>
                    {predictedMood && (
                      <div className="border border-blue-100 bg-blue-50 rounded-lg p-3">
                        <p className="text-sm font-semibold text-blue-900">
                          Predicted Mood: {predictedMood.predictedMood} ({predictedMood.shift})
                        </p>
                        <p className="text-xs text-blue-800 mt-1">{predictedMood.rationale}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Today&apos;s Tasks</h4>
                    {patientDetail.tasks && patientDetail.tasks.length > 0 ? (
                    <div className="space-y-2">
                      {patientDetail.tasks.map((t: any) => (
                        <div
                          key={t._id}
                          className={`flex items-start space-x-3 border border-gray-200 rounded-lg p-3 ${
                            t.completed ? 'bg-green-50' : 'bg-white'
                          }`}
                        >
                            <input
                              type="checkbox"
                              checked={!!t.completed}
                              readOnly
                              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-semibold ${t.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {t.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {t.dueDate ? new Date(t.dueDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Today'}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                className="text-gray-500 hover:text-blue-600"
                                onClick={async () => {
                                  setShowTaskModal(true);
                                  setTaskError("");
                                  setNewTaskTitle(t.title || '');
                                  setNewTaskDescription(t.description || '');
                                  setNewTaskDue(t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 16) : '');
                                  setNewTaskStatus(t.completed ? 'COMPLETED' : 'PENDING');
                                  // reuse modal for editing by pre-filling; store task id
                                  const tid = t?._id;
                                  setEditingTaskId(
                                    typeof tid === 'string'
                                      ? tid
                                      : tid?.toString
                                      ? tid.toString()
                                      : tid
                                      ? `${tid}`
                                      : null
                                  );
                                }}
                                title="Edit task"
                              >
                                ✎
                              </button>
                              <button
                                className="text-gray-500 hover:text-red-600"
                                onClick={async () => {
                                  if (!selectedPatient) return;
                                  try {
                                    const res = await fetch(`${API_BASE_URL}/api/tasks/${t._id}`, {
                                      method: 'DELETE'
                                    });
                                    if (!res.ok) {
                                      const data = await res.json().catch(() => null);
                                      throw new Error(data?.error || 'Failed to delete task');
                                    }
                                    const detailRes = await fetch(`${API_BASE_URL}/api/patients/${selectedPatient._id}/dashboard`);
                                    if (detailRes.ok) {
                                      const data = await detailRes.json();
                                      setPatientDetail({
                                        patient: {
                                          _id: data.patient._id,
                                          name: data.patient.name,
                                          email: data.patient.email,
                                          location: data.patient.location,
                                          createdAt: data.patient.createdAt
                                        },
                                        memories: data.memories?.recent || [],
                                        journal: data.journal?.recent || [],
                                        mood: data.mood?.recent ? [data.mood.recent[0]].filter(Boolean) : [],
                                        tasks: data.tasks?.recent || []
                                      });
                                    }
                                  } catch (err: any) {
                                    setTaskError(err?.message || 'Failed to delete task');
                                  }
                                }}
                                title="Delete task"
                              >
                                🗑
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No tasks scheduled today.</p>
                    )}
                    <button
                      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                      onClick={() => {
                        setShowTaskModal(true);
                        setTaskError("");
                        setEditingTaskId(null);
                        setNewTaskTitle("");
                        setNewTaskDescription("");
                        setNewTaskDue("");
                        setNewTaskStatus('PENDING');
                      }}
                    >
                      Add Task
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showTaskModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTaskId ? "Edit Task" : `Add Task for ${selectedPatient.name}`}
              </h3>
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  setEditingTaskId(null);
                  setTaskError("");
                  setNewTaskTitle("");
                  setNewTaskDescription("");
                  setNewTaskDue("");
                  setNewTaskStatus("PENDING");
                }}
                className="text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>
            {taskError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {taskError}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Task Name</label>
              <input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Task title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Details</label>
              <textarea
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add details"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Due date/time</label>
                <input
                  type="datetime-local"
                  value={newTaskDue}
                  onChange={(e) => setNewTaskDue(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  value={newTaskStatus}
                  onChange={(e) => setNewTaskStatus(e.target.value as 'PENDING' | 'COMPLETED')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  setEditingTaskId(null);
                  setTaskError("");
                  setNewTaskTitle("");
                  setNewTaskDescription("");
                  setNewTaskDue("");
                  setNewTaskStatus("PENDING");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={creatingTask}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newTaskTitle || !newTaskDue || !selectedPatient) {
                    setTaskError("Title and due date are required.");
                    return;
                  }
                  if (editingTaskId && typeof editingTaskId !== 'string') {
                    setTaskError("Task id is invalid. Please close and reopen the patient details, then try again.");
                    return;
                  }
                  setCreatingTask(true);
                  setTaskError("");
                  try {
                    const isEdit = !!editingTaskId;
                    const res = await fetch(
                      isEdit ? `${API_BASE_URL}/api/tasks/${editingTaskId}` : `${API_BASE_URL}/api/tasks`,
                      {
                        method: isEdit ? 'PATCH' : 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          patientId: selectedPatient._id,
                          caregiverId: user?.userId,
                          title: newTaskTitle,
                          description: newTaskDescription,
                          dueDate: newTaskDue,
                          priority: 'MEDIUM',
                          status: newTaskStatus
                        })
                      }
                    );
                    if (!res.ok) {
                      const data = await res.json().catch(() => null);
                      if (res.status === 404) {
                        // Task is stale; refresh data and close modal to avoid stuck UI
                        const detailRes = await fetch(`${API_BASE_URL}/api/patients/${selectedPatient._id}/dashboard`);
                        if (detailRes.ok) {
                          const refreshed = await detailRes.json();
                          setPatientDetail({
                            patient: {
                              _id: refreshed.patient._id,
                              name: refreshed.patient.name,
                              email: refreshed.patient.email,
                              location: refreshed.patient.location,
                              createdAt: refreshed.patient.createdAt
                            },
                            memories: refreshed.memories?.recent || [],
                            journal: refreshed.journal?.recent || [],
                            mood: refreshed.mood?.recent ? [refreshed.mood.recent[0]].filter(Boolean) : [],
                            tasks: (refreshed.tasks?.recent || []).map((t: any) => ({
                              ...t,
                              _id: t._id?.toString ? t._id.toString() : t._id
                            }))
                          });
                        }
                        setShowTaskModal(false);
                        setEditingTaskId(null);
                        throw new Error("Task not found. It may have been deleted. Tasks have been refreshed.");
                      }
                      throw new Error(data?.error || (isEdit ? "Failed to update task" : "Failed to create task"));
                    }
                    // Refresh detail panel
                    setShowTaskModal(false);
                    setNewTaskTitle("");
                    setNewTaskDescription("");
                    setNewTaskDue("");
                    setNewTaskStatus('PENDING');
                    setEditingTaskId(null);
                    // refetch dashboard details
                    const detailRes = await fetch(`${API_BASE_URL}/api/patients/${selectedPatient._id}/dashboard`);
                    if (detailRes.ok) {
                      const data = await detailRes.json();
                      setPatientDetail({
                        patient: {
                          _id: data.patient._id,
                          name: data.patient.name,
                          email: data.patient.email,
                          location: data.patient.location,
                          createdAt: data.patient.createdAt
                        },
                        memories: data.memories?.recent || [],
                        journal: data.journal?.recent || [],
                        mood: data.mood?.recent ? [data.mood.recent[0]].filter(Boolean) : [],
                        tasks: (data.tasks?.recent || []).map((t: any) => ({
                          ...t,
                          _id: t._id?.toString ? t._id.toString() : t._id
                        }))
                      });
                    }
                  } catch (err: any) {
                    setTaskError(err?.message || "Failed to create task");
                  } finally {
                    setCreatingTask(false);
                  }
                }}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60"
                disabled={creatingTask}
              >
                {creatingTask ? "Saving..." : editingTaskId ? "Save Task" : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
