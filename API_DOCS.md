# Fish Quest: Distributed API Integration & Endpoint Documentation

This document describes the external web service integration with Marc Conrad's Fish Game API and the internal REST API architecture implemented in the Node.js / Express backend.

---

## 1. External Web Service Integration

### Marc Conrad Fish Game API
- **Official Documentation:** [https://marcconrad.com/uob/fish/doc.php](https://marcconrad.com/uob/fish/doc.php)
- **Base Endpoint:** `https://marcconrad.com/uob/fish/api.php?out=json`
- **Protocol:** HTTPS / REST over HTTP/1.1 with TLS encryption.
- **Payload Format:** JSON
- **Response Structure:**
  ```json
  {
    "question": "https://www.sanfoh.com/uob/fish/data/ch_d8e13b_233044_004x004.png",
    "fish": 4,
    "chest": 4
  }
  ```
- **Architectural Handling (Decoupled Proxy):**
  - The client browser never communicates directly with the external API to avoid CORS issues and prevent solution leakage in network inspectors.
  - The Express backend (`backend/services/fishApiService.js`) retrieves the question, securely caches genuine API questions in memory, and generates an opaque `roundId` UUID for the client.

---

## 2. Internal REST API Endpoints

### Authentication & Virtual Identity (`/api/auth`)

#### 1. `POST /api/auth/register`
- **Description:** Establishes a new virtual identity with hashed password (`bcryptjs`, 10 salt rounds).
- **Body:**
  ```json
  {
    "username": "DeepDiver",
    "email": "diver@ocean.com",
    "password": "Password123!",
    "avatar": "shark"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Account registered successfully!",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "6afe7d1e6fd4921cf393ba94",
      "username": "DeepDiver",
      "email": "diver@ocean.com",
      "avatar": "shark",
      "stats": { "totalGames": 0, "highScore": 0, "badges": ["Novice Angler"] }
    }
  }
  ```

#### 2. `POST /api/auth/login`
- **Description:** Authenticates credentials and returns a signed stateless JWT token.
- **Body:**
  ```json
  { "username": "DeepDiver", "password": "Password123!" }
  ```
- **Response (200 OK):** Returns JWT token and sanitized user profile (password hash omitted).

#### 3. `GET /api/auth/profile` *(Protected)*
- **Headers:** `Authorization: Bearer <token>`
- **Description:** Retrieves persistent user stats, lifetime points, and unlocked badges.

#### 4. `PUT /api/auth/avatar` *(Protected)*
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ "avatar": "dolphin" }`
- **Description:** Updates virtual identity avatar customization.

---

### Game & Interoperability (`/api/game`)

#### 1. `POST /api/game/start-session`
- **Headers:** Optional `Authorization: Bearer <token>`
- **Description:** Initializes a server-side game session tracking lives, rounds, and verified score.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "sessionId": "27e31cbb-9132-4065-a274-ce4beebdf13d",
    "lives": 3,
    "score": 0,
    "round": 1
  }
  ```

#### 2. `GET /api/game/new-round`
- **Description:** Fetches a genuine challenge from Marc Conrad's Fish API and returns an opaque `roundId`.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "puzzle": {
      "roundId": "fa9f9b0b-d6fd-4c06-bcb9-9ba01ea85f9f",
      "questionUrl": "https://www.sanfoh.com/uob/fish/data/ch_d9f39e_233034_006x004.png",
      "isCached": false,
      "protocol": "HTTPS/REST (Live JSON)",
      "source": "https://marcconrad.com/uob/fish/api.php"
    }
  }
  ```

#### 3. `POST /api/game/sonar-hint`
- **Description:** Calculates 5 eliminated wrong digits entirely on the server without leaking the correct solution.
- **Body:** `{ "roundId": "fa9f9b0b-d6fd-4c06-bcb9-9ba01ea85f9f" }`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "eliminatedDigits": [1, 6, 9, 3, 0]
  }
  ```

#### 4. `POST /api/game/verify`
- **Description:** Verifies the player's guess against server-side round memory and updates the session score.
- **Body:**
  ```json
  {
    "sessionId": "27e31cbb-9132-4065-a274-ce4beebdf13d",
    "roundId": "fa9f9b0b-d6fd-4c06-bcb9-9ba01ea85f9f",
    "playerAnswer": 4,
    "timeRemaining": 15,
    "roundNumber": 1
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "correct": true,
    "correctSolution": 4,
    "chestValue": 7,
    "sessionUpdate": {
      "valid": true,
      "correct": true,
      "pointsAwarded": 250,
      "newTotalScore": 250,
      "round": 2,
      "livesRemaining": 3,
      "combo": 1,
      "highestCombo": 1,
      "isGameOver": false
    }
  }
  ```

#### 5. `POST /api/game/submit-score`
- **Description:** Finalizes the game session and records the server-verified score into MongoDB Atlas.
- **Body:** `{ "sessionId": "27e31cbb-9132-4065-a274-ce4beebdf13d" }`
- **Response (200 OK):** Confirms score persistence in `scores` collection and user stats update.

#### 6. `GET /api/game/leaderboard`
- **Query Params:** `?limit=10`
- **Description:** Retrieves global rankings sorted by score descending.

#### 7. `GET /api/game/architecture`
- **Description:** Returns JSON summary of how the four course themes are realized.

#### 8. `GET /api/game/events-audit`
- **Description:** Exposes the in-process event audit buffer for real-time telemetry inspection.
