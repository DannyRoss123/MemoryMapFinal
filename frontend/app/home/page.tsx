'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');

export default function HomePage() {
  const router = useRouter();
  const { user, logout, isLoading } = useUser();
  const [tasks, setTasks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [todayMood, setTodayMood] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  // Fetch today's mood
  useEffect(() => {
    const fetchTodayMood = async () => {
      if (!user?.userId) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/mood/patient/${user.userId}/today`);
        if (response.ok) {
          const data = await response.json();
          setTodayMood(data);
        }
      } catch (error) {
        console.error('Error fetching mood:', error);
      }
    };

    if (user?.userId && user?.role === 'PATIENT') {
      fetchTodayMood();
    }
  }, [user]);

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user?.userId) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/tasks?patientId=${user.userId}`);
        if (response.ok) {
          const data = await response.json();
          setTasks(data.slice(0, 3)); // Show first 3 tasks
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    if (user?.userId && user?.role === 'PATIENT') {
      fetchTasks();
    }
  }, [user]);

  // Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      if (!user?.userId) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/contacts/patient/${user.userId}`);
        if (response.ok) {
          const data = await response.json();
          setContacts(data);
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    };

    if (user?.userId && user?.role === 'PATIENT') {
      fetchContacts();
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    );
  }

  const getMoodMessage = (mood) => {
    const messages = {
      HAPPY: "I'm glad you're feeling happy!",
      CALM: "I'm glad you're feeling calm!",
      SAD: "I hope your day gets better!",
      ANXIOUS: "Take a deep breath, you've got this!",
      ANGRY: "Take it easy today!",
      TIRED: "Rest well today!"
    };
    return messages[mood] || "Have a great day!";
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  const careTeam = contacts.filter(c => c.relationship === 'Doctor' || c.relationship === 'Nurse' || c.relationship === 'Caregiver');
  const family = contacts.filter(c => c.relationship === 'Family' || c.relationship === 'Daughter' || c.relationship === 'Son' || c.relationship === 'Sister' || c.relationship === 'Brother').slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Logo and Navigation stacked so the title sits above the tabs */}
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold text-gray-900">Memory Map</h1>
              <nav className="hidden md:flex space-x-6 mt-2">
                <button className="text-gray-900 font-medium border-b-2 border-blue-600 pb-1">Home</button>
                <button className="text-gray-600 hover:text-gray-900">Memories</button>
                <button className="text-gray-600 hover:text-gray-900">Journal</button>
                <button className="text-gray-600 hover:text-gray-900">Contacts</button>
              </nav>
            </div>

            {/* User Profile */}
            <div className="relative flex items-center space-x-3" ref={menuRef}>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">Patient</p>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {user.name?.charAt(0).toUpperCase()}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-12 w-40 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-10">
                  <button
                    onClick={() => logout()}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Greeting */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Good {getTimeOfDay()}, {user.name}
              </h2>
              <p className="text-lg text-gray-600">
                {todayMood ? getMoodMessage(todayMood.mood) : "Have a wonderful day!"}
              </p>
            </div>

            {/* Yesterday's Memory */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Memories</h3>
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-400 text-center">No recent memories</p>
              </div>
            </div>

            {/* Today's Tasks */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Today's Tasks</h3>
              {tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.map((task, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={task.completed}
                        readOnly
                      />
                      <div className="flex-1">
                        <p className={`${task.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {task.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {task.dueDate ? new Date(task.dueDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'Throughout day'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <p className="text-gray-400 text-center">No daily tasks</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebars */}
          <div className="space-y-6">
            {/* Care Team */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Care Team</h3>
              {careTeam.length > 0 ? (
                <div className="space-y-4">
                  {careTeam.map((contact, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold flex-shrink-0">
                        {contact.firstName?.charAt(0)}{contact.lastName?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{contact.firstName} {contact.lastName}</p>
                        <p className="text-sm text-gray-500">{contact.relationship}</p>
                        {contact.email && (
                          <p className="text-xs text-gray-400 mt-1">{contact.email}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <p className="text-gray-400 text-center">No care team assigned</p>
                </div>
              )}
            </div>

            {/* Family */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Family</h3>
              {family.length > 0 ? (
                <div className="space-y-4">
                  {family.map((contact, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold flex-shrink-0">
                        {contact.firstName?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{contact.firstName} {contact.lastName}</p>
                        <p className="text-sm text-gray-500">{contact.relationship}</p>
                        {contact.phoneNumber && (
                          <p className="text-xs text-gray-400 mt-1">{contact.phoneNumber}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <p className="text-gray-400 text-center">No family contacts</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
