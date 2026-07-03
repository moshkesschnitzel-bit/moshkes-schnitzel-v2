let currentUser = null;
let orderSummary = null;
let selectedAddress = '';
let addressTimeout = null;

async function initCheckout() {
  // Check store is open
  try {
    const storeDoc = await db.collection('settings').doc('store').get();
    if (storeDoc.exists && storeDoc.data().isOpen === false) {
      document.getElementById('store-closed-msg').style.display = 'block';
      document.getElementById('place-order-btn').disabled = true;
      document.getElementById('place-order-btn').style.background = '#ccc';
    }
  } catch(e) {}

  // Load order summary
  orderSummary = JSON.parse(localStorage.getItem('orderSummary') || '{}');
  loadCheckoutSummary();

  // Hide delivery address if pickup
  if (orderSummary.orderType === 'pickup') {
    const deliverySection = document.getElementById('delivery-address-section');
    if (deliverySection) deliverySection.style.display = 'none';
  }

  // Check auth
  auth.onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    currentUser = user;

    // Pre-fill email
    document.getElementById('checkout-email').value = user.email;

    // Load user profile from Firestore
    try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        if (data.name) document.getElementById('checkout-name').value = data.name;
        if (data.phone) document.getElementById('checkout-phone').value = data.phone;
        if (data.address) {
          document.getElementById('checkout-address').value = data.address;
          selectedAddress = data.address;
          showMapPreview(data.address);
        }
      }
    } catch(e) {}
  });
}

// Load order summary
function loadCheckoutSummary() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const itemsDiv = document.getElementById('checkout-items');

  if (!itemsDiv) return;

  itemsDiv.innerHTML = '';
  cart.forEach(item => {
    itemsDiv.innerHTML += `
      <div class="checkout-item">
        <span>${item.qty}x ${item.name}</span>
        <span>₪${item.itemTotal.toFixed(2)}</span>
      </div>
    `;
  });

  if (orderSummary) {
    const subtotalEl = document.getElementById('co-subtotal');
    const totalEl = document.getElementById('co-total');
    if (subtotalEl) subtotalEl.textContent = `₪${orderSummary.subtotal?.toFixed(2) || 0}`;
    
    if (orderSummary.orderType === 'delivery') {
      const deliveryEl = document.getElementById('co-delivery');
      if (deliveryEl) deliveryEl.textContent = `₪${orderSummary.deliveryFee || 0}`;
    } else {
      const deliveryRow = document.getElementById('co-delivery-row');
      if (deliveryRow) deliveryRow.style.display = 'none';
    }

    if (orderSummary.paymentMethod === 'card') {
      const ccFee = orderSummary.subtotal * 0.12;
      const ccRow = document.getElementById('co-cc-row');
      const ccFeeEl = document.getElementById('co-cc-fee');
      const usdRow = document.getElementById('co-usd-row');
      const usdEl = document.getElementById('co-usd');
      const badge = document.getElementById('payment-badge');
      if (ccRow) ccRow.style.display = 'flex';
      if (ccFeeEl) ccFeeEl.textContent = `₪${ccFee.toFixed(2)}`;
      if (usdRow) usdRow.style.display = 'flex';
      if (usdEl) usdEl.textContent = `$${orderSummary.usdTotal}`;
      if (badge) badge.innerHTML = '<i class="fas fa-credit-card"></i> Credit Card';
    }

    if (totalEl) totalEl.textContent = `₪${orderSummary.total?.toFixed(2) || 0}`;

    if (orderSummary.isSplit) {
      const splitBox = document.getElementById('split-info-box');
      const splitAmt = document.getElementById('co-split-amount');
      if (splitBox) splitBox.style.display = 'block';
      if (splitAmt) splitAmt.textContent = (orderSummary.total / 2).toFixed(2);
    }
  }
}

