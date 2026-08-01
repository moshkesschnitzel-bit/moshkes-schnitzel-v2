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
  try {
    const body = JSON.parse(event.body);
    const toolCallId = body.message?.toolCalls?.[0]?.id;

    const globalSnapshot = await db.collection('globalToppings').get();
    const globalToppings = [];
    const globalSauces = [];

    globalSnapshot.forEach(doc => {
      const g = doc.data();
      if (g.type === 'topping') {
        globalToppings.push(g.name);
      } else if (g.type === 'sauce') {
        globalSauces.push(g.name);
      }
    });

    const categoriesSnapshot = await db.collection('categories').get();
    const categoryNames = {};
    categoriesSnapshot.forEach(doc => {
      categoryNames[doc.id] = (doc.data().name || '').toLowerCase();
    });

    const snapshot = await db.collection('menuItems').get();
    const items = [];

    snapshot.forEach(doc => {
      const d = doc.data();
      const catName = categoryNames[d.categoryId] || '';
      const isDrink = catName.includes('drink');
      const hasOwnToppings = d.toppings && d.toppings.length > 0;

      items.push({
        name: d.name || '',
        price: d.price || 0,
        available: d.available !== false,
        outOfStock: d.outOfStock === true,
        toppings: isDrink ? [] : (hasOwnToppings ? d.toppings : globalToppings),
        sauces: isDrink ? [] : globalSauces,
        extras: d.extras || []
      });
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        results: [{
          toolCallId: toolCallId,
          result: JSON.stringify({ items })
        }]
      })
    };
  } catch (error) {
    console.error('Error fetching menu:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};