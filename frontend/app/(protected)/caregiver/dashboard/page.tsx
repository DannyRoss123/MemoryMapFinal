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
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  patientName?: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
  patientId?: string | null;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  completed?: boolean;
}

export default function CaregiverDashboardPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useUser();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState({
    activePatients: 0,
    tasksInProgress: 0,
    memoriesLogged: 0,
    unreadMessages: 0,
    tasksDueToday: 0
  });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [taskStatus, setTaskStatus] = useState<'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('PENDING');
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskError, setTaskError] = useState('');
  const taskPatientId = '';
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ taskId: string; targetStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' } | null>(null);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [savingTask, setSavingTask] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (selectedTask) {
      setSavingTask(false);
      setEditError('');
    }
  }, [selectedTask]);

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

          setStats(prev => ({
            ...prev,
            activePatients: data.length,
            tasksInProgress: Math.min(data.length * 2, 4),
            memoriesLogged: Math.min(data.length, 2),
            unreadMessages: data.length > 0 ? 2 : 0
          }));
        }
      } catch (error) {
        console.error('Error fetching assigned patients:', error);
      }
    };

    if (user?.userId && user?.role === 'CAREGIVER') {
      fetchAssignedPatients();
      fetchTasksForCaregiver();
    }
  }, [user]);

  const fetchTasksForCaregiver = async () => {
    if (!user?.userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks?caregiverId=${user.userId}`);
      if (res.ok) {
        const data = await res.json();
        const filtered = (data || []).filter((t: any) => !t.patientId);
        const mapped = filtered.map((t: any) => ({
          ...t,
          _id: t._id?.toString ? t._id.toString() : t._id,
          status: t.status || (t.completed ? 'COMPLETED' : 'PENDING')
        }));
        setTasks(mapped);
        setStats(prev => ({
          ...prev,
          tasksDueToday: mapped.length,
          tasksInProgress: mapped.filter((t: any) => t.status === 'IN_PROGRESS').length
        }));
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'border-l-4 border-rose-400 bg-gradient-to-br from-rose-50 to-white';
      case 'MEDIUM': return 'border-l-4 border-amber-400 bg-gradient-to-br from-amber-50 to-white';
      case 'LOW': return 'border-l-4 border-sky-400 bg-gradient-to-br from-sky-50 to-white';
      default: return 'border-l-4 border-gray-300';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH': return <span className="px-2.5 py-1 text-xs font-semibold bg-rose-100 text-rose-700 rounded-full">High</span>;
      case 'MEDIUM': return <span className="px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full">Medium</span>;
      case 'LOW': return <span className="px-2.5 py-1 text-xs font-semibold bg-sky-100 text-sky-700 rounded-full">Low</span>;
      default: return null;
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading || !user || user.role !== 'CAREGIVER') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-gray-600 text-xl font-medium animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <CaregiverLayout>
      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-8 py-5 sticky top-0 z-20">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search patients, tasks..."
                className="w-96 px-5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-white/70 text-sm font-medium placeholder:text-gray-400"
              />
            </div>
            <div className="flex items-center space-x-3">
              <button className="relative text-gray-600 hover:text-gray-900 p-2.5 hover:bg-gray-100/80 rounded-xl transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {stats.unreadMessages > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold ring-2 ring-white">
                    {stats.unreadMessages}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-8 py-6 max-w-7xl mx-auto w-full">
          {/* Welcome Section */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 mb-8 shadow-xl">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-2">Welcome back, {user.name}</h2>
              <p className="text-blue-100 text-lg mb-6 max-w-2xl">Your centralized care workspace for managing patient needs and clinical priorities.</p>
              <div className="flex space-x-3">
                <button className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all border border-white/20">
                  View Schedule
                </button>
                <button className="px-6 py-3 bg-white text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg">
                  Quick Actions
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-emerald-200 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-500 mb-1">Active Patients</p>
                <div className="flex items-baseline">
                  <p className="text-4xl font-bold text-gray-900">{stats.activePatients}</p>
                  <span className="ml-3 text-sm text-emerald-600 font-semibold flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                    </svg>
                    Active
                  </span>
                </div>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-amber-200 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-500 mb-1">Tasks In Progress</p>
                <div className="flex items-baseline">
                  <p className="text-4xl font-bold text-gray-900">{stats.tasksInProgress}</p>
                  <span className="ml-3 text-sm text-amber-600 font-semibold">
                    {stats.tasksDueToday} due today
                  </span>
                </div>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-500 mb-1">Memories Logged</p>
                <div className="flex items-baseline">
                  <p className="text-4xl font-bold text-gray-900">{stats.memoriesLogged}</p>
                  <span className="ml-3 text-sm text-purple-600 font-semibold">+{stats.memoriesLogged} today</span>
                </div>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-500 mb-1">Messages</p>
                <div className="flex items-baseline">
                  <p className="text-4xl font-bold text-gray-900">{patients.length > 0 ? 5 : 0}</p>
                  <span className="ml-3 text-sm text-rose-600 font-semibold">{stats.unreadMessages} unread</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Priorities */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Today's Priorities</h3>
                  <p className="text-sm text-gray-500 mt-1">Drag tasks to update their status</p>
                </div>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Task</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['PENDING', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
                  <div
                    key={status}
                    className="bg-gradient-to-b from-gray-50 to-white rounded-xl p-4 border border-gray-200 min-h-[280px] transition-all hover:border-gray-300"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (!dragTaskId) return;
                      const newStatus = status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
                      setPendingStatusUpdate({ taskId: dragTaskId, targetStatus: newStatus });
                      setShowStatusModal(true);
                      setDragTaskId(null);
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          status === 'PENDING' ? 'bg-gray-400' :
                          status === 'IN_PROGRESS' ? 'bg-amber-400 animate-pulse' :
                          'bg-emerald-400'
                        }`}></div>
                        <p className="text-sm font-bold text-gray-800">
                          {status === 'PENDING' && 'Pending'}
                          {status === 'IN_PROGRESS' && 'In Progress'}
                          {status === 'COMPLETED' && 'Completed'}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {tasks.filter((t) => (t.status || 'PENDING') === status).length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {tasks
                        .filter((t) => (t.status || 'PENDING') === status)
                        .map((task) => (
                          <div
                            key={task._id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = 'move';
                              e.currentTarget.classList.add('opacity-60');
                              setDragTaskId(task._id);
                            }}
                            onDragEnd={(e) => {
                              e.currentTarget.classList.remove('opacity-60');
                              setDragTaskId(null);
                            }}
                            onClick={() => setSelectedTask(task)}
                            className={`bg-white rounded-xl p-4 shadow-sm border ${getPriorityColor(task.priority)} hover:shadow-md transition-all cursor-move hover:-translate-y-0.5 min-h-[130px] flex flex-col`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              {getPriorityBadge(task.priority)}
                            </div>
                            <h4 className="font-bold text-gray-900 mb-1 line-clamp-2">{task.title}</h4>
                            <p className="text-sm text-gray-600 line-clamp-2 flex-1">
                              {task.description}
                            </p>
                            {task.dueDate && (
                              <p className="text-xs text-gray-500 mt-2 flex items-center">
                                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {new Date(task.dueDate).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                        ))}
                      {tasks.filter((t) => (t.status || 'PENDING') === status).length === 0 && (
                        <div className="text-sm text-gray-400 text-center py-8 italic">No tasks</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Activity Feed</h3>
                  <p className="text-sm text-gray-500 mt-1">Recent updates</p>
                </div>
              </div>

              <div className="space-y-4">
                {activityFeed.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 text-sm font-medium">No recent activity</p>
                  </div>
                ) : (
                  activityFeed.map((activity) => (
                    <div key={activity.id} className="border-b border-gray-100 pb-4 last:border-b-0 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-600 mt-0.5">{activity.description}</p>
                          <p className="text-xs text-gray-400 mt-1.5">{activity.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button className="w-full mt-6 py-2.5 text-blue-700 font-semibold hover:bg-blue-50 rounded-xl transition-all">
                View Full Timeline
              </button>
            </div>
          </div>
        </main>
      </div>
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center px-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg p-6 space-y-4 animate-slideUp">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Add New Task</h3>
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  setTaskError('');
                }}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {taskError && (
              <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                {taskError}
              </div>
            )}
            {statusError && (
              <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                {statusError}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Title</label>
              <input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="Task title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Description</label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
                placeholder="Add details"
              />
            </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Due date/time</label>
                  <input
                    type="datetime-local"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Status</label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED')}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  setTaskError('');
                }}
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                disabled={creatingTask}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!taskTitle || !taskDueDate) {
                    setTaskError('Title and due date are required.');
                    return;
                  }
                  setCreatingTask(true);
                  setTaskError('');
                  try {
                    const res = await fetch(`${API_BASE_URL}/api/tasks`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        patientId: taskPatientId,
                        caregiverId: user?.userId,
                        title: taskTitle,
                        description: taskDescription,
                        dueDate: taskDueDate,
                        priority: taskPriority,
                        status: taskStatus
                      })
                    });
                    if (!res.ok) {
                      const data = await res.json().catch(() => null);
                      throw new Error(data?.error || 'Failed to create task');
                    }
                    await fetchTasksForCaregiver();
                    setShowTaskModal(false);
                    setTaskTitle('');
                    setTaskDescription('');
                    setTaskDueDate('');
                    setTaskPriority('MEDIUM');
                    setTaskStatus('PENDING');
                  } catch (err: any) {
                    setTaskError(err?.message || 'Failed to create task');
                  } finally {
                    setCreatingTask(false);
                  }
                }}
               className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 transition-all shadow-sm hover:shadow-md"
               disabled={creatingTask}
             >
               {creatingTask ? 'Saving...' : 'Create Task'}
             </button>
           </div>
         </div>
       </div>
      )}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center px-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl p-6 space-y-4 animate-slideUp">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Task Details</h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Title</label>
              <input
                value={selectedTask.title}
                onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Description</label>
              <textarea
                value={selectedTask.description}
                onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Due date/time</label>
                <input
                  type="datetime-local"
                  value={selectedTask.dueDate ? selectedTask.dueDate.substring(0, 16) : ''}
                  onChange={(e) => setSelectedTask({ ...selectedTask, dueDate: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Priority</label>
                <select
                  value={selectedTask.priority}
                  onChange={(e) => setSelectedTask({ ...selectedTask, priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Status</label>
              <select
                value={selectedTask.status || 'PENDING'}
                onChange={(e) => setSelectedTask({ ...selectedTask, status: e.target.value as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' })}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedTask) return;
                  setSavingTask(true);
                  setEditError('');
                  try {
                    const res = await fetch(`${API_BASE_URL}/api/tasks/${selectedTask._id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: selectedTask.title,
                        description: selectedTask.description,
                        dueDate: selectedTask.dueDate,
                        priority: selectedTask.priority,
                        status: selectedTask.status || 'PENDING'
                      })
                    });
                    if (res.status === 404) {
                      await fetchTasksForCaregiver();
                      setSelectedTask(null);
                      return;
                    }
                    if (!res.ok) {
                      const data = await res.json().catch(() => null);
                      throw new Error(data?.error || 'Failed to update task');
                    }
                    const updated = await res.json();
                    const updatedId = updated._id?.toString ? updated._id.toString() : updated._id;
                    setTasks((prev) =>
                      prev.map((t) => (t._id === updatedId ? { ...t, ...updated, _id: updatedId } : t))
                    );
                    await fetchTasksForCaregiver();
                    setSelectedTask(null);
                  } catch (err: any) {
                    setEditError(err?.message || 'Failed to update task');
                  } finally {
                    setSavingTask(false);
                  }
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
              >
                {savingTask ? 'Saving...' : 'Save'}
              </button>
            </div>
            {editError && (
              <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                {editError}
              </div>
            )}
          </div>
        </div>
      )}
      {showStatusModal && pendingStatusUpdate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center px-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md p-6 space-y-4 animate-slideUp">
            <h3 className="text-xl font-bold text-gray-900">Update Task Status</h3>
            <p className="text-sm text-gray-600">
              Move this task to <span className="font-bold text-gray-900">{pendingStatusUpdate.targetStatus.replace('_', ' ')}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setPendingStatusUpdate(null);
                  setStatusError('');
                }}
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!pendingStatusUpdate) return;
                  setUpdatingStatus(true);
                  setStatusError('');
                  try {
                    const res = await fetch(`${API_BASE_URL}/api/tasks/${pendingStatusUpdate.taskId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        status: pendingStatusUpdate.targetStatus
                      })
                    });
                    if (res.status === 404) {
                      await fetchTasksForCaregiver();
                      setShowStatusModal(false);
                      setPendingStatusUpdate(null);
                      return;
                    }
                    if (!res.ok) {
                      const data = await res.json().catch(() => null);
                      throw new Error(data?.error || 'Failed to update task');
                    }
                    const updated = await res.json();
                    const updatedId = updated._id?.toString ? updated._id.toString() : updated._id;
                    setTasks((prev) =>
                      prev.map((t) =>
                        t._id === updatedId
                          ? {
                              ...t,
                              status: pendingStatusUpdate.targetStatus,
                              completed: updated?.completed,
                              dueDate: updated?.dueDate,
                              priority: updated?.priority || t.priority,
                              _id: updatedId
                            }
                          : t
                      )
                    );
                    await fetchTasksForCaregiver();
                    setShowStatusModal(false);
                    setPendingStatusUpdate(null);
                  } catch (err: any) {
                    setStatusError(err?.message || 'Failed to update task');
                  } finally {
                    setUpdatingStatus(false);
                  }
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
              >
                {updatingStatus ? 'Updating...' : 'Update'}
              </button>
            </div>
            {statusError && (
              <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                {statusError}
              </div>
            )}
          </div>
        </div>
      )}
    </CaregiverLayout>
  );
}
