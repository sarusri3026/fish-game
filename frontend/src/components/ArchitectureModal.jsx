
import React, { useState } from 'react';
import { useSound } from '../context/SoundContext';
import { X, Layers, Zap, Globe, Shield, Video, Code, CheckCircle2 } from 'lucide-react';

export default function ArchitectureModal({ isOpen, onClose }) {
  const { playBubblePop } = useSound();
  const [activeTab, setActiveTab] = useState('principles'); // 'principles', 'events', 'interop', 'identity', 'script'

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog modal-extra-wide glassmorphic">
        <button
          className="modal-close-btn"
          onClick={() => {
            playBubblePop();
            onClose();
          }}
        >
          <X size={20} />
        </button>

        <div className="arch-header">
          <div className="arch-badge">
            <span>CIS045-3 Distributed Service Architectures</span>
          </div>
          <h2>Assignment Architectural Overview & 4 Themes</h2>
          <p className="arch-subtitle">
            Comprehensive breakdown of the four key themes and 10-minute video presentation guide designed to achieve a 1st Class (70%+) grade.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="arch-tabs">
          <button
            className={`arch-tab-btn ${activeTab === 'principles' ? 'tab-active' : ''}`}
            onClick={() => {
              playBubblePop();
              setActiveTab('principles');
            }}
          >
            <Layers size={16} />
            <span>1. Low Coupling & High Cohesion</span>
          </button>

          <button
            className={`arch-tab-btn ${activeTab === 'events' ? 'tab-active' : ''}`}
            onClick={() => {
              playBubblePop();
              setActiveTab('events');
            }}
          >
            <Zap size={16} />
            <span>2. Event-Driven Programming</span>
          </button>

          <button
            className={`arch-tab-btn ${activeTab === 'interop' ? 'tab-active' : ''}`}
            onClick={() => {
              playBubblePop();
              setActiveTab('interop');
            }}
          >
            <Globe size={16} />
            <span>3. Interoperability</span>
          </button>

          <button
            className={`arch-tab-btn ${activeTab === 'identity' ? 'tab-active' : ''}`}
            onClick={() => {
              playBubblePop();
              setActiveTab('identity');
            }}
          >
            <Shield size={16} />
            <span>4. Virtual Identity</span>
          </button>

          <button
            className={`arch-tab-btn tab-highlight ${activeTab === 'script' ? 'tab-active' : ''}`}
            onClick={() => {
              playBubblePop();
              setActiveTab('script');
            }}
          >
            <Video size={16} />
            <span>10-Min Video Script</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="arch-content-body">
          {activeTab === 'principles' && (
            <div className="arch-section">
              <h3 className="arch-sec-title">
                <Layers className="cyan-text" /> Theme 1: Software Design Principles (Low Coupling & High Cohesion)
              </h3>
              <p className="arch-sec-desc">
                In distributed systems, High Cohesion means each software module has a single, well-defined responsibility. Low Coupling means modules interact via explicit contracts without depending on internal implementation details.
              </p>

              <div className="arch-grid-2">
                <div className="arch-card glassmorphic">
                  <h4 className="card-sub-title">Backend Cohesion & Layering</h4>
                  <ul className="arch-list">
                    <li>
                      <CheckCircle2 size={16} className="text-cyan" />
                      <strong>Routers (<code>backend/router/*</code>):</strong> Exclusively map HTTP endpoints (verbs & URLs) to controller methods.
                    </li>
                    <li>
                      <CheckCircle2 size={16} className="text-cyan" />
                      <strong>Controllers (<code>backend/controller/*</code>):</strong> Coordinate business logic, validate inputs, format responses.
                    </li>
                    <li>
                      <CheckCircle2 size={16} className="text-cyan" />
                      <strong>Services (<code>backend/services/*</code>):</strong> Dedicated service layer for external REST API and event emitters.
                    </li>
                    <li>
                      <CheckCircle2 size={16} className="text-cyan" />
                      <strong>Models (<code>backend/models/*</code>):</strong> Encapsulate MongoDB collections, indexes, and queries.
                    </li>
                    <li>
                      <CheckCircle2 size={16} className="text-cyan" />
                      <strong>Middleware (<code>backend/middleware/*</code>):</strong> Independent auth checks and centralized error handling.
                    </li>
                  </ul>
                </div>

                <div className="arch-card glassmorphic">
                  <h4 className="card-sub-title">Frontend Component Decoupling</h4>
                  <ul className="arch-list">
                    <li>
                      <CheckCircle2 size={16} className="text-cyan" />
                      <strong>Custom Hook (<code>useFishGame.js</code>):</strong> Encapsulates complete game state machine, lives, timers, scoring; pure UI components remain stateless.
                    </li>
                    <li>
                      <CheckCircle2 size={16} className="text-cyan" />
                      <strong>Context Providers (<code>AuthContext</code> & <code>SoundContext</code>):</strong> Provide global identity and audio synthesis without prop drilling.
                    </li>
                    <li>
                      <CheckCircle2 size={16} className="text-cyan" />
                      <strong>API Client (<code>services/api.js</code>):</strong> Single gateway for all HTTP communications with automatic JWT token attachment.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="code-snippet-box">
                <div className="code-header">
                  <Code size={14} /> Demonstrating Low Coupling in Express & React
                </div>
                <pre>
                  {`// Controllers only interact with Services, not directly with network sockets or DB drivers
const fishApiService = require('../services/fishApiService');
const gameEvents = require('../services/eventService');

// Express route is decoupled from logic:
router.get('/new-round', (req, res) => gameController.getNewRound(req, res));`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="arch-section">
              <h3 className="arch-sec-title">
                <Zap className="amber-text" /> Theme 2: Event-Driven Programming
              </h3>
              <p className="arch-sec-desc">
                Event-driven programming executes flow in response to events (user inputs, time ticks, hardware audio triggers, server domain events).
              </p>

              <div className="arch-grid-2">
                <div className="arch-card glassmorphic">
                  <h4 className="card-sub-title">Client-Side Event Architecture</h4>
                  <ul className="arch-list">
                    <li>
                      <CheckCircle2 size={16} className="text-amber" />
                      <strong>DOM & Keyboard Events:</strong> Physical key presses (0-9, Enter, Esc) and on-screen clicks dispatch reactive state updates.
                    </li>
                    <li>
                      <CheckCircle2 size={16} className="text-amber" />
                      <strong>Timer Tick Events:</strong> 1000ms <code>setInterval</code> events drive countdowns, triggering timeout events when zero is reached.
                    </li>
                    <li>
                      <CheckCircle2 size={16} className="text-amber" />
                      <strong>Web Audio API Acoustic Events:</strong> Synthetic audio events (chimes, pops, streaks) generated instantly via oscillators without external files.
                    </li>
                  </ul>
                </div>

                <div className="arch-card glassmorphic">
                  <h4 className="card-sub-title">Server-Side Event Architecture</h4>
                  <ul className="arch-list">
                    <li>
                      <CheckCircle2 size={16} className="text-amber" />
                      <strong>In-Process EventEmitter (<code>eventService.js</code>):</strong> An asynchronous in-process publish/subscribe mechanism (not an external message broker) decoupling domain events:
                    </li>
                    <li className="pl-4">
                      • <code>user:registered</code> - Audit trail recording
                    </li>
                    <li className="pl-4">
                      • <code>user:login</code> - User session & IP telemetry
                    </li>
                    <li className="pl-4">
                      • <code>round:completed</code> - Round analytics & correctness
                    </li>
                    <li className="pl-4">
                      • <code>game:finished</code> - Score notifications & match logging
                    </li>
                    <li className="pl-4">
                      • <code>badge:unlocked</code> - Milestone achievement awards
                    </li>
                  </ul>
                </div>
              </div>

              <div className="code-snippet-box">
                <div className="code-header">
                  <Code size={14} /> EventEmitter Implementation in <code>backend/services/eventService.js</code>
                </div>
                <pre>
                  {`const EventEmitter = require('events');
class GameEventEmitter extends EventEmitter {}
const gameEvents = new GameEventEmitter();

gameEvents.on('game:finished', (data) => {
  console.log(\`[EVENT] Match ended for \${data.username} | Score: \${data.score}\`);
});`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'interop' && (
            <div className="arch-section">
              <h3 className="arch-sec-title">
                <Globe className="cyan-text" /> Theme 3: Interoperability
              </h3>
              <p className="arch-sec-desc">
                Interoperability enables distinct software systems running on different platforms, technologies, and networks to communicate seamlessly via standard protocols and data formats.
              </p>

              <div className="arch-grid-2">
                <div className="arch-card glassmorphic">
                  <h4 className="card-sub-title">Fish Game API Integration</h4>
                  <ul className="arch-list">
                    <li>
                      <CheckCircle2 size={16} className="text-cyan" />
                      <strong>Endpoint:</strong> <code>https://marcconrad.com/uob/fish/api.php?out=json</code>
                    </li>
                    <li>
                      <CheckCircle2 size={16} className="text-cyan" />
                      <strong>Protocol:</strong> HTTPS / REST over HTTP/1.1 with TLS encryption.
                    </li>
                    <li>
                      <CheckCircle2 size={16} className="text-cyan" />
                      <strong>Data Interchange:</strong> JSON payload containing <code>question</code> image URL and <code>fish</code> solution.
                    </li>
                    <li>
                      <CheckCircle2 size={16} className="text-cyan" />
                      <strong>Decoupled Proxy Layer:</strong> Node.js backend proxies the request and stores puzzle solutions in a server-side active round store. The client receives only an opaque <code>roundId</code> UUID, completely eliminating client-side solution tampering or base64 JWT payload inspection.
                    </li>
                  </ul>
                </div>

                <div className="arch-card glassmorphic">
                  <h4 className="card-sub-title">Fault Tolerance & Resilience</h4>
                  <ul className="arch-list">
                    <li>
                      <CheckCircle2 size={16} className="text-cyan" />
                      <strong>Network Timeout Guard:</strong> 7,000ms timeout prevents hanging requests.
                    </li>
                    <li>
                      <CheckCircle2 size={16} className="text-cyan" />
                      <strong>Genuine API Cache Pool:</strong> Successfully retrieved puzzles from live requests are cached (up to 30) for zero-downtime gameplay during university server outages.
                    </li>
                    <li>
                      <CheckCircle2 size={16} className="text-cyan" />
                      <strong>Dedicated Sonar Hint:</strong> <code>POST /api/game/sonar-hint</code> calculates 5 wrong digits on the server without ever sending the solution to the browser.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="code-snippet-box">
                <div className="code-header">
                  <Code size={14} /> Interoperability Proxy in <code>backend/services/fishApiService.js</code>
                </div>
                <pre>
                  {`const response = await axios.get('https://marcconrad.com/uob/fish/api.php?out=json', { timeout: 7000 });
// Solution is stored safely in server memory; client receives only an opaque roundId
const roundId = crypto.randomUUID();
this.activeRounds.set(roundId, { solution: response.data.fish, ... });`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'identity' && (
            <div className="arch-section">
              <h3 className="arch-sec-title">
                <Shield className="cyan-text" /> Theme 4: Virtual Identity & Security
              </h3>
              <p className="arch-sec-desc">
                Virtual identity represents a verified digital persona within a distributed system, encompassing authentication, access control, state persistence, and auditability.
              </p>

              <div className="arch-grid-2">
                <div className="arch-card glassmorphic">
                  <h4 className="card-sub-title">Authentication & Cryptography</h4>
                  <ul className="arch-list">
                    <li>
                      <CheckCircle2 size={16} className="text-cyan" />
                      <strong>Password Hashing:</strong> <code>bcryptjs</code> with 10 salt rounds ensures plaintext passwords are never stored in the database.
                    </li>
                    <li>
                      <CheckCircle2 size={16} className="text-cyan" />
                      <strong>JSON Web Tokens (JWT):</strong> Stateless authentication token digitally signed with HMAC-SHA256, transmitted via <code>Authorization: Bearer</code> headers.
                    </li>
                    <li>
                      <CheckCircle2 size={16} className="text-cyan" />
                      <strong>Protected Routes:</strong> <code>verifyToken</code> middleware guards endpoints such as profile inspection and avatar updates.
                    </li>
                  </ul>
                </div>

                <div className="arch-card glassmorphic">
                  <h4 className="card-sub-title">Identity Persistence & Badges</h4>
                  <ul className="arch-list">
                    <li>
                      <CheckCircle2 size={16} className="text-cyan" />
                      <strong>MongoDB Atlas Collections:</strong> Persistent storage for <code>users</code> and <code>scores</code> with unique indexes.
                    </li>
                    <li>
                      <CheckCircle2 size={16} className="text-cyan" />
                      <strong>Customizable Underwater Avatar:</strong> Player can choose and update their avatar (Clownfish, Shark, Octopus, etc.).
                    </li>
                    <li>
                      <CheckCircle2 size={16} className="text-cyan" />
                      <strong>Gamified Identity:</strong> Unlocks badges (Reef Explorer, Deep Sea Diver, Ocean Master) as player achieves milestones.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="code-snippet-box">
                <div className="code-header">
                  <Code size={14} /> Password Hashing in <code>backend/models/User.js</code>
                </div>
                <pre>
                  {`const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);
// Token signed with user payload:
const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'script' && (
            <div className="arch-section">
              <h3 className="arch-sec-title">
                <Video className="gold-text" /> 10-Minute Video Presentation Script (1st Class Guide)
              </h3>
              <p className="arch-sec-desc">
                Follow this exact outline when recording your video. Show your working system first, then walk through each theme showing the code files on screen!
              </p>

              <div className="video-script-timeline">
                <div className="timeline-item">
                  <div className="timeline-time">00:00 - 02:00</div>
                  <div className="timeline-content">
                    <h4>Part 1: Working System Demonstration</h4>
                    <p>
                      • Show the live Fish Quest application in browser.
                      <br />• Register or log in with your Virtual Identity.
                      <br />• Play 2 rounds: show the puzzle fetched from Marc Conrad's Fish API, timer countdown, sound effects, and answer submission.
                      <br />• Open the Leaderboard to show score persistence in MongoDB Atlas.
                    </p>
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-time">02:00 - 04:00</div>
                  <div className="timeline-content">
                    <h4>Part 2: Theme 1 - Software Design Principles (Low Coupling & High Cohesion)</h4>
                    <p>
                      • Open VS Code and show the folder structure.
                      <br />• <strong>Cohesion:</strong> Explain how <code>server.js</code> delegates to <code>router/</code>, <code>controller/</code>, <code>services/</code>, and <code>models/</code>.
                      <br />• <strong>Low Coupling:</strong> Show how <code>useFishGame.js</code> custom hook separates game mechanics from UI rendering, and how <code>api.js</code> isolates network calls.
                    </p>
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-time">04:00 - 06:00</div>
                  <div className="timeline-content">
                    <h4>Part 3: Theme 2 - Event-Driven Programming</h4>
                    <p>
                      • Show <code>backend/services/eventService.js</code>: Explain the Node.js <code>EventEmitter</code> pub/sub pattern (listening to <code>round:completed</code>, <code>game:finished</code>).
                      <br />• Show <code>frontend/src/context/SoundContext.jsx</code>: Explain how Web Audio API synthesizes acoustic events on demand.
                      <br />• Show the timer interval event in <code>useFishGame.js</code> and keyboard listener events.
                    </p>
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-time">06:00 - 08:00</div>
                  <div className="timeline-content">
                    <h4>Part 4: Theme 3 - Interoperability</h4>
                    <p>
                      • Show <code>backend/services/fishApiService.js</code>: Explain the HTTP/REST protocol and JSON data interchange with <code>https://marcconrad.com/uob/fish/api.php?out=json</code>.
                      <br />• Discuss why a backend proxy is superior to direct client calls (prevents client-side cheating by signing JWT round tokens, prevents CORS issues, and handles server caching/resilience).
                    </p>
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-time">08:00 - 10:00</div>
                  <div className="timeline-content">
                    <h4>Part 5: Theme 4 - Virtual Identity & Conclusion</h4>
                    <p>
                      • Show <code>backend/models/User.js</code> and <code>backend/middleware/authMiddleware.js</code>: Explain Bcrypt password hashing (salt 10) and stateless JWT verification.
                      <br />• Show the MongoDB Atlas database collections (<code>users</code>, <code>scores</code>).
                      <br />• Summarize how the four themes together form a secure, distributed, and scalable service architecture.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

