import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import bgMusicUrl from '../assets/bg-audio.mp3';

/**
 * SoundContext - Web Audio API Synthesizer & Background Music Orchestrator
 * Demonstrates Theme 2: Event-Driven Programming
 * Translates UI and Game events into real-time acoustic events,
 * and maintains immersive ocean ambiance with continuous looping music.
 */
const SoundContext = createContext(null);

export const SoundProvider = ({ children }) => {
  // Sound FX toggle
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('fish_quest_sound') !== 'false';
  });

  // Background Music toggle
  const [musicEnabled, setMusicEnabled] = useState(() => {
    return localStorage.getItem('fish_quest_music') !== 'false';
  });

  // Music Volume (0.0 to 1.0)
  const [musicVolume, setMusicVolumeState] = useState(() => {
    const saved = localStorage.getItem('fish_quest_music_volume');
    return saved !== null ? parseFloat(saved) : 0.35;
  });

  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // Audio Context for synthesized sound FX
  const audioCtxRef = useRef(null);

  // Audio Element for looping background music
  const bgAudioRef = useRef(null);

  // Initialize background music Audio element
  useEffect(() => {
    const audio = new Audio(bgMusicUrl);
    audio.loop = true;
    audio.volume = musicVolume;
    audio.preload = 'auto';
    bgAudioRef.current = audio;

    const handlePlay = () => setIsMusicPlaying(true);
    const handlePause = () => setIsMusicPlaying(false);
    const handleError = (e) => {
      console.warn('Background audio playback notice:', e);
      setIsMusicPlaying(false);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    // Function to safely attempt play
    const tryPlayMusic = () => {
      if (!audio || !musicEnabled) return;
      audio.play().then(() => {
        setIsMusicPlaying(true);
      }).catch(() => {
        // Autoplay policy prevented playback until user interaction
        setIsMusicPlaying(false);
      });
    };

    // User gesture unlocker (resolves browser autoplay policy)
    const unlockAudioOnGesture = () => {
      if (musicEnabled && audio.paused) {
        tryPlayMusic();
      }
      // Also resume web audio context if suspended
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      // Remove one-time gesture listeners
      window.removeEventListener('click', unlockAudioOnGesture);
      window.removeEventListener('keydown', unlockAudioOnGesture);
      window.removeEventListener('touchstart', unlockAudioOnGesture);
    };

    window.addEventListener('click', unlockAudioOnGesture);
    window.addEventListener('keydown', unlockAudioOnGesture);
    window.addEventListener('touchstart', unlockAudioOnGesture);

    // Initial attempt in case user already interacted
    tryPlayMusic();

    return () => {
      window.removeEventListener('click', unlockAudioOnGesture);
      window.removeEventListener('keydown', unlockAudioOnGesture);
      window.removeEventListener('touchstart', unlockAudioOnGesture);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // React to musicEnabled state changes
  useEffect(() => {
    const audio = bgAudioRef.current;
    if (!audio) return;

    if (musicEnabled) {
      audio.volume = musicVolume;
      audio.play().then(() => {
        setIsMusicPlaying(true);
      }).catch((err) => {
        // Will be resumed on user gesture
        setIsMusicPlaying(false);
      });
    } else {
      audio.pause();
      setIsMusicPlaying(false);
    }
  }, [musicEnabled]);

  // React to volume changes
  const setMusicVolume = (vol) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setMusicVolumeState(clamped);
    localStorage.setItem('fish_quest_music_volume', String(clamped));
    if (bgAudioRef.current) {
      bgAudioRef.current.volume = clamped;
    }
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('fish_quest_sound', String(next));
      return next;
    });
  };

  const toggleMusic = () => {
    setMusicEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('fish_quest_music', String(next));
      if (!next && bgAudioRef.current) {
        bgAudioRef.current.pause();
      } else if (next && bgAudioRef.current) {
        bgAudioRef.current.volume = musicVolume;
        bgAudioRef.current.play().catch(() => {});
      }
      return next;
    });
  };

  // Web Audio Context Synthesizer helper
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // 1. Water Bubble Pop Event
  const playBubblePop = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      // Audio fallback
    }
  };

  // 2. Correct Guess Event (Joyful Chime)
  const playCorrect = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = ctx.currentTime;

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.07);

        gain.gain.setValueAtTime(0.25, now + index * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.07 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.07);
        osc.stop(now + index * 0.07 + 0.25);
      });
    } catch (e) {}
  };

  // 3. Incorrect Guess Event (Subtle Buzz)
  const playWrong = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.25);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  };

  // 4. Streak / Combo Event (Ascending Sweep)
  const playStreak = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  };

  // 5. Game Over Event (Gentle Splash)
  const playGameOver = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [392.0, 349.23, 311.13, 261.63]; // G4, F4, Eb4, C4
      const now = ctx.currentTime;

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.12);

        gain.gain.setValueAtTime(0.2, now + index * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.12);
        osc.stop(now + index * 0.12 + 0.35);
      });
    } catch (e) {}
  };

  return (
    <SoundContext.Provider
      value={{
        soundEnabled,
        toggleSound,
        musicEnabled,
        toggleMusic,
        musicVolume,
        setMusicVolume,
        isMusicPlaying,
        playBubblePop,
        playCorrect,
        playWrong,
        playStreak,
        playGameOver
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => useContext(SoundContext);
