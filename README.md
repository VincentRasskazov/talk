### NOTE: this is not meant to be for normal coders. it is purely customised for my website. u can tinker around but u have been warned




# Talk

A React/Redux chat application called **Talk**. It uses Firebase for authentication and realtime data storage. The project is configured for deployment to GitHub Pages at the root URL:

```
https://vincentrasskazov.github.io/talk/
```

## Features

- Google authentication via Firebase Auth (ensure your GitHub Pages domain is added to Firebase’s authorized domains)
- Firestore realtime chats and messages
- Material-UI components for the UI
- Redux toolkit for state management

## Getting Started

```bash
# install dependencies
npm install

# start development server
npm start
```

App will run on `http://localhost:3000` by default.

## Deploying to GitHub Pages

The project uses the `gh-pages` package. When you're ready to publish:

```bash
npm run deploy
```

This will build the app (with a workaround for newer Node versions) and push the `build` folder to the `gh-pages` branch.

## Firebase Configuration

Firebase credentials are stored in `src/firebase.js`. The current config points to the `chat-65f4a` project and is used for authentication and Firestore access.

Feel free to update the config or Firebase project as needed.
