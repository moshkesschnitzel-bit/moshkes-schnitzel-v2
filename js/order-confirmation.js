document.addEventListener('DOMContentLoaded', async () => {
  const orderNumber = localStorage.getItem('lastOrderNumber');
  const orderId = localStorage.getItem('lastOrderId');

  if (!orderNumber) {
    window.location.href = 'index.html';
    return;
  }

  // Show order number
  document.getElementById('order-number').textContent = orderNumber;

  try {
    // Load order details from Firestore
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (orderDoc.exists) {
      const order = orderDoc.data();
      const detailsDiv = document.getElementById('confirmation-details');

      detailsDiv.innerHTML = `
        <div class="confirmation-row">
          <span><i class="fas fa-user"></i> Name</span>
          <span>${order.customerName}</span>
        </div>
        <div class="confirmation-row">
          <span><i class="fas fa-phone"></i> Phone</span>
          <span>${order.customerPhone}</span>
        </div>
        ${order.orderType === 'delivery' ? `
        <div class="confirmation-row">
          <span><i class="fas fa-map-marker-alt"></i> Address</span>
          <span>${order.deliveryAddress}</span>
        </div>
        <div class="confirmation-row">
          <span><i class="fas fa-map"></i> Map</span>
          <a href="${order.mapsLink}" target="_blank" class="maps-link">
            View on Google Maps <i class="fas fa-external-link-alt"></i>
          </a>
        </div>
        ` : `
        <div class="confirmation-row">
          <span><i class="fas fa-store"></i> Order Type</span>
          <span>Pickup</span>
        </div>
        `}
        <div class="confirmation-row">
          <span><i class="fas fa-credit-card"></i> Payment</span>
          <span>${order.paymentMethod === 'card' ? 'Credit Card' : 'Cash on Delivery'}</span>
        </div>
        <div class="confirmation-row total-row">
          <span><i class="fas fa-shekel-sign"></i> Total</span>
          <span>₪${order.total?.toFixed(2)}</span>
        </div>
        ${order.usdTotal ? `
        <div class="confirmation-row">
          <span><i class="fas fa-dollar-sign"></i> Total in USD</span>
          <span>$${order.usdTotal}</span>
        </div>
        ` : ''}
        ${order.isSplit ? `
        <div class="confirmation-row">
          <span><i class="fas fa-users"></i> Split Payment</span>
          <span>Each pays ₪${(order.total / 2).toFixed(2)}</span>
        </div>
        ` : ''}

        <div class="order-items-list">
          <h4>Items Ordered</h4>
          ${order.items.map(item => `
            <div class="confirmation-item">
              <span>${item.qty}x ${item.name}</span>
              <span>₪${item.itemTotal.toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Clear order data from localStorage
    localStorage.removeItem('lastOrderNumber');
    localStorage.removeItem('lastOrderId');

  } catch (error) {
    console.log('Confirmation error:', error);
  }
});