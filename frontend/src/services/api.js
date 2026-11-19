/**
 * API Service Client - Centralized HTTP Interoperability Client
 * Theme 1: High Cohesion (Dedicated solely to network communication)
 * Theme 4: Virtual Identity (Attaches Bearer JWT token to requests)
 */

const API_BASE = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('fish_quest_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth & Virtual Identity
  async register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async login(credentials) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return res.json();
  },

  async getProfile() {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async updateAvatar(avatar) {
    const res = await fetch(`${API_BASE}/auth/avatar`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ avatar })
    });
    return res.json();
  },

  // Game & Interoperability
  async startSession() {
    const res = await fetch(`${API_BASE}/game/start-session`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getNewRound() {
    const res = await fetch(`${API_BASE}/game/new-round`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getSonarHint(roundId) {
    const res = await fetch(`${API_BASE}/game/sonar-hint`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ roundId })
    });
    return res.json();
  },

  async verifyAnswer(verifyPayload) {
    const res = await fetch(`${API_BASE}/game/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(verifyPayload)
    });
    return res.json();
  },

  async submitScore(scoreData) {
    const res = await fetch(`${API_BASE}/game/submit-score`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(scoreData)
    });
    return res.json();
  },

  async getLeaderboard(limit = 10) {
    const res = await fetch(`${API_BASE}/game/leaderboard?limit=${limit}`);
    return res.json();
  },

  async getUserHistory() {
    const res = await fetch(`${API_BASE}/game/history`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getArchitectureSummary() {
    const res = await fetch(`${API_BASE}/game/architecture`);
    return res.json();
  },

  // Level Progression & 3-Star System
  async getLevelProgress() {
    const res = await fetch(`${API_BASE}/levels/progress`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async startLevel(levelNumber) {
    const res = await fetch(`${API_BASE}/levels/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ levelNumber })
    });
    return res.json();
  },

  async submitLevel({ levelSessionId, playerAnswer, timeRemaining }) {
    const res = await fetch(`${API_BASE}/levels/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ levelSessionId, playerAnswer, timeRemaining })
    });
    return res.json();
  },

  async claimLevelBonus({ bonusKey, stageId, levelNumber }) {
    const res = await fetch(`${API_BASE}/levels/claim-bonus`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ bonusKey, stageId, levelNumber })
    });
    return res.json();
  }
};
