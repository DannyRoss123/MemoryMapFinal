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
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'warning' | 'info';
  actionLabel: string;
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

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'CAREGIVER')) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  // Fetch assigned patients
  useEffect(() => {
    const fetchAssignedPatients = async () => {
      if (!user?.userId) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/assignments/caregiver/${user.userId}/patients`);
        if (response.ok) {
          const data = await response.json();
          setPatients(data);

          // Update stats
          setStats(prev => ({
            ...prev,
            activePatients: data.length,
            tasksInProgress: Math.min(data.length * 2, 4), // Sample calculation
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
      loadMockData();
    }
  }, [user]);

  const loadMockData = () => {
    // Mock tasks
    setTasks([
      {
        id: '1',
        title: 'Check in on patients with no activity logged today',
        description: 'Review patient engagement and reach out to those who may need support',
        priority: 'critical',
        actionLabel: 'Review Patients'
      },
      {
        id: '2',
        title: 'Celebrate wins with a quick message to family',
        description: 'Share positive updates and milestones with loved ones',
        priority: 'warning',
        actionLabel: 'Message Family'
      },
      {
        id: '3',
        title: 'Update care plans when routines change',
        description: 'Review and adjust care protocols based on recent observations',
        priority: 'info',
        actionLabel: 'Update Plans'
      }
    ]);

    // Mock activity feed
    setActivityFeed([
      {
        id: '1',
        type: 'mood',
        title: 'Mood assessment logged',
        description: "Margaret's mood recorded as positive",
        time: '15 min'
      },
      {
        id: '2',
        type: 'message',
        title: 'Family message received',
        description: 'Sarah Johnson requested an update',
        time: '1 hour'
      },
      {
        id: '3',
        type: 'memory',
        title: 'Memory shared',
        description: 'Photo from family gathering uploaded',
        time: '2 hours'
      },
      {
        id: '4',
        type: 'routine',
        title: 'Daily routine completed',
        description: 'Morning medications administered',
        time: '3 hours'
      }
    ]);

    setStats(prev => ({
      ...prev,
      tasksDueToday: 3
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-4 border-red-500 bg-red-50';
      case 'warning': return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'info': return 'border-l-4 border-blue-500 bg-blue-50';
      default: return 'border-l-4 border-gray-300';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded">Critical</span>;
      case 'warning': return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded">Warning</span>;
      case 'info': return <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded">Info</span>;
      default: return null;
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading || !user || user.role !== 'CAREGIVER') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <CaregiverLayout>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search patients, tasks..."
                className="w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {stats.unreadMessages > 0 && (
                  <span className="absolute -mt-6 ml-3 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {stats.unreadMessages}
                  </span>
                )}
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                + New Task
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* Welcome Section */}
          <div className="bg-blue-50 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {user.name}</h2>
            <p className="text-gray-600 mb-4">Your centralized care workspace for managing patient needs, family connections, and clinical priorities.</p>
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-white text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition border border-blue-200">
                View Schedule
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                Quick Actions
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Patients</p>
                  <div className="flex items-baseline mt-2">
                    <p className="text-3xl font-bold text-gray-900">{stats.activePatients}</p>
                    <span className="ml-2 text-sm text-green-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                      </svg>
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">• 2h</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasks in Progress</p>
                <div className="flex items-baseline mt-2">
                  <p className="text-3xl font-bold text-gray-900">{stats.tasksInProgress}</p>
                  <span className="ml-2 text-sm text-orange-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {stats.tasksDueToday} due today
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Memories Logged</p>
                <div className="flex items-baseline mt-2">
                  <p className="text-3xl font-bold text-gray-900">{stats.memoriesLogged}</p>
                  <span className="ml-2 text-sm text-green-600">+{stats.memoriesLogged} today</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages</p>
                <div className="flex items-baseline mt-2">
                  <p className="text-3xl font-bold text-gray-900">{patients.length > 0 ? 5 : 0}</p>
                  <span className="ml-2 text-sm text-red-600">• {stats.unreadMessages} unread</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Priorities */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Today's Priorities</h3>
                  <p className="text-sm text-gray-600">Focus areas for optimal care delivery</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </button>
                  <span className="text-sm text-gray-600">{tasks.length} tasks</span>
                </div>
              </div>

              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className={`rounded-lg p-4 ${getPriorityColor(task.priority)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        {getPriorityBadge(task.priority)}
                        <h4 className="font-semibold text-gray-900 mt-2">{task.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      </div>
                    </div>
                    <button className="mt-3 px-4 py-2 bg-white text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 transition border border-blue-200">
                      {task.actionLabel}
                    </button>
                  </div>
                ))}
              </div>

              <button className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                Open Patient Workspaces
              </button>
            </div>

            {/* Activity Feed */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Activity Feed</h3>
                  <p className="text-sm text-gray-600">Recent care updates</p>
                </div>
              </div>

              <div className="space-y-4">
                {activityFeed.map((activity) => (
                  <div key={activity.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-6 py-2 text-blue-700 font-medium hover:bg-blue-50 rounded-lg transition">
                View Full Timeline
              </button>
            </div>
          </div>
        </main>
      </div>
    </CaregiverLayout>
  );
}
