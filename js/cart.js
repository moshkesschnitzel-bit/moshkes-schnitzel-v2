let orderType = 'delivery';
let paymentMethod = 'cash';
let deliveryFee = 0;
let exchangeRate = 3.7; // USD to ILS rate
let isSplit = false;

// Load cart and settings
async function loadCart() {
  try {
    // Get delivery fee and exchange rate from Firebase
    const settingsDoc = await db.collection('settings').doc('store').get();
    if (settingsDoc.exists) {
      deliveryFee = settingsDoc.data().deliveryFee || 0;
      exchangeRate = settingsDoc.data().exchangeRate || 3.7;
      
      // Check if delivery is available
      const deliveryAvailable = settingsDoc.data().deliveryAvailable !== false;
      if (!deliveryAvailable) {
        const deliveryBtn = document.querySelector('.order-type-selector .type-btn:first-child');
        if (deliveryBtn) {
          deliveryBtn.disabled = true;
          deliveryBtn.style.opacity = '0.4';
          deliveryBtn.title = 'Delivery not available right now';
        }
        selectOrderType('pickup');
        orderType = 'pickup';
      }
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartItemsDiv = document.getElementById('cart-items');

    if (cart.length === 0) {
      cartItemsDiv.innerHTML = `
        <div class="empty-cart">
          <i class="fas fa-shopping-cart"></i>
          <h3>Your cart is empty</h3>
          <p>Add some delicious items from our menu!</p>
          <a href="menu.html" class="btn-primary">Browse Menu</a>
        </div>
      `;
      updateSummary();
      return;
    }

    cartItemsDiv.innerHTML = '';
    cart.forEach((item, index) => {
      const extrasText = item.extras && item.extras.length > 0 
        ? item.extras.map(e => e.name).join(', ') : '';
      const toppingsText = item.toppings && item.toppings.length > 0 
        ? item.toppings.map(t => t.name).join(', ') : '';

      const cartCard = document.createElement('div');
      cartCard.className = 'cart-card';
      cartCard.innerHTML = `
        <img src="${item.image}" alt="${item.name}" />
        <div class="cart-card-info">
          <h3>${item.name}</h3>
          ${extrasText ? `<p class="cart-extras">Extras: ${extrasText}</p>` : ''}
          ${toppingsText ? `<p class="cart-extras">Toppings: ${toppingsText}</p>` : ''}
          ${item.request ? `<p class="cart-extras">Note: ${item.request}</p>` : ''}
          <div class="cart-card-bottom">
            <div class="cart-qty">
              <button onclick="changeCartQty(${index}, -1)">−</button>
              <span>${item.qty}</span>
              <button onclick="changeCartQty(${index}, 1)">+</button>
            </div>
            <span class="price">₪${item.itemTotal.toFixed(2)}</span>
            <button class="btn-remove" onclick="removeFromCart(${index})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
      cartItemsDiv.appendChild(cartCard);
    });

    updateSummary();
    updateCartCount();

  } catch (error) {
    console.log('Cart loading error:', error);
  }
}

// Update order summary
function updateSummary() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const subtotal = cart.reduce((sum, item) => sum + item.itemTotal, 0);
  
  let total = subtotal;
  
  // Add delivery fee
  if (orderType === 'delivery') {
    total += deliveryFee;
    document.getElementById('delivery-fee-row').style.display = 'flex';
    document.getElementById('summary-delivery').textContent = `₪${deliveryFee}`;
  } else {
    document.getElementById('delivery-fee-row').style.display = 'none';
  }

  // Add CC fee
  if (paymentMethod === 'card') {
    const ccFee = total * 0.12;
    total += ccFee;
    document.getElementById('cc-fee-row').style.display = 'flex';
    document.getElementById('summary-cc-fee').textContent = `₪${ccFee.toFixed(2)}`;
    
    // Show USD conversion
    const usdTotal = total / exchangeRate;
    document.getElementById('usd-row').style.display = 'flex';
    document.getElementById('summary-usd').textContent = `$${usdTotal.toFixed(2)}`;
    
    // Show split option
    document.getElementById('split-payment-section').style.display = 'block';
  } else {
    document.getElementById('cc-fee-row').style.display = 'none';
    document.getElementById('usd-row').style.display = 'none';
    document.getElementById('split-payment-section').style.display = 'none';
  }

  document.getElementById('summary-subtotal').textContent = `₪${subtotal.toFixed(2)}`;
  document.getElementById('summary-total').textContent = `₪${total.toFixed(2)}`;

  // Update split amount
  if (isSplit) {
    document.getElementById('split-amount').textContent = (total / 2).toFixed(2);
  }

  // Save totals for checkout
  localStorage.setItem('orderSummary', JSON.stringify({
    subtotal, deliveryFee: orderType === 'delivery' ? deliveryFee : 0,
    total, orderType, paymentMethod, isSplit,
    usdTotal: paymentMethod === 'card' ? (total / exchangeRate).toFixed(2) : null
  }));
}

// Select order type
function selectOrderType(type) {
  orderType = type;
  document.querySelectorAll('.order-type-selector .type-btn').forEach(btn => 
    btn.classList.remove('active'));
  event.target.closest('.type-btn').classList.add('active');
  updateSummary();
}

// Select payment method
function selectPayment(method) {
  paymentMethod = method;
  document.querySelectorAll('.payment-selector .type-btn').forEach(btn => 
    btn.classList.remove('active'));
  event.target.closest('.type-btn').classList.add('active');
  updateSummary();
}

// Toggle split payment
function toggleSplit() {
  isSplit = document.getElementById('split-toggle').checked;
  document.getElementById('split-details').style.display = isSplit ? 'block' : 'none';
  updateSummary();
}

// Change cart item quantity
function changeCartQty(index, delta) {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  cart[index].qty = Math.max(1, cart[index].qty + delta);
  
  // Recalculate item total
  const item = cart[index];
  const extrasTotal = item.extras ? item.extras.reduce((s, e) => s + e.price, 0) : 0;
  const toppingsTotal = item.toppings ? item.toppings.reduce((s, t) => s + (t.price || 0), 0) : 0;
  item.itemTotal = (item.price + extrasTotal + toppingsTotal) * item.qty;
  
  localStorage.setItem('cart', JSON.stringify(cart));
  loadCart();
}

// Remove from cart
function removeFromCart(index) {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  loadCart();
}

// Update cart count
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartCountEl = document.querySelector('.cart-count');
  if (cartCountEl) cartCountEl.textContent = count;
}

// Proceed to checkout
function proceedToCheckout() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }

  // Check if user is logged in
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = 'login.html';
    } else {
      window.location.href = 'checkout.html';
    }
  });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  if (window.db) {
    loadCart();
  } else {
    document.addEventListener('firebaseReady', loadCart);
  }
});