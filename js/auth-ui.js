// Auth UI - shows login/logout button in navbar
function updateAuthUI(user) {
  const authBtn = document.getElementById('auth-btn');
  
  if (user) {
    // User is logged in
    authBtn.innerHTML = `
      <div class="user-menu">
        <img src="${user.photoURL || 'assets/default-avatar.png'}" 
             alt="Profile" class="user-avatar" />
        <div class="user-dropdown">
          <p class="user-name">${user.displayName || user.email}</p>
          <a href="profile.html">My Orders</a>
          <a href="#" onclick="signOut()">Sign Out</a>
        </div>
      </div>
    `;
  } else {
    // User is logged out
    authBtn.innerHTML = `
      <a href="login.html" class="btn-login">
        <i class="fas fa-user"></i> Sign In
      </a>
    `;
  }
}

// Sign out function
function signOut() {
  auth.signOut().then(() => {
    window.location.href = 'index.html';
  });
}

// Listen for auth state changes
auth.onAuthStateChanged(updateAuthUI);