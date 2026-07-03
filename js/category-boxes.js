function loadCategoryBoxes() {
    if (!window.db) {
        document.addEventListener('firebaseReady', loadCategoryBoxes);
            return;
              }

                db.collection('categoryBoxes').orderBy('order').onSnapshot(snapshot => {
                    const grid = document.getElementById('categories-grid');
                        if (!grid) return;

                            if (snapshot.empty) {
                                  grid.innerHTML = '<p style="text-align:center;color:#888;">Coming soon!</p>';
                                        return;
                                            }

                                                grid.innerHTML = '';
                                                    snapshot.forEach(doc => {
                                                          const box = doc.data();
                                                                const card = document.createElement('a');
                                                                      card.href = box.link || 'menu.html';
                                                                            card.className = 'category-card-img-box';
                                                                                  card.innerHTML = `
                                                                                          <div class="category-card-inner" style="${box.image ? `background-image:url('${box.image}')` : 'background:#3b1f0e'}">
                                                                                                    <div class="category-card-overlay">
                                                                                                                <h3>${box.name}</h3>
                                                                                                                          </div>
                                                                                                                                  </div>
                                                                                                                                        `;
                                                                                                                                              grid.appendChild(card);
                                                                                                                                                  });
                                                                                                                                                    });
                                                                                                                                                    }

                                                                                                                                                    document.addEventListener('DOMContentLoaded', loadCategoryBoxes);
