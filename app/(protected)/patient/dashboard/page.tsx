'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@/app/context/UserContext';
import { patientApi, type Memory, type Task, type JournalEntry } from '@/lib/api';

export default function PatientDashboardPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddMemoryModal, setShowAddMemoryModal] = useState(false);
  const [showAllMemoriesModal, setShowAllMemoriesModal] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<string | null>(null);
  const [showNewJournalModal, setShowNewJournalModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Backend data states
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  // Form states for new entries
  const [newJournalTitle, setNewJournalTitle] = useState('');
  const [newJournalContent, setNewJournalContent] = useState('');
  const [newMemoryDescription, setNewMemoryDescription] = useState('');
  const [newMemoryDate, setNewMemoryDate] = useState('');
  const [newMemoryFile, setNewMemoryFile] = useState<File | null>(null);

  // Load dashboard data from backend
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.userId) return;

      try {
        setIsLoading(true);
        const [tasksData, memoriesData, journalData] = await Promise.all([
          patientApi.getTasks(user.userId),
          patientApi.getMemories(user.userId),
          patientApi.getJournalEntries(user.userId),
        ]);

        setTasks(tasksData);
        setMemories(memoriesData);
        setJournalEntries(journalData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.userId]);

  const careTeam = [
    {
      id: 1,
      name: 'Sarah Chen',
      role: 'Primary Nurse',
      phone: '(555) 123-4567',
      initials: 'SC',
    },
    {
      id: 2,
      name: 'Dr. Robert Martinez',
      role: 'Primary Physician',
      phone: '(555) 234-5678',
      initials: 'RM',
    },
    {
      id: 3,
      name: 'Lisa Thompson',
      role: 'Physical Therapist',
      phone: '(555) 345-6789',
      initials: 'LT',
    },
  ];

  const familyMembers = [
    {
      id: 1,
      name: 'Mary Johnson',
      relation: 'Daughter',
      phone: '(555) 456-7890',
      initials: 'MJ',
    },
    {
      id: 2,
      name: 'Emma Rodriguez',
      relation: 'Niece',
      phone: '(555) 567-8901',
      initials: 'ER',
    },
    {
      id: 3,
      name: 'Michael Chen',
      relation: 'Grandson',
      phone: '(555) 678-9012',
      initials: 'MC',
    },
    {
      id: 4,
      name: 'David Johnson',
      relation: 'Son-in-law',
      phone: '(555) 789-0123',
      initials: 'DJ',
    },
  ];

  const toggleTask = async (id: string) => {
    if (!user?.userId) return;

    const task = tasks.find(t => t._id === id);
    if (!task) return;

    try {
      await patientApi.updateTask(user.userId, id, { completed: !task.completed });
      // Update local state optimistically
      setTasks(tasks.map(t =>
        t._id === id ? { ...t, completed: !t.completed } : t
      ));
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleAddMemory = async () => {
    if (!user?.userId || !newMemoryDescription) return;

    try {
      const formData = new FormData();
      formData.append('description', newMemoryDescription);
      if (newMemoryDate) {
        formData.append('date', newMemoryDate);
      }
      if (newMemoryFile) {
        formData.append('image', newMemoryFile);
      }

      await patientApi.createMemory(user.userId, formData);

      // Reload memories
      const memoriesData = await patientApi.getMemories(user.userId);
      setMemories(memoriesData);

      // Reset form and close modal
      setNewMemoryDescription('');
      setNewMemoryDate('');
      setNewMemoryFile(null);
      setShowAddMemoryModal(false);
    } catch (error) {
      console.error('Failed to add memory:', error);
    }
  };

  const handleAddJournalEntry = async () => {
    if (!user?.userId || !newJournalTitle || !newJournalContent) return;

    try {
      await patientApi.createJournalEntry(user.userId, {
        title: newJournalTitle,
        content: newJournalContent,
      });

      // Reload journal entries
      const journalData = await patientApi.getJournalEntries(user.userId);
      setJournalEntries(journalData);

      // Reset form and close modal
      setNewJournalTitle('');
      setNewJournalContent('');
      setShowNewJournalModal(false);
    } catch (error) {
      console.error('Failed to add journal entry:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewMemoryFile(e.target.files[0]);
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real app, this would start/stop microphone recording
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] relative">
      {/* Decorative Triangles */}
      {/* Bottom triangles (smaller - about 2/3 size) */}
      <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-gradient-to-tr from-[#dbeafe] to-transparent opacity-50 pointer-events-none z-0" style={{clipPath: 'polygon(0 100%, 0 0, 100% 100%)'}}></div>
      <div className="absolute bottom-0 right-0 w-[200px] h-[200px] bg-gradient-to-tl from-[#e0e7ff] to-transparent opacity-50 pointer-events-none z-0" style={{clipPath: 'polygon(100% 100%, 0 100%, 100% 0)'}}></div>
      {/* Top triangles (smaller - 2/3 size) */}
      <div className="absolute top-0 left-0 w-[200px] h-[200px] bg-gradient-to-br from-[#dbeafe] to-transparent opacity-50 pointer-events-none z-0" style={{clipPath: 'polygon(0 0, 100% 0, 0 100%)'}}></div>
      <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-gradient-to-bl from-[#e0e7ff] to-transparent opacity-50 pointer-events-none z-0" style={{clipPath: 'polygon(100% 0, 100% 100%, 0 0)'}}></div>

      {/* Header - NetNation Style */}
      <header className="bg-white border-b border-gray-100 relative z-10">
        <div className="max-w-7xl mx-auto px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Left: Logo */}
            <h1 className="text-2xl font-bold text-[#1e40af]">Memory Map</h1>

            {/* Center: Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-10">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`text-sm font-medium transition ${
                  activeTab === 'dashboard'
                    ? 'text-[#1e40af]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('memories')}
                className={`text-sm font-medium transition ${
                  activeTab === 'memories'
                    ? 'text-[#1e40af]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Memories
              </button>
              <button
                onClick={() => setActiveTab('journal')}
                className={`text-sm font-medium transition ${
                  activeTab === 'journal'
                    ? 'text-[#1e40af]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Journal
              </button>
              <button
                onClick={() => setActiveTab('contacts')}
                className={`text-sm font-medium transition ${
                  activeTab === 'contacts'
                    ? 'text-[#1e40af]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Contacts
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`text-sm font-medium transition ${
                  activeTab === 'settings'
                    ? 'text-[#1e40af]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Settings
              </button>
            </nav>

            {/* Right: User Menu */}
            <div className="flex items-center gap-6">
              <span className="text-sm text-gray-600">Hi, {user?.name || 'Guest'}</span>
              <Link
                href="/login"
                className="text-sm text-[#1e40af] hover:text-[#1e3a8a] font-medium"
              >
                Logout
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 lg:px-12 py-3">
        {activeTab === 'dashboard' && (
          <div>
            {/* Hero Section with Circular Image */}
            <div className="mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-[#1e40af] mb-6 leading-tight">
                Yesterday&apos;s Memory
              </h2>

              <div className="grid md:grid-cols-[auto_1fr_auto] gap-12 items-start mt-8">
                {/* Circular Image with Button */}
                <div className="flex-shrink-0 flex flex-col items-center gap-4">
                  <div className="relative w-64 h-64 rounded-full overflow-hidden shadow-lg">
                    <Image
                      src="/older person memory.png"
                      alt="Yesterday's memory"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  <button
                    onClick={() => setActiveTab('memories')}
                    className="px-8 py-3 bg-[#1e40af] text-white rounded-full font-medium hover:bg-[#1e3a8a] transition shadow-md hover:shadow-lg"
                  >
                    Memories
                  </button>
                </div>

                {/* Text Content */}
                <div className="flex-1 max-w-md space-y-8">
                  <div className="pb-8 border-b-2 border-gray-200">
                    <p className="text-base text-gray-700 leading-relaxed mb-4">
                      Had a quiet afternoon listening to my favorite music. Felt relaxed and connected after a call with family.
                    </p>
                    <p className="text-sm text-gray-500">Posted yesterday at 3:00 PM</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Today&apos;s Tasks</h3>
                    {isLoading ? (
                      <p className="text-sm text-gray-500">Loading tasks...</p>
                    ) : tasks.length === 0 ? (
                      <p className="text-sm text-gray-500">No tasks yet. Add some to get started!</p>
                    ) : (
                      <div className="space-y-3">
                        {tasks.map(task => (
                          <label key={task._id} className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              className="w-5 h-5 rounded border-gray-300 text-[#1e40af] focus:ring-[#1e40af]"
                              checked={task.completed}
                              onChange={() => toggleTask(task._id)}
                            />
                            <span className={`text-base text-gray-700 ${task.completed ? 'line-through opacity-60' : 'group-hover:text-gray-900'}`}>
                              {task.title}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Care Team & Family */}
                <div className="flex flex-col gap-6 min-w-[240px] max-w-[280px] -mt-12">
                  <div className="space-y-2 pb-6 border-b-2 border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Caregiver</h3>
                    <p className="text-base font-medium text-gray-900">Sarah Chen</p>
                    <p className="text-base text-gray-700 leading-relaxed font-light">
                      &quot;You&apos;re doing great today, Jennifer! Keep up the wonderful spirit.&quot; 💙
                    </p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Family</h3>
                    <p className="text-base font-medium text-gray-900">Mary Johnson <span className="text-sm text-gray-500 italic font-normal">- Your Daughter</span></p>
                    <p className="text-base text-gray-700 leading-relaxed font-light">
                      &quot;Love you Mom! Can&apos;t wait to visit this weekend. You&apos;re always in my thoughts.&quot; ❤️
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-medium text-gray-900">Emma Rodriguez <span className="text-sm text-gray-500 italic font-normal">- Your Niece</span></p>
                    <p className="text-base text-gray-700 leading-relaxed font-light">
                      &quot;Hope you&apos;re having a wonderful day, Aunt Jennifer! Thinking of you and sending lots of love.&quot;
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-medium text-gray-900">Michael Chen <span className="text-sm text-gray-500 italic font-normal">- Your Grandson</span></p>
                    <p className="text-base text-gray-700 leading-relaxed font-light">
                      &quot;Hi Grandma! Thanks for teaching me how to make your famous cookies. They turned out perfect!&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'memories' && (
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1e40af] mb-6 leading-tight">
              Recent Memories
            </h2>

            {/* Timeline - Full Width */}
            <div className="relative pb-8 min-h-[450px]">
              {/* SVG winding timeline path - smooth curves */}
              <svg className="absolute left-0 top-0 w-full h-full pointer-events-none" preserveAspectRatio="none" style={{ zIndex: 0 }}>
                <path
                  d="M 80 80
                     C 250 80, 250 200, 420 200
                     S 590 80, 760 80
                     S 930 200, 1100 200
                     S 1270 80, 1440 80"
                  stroke="#1e40af"
                  strokeWidth="3"
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              {/* Memory items - positioned along the curve */}
              <div className="relative" style={{ zIndex: 1 }}>
                {isLoading ? (
                  <div className="text-center py-20">
                    <p className="text-gray-500">Loading memories...</p>
                  </div>
                ) : memories.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-gray-500">No memories yet. Add your first memory!</p>
                  </div>
                ) : (
                  memories.slice().reverse().map((memory, index) => {
                    // Positions along the timeline - adjusted to prevent overlap
                    // Most recent (Yesterday) on left, oldest (5 days ago) on right
                    const positions = [
                      { left: '3%', top: '20px' },      // Memory 5 (Yesterday) - left, top
                      { left: '23%', top: '170px' },    // Memory 4 (2 days ago) - left-center, bottom
                      { left: '48%', top: '20px' },     // Memory 3 (3 days ago) - center, top
                      { left: '73%', top: '170px' },    // Memory 2 (4 days ago) - right-center, bottom
                      { right: '3%', top: '20px' },     // Memory 1 (5 days ago) - far right, top
                    ];

                    const isBottom = index % 2 === 1;
                    const position = positions[index % positions.length];

                    return (
                      <div
                        key={memory._id}
                        className="absolute"
                        style={position}
                      >
                        <div className={`flex ${isBottom ? 'flex-col' : 'flex-col-reverse'} items-center gap-3`}>
                          {/* Circle with placeholder image */}
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-4 border-white shadow-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {memory.imageUrl ? (
                              <Image src={memory.imageUrl} alt="Memory" fill className="object-cover" />
                            ) : (
                              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>

                          {/* Memory content */}
                          <div className="bg-white rounded-lg shadow-md p-4 w-52 hover:shadow-lg transition">
                            <p className="text-xs text-[#1e40af] font-semibold mb-2">{formatDate(memory.date)}</p>
                            <p className="text-sm text-gray-700 line-clamp-2">{memory.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 max-w-2xl mx-auto mt-8">
              <button
                onClick={() => setShowAddMemoryModal(true)}
                className="flex-1 px-6 py-3 bg-[#1e40af] text-white rounded-full font-medium hover:bg-[#1e3a8a] transition shadow-md hover:shadow-lg"
              >
                + Add Memory
              </button>
              <button
                onClick={() => setShowAllMemoriesModal(true)}
                className="flex-1 px-6 py-3 bg-white text-[#1e40af] border-2 border-[#1e40af] rounded-full font-medium hover:bg-[#1e40af] hover:text-white transition shadow-md hover:shadow-lg"
              >
                View All Memories
              </button>
            </div>
          </div>
        )}

        {activeTab === 'journal' && (
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1e40af] mb-2 leading-tight">
              Journal
            </h2>

            <div className="grid lg:grid-cols-[1fr_400px] gap-6">
              {/* Left: New Entry Form */}
              <div className="bg-white rounded-xl shadow-lg p-5">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">New Entry</h3>

                <div className="space-y-3">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      placeholder="Give your entry a title..."
                      value={newJournalTitle}
                      onChange={(e) => setNewJournalTitle(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e40af] focus:border-transparent"
                    />
                  </div>

                  {/* Journal Text Area with Microphone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Your thoughts</label>
                    <div className="relative">
                      <textarea
                        rows={8}
                        placeholder="Write about your day, feelings, or anything on your mind..."
                        value={newJournalContent}
                        onChange={(e) => setNewJournalContent(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e40af] focus:border-transparent resize-none pr-14"
                      />
                      {/* Microphone Button */}
                      <button
                        type="button"
                        onClick={toggleRecording}
                        className={`absolute right-3 bottom-3 p-3 rounded-full transition ${
                          isRecording
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={isRecording ? 'Stop recording' : 'Start voice recording'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                          />
                        </svg>
                      </button>
                    </div>
                    {isRecording && (
                      <p className="text-sm text-red-500 mt-2 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        Recording in progress...
                      </p>
                    )}
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleAddJournalEntry}
                    className="w-full px-6 py-3 bg-[#1e40af] text-white rounded-full font-medium hover:bg-[#1e3a8a] transition shadow-md hover:shadow-lg"
                  >
                    Save Entry
                  </button>
                </div>
              </div>

              {/* Right: Recent Entries */}
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Recent Entries</h3>

                {isLoading ? (
                  <p className="text-sm text-gray-500">Loading entries...</p>
                ) : journalEntries.length === 0 ? (
                  <p className="text-sm text-gray-500">No journal entries yet. Write your first one!</p>
                ) : (
                  journalEntries.map((entry, index) => (
                    <div
                      key={entry._id}
                      className={`${
                        index === 0 ? 'border-l-4 border-[#1e40af]' : 'border-l-4 border-gray-300'
                      } pl-4 py-3 bg-white rounded-r-lg shadow-sm hover:shadow-md transition cursor-pointer`}
                    >
                      <h4 className="font-semibold text-gray-900 text-base mb-1">{entry.title}</h4>
                      <span className="text-xs text-gray-500">{formatDate(entry.createdAt)}</span>
                      <p className="text-sm text-gray-700 leading-relaxed mt-2 line-clamp-3">
                        {entry.content}
                      </p>
                    </div>
                  ))
                )}

                <button
                  onClick={() => setShowNewJournalModal(true)}
                  className="w-full px-4 py-3 text-[#1e40af] border-2 border-[#1e40af] rounded-full font-medium hover:bg-[#1e40af] hover:text-white transition text-sm"
                >
                  View All Entries
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1e40af] mb-6 leading-tight">
              Contacts
            </h2>

            {/* Care Team Section */}
            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Your Care Team</h3>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {careTeam.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-[#1e40af] hover:shadow-lg transition"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-semibold text-[#1e40af]">{member.initials}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-lg mb-1">{member.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{member.role}</p>
                        <a
                          href={`tel:${member.phone}`}
                          className="inline-flex items-center gap-2 text-sm text-[#1e40af] hover:text-[#1e3a8a] font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          {member.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Family Section */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Family</h3>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {familyMembers.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-[#1e40af] hover:shadow-lg transition"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-semibold text-purple-700">{member.initials}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-lg mb-1">{member.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{member.relation}</p>
                        <a
                          href={`tel:${member.phone}`}
                          className="inline-flex items-center gap-2 text-sm text-[#1e40af] hover:text-[#1e3a8a] font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          {member.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1e40af] mb-8 leading-tight">
              Settings
            </h2>

            <div className="max-w-2xl space-y-8">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg mb-4">Notifications</h3>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 rounded text-[#1e40af]" defaultChecked />
                  <span className="text-gray-700">Email notifications</span>
                </label>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 text-lg mb-4">Privacy</h3>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 rounded text-[#1e40af]" defaultChecked />
                  <span className="text-gray-700">Share memories with care team</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* View All Memories Modal */}
      {showAllMemoriesModal && !selectedMemory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-3xl font-bold text-[#1e40af]">All Memories</h3>
                <button
                  onClick={() => setShowAllMemoriesModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Memory Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {memories.length === 0 ? (
                  <p className="text-gray-500 col-span-3">No memories yet. Add your first memory!</p>
                ) : (
                  memories.slice().reverse().map((memory) => (
                    <button
                      key={memory._id}
                      onClick={() => setSelectedMemory(memory._id)}
                      className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-[#1e40af] hover:shadow-lg transition group text-left"
                    >
                      {/* Image */}
                      <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                        {memory.imageUrl ? (
                          <Image src={memory.imageUrl} alt="Memory" fill className="object-cover" />
                        ) : (
                          <svg className="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      {/* Content */}
                      <div className="p-4">
                        <p className="text-sm text-[#1e40af] font-semibold mb-2">{formatDate(memory.date)}</p>
                        <p className="text-sm text-gray-700 line-clamp-3">{memory.description}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Memory Detail Modal */}
      {showAllMemoriesModal && selectedMemory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setSelectedMemory(null)}
                  className="flex items-center gap-2 text-gray-600 hover:text-[#1e40af] transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <button
                  onClick={() => {
                    setSelectedMemory(null);
                    setShowAllMemoriesModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Memory Details */}
              {(() => {
                const memory = memories.find(m => m._id === selectedMemory);
                if (!memory) return null;

                return (
                  <div className="space-y-6">
                    {/* Image */}
                    <div className="relative h-96 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center overflow-hidden">
                      {memory.imageUrl ? (
                        <Image src={memory.imageUrl} alt="Memory" fill className="object-cover" />
                      ) : (
                        <svg className="w-24 h-24 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>

                    {/* Date */}
                    <div>
                      <p className="text-sm font-semibold text-gray-500 mb-1">DATE</p>
                      <p className="text-lg text-[#1e40af] font-semibold">{formatDate(memory.date)}</p>
                    </div>

                    {/* Description */}
                    <div>
                      <p className="text-sm font-semibold text-gray-500 mb-2">DESCRIPTION</p>
                      <p className="text-base text-gray-700 leading-relaxed">{memory.description}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                      <button className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition">
                        Edit
                      </button>
                      <button className="flex-1 px-6 py-3 border-2 border-red-300 text-red-600 rounded-full font-medium hover:bg-red-50 transition">
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Add Memory Modal */}
      {showAddMemoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-3xl font-bold text-[#1e40af]">Add New Memory</h3>
                <button
                  onClick={() => setShowAddMemoryModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Picture Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="memory-file-upload"
                  />
                  <label
                    htmlFor="memory-file-upload"
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-[#1e40af] transition flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <svg className="w-12 h-12 text-gray-400 group-hover:text-[#1e40af] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-sm text-gray-500 group-hover:text-[#1e40af] transition">
                      {newMemoryFile ? newMemoryFile.name : 'Click to upload photo'}
                    </span>
                  </label>
                </div>

                {/* Date & Time */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">When did this happen?</label>
                  <input
                    type="datetime-local"
                    value={newMemoryDate}
                    onChange={(e) => setNewMemoryDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e40af] focus:border-transparent"
                  />
                </div>

                {/* Journal Entry */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">What happened?</label>
                  <textarea
                    rows={6}
                    placeholder="Describe your memory..."
                    value={newMemoryDescription}
                    onChange={(e) => setNewMemoryDescription(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e40af] focus:border-transparent resize-none"
                  />
                </div>

                {/* Mood Selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">How did you feel?</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'happy', label: 'Happy', emoji: '😊' },
                      { value: 'calm', label: 'Calm', emoji: '😌' },
                      { value: 'excited', label: 'Excited', emoji: '🤗' },
                      { value: 'grateful', label: 'Grateful', emoji: '🙏' },
                      { value: 'peaceful', label: 'Peaceful', emoji: '😇' },
                      { value: 'loved', label: 'Loved', emoji: '❤️' },
                    ].map((mood) => (
                      <button
                        key={mood.value}
                        type="button"
                        className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-lg hover:border-[#1e40af] hover:bg-blue-50 transition"
                      >
                        <span className="text-3xl">{mood.emoji}</span>
                        <span className="text-xs font-medium text-gray-700">{mood.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowAddMemoryModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMemory}
                    className="flex-1 px-6 py-3 bg-[#1e40af] text-white rounded-full font-medium hover:bg-[#1e3a8a] transition shadow-md hover:shadow-lg"
                  >
                    Add Memory
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Journal Entry Modal */}
      {showNewJournalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-3xl font-bold text-[#1e40af]">New Journal Entry</h3>
                <button
                  onClick={() => {
                    setShowNewJournalModal(false);
                    setIsRecording(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    placeholder="Give your entry a title..."
                    value={newJournalTitle}
                    onChange={(e) => setNewJournalTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e40af] focus:border-transparent"
                  />
                </div>

                {/* Journal Text Area with Microphone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Your thoughts</label>
                  <div className="relative">
                    <textarea
                      rows={10}
                      placeholder="Write about your day, feelings, or anything on your mind..."
                      value={newJournalContent}
                      onChange={(e) => setNewJournalContent(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e40af] focus:border-transparent resize-none pr-14"
                    />
                    {/* Microphone Button */}
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`absolute right-3 bottom-3 p-3 rounded-full transition ${
                        isRecording
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={isRecording ? 'Stop recording' : 'Start voice recording'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                      </svg>
                    </button>
                  </div>
                  {isRecording && (
                    <p className="text-sm text-red-500 mt-2 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      Recording in progress...
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => {
                      setShowNewJournalModal(false);
                      setIsRecording(false);
                    }}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddJournalEntry}
                    className="flex-1 px-6 py-3 bg-[#1e40af] text-white rounded-full font-medium hover:bg-[#1e3a8a] transition shadow-md hover:shadow-lg"
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
