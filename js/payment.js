let stripe;
let cardElement;
let currentClientSecret = null;
let isSplit = false;
let currentPart = 1;
let part1Paid = false;
let part2Paid = false;
let orderData = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Get publishable key
  const publishableKey = 'pk_live_51SUmPm0wfnjOWR8UjAMUStomnD6xeAZYp0EFkpPbcwpr8w4sGpcgs2s9NLS200ZGRRKKrzJ218YIqA7Hr3lilnzz002BmTij1K';
  
  // Load order data from localStorage
  orderData = JSON.parse(localStorage.getItem('pendingOrder') || '{}');
  
  if (!orderData.orderNumber) {
    window.location.href = 'index.html';
    return;
  }

  // Show order summary
  showOrderSummary();

  // Initialize Stripe
  stripe = Stripe(publishableKey);
  const elements = stripe.elements();
  cardElement = elements.create('card', {
    style: {
      base: {
        fontFamily: 'Poppins, sans-serif',
        fontSize: '16px',
        color: '#3b1f0e',
        '::placeholder': { color: '#aaa' }
      }
    }
  });
  cardElement.mount('#card-element');

  // Create payment intent
  await createPaymentIntent();
});

function showOrderSummary() {
  const summary = document.getElementById('payment-summary');
  isSplit = orderData.isSplit || false;
  
  summary.innerHTML = `
    <div style="background:#fdf3e3;border-radius:10px;padding:15px;margin-bottom:20px;text-align:left;">
      <p style="font-weight:700;color:#3b1f0e;margin-bottom:8px;">Order #${orderData.orderNumber}</p>
      <p style="font-size:14px;color:#666;">${orderData.items?.map(i => `${i.qty}x ${i.name}`).join(', ')}</p>
      <p style="font-size:18px;font-weight:700;color:#c8860a;margin-top:10px;">
        Total: $${orderData.usdTotal}
      </p>
      ${isSplit ? `<p style="font-size:14px;color:#888;">Split: $${(parseFloat(orderData.usdTotal)/2).toFixed(2)} per person</p>` : ''}
    </div>
  `;

  if (isSplit) {
    document.getElementById('split-payment-ui').style.display = 'block';
  }
}

async function createPaymentIntent() {
  try {
    const response = await fetch('/.netlify/functions/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Math.round(parseFloat(orderData.usdTotal) * 100),
        currency: 'usd',
        orderNumber: orderData.orderNumber,
        customerEmail: orderData.customerEmail,
        isSplit: orderData.isSplit || false
      })
    });

    const data = await response.json();

    if (data.split) {
      currentClientSecret = data.clientSecret1;
      localStorage.setItem('splitSecret2', data.clientSecret2);
      localStorage.setItem('splitAmount', data.splitAmount);
      document.getElementById('split-status-1').textContent = `💳 Person 1: $${data.splitAmount}`;
      document.getElementById('split-status-2').textContent = `⏳ Person 2: $${data.splitAmount} (waiting)`;
    } else {
      currentClientSecret = data.clientSecret;
    }
  } catch (error) {
    showError('Could not initialize payment. Please try again.');
  }
}

function showSplitPart(part) {
  currentPart = part;
  document.querySelectorAll('.split-tab').forEach((t, i) => {
    t.classList.toggle('active', i === part - 1);
  });

  if (part === 2) {
    currentClientSecret = localStorage.getItem('splitSecret2');
  } else {
    currentClientSecret = localStorage.getItem('splitSecret1') || currentClientSecret;
  }
}

async function handlePayment() {
  const btn = document.getElementById('pay-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

  try {
    const result = await stripe.confirmCardPayment(currentClientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: { email: orderData.customerEmail }
      }
    });

    if (result.error) {
      showError(result.error.message);
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-lock"></i> Pay Now';
    } else if (result.paymentIntent.status === 'succeeded') {
      if (isSplit) {
        if (currentPart === 1) {
          part1Paid = true;
          localStorage.setItem('splitSecret1', currentClientSecret);
          document.getElementById('split-status-1').textContent = '✅ Person 1: Paid!';
          showSplitPart(2);
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-lock"></i> Pay Now';
        } else {
          part2Paid = true;
          document.getElementById('split-status-2').textContent = '✅ Person 2: Paid!';
          await confirmOrder();
        }
      } else {
        await confirmOrder();
      }
    }
  } catch (error) {
    showError('Payment failed. Please try again.');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-lock"></i> Pay Now';
  }
}

async function confirmOrder() {
  try {
    // Save order to Firestore
    const orderRef = await db.collection('orders').add({
      ...orderData,
      status: 'pending',
      paymentStatus: 'paid',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Send receipt email
    await sendOrderReceipt(orderData);

    // Clear localStorage
    localStorage.removeItem('cart');
    localStorage.removeItem('orderSummary');
    localStorage.removeItem('pendingOrder');
    localStorage.removeItem('splitSecret2');
    localStorage.setItem('lastOrderNumber', orderData.orderNumber);
    localStorage.setItem('lastOrderId', orderRef.id);

    window.location.href = 'order-confirmation.html';
  } catch (error) {
    showError('Order confirmation failed. Please contact us.');
  }
}

function showError(message) {
  const errorDiv = document.getElementById('card-errors');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}