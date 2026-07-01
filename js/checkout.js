let currentUser = null;
let orderSummary = null;
let selectedAddress = '';
let addressTimeout = null;

// Init
document.addEventListener('DOMContentLoaded', async () => {
  // Check auth
  auth.onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    currentUser = user;

    // Pre-fill user details
    document.getElementById('checkout-email').value = user.email;

    // Load user profile from Firestore
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
  });

  // Check store is open
  const storeDoc = await db.collection('settings').doc('store').get();
  if (storeDoc.exists && storeDoc.data().isOpen === false) {
    document.getElementById('store-closed-msg').style.display = 'block';
    document.getElementById('place-order-btn').disabled = true;
    document.getElementById('place-order-btn').style.background = '#ccc';
  }

  // Load order summary
  orderSummary = JSON.parse(localStorage.getItem('orderSummary') || '{}');
  loadCheckoutSummary();

  // Hide delivery address if pickup
  if (orderSummary.orderType === 'pickup') {
    document.getElementById('delivery-address-section').style.display = 'none';
  }
});

// Load order summary
function loadCheckoutSummary() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const itemsDiv = document.getElementById('checkout-items');

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
    document.getElementById('co-subtotal').textContent = `₪${orderSummary.subtotal?.toFixed(2) || 0}`;
    
    if (orderSummary.orderType === 'delivery') {
      document.getElementById('co-delivery').textContent = `₪${orderSummary.deliveryFee || 0}`;
    } else {
      document.getElementById('co-delivery-row').style.display = 'none';
    }

    if (orderSummary.paymentMethod === 'card') {
      const ccFee = orderSummary.subtotal * 0.12;
      document.getElementById('co-cc-row').style.display = 'flex';
      document.getElementById('co-cc-fee').textContent = `₪${ccFee.toFixed(2)}`;
      document.getElementById('co-usd-row').style.display = 'flex';
      document.getElementById('co-usd').textContent = `$${orderSummary.usdTotal}`;
      document.getElementById('payment-badge').innerHTML = 
        '<i class="fas fa-credit-card"></i> Credit Card';
    }

    document.getElementById('co-total').textContent = `₪${orderSummary.total?.toFixed(2) || 0}`;

    if (orderSummary.isSplit) {
      document.getElementById('split-info-box').style.display = 'block';
      document.getElementById('co-split-amount').textContent = 
        (orderSummary.total / 2).toFixed(2);
    }
  }
}

// Search address using Google Maps Geocoding
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
  mapIframe.src = `https://maps.google.com/maps?q=${encodedAddress}&output=embed`;
  document.getElementById('map-preview').style.display = 'block';
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

  // Disable button
  const btn = document.getElementById('place-order-btn');
  btn.disabled = true;
  btn.textContent = 'Placing Order...';

  try {
    // Generate order number
    const orderNumber = Math.floor(10000 + Math.random() * 90000).toString();

    // Full delivery address
    const fullAddress = apt ? `${address}, ${apt}` : address;
    const mapsLink = `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}`;

    // Save order to Firestore
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

    // Update user profile with latest address
    await db.collection('users').doc(currentUser.uid).set({
      name, phone, address: fullAddress
    }, { merge: true });

    // Send order receipt email
    await sendOrderReceipt({
      orderNumber,
      customerName: name,
      customerEmail: currentUser.email,
      items: cart,
      orderType: orderSummary.orderType,
      paymentMethod: orderSummary.paymentMethod,
      deliveryAddress: fullAddress,
      total: orderSummary.total,
      usdTotal: orderSummary.usdTotal
    });

    // Save order number for confirmation page
    localStorage.setItem('lastOrderNumber', orderNumber);
    localStorage.setItem('lastOrderId', orderRef.id);

    // Clear cart
    localStorage.removeItem('cart');
    localStorage.removeItem('orderSummary');

    // Redirect to confirmation
    window.location.href = 'order-confirmation.html';

  } catch (error) {
    console.log('Order error:', error);
    alert('Something went wrong. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Place Order';
  }
}