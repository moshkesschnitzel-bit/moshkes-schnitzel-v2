const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    )
  });
}

const db = admin.firestore();

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const args = body.message?.toolCalls?.[0]?.function?.arguments || body;

    const items = (args.items || []).map(item => ({
      name: item.name,
      qty: item.qty || 1,
      itemTotal: item.itemTotal || 0,
      toppings: (item.toppings || []).map(t => ({ name: t, price: 0 })),
      extras: (item.extras || []).map(e => ({ name: e }))
    }));

    const orderNumber = Math.floor(10000 + Math.random() * 90000).toString();

    const orderData = {
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      customerName: args.customerName || '',
      customerPhone: args.customerPhone || '',
      customerEmail: '',
      orderType: args.orderType || 'pickup',
      deliveryAddress: args.deliveryAddress || '',
      deliveryFee: args.deliveryFee || 0,
      subtotal: args.subtotal || 0,
      total: args.total || 0,
      items: items,
      orderNumber: orderNumber,
      orderId: `phone-${orderNumber}`,
      paymentMethod: 'phone',
      paymentStatus: 'pending',
      status: 'preparing',
      isSplit: false,
      source: 'phone-call',
      orderSource: 'Phone Order'
    };

    await db.collection('orders').add(orderData);

    return {
      statusCode: 200,
      body: JSON.stringify({
        results: [{
          toolCallId: body.message?.toolCalls?.[0]?.id || 'submit_order',
          result: `Order ${orderNumber} received successfully.`
        }]
      })
    };
  } catch (error) {
    console.error('Error submitting order:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};