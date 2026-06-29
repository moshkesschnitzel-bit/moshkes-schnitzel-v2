// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCNzL3hKXmR1DSKC-GjHI4mWQDZD79zt-s",
  authDomain: "moshkes-schnitzel-v2.firebaseapp.com",
  projectId: "moshkes-schnitzel-v2",
  storageBucket: "moshkes-schnitzel-v2.firebasestorage.app",
  messagingSenderId: "271814640045",
  appId: "1:271814640045:web:58b19aded25d2280dc2124",
  measurementId: "G-VZ3G294QQL"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const db = firebase.firestore();
const auth = firebase.auth();

console.log("Firebase connected successfully!");