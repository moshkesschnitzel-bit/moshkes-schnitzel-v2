const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    )
  });
}

const db = admin.firestore();

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const toolCallId = body.message?.toolCalls?.[0]?.id;

    const doc = await db.collection('settings').doc('store').get();
    const data = doc.data();

    const now = new Date();
    const jerusalemNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
    const currentDay = dayNames[jerusalemNow.getDay()];
    const currentTime = jerusalemNow.toTimeString().slice(0, 5);

    let isOpen = true;
    let reason = '';

    if (data.isOpen === false) {
      isOpen = false;
      reason = 'The store is closed right now.';
    } else {
      const todayHours = data.hours?.[currentDay];
      if (!todayHours || todayHours.closed === true) {
        isOpen = false;
        reason = `The store is closed on ${currentDay}.`;
      } else {
        if (currentTime < todayHours.open || currentTime > todayHours.close) {
          isOpen = false;
          reason = `The store is closed right now. Hours today are ${todayHours.open} to ${todayHours.close}.`;
        }
      }
    }

    const deliveryAvailable = data.deliveryAvailable !== false;

    return {
      statusCode: 200,
      body: JSON.stringify({
        results: [{
          toolCallId: toolCallId,
          result: JSON.stringify({
            isOpen: isOpen,
            reason: reason,
            deliveryAvailable: deliveryAvailable
          })
        }]
      })
    };
  } catch (error) {
    console.error('Error checking store status:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};