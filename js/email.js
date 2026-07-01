// EmailJS Configuration
const EMAILJS_SERVICE = 'service_jl2fdfc';
const EMAILJS_TEMPLATE = 'template_c8p7qgw';
const EMAILJS_PUBLIC_KEY = 'kLXCMaektvWeFPzQj';

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

// Send Welcome Email
async function sendWelcomeEmail(email, name) {
  try {
    await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
      subject: 'Welcome to Moshke\'s Schnitzel! 🍽️',
      title: 'Welcome to Moshke\'s Schnitzel! 🎉',
      name: name || 'Friend',
      message: 'We\'re so happy to have you! Get ready for the most delicious schnitzel experience. Browse our menu and place your first order!',
      details: '<p style="text-align:center;color:#c8860a;font-size:18px;font-weight:700;">Cozy Comfort Food — Est. 2025 🍽️</p>',
      to_email: email
    });
    console.log('Welcome email sent!');
  } catch (error) {
    console.log('Welcome email error:', error);
  }
}

// Send Order Receipt Email
async function sendOrderReceipt(order) {
  try {
    const itemsList = order.items.map(i => `${i.qty}x ${i.name}`).join(', ');
    const usdText = order.usdTotal ? ` ($${order.usdTotal})` : '';
    
    const details = `
      <p style="font-size:15px;color:#333;margin-bottom:8px;">
        <strong>Order Number:</strong> #${order.orderNumber}
      </p>
      <p style="font-size:15px;color:#333;margin-bottom:8px;">
        <strong>Items:</strong> ${itemsList}
      </p>
      <p style="font-size:15px;color:#333;margin-bottom:8px;">
        <strong>Order Type:</strong> ${order.orderType === 'delivery' ? '🛵 Delivery' : '🏪 Pickup'}
      </p>
      <p style="font-size:15px;color:#333;margin-bottom:8px;">
        <strong>Payment:</strong> ${order.paymentMethod === 'card' ? '💳 Credit Card' : '💵 Cash'}
      </p>
      ${order.orderType === 'delivery' ? `
      <p style="font-size:15px;color:#333;margin-bottom:8px;">
        <strong>Delivery Address:</strong> ${order.deliveryAddress}
      </p>` : ''}
      <div style="border-top:2px solid #f0a500;margin-top:15px;padding-top:15px;">
        <p style="font-size:18px;color:#c8860a;font-weight:700;">
          Total: ₪${order.total?.toFixed(2)}${usdText}
        </p>
      </div>
    `;

    await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
      subject: `Order #${order.orderNumber} Confirmed!`,
      title: 'Your Order is Confirmed! 🎉',
      name: order.customerName,
      message: 'Thank you for your order! We\'re preparing it now with love. Here are your order details:',
      details: details,
      to_email: order.customerEmail
    });
    console.log('Order receipt sent!');
  } catch (error) {
    console.log('Order receipt error:', error);
  }
}