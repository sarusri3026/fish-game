# CIS045-3 Assessment 1: 10-Minute Video Script & Presentation Guide

This guide provides a time-stamped, slide-by-slide script designed to achieve **1st Class marks (70%+)** under the University of Bedfordshire CIS045-3 marking rubric.

---

## ⏱️ Video Breakdown (Total: 10 Minutes Max)

| Segment | Duration | Topic | Files & Screens to Show |
| :--- | :--- | :--- | :--- |
| **Part 1** | 0:00 – 2:00 | **Working System Demonstration** | Browser (`http://localhost:5173`) |
| **Part 2** | 2:00 – 4:00 | **Software Design Principles** (Coupling & Cohesion) | `backend/server.js`, `router/`, `controller/`, `useFishGame.js` |
| **Part 3** | 4:00 – 6:00 | **Event-Driven Programming** | `backend/services/eventService.js`, `frontend/SoundContext.jsx` |
| **Part 4** | 6:00 – 8:00 | **Interoperability & Security Proxy** | `backend/services/fishApiService.js`, `backend/services/gameSessionService.js` |
| **Part 5** | 8:00 – 10:00 | **Virtual Identity, Anti-Cheat & MongoDB** | `backend/models/User.js`, `middleware/authMiddleware.js`, MongoDB Atlas |

---

## 🎙️ Step-by-Step Script & Talking Points

### Part 1: Working System Demonstration (0:00 – 2:00)
- **What to show on screen:** Full screen browser at `http://localhost:5173`.
- **What to say:**
  > *"Hello, my name is [Your Name], and this is my coursework presentation for CIS045-3 Distributed Service Architectures. Today I am presenting 'Fish Quest', an oceanic distributed puzzle game developed on the MERN stack—MongoDB Atlas, Express.js, React 19, and Node.js—which interoperates with Marc Conrad's external Fish Game API.*
  >
  > *First, let's look at the working application. In the top bar, I can establish my Virtual Identity. I click 'Sign In / Identity', register with a username, password, and custom aquatic avatar like a Shark or Dolphin, and sign in. Notice that the server issues a secure JSON Web Token, and my avatar and high score appear in the header.*
  >
  > *Now let's dive into the gameplay. The game arena displays a math challenge retrieved live from Marc Conrad's external web service. Notice the 'Live Fish API' badge. As the 20-second oxygen timer counts down, I count the fish in the picture and enter my guess using the on-screen keypad or my physical keyboard.*
  >
  > *When I submit, the Web Audio engine plays a synthesized chime, streaks multiply my points, and confetti bursts on combos. We also have power-ups: clicking 'Sonar Ping' triggers a dedicated backend endpoint that eliminates 5 wrong digits without ever leaking the answer to the browser! When lives deplete, the match concludes, and the score is securely persisted to MongoDB Atlas, updating our global leaderboard."*

---

### Part 2: Theme 1 – Software Design Principles: Low Coupling & High Cohesion (2:00 – 4:00)
- **What to show on screen:** VS Code showing the folder tree: `backend/` and `frontend/`.
- **What to say:**
  > *"Now let's examine the software architecture, starting with Theme 1: Low Coupling and High Cohesion.*
  >
  > *High Cohesion means each component has a single, well-defined responsibility. In our Express backend, we have implemented a clean layered architecture:*
  > *1. The Router layer in `backend/router/` exclusively maps endpoints and HTTP verbs.*
  > *2. The Controller layer in `backend/controller/` handles request validation and response formatting.*
  > *3. The Service layer in `backend/services/` encapsulates business logic, including external Fish API calls and server-side game sessions.*
  > *4. The Model layer in `backend/models/` manages MongoDB Atlas collections, queries, and sanitization.*
  > *5. The Middleware layer in `backend/middleware/` handles JWT verification independently.*
  >
  > *On the frontend, we maintain High Cohesion by separating game mechanics from UI presentation. In `frontend/src/hooks/useFishGame.js`, a custom React hook encapsulates the 20-second timer, lives, scoring, and input handling. The visual components like `GameArena.jsx` remain lean and stateless.*
  >
  > *Low Coupling means components interact through well-defined contracts rather than internal details. The React frontend interacts with the backend strictly through our centralized API client in `frontend/src/services/api.js`. If the database schema or external web service changes, our UI components require zero modifications."*

---

