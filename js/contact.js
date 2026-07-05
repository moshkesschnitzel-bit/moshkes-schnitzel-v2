// Load contact info from Firebase
async function loadContactInfo() {
  try {
    const doc = await db.collection('settings').doc('footer').get();
    
    if (doc.exists) {
      const data = doc.data();
      
      if (data.phone) document.getElementById('contact-phone').textContent = data.phone;
      if (data.email) document.getElementById('contact-email').textContent = data.email;
      if (data.whatsapp) document.getElementById('contact-whatsapp').textContent = data.whatsapp;
      if (data.address) document.getElementById('contact-address').textContent = data.address;
    }

    // Load opening hours
    const storeDoc = await db.collection('settings').doc('store').get();
    if (storeDoc.exists) {
      const storeData = storeDoc.data();
      const hoursList = document.getElementById('opening-hours-list');
      hoursList.innerHTML = '';

      // Check if closed today
      if (storeData.closedToday) {
        hoursList.innerHTML = `
          <div class="hours-row" style="color:#e74c3c;font-weight:700;">
            <span>Today</span>
            <span>🔴 Closed Today</span>
          </div>
        `;
      }

      // Show regular hours
      if (storeData.hours) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = new Date().toLocaleDateString('en-US', {weekday: 'long'});
        
        days.forEach(day => {
          if (storeData.hours[day]) {
            const isToday = day === today;
            const isClosed = isToday && storeData.closedToday;
            hoursList.innerHTML += `
              <div class="hours-row" style="${isToday ? 'font-weight:700;color:#3b1f0e;' : ''}">
                <span>${day} ${isToday ? '(Today)' : ''}</span>
                <span>${isClosed ? '🔴 Closed' : `${storeData.hours[day].open} — ${storeData.hours[day].close}`}</span>
              </div>
            `;
          }
        });
      } else {
        hoursList.innerHTML += '<p style="color:#888;font-size:14px;">Hours coming soon!</p>';
      }
    }

  } catch (error) {
    console.log('Contact loading error:', error);
  }
}

// Send message (saved to Firestore)
async function sendMessage() {
  const name = document.getElementById('contact-name').value.trim();
  const email = document.getElementById('contact-email-input').value.trim();
  const phone = document.getElementById('contact-phone-input').value.trim();
  const message = document.getElementById('contact-message').value.trim();

  if (!name || !email || !message) {
    alert('Please fill in your name, email and message.');
    return;
  }

  try {
    await db.collection('messages').add({
      name,
      email,
      phone,
      message,
      read: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById('form-success').style.display = 'block';
    document.getElementById('contact-name').value = '';
    document.getElementById('contact-email-input').value = '';
    document.getElementById('contact-phone-input').value = '';
    document.getElementById('contact-message').value = '';

  } catch (error) {
    alert('Something went wrong. Please try again.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.db) {
    loadContactInfo();
  } else {
    document.addEventListener('firebaseReady', loadContactInfo);
  }
});