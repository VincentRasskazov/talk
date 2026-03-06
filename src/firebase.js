import firebase from "firebase";

const firebaseConfig = {
  apiKey: "AIzaSyChrfsHBeDKy56koXEFCPgOPM9f_BJh9Rk",
  authDomain: "chat-65f4a.firebaseapp.com",
  projectId: "chat-65f4a",
  storageBucket: "chat-65f4a.firebasestorage.app",
  messagingSenderId: "512709701751",
  appId: "1:512709701751:web:9f1d34aae5a67aee451672"
};
const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebaseApp.firestore();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

export { auth, provider };
export default db;
