function updateAuthUI(user) {
  const authBtn = document.getElementById('auth-btn');
  if (!authBtn) return;
  
  if (user) {
    authBtn.innerHTML = `
      <div class="user-menu">
        <span class="user-name-btn">${user.displayName || user.email.split('@')[0]}</span>
        <div class="user-dropdown">
          <p class="user-name">${user.displayName || user.email}</p>
          <a href="profile.html"><i class="fas fa-user"></i> My Profile</a>
          <a href="orders.html"><i class="fas fa-receipt"></i> My Orders</a>
          <a href="contact.html"><i class="fas fa-envelope"></i> Contact</a>
          <a href="#" onclick="signOut()"><i class="fas fa-sign-out-alt"></i> Sign Out</a>
        </div>
      </div>
    `;
  } else {
    authBtn.innerHTML = `
      <a href="login.html" class="btn-login">
        <i class="fas fa-user"></i> Sign In
      </a>
    `;
  }
}

function signOut() {
  auth.signOut().then(() => {
    window.location.href = 'index.html';
  });
}

function initAuthUI() {
  auth.onAuthStateChanged(updateAuthUI);
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.auth) {
    initAuthUI();
  } else {
    document.addEventListener('firebaseReady', initAuthUI);
  }
});