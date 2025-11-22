"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";
import WelcomeScreen from "../components/WelcomeScreen";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"
).replace(/\/$/, "");

type MoodOption = {
  emoji: string;
  label: string;
  value: "HAPPY" | "CALM" | "SAD" | "ANXIOUS" | "ANGRY" | "TIRED";
};

const moodOptions: MoodOption[] = [
  { emoji: "😊", label: "Happy", value: "HAPPY" },
  { emoji: "😌", label: "Calm", value: "CALM" },
  { emoji: "😟", label: "Sad", value: "SAD" },
  { emoji: "😰", label: "Anxious", value: "ANXIOUS" },
  { emoji: "😠", label: "Angry", value: "ANGRY" },
  { emoji: "😴", label: "Tired", value: "TIRED" },
];

export default function MoodCheckPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  const [showMoodCheck, setShowMoodCheck] = useState(false);
  const [checkingMood, setCheckingMood] = useState(true);
  const [moodAlreadyEntered, setMoodAlreadyEntered] = useState(false);

  useEffect(() => {
    // Redirect non-patients to home
    if (!isLoading && user && user.role !== "PATIENT") {
      router.replace("/home");
    }
    // Redirect if not logged in
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  // Check if mood already entered for today
  useEffect(() => {
    const checkTodaysMood = async () => {
      if (!user?.userId) {
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/mood/patient/${user.userId}/today`
        );

        if (response.ok) {
          // Mood already entered today
          setMoodAlreadyEntered(true);
        } else if (response.status === 404) {
          // No mood entry for today, proceed normally
          setMoodAlreadyEntered(false);
        }
      } catch (err) {
        console.error("Error checking mood:", err);
        // On error, proceed normally to allow mood entry
        setMoodAlreadyEntered(false);
      } finally {
        setCheckingMood(false);
      }
    };

    if (user?.userId) {
      checkTodaysMood();
    }
  }, [user?.userId]);

  const handleWelcomeComplete = () => {
    setShowWelcome(false);

    // If mood already entered, go directly to home
    if (moodAlreadyEntered) {
      setTimeout(() => {
        router.push("/home");
      }, 600); // Wait for welcome fade-out
    } else {
      // Small delay before showing mood check for smooth transition
      setTimeout(() => {
        setShowMoodCheck(true);
      }, 100);
    }
  };

  const handleMoodSelect = (mood: MoodOption) => {
    setSelectedMood(mood);
    setError("");
  };

  const handleSubmit = async () => {
    if (!selectedMood) {
      setError("Please select how you are feeling");
      return;
    }

    if (!user?.userId) {
      setError("User not found");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mood`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: user.userId,
          mood: selectedMood.value,
          date: new Date().toISOString(),
          notes: "",
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to save mood");
      }

      // Fade out mood check page before redirecting
      setShowMoodCheck(false);
      setTimeout(() => {
        router.push("/home");
      }, 600); // Wait for fade-out animation
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user || checkingMood) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#d4e9f7] to-[#f5fbff] flex items-center justify-center">
        <div className="text-[#0f6abf] text-xl">Loading...</div>
      </div>
    );
  }

  // Show welcome screen first (it will decide whether to show mood check or go to home)
  if (showWelcome) {
    return (
      <WelcomeScreen userName={user.name} onComplete={handleWelcomeComplete} />
    );
  }

  // Show mood check after welcome completes
  if (!showMoodCheck) {
    return null;
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-b from-[#d4e9f7] to-[#f5fbff] flex items-center justify-center px-4 transition-opacity duration-600 ${
        showMoodCheck ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold text-[#0f6abf] text-center mb-12">
          How are you feeling today?
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {moodOptions.map((mood) => (
            <button
              key={mood.label}
              onClick={() => handleMoodSelect(mood)}
              className={`flex flex-col items-center justify-center p-6 rounded-3xl transition-all transform hover:scale-105 ${
                selectedMood?.label === mood.label
                  ? "bg-white border-4 border-[#0f6abf] shadow-lg"
                  : "bg-white border-2 border-gray-200 hover:border-[#7ec6ff]"
              }`}
            >
              <span className="text-5xl mb-3">{mood.emoji}</span>
              <span className="text-lg font-medium text-[#0f6abf]">
                {mood.label}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-100 border border-red-300">
            <p className="text-red-700 text-center">{error}</p>
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedMood}
            className="px-12 py-4 rounded-full bg-gradient-to-r from-[#5ac2ff] to-[#3f89ff] text-white text-lg font-semibold shadow-lg hover:shadow-xl hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