### Part 3: Theme 2 – Event-Driven Programming (4:00 – 6:00)
- **What to show on screen:** Open `backend/services/eventService.js` and `frontend/src/context/SoundContext.jsx`.
- **What to say:**
  > *"Theme 2 is Event-Driven Programming, where program flow is triggered by state and domain events.*
  >
  > *On the server side, in `backend/services/eventService.js`, we use Node.js's built-in `EventEmitter`. It is important to note academically that this is an asynchronous in-process publish/subscribe mechanism, not an external message broker like RabbitMQ. It allows our controllers to emit events without coupling them to auxiliary side-effects.*
  >
  > *Our event broker listens for five key events:*
  > *• `user:registered` for audit logging,*
  > *• `user:login` for access telemetry,*
  > *• `round:completed` for round analytics,*
  > *• `game:finished` for match completion,*
  > *• `badge:unlocked` which fires when a player earns an achievement in `UserModel.js`.*
  >
  > *On the client side, events occur at multiple tiers: DOM click events, keyboard listeners for digits 0 through 9, and 1-second interval temporal events that drive the oxygen countdown.*
  >
  > *Furthermore, in `frontend/src/context/SoundContext.jsx`, we use the browser's Web Audio API to translate game state events into acoustic events. Instead of loading static audio files, we use audio oscillators to synthesize frequencies in real-time for bubble pops, chimes, buzzes, and fanfares."*

---

### Part 4: Theme 3 – Interoperability & Security Proxy (6:00 – 8:00)
- **What to show on screen:** Open `backend/services/fishApiService.js` and `backend/services/gameSessionService.js`.
- **What to say:**
  > *"Theme 3 is Interoperability: enabling heterogeneous software systems to exchange data across networks using standard protocols.*
  >
  > *Our backend interoperates with Marc Conrad's Fish Game API at `https://marcconrad.com/uob/fish/api.php?out=json`. The communication protocol is HTTPS/REST over HTTP/1.1, and the data interchange standard is JSON, returning the question image and solution.*
  >
  > *A crucial architectural enhancement in our implementation is the Decoupled Proxy Pattern. In naive implementations, browsers call the external API directly. This introduces CORS issues and allows players to inspect the network response in DevTools to see the answer `fish`.*
  >
  > *In our system, the Node.js backend acts as an interoperability proxy. It fetches the puzzle and stores the solution securely on the server. The client receives only the image URL and an opaque random UUID `roundId`. The correct answer is never exposed in client tokens or base64 JWT payloads.*
  >
  > *We also implemented a dedicated Sonar Hint endpoint: `POST /api/game/sonar-hint` calculates 5 incorrect digits on the server and returns them without revealing the solution.*
  >
  > *For fault tolerance, we have a 7-second network timeout and an in-memory cache pool storing genuine puzzles retrieved from previous API calls, ensuring zero-downtime gameplay even if university servers experience maintenance."*

---

### Part 5: Theme 4 – Virtual Identity, Anti-Cheat & MongoDB (8:00 – 10:00)
- **What to show on screen:** Open `backend/models/User.js`, `backend/services/gameSessionService.js`, and terminal showing `node backend/tests/verify_suite.js` passing all 11 tests.
- **What to say:**
  > *"Finally, Theme 4 is Virtual Identity and Security. In distributed computing, virtual identity represents a persistent, verified digital persona.*
  >
  > *In `backend/models/User.js`, credentials are created with salt-hashed passwords using `bcryptjs` with 10 salt rounds. Plaintext passwords and hashes are never returned to the frontend. Upon login, the server issues a stateless JSON Web Token (JWT) signed with our server secret, which `authMiddleware.js` verifies on protected routes.*
  >
  > *To ensure score integrity, we implemented server-side game session tracking in `gameSessionService.js`. Instead of trusting a high score sent by the client, the server tracks round answers, calculates combo multipliers, and verifies the final score. Players cannot tamper with scores.*
  >
  > *All identity data, match histories, and achievement badges are stored in MongoDB Atlas collections: `users` and `scores`.*
  >
  > *Here in our terminal, you can see our automated verification suite passing all 11 tests: database connectivity, authentication, anti-tampering, Fish API communication, and in-process events.*
  >
  > *In conclusion, Fish Quest combines Low Coupling and High Cohesion, Event-Driven Architecture, REST Interoperability, and Cryptographic Virtual Identity into a unified, secure distributed application. Thank you."*
