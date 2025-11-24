'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/context/UserContext';
import { patientApi, type Memory } from '@/lib/api';

export default function MemoriesPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    const loadMemories = async () => {
      if (!user?.userId) return;
      setLoading(true);
      setError('');
      try {
        const data = await patientApi.getMemories(user.userId);
        setMemories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load memories');
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId) {
      loadMemories();
    }
  }, [user?.userId]);

  const latestMemory = useMemo(() => memories[0] || null, [memories]);

  const formatDate = (value?: string) => {
    if (!value) return 'Date unavailable';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Date unavailable';
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleCreateMemory = async () => {
    if (!user?.userId || !description.trim()) return;
    setIsSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('description', description.trim());
      formData.append('date', date ? new Date(date).toISOString() : new Date().toISOString());
      if (file) {
        formData.append('file', file);
      }
      const created = await patientApi.createMemory(user.userId, formData);
      setMemories((prev) => [created, ...prev]);
      setDescription('');
      setDate('');
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create memory');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.userId) return;
    try {
      await patientApi.deleteMemory(user.userId, id);
      setMemories((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete memory');
    }
  };

  if (isLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center text-[#0b4e88]">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-r from-[#e6f2ff] via-white to-[#d9ecff] px-6 py-8 rounded-b-3xl shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col gap-3">
          <h1 className="text-3xl md:text-4xl font-semibold text-[#0b4e88]">Memories</h1>
          <p className="text-base text-[#1d3b53]/80">Upload photos or videos and keep your latest memory highlighted.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Create memory */}
        <div className="rounded-3xl border border-[#dbe9fb] bg-white shadow-sm p-5 space-y-4">
          <h2 className="text-xl font-semibold text-[#0b4e88]">Add a memory</h2>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0b4e88]">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-2xl border border-[#d0e3f7] bg-white px-4 py-3 text-base text-[#0d3b66] focus:ring-2 focus:ring-[#4a8fe2] focus:outline-none"
                rows={3}
                placeholder="What do you want to remember?"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0b4e88]">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border border-[#d0e3f7] bg-white px-4 py-3 text-base text-[#0d3b66] focus:ring-2 focus:ring-[#4a8fe2] focus:outline-none"
              />
              <label className="text-sm font-medium text-[#0b4e88] block mt-4">Upload</label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-sm text-[#0d3b66]"
              />
            </div>
          </div>
          <button
            onClick={handleCreateMemory}
            disabled={isSaving}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#5aa9f7] to-[#4a8fe2] text-white font-semibold shadow-md hover:shadow-lg hover:brightness-105 transition disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save memory'}
          </button>
        </div>

        {/* Latest memory highlight */}
        <div className="rounded-3xl border border-[#dbe9fb] bg-white shadow-sm p-5">
          <h2 className="text-xl font-semibold text-[#0b4e88] mb-4">Latest memory</h2>
          <div className="flex flex-wrap gap-8 items-start">
            <div className="relative h-80 w-80 md:h-96 md:w-96 rounded-full border-4 border-[#4a8fe2] overflow-hidden shadow-lg">
              {latestMemory ? (
                <Image
                  src={latestMemory.url || '/older person memory.png'}
                  alt={latestMemory.title || 'Latest memory'}
                  fill
                  className="object-cover"
                />
              ) : (
                <Image src="/older person memory.png" alt="Placeholder" fill className="object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-[260px] space-y-3">
              <div className="rounded-2xl border border-[#dbe9fb] bg-[#f8fafc] p-4">
                <p className="text-sm text-gray-500 mb-2">
                  {formatDate(latestMemory?.createdAt || latestMemory?.date)}
                </p>
                <p className="text-base text-[#1d3b53]">
                  {latestMemory?.description || latestMemory?.title || 'Add a memory to see it here.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* All memories grid */}
        <div className="rounded-3xl border border-[#dbe9fb] bg-white shadow-sm p-5">
          <h2 className="text-xl font-semibold text-[#0b4e88] mb-4">All memories</h2>
          {memories.length === 0 ? (
            <p className="text-sm text-[#1d3b53]/70">No memories yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {memories.map((memory) => (
                <div key={memory._id} className="relative rounded-2xl border border-[#dbe9fb] bg-white shadow-sm p-4 space-y-3">
                  <button
                    onClick={() => handleDelete(memory._id)}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center font-bold"
                    aria-label="Delete memory"
                  >
                    ×
                  </button>
                  <div className="relative h-72 w-72 mx-auto rounded-full overflow-hidden border-4 border-[#4a8fe2]">
                    <Image
                      src={memory.url || '/older person memory.png'}
                      alt={memory.title || 'Memory'}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-sm text-gray-500">{formatDate(memory.createdAt || memory.date)}</p>
                  <p className="text-base text-[#1d3b53]">{memory.description || memory.title || 'No description'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
