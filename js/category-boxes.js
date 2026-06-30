// Load category boxes with images from Firebase
async function loadCategoryBoxes() {
  try {
    db.collection('categoryBoxes').orderBy('order').onSnapshot(snapshot => {
      const grid = document.getElementById('categories-grid');
      
      if (snapshot.empty) {
        grid.innerHTML = '<p style="text-align:center;color:#888;">Coming soon!</p>';
        return;
      }

      grid.innerHTML = '';
      snapshot.forEach(doc => {
        const box = doc.data();
        const card = document.createElement('a');
        card.href = box.link || 'menu.html';
        card.className = 'category-card';
        card.innerHTML = `
          ${box.image ? `<img src="${box.image}" alt="${box.name}" class="category-card-img" />` : 
            `<i class="fas fa-utensils"></i>`}
          <h3>${box.name}</h3>
        `;
        grid.appendChild(card);
      });
    });
  } catch (error) {
    console.log('Category boxes loading error:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadCategoryBoxes);