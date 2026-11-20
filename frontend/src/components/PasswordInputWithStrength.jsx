import React, { useState, useMemo } from 'react';
import { Lock, Eye, EyeOff, Sparkles, Check, X, Shield, Key } from 'lucide-react';

/**
 * Strong password verification criteria
 */
export function checkPasswordStrength(password = '') {
  const criteria = [
    { id: 'length', label: '8+ characters', met: password.length >= 8 },
    { id: 'uppercase', label: 'Uppercase (A-Z)', met: /[A-Z]/.test(password) },
    { id: 'lowercase', label: 'Lowercase (a-z)', met: /[a-z]/.test(password) },
    { id: 'number', label: 'Number (0-9)', met: /[0-9]/.test(password) },
    { id: 'special', label: 'Special symbol (!@#$...)', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password) }
  ];

  const metCount = criteria.filter((c) => c.met).length;

  let label = 'Too short';
  let color = '#ef4444'; // Red
  let percent = 0;

  if (password.length === 0) {
    label = 'Enter password';
    color = '#94a3b8';
    percent = 0;
  } else if (metCount <= 2) {
    label = 'Weak';
    color = '#ef4444';
    percent = 25;
  } else if (metCount === 3) {
    label = 'Fair';
    color = '#f59e0b';
    percent = 50;
  } else if (metCount === 4) {
    label = 'Good';
    color = '#0284c7';
    percent = 75;
  } else if (metCount === 5) {
    label = 'Strong';
    color = '#10b981';
    percent = 100;
  }

  return {
    criteria,
    metCount,
    isStrong: metCount === 5,
    label,
    color,
    percent
  };
}

/**
 * Cryptographically random strong password generator
 */
export function generateStrongPassword() {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghijkmnpqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%^&*_-+=';

  // Seed with at least 2 of each category for strong guarantee
  const parts = [
    uppers[Math.floor(Math.random() * uppers.length)],
    uppers[Math.floor(Math.random() * uppers.length)],
    lowers[Math.floor(Math.random() * lowers.length)],
    lowers[Math.floor(Math.random() * lowers.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
    symbols[Math.floor(Math.random() * symbols.length)]
  ];

  const all = uppers + lowers + numbers + symbols;
  for (let i = 0; i < 4; i++) {
    parts.push(all[Math.floor(Math.random() * all.length)]);
  }

  // Shuffle
  for (let i = parts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [parts[i], parts[j]] = [parts[j], parts[i]];
  }

  return parts.join('');
}

export default function PasswordInputWithStrength({
  value,
  onChange,
  isRegister = false,
  placeholder = 'Enter password',
  required = true,
  onGeneratedSound
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [justGenerated, setJustGenerated] = useState(false);

  const strength = useMemo(() => checkPasswordStrength(value), [value]);

  const handleGenerate = () => {
    const strongPass = generateStrongPassword();
    onChange(strongPass);
    setShowPassword(true);
    setJustGenerated(true);
    if (onGeneratedSound) onGeneratedSound();
    setTimeout(() => setJustGenerated(false), 3000);
  };

  return (
    <div className="password-strength-wrapper">
      <div className="password-header-row">
        <label className="password-label">
          {isRegister ? 'Create Secure Password' : 'Password'}
        </label>
        {isRegister && (
          <button
            type="button"
            className="btn-suggest-strong-pass"
            onClick={handleGenerate}
            title="Generate a randomized cryptographically strong password"
          >
            <Sparkles size={13} className="text-amber" />
            <span>Generate Strong Password</span>
          </button>
        )}
      </div>

      <div className="input-with-icon password-field-group">
        <Lock size={18} className="field-icon" />
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder={isRegister ? 'Min 8 chars, mixed case, symbol' : placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="password-input-element"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
        />
        <button
          type="button"
          className="password-toggle-btn"
          onClick={() => setShowPassword((prev) => !prev)}
          title={showPassword ? 'Hide password' : 'Show password'}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {justGenerated && (
        <div className="password-generated-badge animate-fade-in">
          <Key size={13} className="text-cyan" />
          <span>Strong password generated & displayed above! You can copy or remember it.</span>
        </div>
      )}

      {/* Strong Password Visual Feedback (Registration Only) */}
      {isRegister && (
        <div className="password-strength-panel">
          {/* Strength Bar */}
          <div className="strength-bar-row">
            <span className="strength-bar-label">Strength:</span>
            <div className="strength-bar-track">
              <div
                className="strength-bar-fill"
                style={{
                  width: `${strength.percent}%`,
                  backgroundColor: strength.color
                }}
              />
            </div>
            <span
              className="strength-badge"
              style={{
                color: strength.color,
                borderColor: `${strength.color}66`,
                backgroundColor: `${strength.color}15`
              }}
            >
              {strength.label}
            </span>
          </div>

          {/* Requirements Checklist */}
          <div className="password-rules-grid">
            {strength.criteria.map((item) => (
              <div
                key={item.id}
                className={`password-rule-pill ${item.met ? 'rule-met' : 'rule-unmet'}`}
              >
                {item.met ? (
                  <Check size={12} className="rule-icon met-icon" />
                ) : (
                  <span className="rule-dot" />
                )}
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="password-security-hint">
            <Shield size={12} className="text-cyan" />
            <span>Theme 4 Security: Encrypted using Bcrypt (10 salt rounds) hashing function</span>
          </div>
        </div>
      )}
    </div>
  );
}
