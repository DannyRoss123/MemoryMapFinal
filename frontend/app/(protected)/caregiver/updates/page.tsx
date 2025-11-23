"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../../context/UserContext";
import CaregiverLayout from "../components/CaregiverLayout";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");

interface Update {
  id: string;
  type: 'mood' | 'medication' | 'activity' | 'alert' | 'message';
  patientId: string;
  patientName: string;
  title: string;
  description: string;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
  read: boolean;
}

export default function CaregiverUpdatesPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
  const [filteredUpdates, setFilteredUpdates] = useState<Update[]>([]);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'CAREGIVER')) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.userId && user?.role === 'CAREGIVER') {
      loadMockUpdates();
    }
  }, [user]);

  useEffect(() => {
    let filtered = [...updates];

    if (filter === 'unread') {
      filtered = filtered.filter(u => !u.read);
    } else if (filter === 'high') {
      filtered = filtered.filter(u => u.priority === 'high');
    }

    setFilteredUpdates(filtered);
  }, [filter, updates]);

  const loadMockUpdates = () => {
    const mockUpdates: Update[] = [
      {
        id: '1',
        type: 'alert',
        patientId: '1',
        patientName: 'Margaret Smith',
        title: 'Missed medication reminder',
        description: 'Morning medication was not taken at the scheduled time',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
        priority: 'high',
        read: false
      },
      {
        id: '2',
        type: 'mood',
        patientId: '1',
        patientName: 'Margaret Smith',
        title: 'Mood assessment completed',
        description: 'Patient recorded mood as "Very Good" with positive energy levels',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        priority: 'medium',
        read: false
      },
      {
        id: '3',
        type: 'activity',
        patientId: '2',
        patientName: 'John Davis',
        title: 'Daily activity logged',
        description: 'Completed morning walk for 20 minutes',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        priority: 'low',
        read: true
      },
      {
        id: '4',
        type: 'message',
        patientId: '1',
        patientName: 'Margaret Smith',
        title: 'Family message received',
        description: 'Daughter Sarah requested an update on recent activities',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
        priority: 'medium',
        read: false
      },
      {
        id: '5',
        type: 'medication',
        patientId: '2',
        patientName: 'John Davis',
        title: 'Medication administered',
        description: 'Evening medications taken as prescribed',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
        priority: 'low',
        read: true
      }
    ];

    setUpdates(mockUpdates);
    setFilteredUpdates(mockUpdates);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return (
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'mood':
        return (
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'activity':
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        );
      case 'medication':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
      case 'message':
        return (
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">High Priority</span>;
      case 'medium':
        return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-full">Medium</span>;
      case 'low':
        return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full">Low</span>;
      default:
        return null;
    }
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const markAsRead = (id: string) => {
    setUpdates(prev => prev.map(u => u.id === id ? { ...u, read: true } : u));
  };

  const unreadCount = updates.filter(u => !u.read).length;
  const highPriorityCount = updates.filter(u => u.priority === 'high' && !u.read).length;

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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Updates</h1>
              <p className="text-sm text-gray-600 mt-1">Stay informed about patient activities and alerts</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({updates.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('high')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === 'high'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                High Priority ({highPriorityCount})
              </button>
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
                  <p className="text-sm font-medium text-gray-600">Total Updates</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{updates.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unread</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{unreadCount}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">High Priority</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{highPriorityCount}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Updates List */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Updates</h2>
              <p className="text-sm text-gray-600 mt-1">
                {filteredUpdates.length} {filteredUpdates.length === 1 ? 'update' : 'updates'}
              </p>
            </div>

            {filteredUpdates.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No updates found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  You're all caught up! Check back later for new updates.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredUpdates.map((update) => (
                  <div
                    key={update.id}
                    className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !update.read ? 'bg-blue-50/30' : ''
                    }`}
                    onClick={() => markAsRead(update.id)}
                  >
                    <div className="flex items-start space-x-4">
                      {getTypeIcon(update.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-base font-semibold text-gray-900">{update.title}</h3>
                            {!update.read && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                            )}
                          </div>
                          {getPriorityBadge(update.priority)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{update.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="font-medium text-gray-700">{update.patientName}</span>
                          <span>•</span>
                          <span>{getRelativeTime(update.timestamp)}</span>
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
  );
}