// Search address
async function searchAddress() {
  const input = document.getElementById('checkout-address').value;
  clearTimeout(addressTimeout);
  
  if (input.length < 3) {
    document.getElementById('address-suggestions').innerHTML = '';
    return;
  }

  addressTimeout = setTimeout(async () => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&limit=5`
      );
      const results = await response.json();
      showAddressSuggestions(results);
    } catch (error) {
      console.log('Address search error:', error);
    }
  }, 500);
}

// Show address suggestions
function showAddressSuggestions(results) {
  const suggestionsDiv = document.getElementById('address-suggestions');
  suggestionsDiv.innerHTML = '';

  results.forEach(result => {
    const div = document.createElement('div');
    div.className = 'suggestion-item';
    div.textContent = result.display_name;
    div.onclick = () => {
      document.getElementById('checkout-address').value = result.display_name;
      selectedAddress = result.display_name;
      suggestionsDiv.innerHTML = '';
      showMapPreview(result.display_name);
    };
    suggestionsDiv.appendChild(div);
  });
}

// Show map preview
function showMapPreview(address) {
  const encodedAddress = encodeURIComponent(address);
  const mapIframe = document.getElementById('map-iframe');
  if (mapIframe) {
    mapIframe.src = `https://maps.google.com/maps?q=${encodedAddress}&output=embed`;
    document.getElementById('map-preview').style.display = 'block';
  }
}

// Place order
async function placeOrder() {
  const name = document.getElementById('checkout-name').value.trim();
  const phone = document.getElementById('checkout-phone').value.trim();
  const address = document.getElementById('checkout-address').value.trim();
  const apt = document.getElementById('checkout-apt')?.value.trim() || '';
  const notes = document.getElementById('checkout-notes').value.trim();

  if (!name || !phone) {
    alert('Please enter your name and phone number.');
    return;
  }

  if (orderSummary.orderType === 'delivery' && !address) {
    alert('Please enter your delivery address.');
    return;
  }

  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }

  const btn = document.getElementById('place-order-btn');
  btn.disabled = true;
  btn.textContent = 'Placing Order...';

  try {
    const orderNumber = Math.floor(10000 + Math.random() * 90000).toString();
    const fullAddress = apt ? `${address}, ${apt}` : address;
    const mapsLink = `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}`;

    const orderRef = await db.collection('orders').add({
      orderNumber,
      userId: currentUser.uid,
      customerName: name,
      customerPhone: phone,
      customerEmail: currentUser.email,
      deliveryAddress: fullAddress,
      mapsLink,
      notes,
      items: cart,
      subtotal: orderSummary.subtotal,
      deliveryFee: orderSummary.deliveryFee || 0,
      total: orderSummary.total,
      paymentMethod: orderSummary.paymentMethod,
      orderType: orderSummary.orderType,
      isSplit: orderSummary.isSplit || false,
      usdTotal: orderSummary.usdTotal || null,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('users').doc(currentUser.uid).set({
      name, phone, address: fullAddress
    }, { merge: true });

    if (orderSummary.paymentMethod === 'card') {
      localStorage.setItem('pendingOrder', JSON.stringify({
        orderNumber,
        orderId: orderRef.id,
        customerName: name,
        customerEmail: currentUser.email,
        customerPhone: phone,
        items: cart,
        orderType: orderSummary.orderType,
        paymentMethod: 'card',
        deliveryAddress: fullAddress,
        mapsLink,
        notes,
        subtotal: orderSummary.subtotal,
        deliveryFee: orderSummary.deliveryFee || 0,
        total: orderSummary.total,
        usdTotal: orderSummary.usdTotal,
        isSplit: orderSummary.isSplit || false
      }));
      localStorage.removeItem('cart');
      localStorage.removeItem('orderSummary');
      window.location.href = 'payment.html';
    } else {
      await sendOrderReceipt({
        orderNumber,
        customerName: name,
        customerEmail: currentUser.email,
        items: cart,
        orderType: orderSummary.orderType,
        paymentMethod: 'cash',
        deliveryAddress: fullAddress,
        total: orderSummary.total,
        usdTotal: null
      });
      localStorage.setItem('lastOrderNumber', orderNumber);
      localStorage.setItem('lastOrderId', orderRef.id);
      localStorage.removeItem('cart');
      localStorage.removeItem('orderSummary');
      window.location.href = 'order-confirmation.html';
    }

  } catch (error) {
    console.log('Order error:', error);
    alert('Something went wrong. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Place Order';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.db && window.auth) {
    initCheckout();
  } else {
    document.addEventListener('firebaseReady', initCheckout);
  }
});
