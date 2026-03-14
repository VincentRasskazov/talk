# 💬 Talk - Real-Time Chat Platform

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)
![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)

**Talk** is a fully-featured, Discord-style real-time messaging application built entirely with React and Firebase. It supports server-based communities, direct messaging, peer-to-peer WebRTC voice/video calls, and advanced administrative tools.

---

### ⚠️ AI Generation & Repository Disclaimer
> **Please Note:** This repository and its codebase were built iteratively with heavy assistance from AI (Large Language Models). Because of the rapid prototyping and generation process:
> * **The Code is Messy:** You will find massive monolithic files (like a 1,500+ line `App.js`), unconventional structures, and spaghetti code. 
> * **Hidden Secrets:** There may be deprecated API keys or messy configuration secrets buried deep within the commit history. Please respect the project and refrain from digging through the history to find them. 
> * It is a passion project focused on end-user features rather than perfect code architecture!

---

## 🚀 Key Features

### 🗣️ Core Communication
* **Servers & Channels:** Create public or private servers, organize discussions into text channels, and use invite codes to grow your community.
* **Direct Messaging:** Private 1-on-1 conversations with real-time read receipts.
* **Rich Embeds & Media:** Automatic Discord-style URL link previews (powered by Microlink), inline image rendering, and Tenor GIF integration.
* **Inline Replies:** Reply directly to specific messages for clear conversational threads.

### 📞 Voice & Video 
* **Native WebRTC:** Secure, peer-to-peer voice and video calling built directly into the browser without third-party SDKs. 
* **Server Voice Channels:** Dedicated audio rooms for server communities.

### 🛡️ Moderation & Safety
* **Device-Level Banning:** A robust 3-strike spam filter that permanently locks out malicious users via local storage, preventing alt-account abuse.
* **Role Management:** Admins can create custom colored roles and assign granular permissions (like kicking users or deleting messages).
* **The `/clear` Command:** Global Admins can easily wipe up to 50 messages at a time to clean up chat clutter.
* **Rate Limiting:** Hardcoded 5,000 character limits on all inputs to protect Firebase bandwidth and user RAM.

### ⚡ Performance & UX
* **Offline Caching:** Messages are instantly loaded from `localStorage` upon rendering, cutting down Firebase reads and providing a lightning-fast UI while the server connects.
* **Hyper-Optimized Writes:** Background tasks (like unread channel timestamps) are throttled to run only once every 60 seconds, saving massive amounts of Firebase quota.
* **Performance Mode:** A user-toggled setting that disables heavy UI elements (like URL fetching) to save CPU/RAM on lower-end devices.
* **Native Notifications:** HTML5 browser push notifications with audio alerts for background tabs (no Service Workers required).

### 🤖 AI Companions
* **Integrated LLMs:** Talk directly to built-in AI assistants (like VincentAI) inside any channel or DM by using specific trigger tags (e.g., `@copilot`). The AI is context-aware and knows who it is talking to.

---

## 🛠️ Tech Stack

* **Frontend:** React.js, standard CSS
* **Backend / Database:** Firebase Firestore (Real-time NoSQL)
* **Authentication:** Firebase Auth (Email/Password & Google OAuth)
* **Media / Fetching:** Microlink API (URL previews), Tenor API (GIFs)
* **Hosting:** GitHub Pages via automated GitHub Actions (`deploy.yml`)

---

## 💻 Getting Started (Local Development)

If you want to clone this repository and run it locally, follow these steps:

1. **Clone the repo:**
   ```bash
   git clone [https://github.com/VincentRasskazov/talk.git](https://github.com/VincentRasskazov/talk.git)
   cd talk
