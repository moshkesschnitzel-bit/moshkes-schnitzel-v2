// Redirect if already logged in
auth.onAuthStateChanged(user => {
  if (user && !window.location.pathname.includes('register')) {
    window.location.href = 'index.html';
  }
});

// Sign up with Google
function signUpWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(async result => {
      const user = result.user;
      await saveUserToFirestore(user, '', '');
      await sendWelcomeEmail(user.email, user.displayName || 'Friend');
      window.location.href = 'index.html';
    })
    .catch(error => {
      showError(error.message);
    });
}

// Register with Email
async function registerWithEmail() {
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!name || !email || !password) {
    showError('Please fill in all required fields.');
    return;
  }

  if (password.length < 6) {
    showError('Password must be at least 6 characters.');
    return;
  }

  try {
    const result = await auth.createUserWithEmailAndPassword(email, password);
    const user = result.user;

    await user.updateProfile({ displayName: name });
    await saveUserToFirestore(user, name, phone);
    await sendWelcomeEmail(email, name);

    window.location.href = 'index.html';
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      showError('This email is already registered. Please sign in.');
    } else {
      showError(error.message);
    }
  }
}

// Save user to Firestore
async function saveUserToFirestore(user, name, phone) {
  const userRef = db.collection('users').doc(user.uid);
  const doc = await userRef.get();
  if (!doc.exists) {
    await userRef.set({
      name: name || user.displayName || '',
      email: user.email,
      phone: phone || '',
      address: '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
}

// Show error/success message
function showError(message) {
  const errorDiv = document.getElementById('error-msg');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}