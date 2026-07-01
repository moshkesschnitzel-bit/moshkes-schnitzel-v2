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
      details: 'Cozy Comfort Food — Est. 2025 🍽️',
      to_email: email,
      reply_to: email
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
    
    const details = `Order Number: #${order.orderNumber} | Items: ${itemsList} | Type: ${order.orderType === 'delivery' ? 'Delivery' : 'Pickup'} | Payment: ${order.paymentMethod === 'card' ? 'Credit Card' : 'Cash'}${order.orderType === 'delivery' ? ' | Address: ' + order.deliveryAddress : ''} | Total: ₪${order.total?.toFixed(2)}${usdText}`;

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