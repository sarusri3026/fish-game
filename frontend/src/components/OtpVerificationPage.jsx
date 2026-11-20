import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import {
  ShieldCheck,
  Mail,
  KeyRound,
  ArrowLeft,
  Clock,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Waves,
  Volume2,
  VolumeX,
  Music
} from 'lucide-react';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

export default function OtpVerificationPage({
  isStandalone = true,
  onSuccess,
  onCancel
}) {
  const { verifyOTP, resendOTP, cancelOTP, pendingUsername } = useAuth();
  const {
    soundEnabled,
    toggleSound,
    musicEnabled,
    toggleMusic,
    playBubblePop,
    playCorrect,
    playWrong
  } = useSound();

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [timeLeft, setTimeLeft] = useState(RESEND_COOLDOWN_SECONDS);

  const inputRefs = useRef([]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Cooldown countdown timer for resend
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Handle single digit input
  const handleDigitChange = (index, value) => {
    // Only accept numeric digits
    const cleaned = value.replace(/\D/g, '');

    const newDigits = [...digits];

    if (!cleaned) {
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    // If multiple characters pasted into single field
    if (cleaned.length > 1) {
      handlePastedCode(cleaned);
      return;
    }

    newDigits[index] = cleaned;
    setDigits(newDigits);
    setErrorMsg('');

    // Advance to next input
    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all digits are entered
    const fullCode = newDigits.join('');
    if (fullCode.length === OTP_LENGTH && !newDigits.includes('')) {
      submitVerification(fullCode);
    }
  };

  // Handle Backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle full 6-digit paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    handlePastedCode(pasted);
  };

  const handlePastedCode = (code) => {
    const numericOnly = code.replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!numericOnly) return;

    const newDigits = [...digits];
    for (let i = 0; i < numericOnly.length; i++) {
      newDigits[i] = numericOnly[i];
    }
    setDigits(newDigits);
    setErrorMsg('');

    // Focus last filled index or first empty
    const focusIndex = Math.min(numericOnly.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();

    if (numericOnly.length === OTP_LENGTH) {
      submitVerification(numericOnly);
    }
  };

  // Submit OTP Verification
  const submitVerification = async (codeToVerify) => {
    const finalCode = codeToVerify || digits.join('');

    if (finalCode.length !== OTP_LENGTH) {
      playWrong();
      setErrorMsg(`Please enter all ${OTP_LENGTH} digits of your verification code.`);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await verifyOTP(finalCode);

      if (res.success) {
        playCorrect();
        setSuccessMsg('Two-factor verification successful! Entering Ocean...');
        if (onSuccess) onSuccess();
      } else {
        playWrong();
        setErrorMsg(res.message || 'Invalid verification code. Please check and try again.');
        // Clear digits for another try
        setDigits(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      playWrong();
      setErrorMsg('Network error during verification. Check if backend is active.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (timeLeft > 0 || resending) return;

    playBubblePop();
    setResending(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await resendOTP();

      if (res.success) {
        setSuccessMsg(res.message || 'A fresh 6-digit code has been sent to your email.');
        setTimeLeft(RESEND_COOLDOWN_SECONDS);
        setDigits(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      } else {
        playWrong();
        setErrorMsg(res.message || 'Could not resend OTP. Please try again.');
      }
    } catch (err) {
      playWrong();
      setErrorMsg('Failed to resend code due to network error.');
    } finally {
      setResending(false);
    }
  };

  // Cancel and return to login
  const handleCancel = () => {
    playBubblePop();
    cancelOTP();
    if (onCancel) onCancel();
  };

  // Card Content
  const cardBody = (
    <div className="otp-card glassmorphic">
      <div className="otp-card-header">
        <button
          type="button"
          className="otp-back-link"
          onClick={handleCancel}
          title="Back to Sign In"
        >
          <ArrowLeft size={16} />
          <span>Back to Sign In</span>
        </button>

        <div className="otp-icon-halo">
          <Mail size={32} className="cyan-text animate-pulse-subtle" />
          <KeyRound size={18} className="otp-sub-icon text-amber" />
        </div>

        <h2 className="otp-title">Email OTP Verification</h2>

        <p className="otp-subtitle">
          A secure 6-digit verification code has been dispatched to your registered email address.
          {pendingUsername && (
            <span className="otp-user-badge">
              Account: <strong>{pendingUsername}</strong>
            </span>
          )}
        </p>
      </div>

      {errorMsg && (
        <div className="auth-alert error-alert animate-fade-in">
          <AlertCircle size={16} className="alert-icon" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="auth-alert success-alert animate-fade-in">
          <CheckCircle2 size={16} className="alert-icon" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 6-Digit Segmented Box Inputs */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitVerification();
        }}
        className="otp-form"
      >
        <div className="otp-inputs-row" onPaste={handlePaste}>
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`otp-digit-box ${digit ? 'filled' : ''} ${errorMsg ? 'has-error' : ''}`}
              autoComplete="one-time-code"
              disabled={loading}
              aria-label={`Digit ${idx + 1}`}
            />
          ))}
        </div>

        <div className="otp-info-bar">
          <div className="otp-timer-chip">
            <Clock size={13} className="text-cyan" />
            <span>Code valid for 5 minutes</span>
          </div>

          <div className="otp-resend-wrapper">
            {timeLeft > 0 ? (
              <span className="otp-cooldown-text">
                Resend code in <strong>{timeLeft}s</strong>
              </span>
            ) : (
              <button
                type="button"
                className="otp-resend-btn"
                onClick={handleResend}
                disabled={resending}
              >
                <RefreshCw size={13} className={resending ? 'spin-icon' : ''} />
                <span>{resending ? 'Sending...' : 'Resend Code'}</span>
              </button>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="btn-glow-large submit-btn otp-submit-btn"
          disabled={loading || digits.join('').length !== OTP_LENGTH}
        >
          <Sparkles size={18} />
          <span>{loading ? 'Verifying Code...' : 'Verify OTP & Enter Ocean'}</span>
        </button>
      </form>

      <div className="otp-footer-security">
        <ShieldCheck size={14} className="text-cyan" />
        <span>Theme 4: Two-Factor Authentication with SHA-256 Hashed OTP & Timing-Safe Verification</span>
      </div>
    </div>
  );

  // If used embedded within a modal or section
  if (!isStandalone) {
    return <div className="otp-embedded-container">{cardBody}</div>;
  }

  // Full-page standalone view
  return (
    <div className="game-app-shell login-view-shell otp-page-shell">
      {/* Animated Rising Bubbles */}
      <div className="bubble b1"></div>
      <div className="bubble b2"></div>
      <div className="bubble b3"></div>
      <div className="bubble b4"></div>
      <div className="bubble b5"></div>
      <div className="bubble b6"></div>

      {/* Floating Animated Fish */}
      <div className="swimming-fish f1">🐠</div>
      <div className="swimming-fish f2">🐟</div>
      <div className="swimming-fish f3">🐡</div>

      {/* Top Navbar */}
      <header className="navbar-container">
        <div className="brand-badge">
          <div className="brand-icon-wrapper">
            <span className="brand-icon">🐠</span>
            <Waves className="waves-icon" size={16} />
          </div>
          <div>
            <h1 className="brand-title">FISH QUEST</h1>
            <span className="brand-sub">Two-Factor Authentication</span>
          </div>
        </div>

        <div className="navbar-actions">
          {/* Background Music Toggle */}
          <button
            className={`nav-btn nav-btn-icon ${musicEnabled ? 'active-audio' : ''}`}
            onClick={() => {
              playBubblePop();
              toggleMusic();
            }}
            title={musicEnabled ? 'Mute Background Music' : 'Play Background Music'}
          >
            <Music size={18} className={musicEnabled ? 'cyan-text' : 'muted-text'} />
          </button>

          {/* Sound FX Toggle */}
          <button
            className="nav-btn nav-btn-icon"
            onClick={() => {
              playBubblePop();
              toggleSound();
            }}
            title={soundEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
          >
            {soundEnabled ? <Volume2 size={18} className="cyan-text" /> : <VolumeX size={18} className="muted-text" />}
          </button>
        </div>
      </header>

      {/* Main Centered Content */}
      <main className="otp-main-container">
        {cardBody}
      </main>
    </div>
  );
}
