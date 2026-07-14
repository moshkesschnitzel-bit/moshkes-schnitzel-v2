async function loadPopup() {
  try {
    const doc = await db.collection('settings').doc('popup').get();
    if (doc.exists && doc.data().enabled) {
      const data = doc.data();
      showPopup(data);
    }
  } catch (error) {
    console.log('Popup error:', error);
  }
}

function showPopup(data) {
  const popup = document.createElement('div');
  popup.id = 'announcement-popup';
  popup.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
  `;

  popup.innerHTML = `
    <div style="
      background: ${data.bgColor || '#c0392b'};
      border-radius: 20px;
      padding: 40px 35px;
      max-width: 500px;
      width: 100%;
      position: relative;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    ">
      <button onclick="closePopup()" style="
        position: absolute;
        top: 15px;
        right: 15px;
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 35px;
        height: 35px;
        border-radius: 50%;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
      ">×</button>
      <p style="
        color: ${data.textColor || '#ffffff'};
        font-family: '${data.font || 'Poppins'}', sans-serif;
        font-size: ${data.fontSize || '18px'};
        line-height: 1.6;
        margin: 0;
        white-space: pre-wrap;
      ">${data.message}</p>
    </div>
  `;

  document.body.appendChild(popup);
}

function closePopup() {
  const popup = document.getElementById('announcement-popup');
  if (popup) popup.remove();
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.db) {
    loadPopup();
  } else {
    document.addEventListener('firebaseReady', loadPopup);
  }
});