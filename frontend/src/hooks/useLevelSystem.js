import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';

/**
 * useLevelProgress - Manages 100-Level progression state.
 * Fetches the player's progress from MongoDB on mount,
 * and provides helpers to start and submit level attempts.
 * Theme 1: High Cohesion (Dedicated entirely to level-mode state)
 * Theme 4: Virtual Identity (Linked to authenticated user in MongoDB)
 */
export function useLevelProgress() {
  const { user } = useAuth();

  const [progress, setProgress] = useState({
    unlockedLevel: 1,
    totalStars: 0,
    completedLevels: 0,
    claimedBonuses: {},
    levels: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProgress = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getLevelProgress();
      if (res.success) {
        setProgress({
          unlockedLevel: res.unlockedLevel || 1,
          totalStars: res.totalStars || 0,
          completedLevels: res.completedLevels || 0,
          claimedBonuses: res.claimedBonuses || {},
          levels: res.levels || {}
        });
      } else {
        setError(res.message || 'Failed to load progress.');
      }
    } catch (err) {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return { progress, loading, error, refreshProgress: fetchProgress };
}

/**
 * useLevelGame - Manages a single level session's gameplay state.
 * Theme 2: Event-Driven (timer ticks, answer events)
 * Theme 3: Interoperability (live fish puzzle from Marc Conrad API)
 */
export function useLevelGame({ onLevelComplete }) {
  const { playBubblePop, playCorrect, playWrong } = useSound();

  // Level game states: 'IDLE' | 'LOADING' | 'PLAYING' | 'SUBMITTING' | 'SUBMITTED'
  const [levelGameState, setLevelGameState] = useState('IDLE');
  const [currentLevel, setCurrentLevel] = useState(null);
  const [levelSessionId, setLevelSessionId] = useState(null);
  const [timeLimit, setTimeLimit] = useState(20);
  const [timeLeft, setTimeLeft] = useState(20);
  const [puzzle, setPuzzle] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [hintAvailable, setHintAvailable] = useState(true);
  const [disabledDigits, setDisabledDigits] = useState([]);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Mutable refs to eliminate stale closures in callbacks & timer ticks
  const gameStateRef = useRef('IDLE');
  const isSubmittingRef = useRef(false);
  const timeLimitRef = useRef(20);
  const timeLeftRef = useRef(20);
  const levelSessionIdRef = useRef(null);
  const selectedAnswerRef = useRef('');
  const isMountedRef = useRef(true);
  const timerRef = useRef(null);

  useEffect(() => { gameStateRef.current = levelGameState; }, [levelGameState]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { selectedAnswerRef.current = selectedAnswer; }, [selectedAnswer]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Starts a new level by calling backend /api/levels/start
  const startLevel = useCallback(async (levelNumber) => {
    if (!isMountedRef.current) return;
    stopTimer();
    isSubmittingRef.current = false;

    setLevelGameState('LOADING');
    setCurrentLevel(levelNumber);
    setSelectedAnswer('');
    selectedAnswerRef.current = '';
    setDisabledDigits([]);
    setHintAvailable(true);
    setResult(null);
    setErrorMsg(null);

    try {
      const res = await api.startLevel(levelNumber);

      if (!isMountedRef.current) return;

      if (res.success) {
        const tl = res.timeLimit || 20;
        setLevelSessionId(res.levelSessionId);
        setTimeLimit(tl);
        setTimeLeft(tl);
        setPuzzle(res.puzzle);
        levelSessionIdRef.current = res.levelSessionId;
        timeLimitRef.current = tl;
        timeLeftRef.current = tl;
        setLevelGameState('PLAYING');
      } else {
        setErrorMsg(res.message || 'Failed to start level.');
        setLevelGameState('IDLE');
      }
    } catch (err) {
      if (isMountedRef.current) {
        setErrorMsg('Connection error. Please try again.');
        setLevelGameState('IDLE');
      }
    }
  }, []);

  // Timer countdown (Theme 2: Event-Driven Programming)
  useEffect(() => {
    if (levelGameState !== 'PLAYING') {
      stopTimer();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          stopTimer();
          // Timeout: submit with -999 to trigger wrong answer
          if (!isSubmittingRef.current && gameStateRef.current === 'PLAYING') {
            isSubmittingRef.current = true;
            handleTimeout();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => stopTimer();
  }, [levelGameState]); // eslint-disable-line

  const handleTimeout = useCallback(async () => {
    if (!isMountedRef.current) return;
    playWrong();

    try {
      const res = await api.submitLevel({
        levelSessionId: levelSessionIdRef.current,
        playerAnswer: -999,
        timeRemaining: 0
      });

      if (!isMountedRef.current) return;
      setLevelGameState('SUBMITTED');
      setResult(res);
      if (onLevelComplete) onLevelComplete(res);
    } catch {
      if (isMountedRef.current) {
        setLevelGameState('IDLE');
        setErrorMsg('Network error on timeout.');
        isSubmittingRef.current = false;
      }
    }
  }, [playWrong, onLevelComplete]);

  // Submit the player's answer (Theme 4: Virtual Identity & Server Score Validation)
  const submitAnswer = useCallback(async (answerVal) => {
    // Resolve guess from parameter or synchronous ref
    const rawGuess = answerVal !== undefined && answerVal !== null ? answerVal : selectedAnswerRef.current;
    if (
      rawGuess === '' ||
      rawGuess === null ||
      rawGuess === undefined ||
      gameStateRef.current !== 'PLAYING' ||
      isSubmittingRef.current
    ) {
      return;
    }

    isSubmittingRef.current = true;
    stopTimer();
    playBubblePop();
    setLevelGameState('SUBMITTING');

    const capturedTimeLeft = timeLeftRef.current;
    const numGuess = Number(rawGuess);

    try {
      const res = await api.submitLevel({
        levelSessionId: levelSessionIdRef.current,
        playerAnswer: numGuess,
        timeRemaining: capturedTimeLeft
      });

      if (!isMountedRef.current) return;

      if (res.correct) {
        playCorrect();
      } else {
        playWrong();
      }

      setLevelGameState('SUBMITTED');
      setResult(res);
      if (onLevelComplete) {
        onLevelComplete(res);
      }
    } catch (err) {
      if (isMountedRef.current) {
        isSubmittingRef.current = false;
        setLevelGameState('PLAYING');
        setErrorMsg('Submission failed. Please check connection and try again.');
      }
    }
  }, [playBubblePop, playCorrect, playWrong, onLevelComplete]);

  // Sonar hint: eliminates 5 wrong digits
  const useSonarHint = useCallback(async () => {
    if (!hintAvailable || gameStateRef.current !== 'PLAYING' || !puzzle?.roundId) return;
    playBubblePop();
    setHintAvailable(false);
    try {
      const res = await api.getSonarHint(puzzle.roundId);
      if (res.success && Array.isArray(res.eliminatedDigits)) {
        setDisabledDigits(res.eliminatedDigits);
      } else {
        setDisabledDigits([0, 1, 8, 9]);
      }
    } catch {
      setDisabledDigits([0, 1, 8, 9]);
    }
  }, [hintAvailable, puzzle, playBubblePop]);

  // Extra Oxygen Hint: adds +10s to timer
  const useExtraAir = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING') return;
    playBubblePop();
    setTimeLeft(prev => Math.min(prev + 10, timeLimitRef.current + 10));
  }, [playBubblePop]);

  const timerPercent = timeLimit > 0 ? Math.max(0, (timeLeft / timeLimit) * 100) : 0;
  const isTimeCritical = timeLeft <= 4;

  return {
    levelGameState,
    currentLevel,
    timeLeft,
    timeLimit,
    timerPercent,
    isTimeCritical,
    puzzle,
    selectedAnswer,
    setSelectedAnswer,
    hintAvailable,
    disabledDigits,
    result,
    errorMsg,
    startLevel,
    submitAnswer,
    useSonarHint,
    useExtraAir
  };
}
