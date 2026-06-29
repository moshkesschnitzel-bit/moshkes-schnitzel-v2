// Redirect if already logged in
auth.onAuthStateChanged(user => {
  if (user) {
    window.location.href = 'index.html';
  }
});

// Sign in with Google
function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      const user = result.user;
      saveUserToFirestore(user);
      window.location.href = 'index.html';
    })
    .catch(error => {
      showError(error.message);
    });
}

// Sign in with Email
function signInWithEmail() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showError('Please enter your email and password.');
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(result => {
      saveUserToFirestore(result.user);
      window.location.href = 'index.html';
    })
    .catch(error => {
      showError('Invalid email or password. Please try again.');
    });
}

// Forgot password
function forgotPassword() {
  const email = document.getElementById('email').value;
  if (!email) {
    showError('Please enter your email address first.');
    return;
  }
  auth.sendPasswordResetEmail(email)
    .then(() => {
      showError('Password reset email sent! Check your inbox.');
      document.getElementById('error-msg').style.color = 'green';
    })
    .catch(error => {
      showError(error.message);
    });
}

// Save user to Firestore
async function saveUserToFirestore(user) {
  const userRef = db.collection('users').doc(user.uid);
  const doc = await userRef.get();
  if (!doc.exists) {
    await userRef.set({
      name: user.displayName || '',
      email: user.email,
      phone: '',
      address: '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
}

// Show error message
function showError(message) {
  const errorDiv = document.getElementById('error-msg');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}