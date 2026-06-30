// Load specials from Firebase
function loadSpecials() {
  db.collection('settings').doc('specials').onSnapshot(settingsDoc => {
    if (settingsDoc.exists && settingsDoc.data().enabled === false) {
      document.getElementById('specials-section').style.display = 'none';
      return;
    }

    db.collection('specials').where('active', '==', true).onSnapshot(snapshot => {
      const grid = document.getElementById('specials-grid');

      if (snapshot.empty) {
        document.getElementById('specials-section').style.display = 'none';
        return;
      }

      document.getElementById('specials-section').style.display = 'block';
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
    });
  });
}

document.addEventListener('DOMContentLoaded', loadSpecials);