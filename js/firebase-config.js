// Firebase config loaded from backend
async function loadFirebaseConfig() {
  try {
    const response = await fetch('/.netlify/functions/get-config');
    const config = await response.json();
    firebase.initializeApp(config);
    window.db = firebase.firestore();
    window.auth = firebase.auth();
    console.log('Firebase connected successfully!');
    document.dispatchEvent(new Event('firebaseReady'));
  } catch (error) {
    console.error('Firebase config error:', error);
  }
}

loadFirebaseConfig();