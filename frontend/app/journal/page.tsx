"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "../components/DashboardHeader";
import { useUser } from "../context/UserContext";

type JournalEntry = {
  id: string;
  text: string;
  title?: string;
  createdAt: Date;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt?: string;
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");

export default function JournalPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [entryText, setEntryText] = useState("");
  const [error, setError] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const [isChatRecording, setIsChatRecording] = useState(false);
  const [isChatTranscribing, setIsChatTranscribing] = useState(false);
  const [chatVoiceError, setChatVoiceError] = useState("");
  const chatRecorderRef = useRef<MediaRecorder | null>(null);
  const chatStreamRef = useRef<MediaStream | null>(null);
  const chatChunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  const activeEntry = useMemo(
    () => entries.find((entry) => entry.id === activeEntryId) || null,
    [activeEntryId, entries]
  );

  const formattedEntries = useMemo(
    () =>
      entries
        .slice()
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((entry) => ({
          ...entry,
          dateLabel: entry.createdAt.toLocaleString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }),
        })),
    [entries]
  );

  useEffect(() => {
    const fetchEntries = async () => {
      if (!user?.userId) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/journal?patientId=${user.userId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch journal entries");
        }
        const data = await res.json();
        const mapped = (data || []).map((entry: any) => ({
          id: entry._id,
          text: entry.content,
          title: entry.title,
          createdAt: entry.date ? new Date(entry.date) : new Date(entry.createdAt || Date.now()),
        }));
        setEntries(mapped);
      } catch (err) {
        console.error(err);
      }
    };

    fetchEntries();
  }, [user?.userId]);

  const loadMessages = async (entry: JournalEntry, { autoAsk }: { autoAsk: boolean }) => {
    setChatLoading(true);
    setChatError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/journal/${entry.id}/messages`);
      if (res.ok) {
        const data = await res.json();
        const mapped: ChatMessage[] = (data || []).map((m: any) => ({
          id: crypto.randomUUID(),
          role: m.role,
          text: m.text,
          createdAt: m.createdAt,
        }));
        if (mapped.length > 0) {
          setChatMessages(mapped);
          setChatLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error(err);
    }

    const entryMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: entry.text,
    };
    setChatMessages([entryMessage]);
    if (autoAsk) {
      sendToAssistant(entry, [entryMessage]);
    }
    setChatLoading(false);
  };

  const sendToAssistant = async (entry: JournalEntry, messages: ChatMessage[]) => {
    setIsSending(true);
    setChatError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/journal/${entry.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryText: entry.text,
          messages: messages.map((m) => ({
            role: m.role,
            text: m.text,
            createdAt: m.createdAt,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get AI response");
      }
      const data = await res.json();
      const updated = (data?.messages || []).map((m: any) => ({
        id: crypto.randomUUID(),
        role: m.role,
        text: m.text,
        createdAt: m.createdAt,
      }));
      if (updated.length > 0) {
        setChatMessages(updated);
      } else if (data?.reply) {
        setChatMessages((prev) => [...messages, { id: crypto.randomUUID(), role: "assistant", text: data.reply }]);
      }
    } catch (err) {
      console.error(err);
      setChatError("Unable to get a response right now. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const startConversation = (entry: JournalEntry, { autoAsk }: { autoAsk: boolean }) => {
    setActiveEntryId(entry.id);
    setChatOpen(true);
    loadMessages(entry, { autoAsk });
  };

  const handleSaveEntry = async () => {
    const trimmed = entryText.trim();
    if (!trimmed) {
      setError("Please write a few words before saving.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const payload = {
        patientId: user?.userId,
        content: trimmed,
        title: trimmed.split("\n")[0].slice(0, 80),
        date: new Date().toISOString(),
      };
      const res = await fetch(`${API_BASE_URL}/api/journal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to save entry");
      }
      const data = await res.json();
      const savedEntry: JournalEntry = {
        id: data._id,
        text: data.content,
        title: data.title,
        createdAt: data.date ? new Date(data.date) : new Date(data.createdAt || Date.now()),
      };
      setEntries((prev) => [...prev, savedEntry]);
      setEntryText("");
      startConversation(savedEntry, { autoAsk: true });
    } catch (err: any) {
      setError(err?.message || "Could not save entry");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendChat = () => {
    if (!activeEntry || isSending) return;
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
    };

    const pendingMessages = [...chatMessages, userMessage];
    setChatMessages(pendingMessages);
    setChatInput("");
    sendToAssistant(activeEntry, pendingMessages);
  };

  const sendAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    setVoiceError("");
    try {
      const formData = new FormData();
      formData.append("audio", blob, "voice-entry.webm");

      const res = await fetch(`${API_BASE_URL}/api/journal/voice/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to transcribe audio");
      }

      const data = await res.json();
      const text = data?.text || "";
      if (text) {
        setEntryText((prev) => (prev ? `${prev}\n${text}` : text));
      }
    } catch (err) {
      console.error(err);
      setVoiceError("Unable to transcribe. Please try again.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const startVoiceRecording = async () => {
    setVoiceError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
        sendAudio(audioBlob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      setVoiceError("Microphone access was denied or unavailable.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendChatAudio = async (blob: Blob) => {
    setIsChatTranscribing(true);
    setChatVoiceError("");
    try {
      const formData = new FormData();
      formData.append("audio", blob, "chat-entry.webm");

      const res = await fetch(`${API_BASE_URL}/api/journal/voice/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to transcribe audio");
      }

      const data = await res.json();
      const text = data?.text || "";
      if (text) {
        setChatInput((prev) => (prev ? `${prev} ${text}` : text));
      }
    } catch (err) {
      console.error(err);
      setChatVoiceError("Unable to transcribe. Please try again.");
    } finally {
      setIsChatTranscribing(false);
    }
  };

  const startChatVoiceRecording = async () => {
    setChatVoiceError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chatStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chatChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chatChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chatChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        chatStreamRef.current = null;
        sendChatAudio(audioBlob);
      };

      recorder.start();
      chatRecorderRef.current = recorder;
      setIsChatRecording(true);
    } catch (err) {
      console.error(err);
      setChatVoiceError("Microphone access was denied or unavailable.");
    }
  };

  const stopChatVoiceRecording = () => {
    if (chatRecorderRef.current && chatRecorderRef.current.state === "recording") {
      chatRecorderRef.current.stop();
      setIsChatRecording(false);
    }
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (chatRecorderRef.current && chatRecorderRef.current.state === "recording") {
        chatRecorderRef.current.stop();
      }
      if (chatStreamRef.current) {
        chatStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Entry composer */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Journal</h2>
              <p className="text-gray-600 mb-6">
                Capture what’s on your mind and open a supportive chat about your feelings.
              </p>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700" htmlFor="journal-entry">
                  How are you feeling today?
                </label>
                <textarea
                  id="journal-entry"
                  value={entryText}
                  onChange={(e) => setEntryText(e.target.value)}
                  rows={6}
                  placeholder="Write freely about your day..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                {voiceError && <p className="text-sm text-red-600">{voiceError}</p>}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-gray-500">
                    Your entry stays private. Share as much or as little as you’d like.
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                      disabled={isSaving || isTranscribing}
                      className={`px-4 py-3 rounded-xl font-semibold shadow-sm border ${
                        isRecording
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-white text-gray-800 border-gray-200 hover:border-blue-300"
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {isRecording ? "Stop Recording" : "Voice Entry"}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEntry}
                      disabled={isSaving}
                      className="px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-sm hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSaving ? "Saving..." : "Save entry & talk about it"}
                    </button>
                  </div>
                </div>
                {isTranscribing && (
                  <p className="text-sm text-gray-500">Transcribing your voice entry...</p>
                )}
              </div>
            </div>

            {/* Previous entries */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Recent entries</h3>
                <span className="text-sm text-gray-500">{entries.length} total</span>
              </div>

              {formattedEntries.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                  No entries yet. Start with a few sentences above.
                </div>
              ) : (
                <div className="space-y-3">
                  {formattedEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="border border-gray-200 rounded-xl p-4 hover:border-blue-200 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="text-sm text-gray-500">{entry.dateLabel}</div>
                          <p className="text-gray-900 leading-relaxed">
                            {entry.text.length > 220 ? `${entry.text.slice(0, 220)}…` : entry.text}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => startConversation(entry, { autoAsk: false })}
                          className="flex-shrink-0 px-3 py-2 text-sm font-medium text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-50"
                        >
                          Chat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tips sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-3">
              <h4 className="text-lg font-semibold text-gray-900">Journaling prompts</h4>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 text-sm">
                <li>What felt heavy or light today?</li>
                <li>Was there a moment you felt proud?</li>
                <li>Who or what supported you?</li>
                <li>What do you need tomorrow?</li>
              </ul>
            </div>
            <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 text-sm text-blue-900 space-y-2">
              <p className="font-semibold">Tip</p>
              <p>
                Keep entries short and honest. The AI chat can help explore how you feel and suggest
                gentle next steps.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Chat modal */}
      {chatOpen && activeEntry && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] h-[90vh] flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 h-full min-h-0">
              {/* Entry summary column */}
              <div className="bg-gray-50 border-r border-gray-200 p-6 flex flex-col gap-4 min-h-0 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  className="text-sm text-gray-500 flex items-center gap-2 hover:text-gray-700"
                >
                  ← Back
                </button>
                <div className="text-xs uppercase text-gray-500 font-semibold">
                  {activeEntry.createdAt.toLocaleString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{activeEntry.title || "Daily Journal"}</h3>
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-100 px-3 py-1 rounded-full mt-2">
                    ✨ Reflected
                  </span>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                  <p className="text-gray-900 leading-relaxed whitespace-pre-line">{activeEntry.text}</p>
                </div>
              </div>

              {/* Chat column */}
              <div className="flex flex-col h-full min-h-0">
                <div className="px-6 pt-6 pb-3 border-b border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900">Guided Conversation</h4>
                  <p className="text-sm text-gray-500">
                    Share more about this entry. Your companion will ask gentle follow-up questions.
                  </p>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4 bg-white">
                  {chatLoading && (
                    <div className="text-sm text-gray-500">Loading conversation...</div>
                  )}
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                          message.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-50 border border-gray-200 text-gray-900"
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}
                  {isSending && (
                    <div className="text-sm text-gray-500">Thinking of a helpful response...</div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {chatError && (
                  <div className="px-6">
                    <div className="mb-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {chatError}
                    </div>
                  </div>
                )}
                {chatVoiceError && (
                  <div className="px-6">
                    <div className="mb-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {chatVoiceError}
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={isChatRecording ? stopChatVoiceRecording : startChatVoiceRecording}
                      disabled={isChatTranscribing || isSending}
                      className={`px-3 py-3 rounded-xl border font-semibold ${
                        isChatRecording
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-white text-gray-800 border-gray-300 hover:border-blue-300"
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                      aria-label="Voice chat entry"
                    >
                      {isChatRecording ? "Stop" : "🎤"}
                    </button>
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChat();
                        }
                      }}
                      placeholder="Continue the conversation..."
                      className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleSendChat}
                      disabled={isSending || isChatTranscribing}
                      className="px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-sm hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSending ? "Sending..." : isChatTranscribing ? "Transcribing..." : "Send"}
                    </button>
                  </div>
                  {isChatTranscribing && (
                    <p className="mt-2 text-sm text-gray-500">Transcribing your voice message...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
