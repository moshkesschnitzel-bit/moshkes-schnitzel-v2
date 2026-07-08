let notificationsList = [];
let unreadCount = 0;

function initNotifications(userId) {
  // Listen for order status changes in real time
  db.collection('orders')
    .where('userId', '==', userId)
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'modified') {
          const order = change.doc.data();
          const message = `Order #${order.orderNumber} updated to: ${order.status.toUpperCase()}`;
          addNotification(message, order.orderNumber);
        }
      });
    });
}

function addNotification(message, orderNumber) {
  const notification = {
    id: Date.now(),
    message,
    orderNumber,
    time: new Date().toLocaleTimeString(),
    read: false
  };

  notificationsList.unshift(notification);
  unreadCount++;
  updateNotificationBell();
  renderNotifications();
}

function updateNotificationBell() {
  const badge = document.getElementById('notif-badge');
  if (badge) {
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? 'flex' : 'none';
  }
}

function toggleNotifications() {
  const panel = document.getElementById('notif-panel');
  if (panel.style.display === 'none' || !panel.style.display) {
    panel.style.display = 'block';
    markAllRead();
  } else {
    panel.style.display = 'none';
  }
}

function markAllRead() {
  unreadCount = 0;
  notificationsList.forEach(n => n.read = true);
  updateNotificationBell();
}

function renderNotifications() {
  const list = document.getElementById('notif-list');
  if (!list) return;

  if (notificationsList.length === 0) {
    list.innerHTML = '<p style="color:#888;font-size:14px;padding:10px;">No notifications yet</p>';
    return;
  }

  list.innerHTML = notificationsList.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}">
      <p class="notif-message">${n.message}</p>
      <span class="notif-time">${n.time}</span>
    </div>
  `).join('');
}

function createNotificationUI() {
  const container = document.createElement('div');
  container.className = 'notif-container';
  container.innerHTML = `
    <div class="notif-bell" onclick="toggleNotifications()">
      <i class="fas fa-bell"></i>
      <span id="notif-badge" class="notif-badge" style="display:none;">0</span>
    </div>
    <div id="notif-panel" class="notif-panel" style="display:none;">
      <div class="notif-header">
        <h4>Notifications</h4>
        <button onclick="clearNotifications()">Clear all</button>
      </div>
      <div id="notif-list">
        <p style="color:#888;font-size:14px;padding:10px;">No notifications yet</p>
      </div>
    </div>
  `;
  return container;
}

function clearNotifications() {
  notificationsList = [];
  unreadCount = 0;
  updateNotificationBell();
  renderNotifications();
  document.getElementById('notif-panel').style.display = 'none';
}

// Init when Firebase is ready
function setupNotifications() {
  auth.onAuthStateChanged(user => {
    if (user) {
      // Add bell to navbar
      const navIcons = document.querySelector('.nav-icons');
      if (navIcons) {
        const notifUI = createNotificationUI();
        navIcons.insertBefore(notifUI, navIcons.firstChild);
      }
      initNotifications(user.uid);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.auth && window.db) {
    setupNotifications();
  } else {
    document.addEventListener('firebaseReady', setupNotifications);
  }
});