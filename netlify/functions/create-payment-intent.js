const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { amount, currency, orderNumber, customerEmail, isSplit } = JSON.parse(event.body);

    if (isSplit) {
      // Create two payment intents for split payment
      const splitAmount = Math.round(amount / 2);
      
      const paymentIntent1 = await stripe.paymentIntents.create({
        amount: splitAmount,
        currency: currency || 'usd',
        metadata: { orderNumber, part: '1of2', customerEmail },
        receipt_email: customerEmail,
      });

      const paymentIntent2 = await stripe.paymentIntents.create({
        amount: splitAmount,
        currency: currency || 'usd',
        metadata: { orderNumber, part: '2of2' },
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          split: true,
          clientSecret1: paymentIntent1.client_secret,
          clientSecret2: paymentIntent2.client_secret,
          splitAmount: splitAmount / 100
        })
      };
    } else {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount),
        currency: currency || 'usd',
        metadata: { orderNumber, customerEmail },
        receipt_email: customerEmail,
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          split: false,
          clientSecret: paymentIntent.client_secret
        })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};