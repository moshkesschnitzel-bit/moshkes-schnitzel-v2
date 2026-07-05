function initOrders() {
  auth.onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    const list = document.getElementById('my-orders-list');

    try {
      const snap = await db.collection('orders')
        .where('userId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .get();

      if (snap.empty) {
        list.innerHTML = `
          <div class="empty-orders">
            <i class="fas fa-receipt"></i>
            <p>No orders yet. <a href="menu.html">Order now!</a></p>
          </div>
        `;
        return;
      }

      list.innerHTML = snap.docs.map(doc => {
        const o = doc.data();
        const date = o.createdAt?.toDate().toLocaleDateString('en-IL') || '';
        const statusColor = {
          pending: '#e67e22', preparing: '#3498db',
          ready: '#27ae60', delivered: '#95a5a6', cancelled: '#e74c3c'
        }[o.status] || '#888';

        const itemsList = o.items?.map(item => {
          let text = `${item.qty}x ${item.name}`;
          if (item.extras?.length > 0) text += ` (${item.extras.map(e => e.name).join(', ')})`;
          if (item.toppings?.length > 0) text += ` + ${item.toppings.map(t => t.name).join(', ')}`;
          return text;
        }).join('<br>') || '';

        return `
          <div class="my-order-card">
            <div class="my-order-header">
              <span class="my-order-number">#${o.orderNumber}</span>
              <span class="my-order-date">${date}</span>
              <span class="my-order-status" style="color:${statusColor};">
                ${o.status?.toUpperCase()}
              </span>
            </div>
            <div class="my-order-items">${itemsList}</div>
            <div class="my-order-total">
              Total: <strong>₪${o.total?.toFixed(2)}</strong>
              ${o.usdTotal ? ` ($${o.usdTotal})` : ''}
            </div>
          </div>
        `;
      }).join('');

    } catch (error) {
      console.log('Orders error:', error);
      list.innerHTML = '<p style="color:#888;padding:20px;">Could not load orders.</p>';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.auth && window.db) {
    initOrders();
  } else {
    document.addEventListener('firebaseReady', initOrders);
  }
});