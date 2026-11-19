# Fish Quest - Distributed Service Architectures (MERN Stack)
### Unit Code: CIS045-3 | Coursework & Video Assessment

**Fish Quest** is a distributed, full-stack puzzle application built on the **MERN Stack** (MongoDB Atlas, Express.js, React 19 + Vite, Node.js) integrating **Marc Conrad's Fish Game Web Service** (`https://marcconrad.com/uob/fish/api.php`).

The application is structured to satisfy and exceed all criteria in the **University of Bedfordshire CIS045-3 marking rubric for 1st Class Honours (70%+)** by addressing the four core unit themes:
1. **Software Design Principles:** Low Coupling & High Cohesion
2. **Event-Driven Programming**
3. **Interoperability**
4. **Virtual Identity & Security**

---

## 🌐 Live System Status

- **Frontend Application:** [http://localhost:5173](http://localhost:5173)
- **Backend API Gateway:** [http://localhost:5000](http://localhost:5000)
- **Health Check Endpoint:** `GET http://localhost:5000/`
- **Architectural Reflection:** `GET http://localhost:5000/api/game/architecture`

---

## 🛠️ Quick Start & Running Tests

### 1. Backend Server
```bash
cd backend
npm install
npm run dev     # Runs on http://localhost:5000
```

### 2. Frontend Client
```bash
cd frontend
npm install
npm run dev     # Runs on http://localhost:5173
```

### 3. Automated Verification Test Suites
Run the full 11-step verification suite covering MongoDB Atlas connectivity, authentication, anti-tampering, Fish API integration, and in-process events:
```bash
node backend/tests/verify_suite.js
```

Run the dedicated 100-Level Progression and 3-Star Rating verification suite:
```bash
node backend/tests/test_level_progression.js
```

---

## 🏛️ Comprehensive Mapping of the Four Themes

### Theme 1: Software Design Principles (Low Coupling & High Cohesion)

| Architectural Layer | Files | Cohesion (Single Responsibility) | Coupling (Decoupled Interactions) |
| :--- | :--- | :--- | :--- |
| **Routing Layer** | `backend/router/authRoutes.js`<br>`backend/router/gameRoutes.js` | Exclusively maps HTTP verbs and URI endpoints to controllers. | Knows nothing about database schemas, API network sockets, or password hashing. |
| **Controller Layer** | `backend/controller/authController.js`<br>`backend/controller/gameController.js` | Coordinates incoming request payloads, validates input syntax, calls services, formats responses. | Interacts with services via structured method arguments; does not access raw DB connections directly. |
| **Service Layer** | `backend/services/fishApiService.js`<br>`backend/services/gameSessionService.js`<br>`backend/services/eventService.js` | Encapsulates business logic: Marc Conrad API communication, server-side session tracking, and in-process event pub/sub. | Fully portable; can be unit tested without starting Express or React. |
| **Model Layer** | `backend/models/User.js`<br>`backend/models/Score.js` | Encapsulates MongoDB collections, indexing, document creation, and sanitization. | Does not handle HTTP headers, tokens, or frontend state. |
| **Middleware Layer** | `backend/middleware/authMiddleware.js` | Reusable JWT cryptographic verification and route guarding. | Attaches decoded user identity to `req.user` for downstream controllers. |
| **Frontend State Layer** | `frontend/src/hooks/useFishGame.js` | Custom React Hook managing game loop, 20s timers, lives, streaks, and scoring. | Stateless UI presentation components (`GameArena.jsx`) merely receive handler props. |
| **API Client Layer** | `frontend/src/services/api.js` | Single point of HTTP communication; automatically attaches `Authorization: Bearer` headers. | React components never make raw `fetch` calls. |

---

### Theme 2: Event-Driven Programming

In this project, event-driven design is implemented across both client and server tiers:

1. **Client-Side Event Architecture:**
   - **DOM & Keyboard Events:** Reactive listener in `GameArena.jsx` captures physical keyboard input (`0-9`, `Enter`, `Backspace`, `Escape`) and dispatches state updates.
   - **Temporal Events:** 1000ms `setInterval` interval tick events drive the 20-second oxygen timer, firing `handleTimeout()` when oxygen depletes.
   - **Acoustic Events (Web Audio API):** `frontend/src/context/SoundContext.jsx` synthesizes audio frequencies in real-time (bubble pop, correct chime, wrong buzz, streak ascending sweep, game-over fanfare) triggered by gameplay state events without loading external audio files.

2. **Server-Side In-Process Event Architecture:**
   - Implemented via Node.js `EventEmitter` in `backend/services/eventService.js`.
   - *Academic Note:* This is an asynchronous **in-process publish/subscribe mechanism**, not an external distributed message broker (such as Kafka or RabbitMQ). It decouples core request/response cycles from auxiliary side-effects.
   - **Emitted & Handled Events:**
     - `user:registered`: Emitted when a new account is created; logs audit trail with timestamp.
     - `user:login`: Emitted upon successful authentication; records IP telemetry and activity.
     - `round:completed`: Emitted after answer verification; records round analytics.
     - `game:finished`: Emitted upon match conclusion; logs verified scores.
     - `badge:unlocked`: Emitted by `UserModel.updateStats()` when a milestone is achieved (e.g. *Reef Explorer*, *Deep Sea Diver*, *Ocean Master*).

---

### Theme 3: Interoperability

- **External Target Service:** Marc Conrad's Fish Game API (`https://marcconrad.com/uob/fish/api.php?out=json`).
- **Communication Protocol:** HTTPS / REST over HTTP/1.1 with TLS encryption.
- **Data Interchange Format:** JSON payload `{ question: string, fish: number, chest: number }`.
- **Security & Decoupled Proxy Pattern:**
  - In basic implementations, client browsers directly call Marc Conrad's API. This has two significant vulnerabilities: browser CORS restrictions and trivial inspection cheating (since the raw JSON payload contains the solution in `fish`).
  - Our Express backend acts as an interoperability proxy (`fishApiService.js`). It retrieves the question, stores the solution in a server-side active round store, and generates an **opaque random round ID (`roundId`)**.
  - The client receives only the puzzle image URL and `roundId`. The solution is never returned in client tokens or base64 JWTs.
- **Dedicated Sonar Hint Endpoint:**
  - `POST /api/game/sonar-hint` accepts `{ roundId }`, computes 5 wrong digits entirely on the server, and returns `{ eliminatedDigits: [...] }` without leaking the solution.
- **Fault-Tolerance & Genuine Caching:**
  - 7,000ms network timeout prevents hanging requests.
  - Puzzles genuinely retrieved from the live external API are stored in an in-memory cache pool (up to 30 puzzles). If external university servers experience temporary outages, cached puzzles maintain zero-downtime gameplay.
  - The API and UI clearly label whether each question is live (`badge-live`) or cached (`badge-cached`). No hardcoded fake data is used.

---

### Theme 4: Virtual Identity & Security

- **Cryptographic Authentication:**
  - User registration and login with salt-hashed passwords using `bcryptjs` (10 salt rounds). Plaintext passwords are never stored in the database.
  - Stateless JSON Web Tokens (JWT) signed with `process.env.JWT_SECRET` and validated by `authMiddleware.js`.
  - Server fails safely on startup if `JWT_SECRET` or `MONGODB_URI` is missing.
  - Passwords and hashes are explicitly excluded from API responses (`projection: { password: 0 }`).
- **Server-Side Score Validation (Anti-Cheat):**
  - Unlike insecure games that trust `{ score: 999999 }` from the client, `gameSessionService.js` tracks session state on the server.
  - Each round answer updates session score, streak, and round count on the server.
  - `POST /api/game/submit-score` validates against `sessionId`, ensuring that the score persisted to MongoDB Atlas is verified.
- **Persistent Persona & Gamification (MongoDB Atlas):**
  - `users` collection: Stores unique identities, customizable underwater avatars (Clownfish, Shark, Octopus, Dolphin, Turtle, Pufferfish, Whale, Crab), and lifetime stats.
  - `scores` collection: Stores global high scores, round reached, accuracy %, and timestamps.
  - Unlocked badge system dynamically awarded upon milestone completion.

---

## 📚 Academic Acknowledgements & Referencing

- **Fish Game Web Service & Concept:** Marc Conrad, University of Bedfordshire ([Documentation](https://marcconrad.com/uob/fish/doc.php)).
- **MERN Architecture & Libraries:** Express.js, React.js, Node.js, MongoDB Atlas Native Driver, Axios, Bcryptjs, JsonWebToken, Lucide-React, Canvas-Confetti.
- **Generative AI Collaboration:** Generative AI tools were utilized for architectural refinement, test suite generation, and CSS aesthetic structuring in compliance with assignment guidelines. All code has been reviewed, executed, and verified by the student.
#   f i s h - g a m e  
 