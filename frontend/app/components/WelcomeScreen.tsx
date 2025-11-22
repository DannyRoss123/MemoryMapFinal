'use client';

import { useEffect, useState } from 'react';

interface WelcomeScreenProps {
  userName: string;
  onComplete: () => void;
}

export default function WelcomeScreen({ userName, onComplete }: WelcomeScreenProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [showText, setShowText] = useState(true);
  const fullText = `Welcome, ${userName}`;

  useEffect(() => {
    let currentIndex = 0;

    // Typing animation
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);

        // Wait 2 seconds after typing completes, then fade out
        setTimeout(() => {
          setShowText(false);

          // Wait for fade out animation to complete (600ms), then call onComplete
          setTimeout(() => {
            onComplete();
          }, 600);
        }, 2000);
      }
    }, 80); // Typing speed: 80ms per character

    return () => clearInterval(typingInterval);
  }, [fullText, onComplete]);

  return (
    <div
      className={`min-h-screen bg-gradient-to-b from-[#d4e9f7] to-[#f5fbff] flex items-center justify-center transition-opacity duration-600 ${
        showText ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <h1 className="text-5xl md:text-6xl font-bold text-[#0f6abf]">
        {displayedText}
        <span className="animate-pulse">|</span>
      </h1>
    </div>
  );
}
