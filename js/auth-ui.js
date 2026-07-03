// Auth UI - shows login/logout button in navbar
function updateAuthUI(user) {
  const authBtn = document.getElementById('auth-btn');
    if (!authBtn) return;
      
        if (user) {
            authBtn.innerHTML = `
                  <div class="user-menu">
                          <span class="user-name-btn">${user.displayName || user.email.split('@')[0]}</span>
                                  <div class="user-dropdown">
                                            <p class="user-name">${user.displayName || user.email}</p>
                                                      <a href="profile.html">My Profile & Orders</a>
                                                                <a href="#" onclick="signOut()">Sign Out</a>
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

                                                                                                                  // Sign out function
                                                                                                                  function signOut() {
                                                                                                                    auth.signOut().then(() => {
                                                                                                                        window.location.href = 'index.html';
                                                                                                                          });
                                                                                                                          }

                                                                                                                          // Init
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