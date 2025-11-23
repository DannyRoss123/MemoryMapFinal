'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/context/UserContext';
import { patientApi } from '@/lib/api';

export default function PatientWelcomePage() {
  const router = useRouter();
  const { user } = useUser();
  const [step, setStep] = useState(1); // 1: Welcome, 2: Mood, 3: Done
  const [selectedMood, setSelectedMood] = useState('');
  const [fadeOut, setFadeOut] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fullText = `Welcome, ${user?.name || 'Guest'}`;

  const moods = [
    { value: 'happy', label: 'Happy', emoji: '😊' },
    { value: 'calm', label: 'Calm', emoji: '😌' },
    { value: 'sad', label: 'Sad', emoji: '😢' },
    { value: 'anxious', label: 'Anxious', emoji: '😰' },
    { value: 'angry', label: 'Angry', emoji: '😠' },
    { value: 'tired', label: 'Tired', emoji: '😴' },
  ];

  // Typewriter effect for welcome text
  useEffect(() => {
    if (step === 1) {
      let index = 0;
      const timer = setInterval(() => {
        if (index <= fullText.length) {
          setDisplayedText(fullText.slice(0, index));
          index++;
        } else {
          clearInterval(timer);
        }
      }, 80); // Speed of typing

      return () => clearInterval(timer);
    }
  }, [step, fullText]);

  // Auto-advance from Welcome screen after typing is done + 1.5 seconds
  useEffect(() => {
    if (step === 1 && displayedText === fullText) {
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setStep(2);
          setFadeOut(false);
        }, 500);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, displayedText, fullText]);

  const handleMoodSubmit = async () => {
    if (!selectedMood || !user?.userId || isSaving) return;

    try {
      setIsSaving(true);

      // Save mood to backend
      await patientApi.createMoodEntry(user.userId, {
        mood: selectedMood,
      });

      // Fade out and navigate to dashboard
      setFadeOut(true);
      setTimeout(() => {
        router.push('/patient/dashboard');
      }, 500);
    } catch (error) {
      console.error('Failed to save mood:', error);
      setIsSaving(false);
      // Still navigate even if mood save fails
      setFadeOut(true);
      setTimeout(() => {
        router.push('/patient/dashboard');
      }, 500);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-[#cbe7ff] via-[#e8f3ff] to-[#f5fbff] overflow-hidden">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-white/50 blur-3xl opacity-70" />
        <div className="absolute right-[-6rem] top-0 h-80 w-80 rounded-full bg-white/40 blur-3xl opacity-70" />
        <div className="absolute left-1/3 bottom-[-6rem] h-96 w-96 rounded-full bg-white/30 blur-3xl opacity-60" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        {step === 1 && (
          <div
            className={`transition-opacity duration-500 ${
              fadeOut ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-[#0b4e88]">
              {displayedText}
              <span className="animate-pulse">|</span>
            </h1>
          </div>
        )}

        {step === 2 && (
          <div
            className={`transition-opacity duration-500 ${
              fadeOut ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <h1 className="text-4xl md:text-5xl font-semibold text-[#0b4e88] mb-8">
              How are you feeling today?
            </h1>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto mt-8">
              {moods.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`bg-white/80 backdrop-blur-sm hover:bg-white hover:scale-105 transition-all duration-200 rounded-2xl p-6 shadow-lg border-2 flex flex-col items-center gap-3 ${
                    selectedMood === mood.value
                      ? 'border-[#5b6ef5] bg-white'
                      : 'border-white/60'
                  }`}
                >
                  <span className="text-4xl">{mood.emoji}</span>
                  <span className="text-lg font-medium text-[#0b4e88]">{mood.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={handleMoodSubmit}
              disabled={!selectedMood || isSaving}
              className="mt-8 px-8 py-3 bg-gradient-to-r from-[#5ac2ff] to-[#3f89ff] text-white font-semibold rounded-full shadow-lg hover:shadow-xl hover:brightness-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
