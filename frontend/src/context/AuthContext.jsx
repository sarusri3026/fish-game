
import React, {
  createContext,
  useContext,
  useState,
  useEffect
} from 'react';

import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [token, setToken] = useState(
    localStorage.getItem('fish_quest_token') || null
  );

  const [challengeToken, setChallengeToken] = useState(null);
  const [pendingUsername, setPendingUsername] = useState('');

  const [loading, setLoading] = useState(true);

  // Load user profile when a valid JWT exists
  useEffect(() => {
    let active = true;

    async function loadUser() {
      if (!token) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await api.getProfile();

        if (!active) return;

        if (response.success && response.user) {
          setUser(response.user);
        } else {
          logout();
        }
      } catch (error) {
        console.error('Failed to load user identity:', error);

        if (active) {
          logout();
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, [token]);

  // STEP 1: Username and password login
  const login = async (username, password) => {
    try {
      const res = await api.login({
        username,
        password
      });

      // Backend must return OTP challenge, not full JWT
      if (res.success && res.otpRequired && res.challengeToken) {
        setChallengeToken(res.challengeToken);
        setPendingUsername(username);

        // Ensure no previous authenticated session remains
        localStorage.removeItem('fish_quest_token');
        setToken(null);
        setUser(null);

        return {
          success: true,
          otpRequired: true,
          message: res.message
        };
      }

      return {
        success: false,
        message: res.message || 'Login verification could not be started.'
      };

    } catch (error) {
      console.error('Login error:', error);

      return {
        success: false,
        message: error.response?.data?.message || 'Login failed.'
      };
    }
  };

  // STEP 2: Verify email OTP
  const verifyOTP = async (otp) => {
    try {
      if (!challengeToken) {
        return {
          success: false,
          message: 'Login session expired. Please log in again.'
        };
      }

      const res = await api.verifyOTP({
        challengeToken,
        otp
      });

      if (res.success && res.token && res.user) {
        // Save JWT only after successful OTP verification
        localStorage.setItem('fish_quest_token', res.token);

        setToken(res.token);
        setUser(res.user);
        setChallengeToken(null);
        setPendingUsername('');

        return {
          success: true,
          message: res.message,
          user: res.user
        };
      }

      return {
        success: false,
        message: res.message || 'OTP verification failed.'
      };

    } catch (error) {
      console.error('OTP verification error:', error);

      return {
        success: false,
        message: error.response?.data?.message || 'Invalid OTP.'
      };
    }
  };

  // Resend email OTP
  const resendOTP = async () => {
    try {
      if (!challengeToken) {
        return {
          success: false,
          message: 'Login session expired. Please log in again.'
        };
      }

      const res = await api.resendOTP({
        challengeToken
      });

      return res;

    } catch (error) {
      console.error('Resend OTP error:', error);

      return {
        success: false,
        message: error.response?.data?.message || 'Unable to resend OTP.'
      };
    }
  };

  // Register new player
  const register = async (username, email, password, avatar) => {
    try {
      const res = await api.register({
        username,
        email,
        password,
        avatar
      });

      if (res.success && res.token) {
        localStorage.setItem('fish_quest_token', res.token);

        setToken(res.token);
        setUser(res.user);
      }

      return res;

    } catch (error) {
      console.error('Registration error:', error);

      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed.'
      };
    }
  };

  // Cancel OTP challenge and return to login
  const cancelOTP = () => {
    setChallengeToken(null);
    setPendingUsername('');
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('fish_quest_token');

    setToken(null);
    setUser(null);
    setChallengeToken(null);
    setPendingUsername('');
  };

  // Update avatar
  const updateAvatar = async (avatar) => {
    try {
      const res = await api.updateAvatar(avatar);

      if (res.success) {
        setUser((prev) =>
          prev ? { ...prev, avatar } : prev
        );
      }

      return res;

    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Avatar update failed.'
      };
    }
  };

  // Refresh user profile
  const refreshProfile = async () => {
    if (!token) return;

    try {
      const response = await api.getProfile();

      if (response.success && response.user) {
        setUser(response.user);
      }
    } catch (error) {
      console.warn('Failed refreshing user profile:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        challengeToken,
        pendingUsername,

        isAuthenticated: !!user && !!token,
        loading,

        login,
        verifyOTP,
        resendOTP,
        cancelOTP,

        register,
        logout,
        updateAvatar,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
