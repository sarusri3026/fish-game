import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import confetti from 'canvas-confetti';

const MAX_LIVES = 3;
const ROUND_TIME = 20;

export function useFishGame() {
  const { user, refreshProfile } = useAuth();
  const { playBubblePop, playCorrect, playWrong, playStreak, playGameOver } = useSound();

  // Primary Game States: 'IDLE' | 'LOADING' | 'PLAYING' | 'ROUND_FEEDBACK' | 'GAME_OVER'
  const [gameState, setGameState] = useState('IDLE');
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'correct'|'wrong'|'timeout', message, solution }
  const [hintAvailable, setHintAvailable] = useState(true);
  const [disabledDigits, setDisabledDigits] = useState([]);
  const [stats, setStats] = useState({
    correctAnswers: 0,
    totalGuesses: 0,
    startTime: null,
    highestCombo: 0
  });

  // Mutable Refs to eliminate stale closures and prevent duplicate submissions
  const isMountedRef = useRef(true);
  const gameStateRef = useRef('IDLE');
  const roundRef = useRef(1);
  const scoreRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);
  const comboRef = useRef(0);
  const timeLeftRef = useRef(ROUND_TIME);
  const currentPuzzleRef = useRef(null);
  const sessionIdRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const isGameOverRef = useRef(false);

  const timerIntervalRef = useRef(null);
  const transitionTimeoutRef = useRef(null);

  // Keep refs synchronized with state
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    roundRef.current = round;
  }, [round]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  useEffect(() => {
    comboRef.current = combo;
  }, [combo]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    currentPuzzleRef.current = currentPuzzle;
  }, [currentPuzzle]);

  // Lifecycle Mount / Unmount cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, []);

  const clearAllTimers = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  };

  // Fetch next puzzle from backend proxy (Theme 3 Interoperability)
  const fetchPuzzle = useCallback(async () => {
    if (!isMountedRef.current || isGameOverRef.current) return;

    try {
      setGameState('LOADING');
      const response = await api.getNewRound();

      if (!isMountedRef.current || isGameOverRef.current) return;

      if (response.success && response.puzzle) {
        setCurrentPuzzle(response.puzzle);
        setSelectedAnswer('');
        setTimeLeft(ROUND_TIME);
        setDisabledDigits([]);
        isSubmittingRef.current = false;
        setGameState('PLAYING');
      } else {
        throw new Error(response.message || 'Puzzle not received');
      }
    } catch (err) {
      console.error('Failed to load puzzle:', err);
      if (isMountedRef.current && !isGameOverRef.current) {
        setGameState('IDLE');
      }
    }
  }, []);

  // Finish Game Handler (Safeguarded against duplicate triggers)
  const finishGame = useCallback(
    async (finalScore, finalRound) => {
      if (isGameOverRef.current) return;
      isGameOverRef.current = true;
      clearAllTimers();

      playGameOver();
      if (isMountedRef.current) {
        setGameState('GAME_OVER');
      }

      const verifiedSessionId = sessionIdRef.current;
      const verifiedScore = finalScore !== undefined ? finalScore : scoreRef.current;
      const verifiedRound = finalRound !== undefined ? finalRound : roundRef.current;

      try {
        await api.submitScore({
          sessionId: verifiedSessionId,
          score: verifiedScore,
          roundReached: verifiedRound
        });

        if (user && refreshProfile) {
          refreshProfile();
        }
      } catch (err) {
        console.error('Failed to submit game score:', err);
      }
    },
    [playGameOver, user, refreshProfile]
  );

  // Handle Timeout Event (Safeguarded against stale closure)
  const handleTimeout = useCallback(async () => {
    if (isSubmittingRef.current || isGameOverRef.current || gameStateRef.current !== 'PLAYING') return;
    isSubmittingRef.current = true;

    clearAllTimers();
    playWrong();

    if (isMountedRef.current) {
      setCombo(0);
      setStats((prev) => ({ ...prev, totalGuesses: prev.totalGuesses + 1 }));
    }

    let revealedSolution = '?';
    try {
      const puzzle = currentPuzzleRef.current;
      if (puzzle && puzzle.roundId) {
        const verifyRes = await api.verifyAnswer({
          sessionId: sessionIdRef.current,
          roundId: puzzle.roundId,
          playerAnswer: -999,
          timeRemaining: 0,
          roundNumber: roundRef.current
        });
        if (verifyRes.correctSolution !== undefined) {
          revealedSolution = verifyRes.correctSolution;
        }
      }
    } catch (e) {
      // Ignored
    }

    if (!isMountedRef.current) return;

    setFeedback({
      type: 'timeout',
      message: `Time's up! The answer was ${revealedSolution}.`,
      solution: revealedSolution
    });

    setGameState('ROUND_FEEDBACK');
    transitionTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current || isGameOverRef.current) return;
      setRound((r) => r + 1);
      setFeedback(null);
      fetchPuzzle();
    }, 2000);
  }, [playWrong, fetchPuzzle]);

  // Timer Tick Event (Theme 2: Event-Driven Programming)
  useEffect(() => {
    if (gameState !== 'PLAYING') {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [gameState, handleTimeout]);

  // Start a brand new game
  const startGame = useCallback(async () => {
    playBubblePop();
    clearAllTimers();

    isGameOverRef.current = false;
    isSubmittingRef.current = false;

    setRound(1);
    setScore(0);
    setLives(MAX_LIVES);
    setCombo(0);
    setHintAvailable(true);
    setDisabledDigits([]);
    setFeedback(null);
    setStats({
      correctAnswers: 0,
      totalGuesses: 0,
      startTime: Date.now(),
      highestCombo: 0
    });

    roundRef.current = 1;
    scoreRef.current = 0;
    livesRef.current = MAX_LIVES;
    comboRef.current = 0;

    // Initialize server-side session for score integrity (Task 4)
    try {
      const sessionRes = await api.startSession();
      if (sessionRes.success && sessionRes.sessionId) {
        sessionIdRef.current = sessionRes.sessionId;
      }
    } catch (e) {
      console.warn('Session initialization warning:', e.message);
    }

    fetchPuzzle();
  }, [fetchPuzzle, playBubblePop]);

  // Submit player guess
  const submitAnswer = async (answerVal) => {
    const guess = answerVal !== undefined ? answerVal : selectedAnswer;
    if (
      guess === '' ||
      guess === null ||
      gameStateRef.current !== 'PLAYING' ||
      isSubmittingRef.current ||
      isGameOverRef.current
    ) {
      return;
    }

    isSubmittingRef.current = true;
    clearAllTimers();
    playBubblePop();

    const numGuess = Number(guess);
    const puzzle = currentPuzzleRef.current;
    if (!puzzle || !puzzle.roundId) {
      isSubmittingRef.current = false;
      return;
    }

    try {
      // Theme 3 Interoperability & Theme 4 Session Verification
      const res = await api.verifyAnswer({
        sessionId: sessionIdRef.current,
        roundId: puzzle.roundId,
        playerAnswer: numGuess,
        timeRemaining: timeLeftRef.current,
        roundNumber: roundRef.current
      });

      if (!isMountedRef.current || isGameOverRef.current) return;

      setStats((prev) => ({
        ...prev,
        totalGuesses: prev.totalGuesses + 1
      }));

      if (res.correct) {
        // Correct answer event
        playCorrect();
        const newCombo = comboRef.current + 1;
        comboRef.current = newCombo;
        setCombo(newCombo);

        setStats((prev) => ({
          ...prev,
          correctAnswers: prev.correctAnswers + 1,
          highestCombo: Math.max(prev.highestCombo, newCombo)
        }));

        if (newCombo >= 3) {
          playStreak();
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 }
          });
        }

        // Use server-validated points if available, otherwise calculate
        const multiplier = 1 + (newCombo - 1) * 0.25;
        const timeBonus = timeLeftRef.current * 10;
        const roundPoints = res.sessionUpdate?.pointsAwarded || Math.round((100 + timeBonus) * multiplier);
        const newTotalScore = res.sessionUpdate?.newTotalScore || scoreRef.current + roundPoints;

        scoreRef.current = newTotalScore;
        setScore(newTotalScore);

        setFeedback({
          type: 'correct',
          message: `Awesome! +${roundPoints} pts (Bonus: ${timeBonus} | Streak: ${newCombo}x)`,
          solution: res.correctSolution
        });

        setGameState('ROUND_FEEDBACK');
        transitionTimeoutRef.current = setTimeout(() => {
          if (!isMountedRef.current || isGameOverRef.current) return;
          setRound((r) => r + 1);
          setFeedback(null);
          fetchPuzzle();
        }, 1500);
      } else {
        // Wrong answer event in Free Play (No life penalty)
        playWrong();
        comboRef.current = 0;
        setCombo(0);

        setFeedback({
          type: 'wrong',
          message: `Oops! Not ${numGuess}. The answer was ${res.correctSolution}.`,
          solution: res.correctSolution
        });

        setGameState('ROUND_FEEDBACK');
        transitionTimeoutRef.current = setTimeout(() => {
          if (!isMountedRef.current || isGameOverRef.current) return;
          setRound((r) => r + 1);
          setFeedback(null);
          fetchPuzzle();
        }, 2000);
      }
    } catch (err) {
      console.error('Answer verification failed:', err);
      isSubmittingRef.current = false;
    }
  };

  // Sonar Ping Hint: Uses dedicated backend endpoint without leaking solution
  const useSonarHint = async () => {
    if (
      !hintAvailable ||
      gameStateRef.current !== 'PLAYING' ||
      isSubmittingRef.current ||
      isGameOverRef.current ||
      !currentPuzzle
    ) {
      return;
    }

    playBubblePop();
    setHintAvailable(false);

    try {
      const res = await api.getSonarHint(currentPuzzle.roundId);
      if (res.success && Array.isArray(res.eliminatedDigits)) {
        setDisabledDigits(res.eliminatedDigits);
      } else {
        // Fallback default elimination
        setDisabledDigits([0, 1, 8, 9]);
      }
    } catch (e) {
      setDisabledDigits([0, 1, 8, 9]);
    }
  };

  // Extra Air Hint: Adds +10 seconds
  const useExtraAir = () => {
    if (gameStateRef.current !== 'PLAYING' || isGameOverRef.current) return;
    playBubblePop();
    setTimeLeft((prev) => Math.min(prev + 10, 30));
  };

  // Stop Game: Concludes Free Play session on player command and records final score
  const stopGame = useCallback(() => {
    clearAllTimers();
    isSubmittingRef.current = false;
    if (gameStateRef.current === 'IDLE' || isGameOverRef.current) {
      setGameState('IDLE');
      return;
    }
    finishGame(scoreRef.current, roundRef.current);
  }, [finishGame]);

  // Reset Game: Immediately halts and resets state to IDLE
  const resetGame = useCallback(() => {
    clearAllTimers();
    isSubmittingRef.current = false;
    isGameOverRef.current = false;
    setGameState('IDLE');
    setRound(1);
    setScore(0);
    setCombo(0);
    setFeedback(null);
  }, []);

  return {
    gameState,
    round,
    score,
    combo,
    timeLeft,
    currentPuzzle,
    selectedAnswer,
    setSelectedAnswer,
    feedback,
    hintAvailable,
    disabledDigits,
    stats,
    startGame,
    stopGame,
    resetGame,
    submitAnswer,
    useSonarHint,
    useExtraAir
  };
}
