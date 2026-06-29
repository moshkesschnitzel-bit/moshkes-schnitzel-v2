// Load specials from Firebase
async function loadSpecials() {
  try {
    const settingsDoc = await db.collection('settings').doc('specials').get();
    
    // If specials are turned off in admin, hide the section
    if (settingsDoc.exists && settingsDoc.data().enabled === false) {
      document.getElementById('specials-section').style.display = 'none';
      return;
    }

    const snapshot = await db.collection('specials')
      .where('active', '==', true)
      .get();

    const grid = document.getElementById('specials-grid');

    if (snapshot.empty) {
      document.getElementById('specials-section').style.display = 'none';
      return;
    }

    grid.innerHTML = '';

    snapshot.forEach(doc => {
      const item = doc.data();
      const card = document.createElement('div');
      card.className = 'special-card';
      card.innerHTML = `
        <img src="${item.image || 'assets/placeholder.jpg'}" alt="${item.name}" />
        <div class="special-card-info">
          <h3>${item.name}</h3>
          <p>${item.description || ''}</p>
          <span class="price">₪${item.price}</span>
        </div>
      `;
      grid.appendChild(card);
    });

  } catch (error) {
    console.log('Specials loading error:', error);
    document.getElementById('specials-section').style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', loadSpecials);