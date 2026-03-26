# 💬 Talk - Real-Time Chat Platform

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)
![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)

**Talk** is a fully-featured, Discord-style real-time messaging application built entirely with React and Firebase. It supports server-based communities, direct messaging, peer-to-peer WebRTC voice/video calls, and advanced administrative tools.

---

### ⚠️ AI Generation & Architecture Disclaimer
> **Please Note:** This repository was built rapidly with heavy assistance from AI. Because of the fast prototyping and iterative generation process:
> * **The Code is a Monolith:** You will find massive files (like a 1,500+ line `App.js`), unconventional structures, and some "spaghetti" code instead of perfectly separated React components. Sorry for the mess!
> * **Hidden Secrets:** There may be deprecated configuration keys buried deep within the commit history. Please respect the project and refrain from digging for them. 
> * **The Goal:** This is a passion project focused purely on shipping end-user features and a great UI, rather than maintaining perfect code architecture.

---

## 🚀 Key Features

### 🗣️ Core Communication
* **Servers & Channels:** Create public or private servers, organize discussions into text/voice channels, and use invite codes to grow your community.
* **Direct Messaging:** Private 1-on-1 conversations with real-time read receipts.
* **Rich Embeds & Media:** Automatic URL link previews (powered by Microlink), inline image rendering, and Tenor GIF integration.
* **Inline Replies & Mentions:** Reply directly to specific messages and `@mention` users.

### 📞 Voice & Video 
* **Native WebRTC:** Secure, peer-to-peer voice and video calling built directly into the browser without third-party SDKs. 
* **Server Voice Channels:** Dedicated audio rooms for server communities.

### 🛡️ Moderation & Safety
* **Role Management:** Admins can create custom colored roles and assign granular permissions (e.g., who can view, send messages, or kick users). Defaults safely to `@everyone`.
* **Device-Level Banning:** A robust 3-strike spam filter that permanently locks out malicious users via local browser storage, preventing alt-account abuse.
* **The `/clear` Command:** Global Admins can instantly wipe up to 50 messages at a time to clean up chat clutter.

### ⚡ Performance & UX
* **Offline Caching:** Messages are instantly loaded from `localStorage` upon rendering, cutting down Firebase reads and providing a lightning-fast UI while the server connects.
* **Hyper-Optimized Writes:** Background tasks (like unread channel timestamps) are throttled to run only once every 60 seconds, saving massive amounts of Firebase quota.
* **Performance Mode:** A user-toggled setting that disables heavy UI elements (like URL fetching) to save CPU/RAM on lower-end devices.
* **Native Notifications:** HTML5 browser push notifications with audio alerts for background tabs.
* **Loading UI:** Custom pulsing logo loading screen for seamless app initialization.

### 🤖 AI Companions
* **Integrated LLMs:** Talk directly to built-in AI assistants (like VincentAI) inside any channel or DM by using specific trigger tags (e.g., `@chatgpt`). The AI is context-aware (knows your name, channel, and device info).

---

## 🛠️ Tech Stack

* **Frontend:** React.js, standard CSS
* **Backend / Database:** Firebase Firestore (Real-time NoSQL)
* **Authentication:** Firebase Auth (Email/Password & Google OAuth)
* **Media / Fetching:** Microlink API (URL previews), Tenor API (GIFs)
* **Deployment:** GitHub Pages via automated GitHub Actions

---

## 💻 Local Development Setup

If you want to fork this repository and run it locally, follow these steps:

1. **Clone the repo:**
   ```bash
   git clone https://github.com/VincentRasskazov/talk.git
   cd talk
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up Secrets:**
   Ensure you change the keys and stuff in the first part of app.js with your own.

4. **Run the app:**
   ```bash
   npm start
   ```
   The app will compile and run on `http://localhost:3000`.

---

## 📄 License
MIT
