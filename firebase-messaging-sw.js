// public/firebase-messaging-sw.js
// Force the worker to activate immediately instead of waiting in the background
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyChrfsHBeDKy56koXEFCPgOPM9f_BJh9Rk",
  authDomain: "chat-65f4a.firebaseapp.com",
  projectId: "chat-65f4a",
  storageBucket: "chat-65f4a.firebasestorage.app",
  messagingSenderId: "512709701751",
  appId: "1:512709701751:web:9f1d34aae5a67aee451672"
});

const messaging = firebase.messaging();

// This listener fires when your app is closed or running in the background
messaging.onBackgroundMessage(function(payload) {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png' // Make sure you have an icon here, or change this path
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
