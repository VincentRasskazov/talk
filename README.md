# Talk - Real-Time Chat Platform

This repository and its codebase were built with heavy assistance from AI. The code contains large monolithic files, unconventional structures, and experimental logic. There may be deprecated configuration secrets in the history; please avoid extracting or reusing them.

Talk is a Discord-style messaging application built with React and Firebase. It supports server communities, direct messaging, and WebRTC voice/video calls.

---

## Key Features

* **Communication:** Servers with text channels, invite codes, and direct messaging with read receipts.
* **Rich Media:** URL link previews, inline image rendering, and Tenor GIF integration.
* **Voice & Video:** Peer-to-peer WebRTC calling and dedicated voice rooms.
* **Moderation:** Device-level banning, role-based permissions, and administrative commands like /clear.
* **Performance:** Offline caching via localStorage, throttled database writes, and a low-resource performance mode.
* **AI Integration:** Context-aware AI assistants accessible via trigger tags in channels or DMs.

---

## Tech Stack

* **Frontend:** React.js and CSS.
* **Backend:** Firebase Firestore (Real-time NoSQL).
* **Authentication:** Firebase Auth (Email/Password and Google OAuth).
* **APIs:** Microlink (URL previews) and Tenor (GIFs).
* **Hosting:** GitHub Pages via GitHub Actions.

---

## Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/VincentRasskazov/talk.git
   cd talk
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   You must provide your own Firebase configuration keys in the source code to enable the backend features.

4. **Run the app:**
   ```bash
   npm start
   ```

---

## Maintenance Status

This is a passion project focused on features rather than code architecture. It is not actively maintained and is provided as-is for educational or experimental purposes.
