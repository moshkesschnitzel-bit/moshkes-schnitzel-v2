let allItems = [];
let currentItem = null;
let currentQty = 1;
let selectedExtras = [];
let selectedToppings = [];

// Load menu from Firebase
async function loadMenu() {
  try {
    // Check if store is open (real-time)
    db.collection('settings').doc('store').onSnapshot(storeDoc => {
      if (storeDoc.exists && storeDoc.data().isOpen === false) {
        document.getElementById('store-closed-banner').style.display = 'block';
      } else {
        document.getElementById('store-closed-banner').style.display = 'none';
      }
    });

    // Load categories
    const categoriesSnap = await db.collection('categories').orderBy('order').get();
    const filterContainer = document.getElementById('category-filters');
    
    categoriesSnap.forEach(doc => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.textContent = doc.data().name;
      btn.onclick = () => filterCategory(doc.id);
      filterContainer.appendChild(btn);
    });

    // Load menu items with real-time updates
    db.collection('menuItems')
      .where('available', '==', true)
      .onSnapshot(snapshot => {
        allItems = [];
        snapshot.forEach(doc => {
          allItems.push({ id: doc.id, ...doc.data() });
        });
        renderMenu(allItems);
      });

  } catch (error) {
    console.log('Menu loading error:', error);
    document.getElementById('menu-grid').innerHTML = 
      '<p style="text-align:center;padding:40px;">Menu coming soon!</p>';
  }
}

// Render menu items
function renderMenu(items) {
  const grid = document.getElementById('menu-grid');
  
  if (items.length === 0) {
    grid.innerHTML = '<p style="text-align:center;padding:40px;color:#888;">No items in this category yet.</p>';
    return;
  }

  grid.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'menu-card';
    card.innerHTML = `
      <div class="menu-card-img">
        <img src="${item.image || 'assets/placeholder.jpg'}" alt="${item.name}" />
        ${item.outOfStock ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
      </div>
      <div class="menu-card-info">
        <h3>${item.name}</h3>
        <p>${item.description || ''}</p>
        <div class="menu-card-bottom">
          <span class="price">₪${item.price}</span>
          ${!item.outOfStock ? 
            `<button class="btn-add" onclick="openModal('${item.id}')">
              <i class="fas fa-plus"></i> Add
            </button>` : 
            `<button class="btn-add disabled" disabled>Out of Stock</button>`
          }
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Filter by category
function filterCategory(categoryId) {
  // Update active button
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  if (categoryId === 'all') {
    renderMenu(allItems);
  } else {
    const filtered = allItems.filter(item => item.categoryId === categoryId);
    renderMenu(filtered);
  }
}

// Open item modal
async function openModal(itemId) {
  const item = allItems.find(i => i.id === itemId);
  if (!item) return;

  currentItem = item;
  currentQty = 1;
  selectedExtras = [];
  selectedToppings = [];

  document.getElementById('modal-img').src = item.image || 'assets/placeholder.jpg';
  document.getElementById('modal-name').textContent = item.name;
  document.getElementById('modal-desc').textContent = item.description || '';
  document.getElementById('modal-price').textContent = item.price;
  document.getElementById('modal-qty').textContent = 1;
  document.getElementById('modal-total').textContent = item.price;
  document.getElementById('modal-request').value = '';

  // Load extras
  const extrasDiv = document.getElementById('modal-extras');
  extrasDiv.innerHTML = '';
  if (item.extras && item.extras.length > 0) {
    extrasDiv.innerHTML = '<h4>Extras</h4>';
    item.extras.forEach((extra, index) => {
      extrasDiv.innerHTML += `
        <label class="extra-option">
          <input type="checkbox" onchange="toggleExtra(${index})" />
          ${extra.name} <span>+₪${extra.price}</span>
        </label>
      `;
    });
  }

  // Load global toppings & sauces (skip for drinks)
  const toppingsDiv = document.getElementById('modal-toppings');
  toppingsDiv.innerHTML = '';
  const globalSnap = await db.collection('globalToppings').get();
  const globalToppings = [];
  globalSnap.forEach(doc => globalToppings.push({ id: doc.id, ...doc.data() }));
  
  // Get category name to check if drinks
  const catDoc = await db.collection('categories').doc(item.categoryId).get();
  const catName = catDoc.exists ? catDoc.data().name.toLowerCase() : '';
  
  if (globalToppings.length > 0 && !catName.includes('drink')) {
    const toppingsList = globalToppings.filter(t => t.type === 'topping');
    const saucesList = globalToppings.filter(t => t.type === 'sauce');
    
    if (toppingsList.length > 0) {
      toppingsDiv.innerHTML += '<h4>Toppings</h4>';
      toppingsList.forEach((topping, index) => {
        toppingsDiv.innerHTML += `
          <label class="extra-option">
            <input type="checkbox" onchange="toggleGlobalTopping('${topping.id}', '${topping.name}', ${topping.price})" />
            ${topping.name}
            ${topping.price > 0 ? `<span>+₪${topping.price}</span>` : '<span>Free</span>'}
          </label>
        `;
      });
    }
    
    if (saucesList.length > 0) {
      toppingsDiv.innerHTML += '<h4>Sauces</h4>';
      saucesList.forEach((sauce, index) => {
        toppingsDiv.innerHTML += `
          <label class="extra-option">
            <input type="checkbox" onchange="toggleGlobalTopping('${sauce.id}', '${sauce.name}', ${sauce.price})" />
            ${sauce.name}
            ${sauce.price > 0 ? `<span>+₪${sauce.price}</span>` : '<span>Free</span>'}
          </label>
        `;
      });
    }
  }

  document.getElementById('item-modal').style.display = 'flex';
  updateModalTotal();
}

// Close modal
function closeModal() {
  document.getElementById('item-modal').style.display = 'none';
}

// Toggle extra
function toggleExtra(index) {
  const extra = currentItem.extras[index];
  const idx = selectedExtras.findIndex(e => e.name === extra.name);
  if (idx > -1) {
    selectedExtras.splice(idx, 1);
  } else {
    selectedExtras.push(extra);
  }
  updateModalTotal();
}

// Toggle topping
function toggleTopping(index) {
  const topping = currentItem.toppings[index];
  const idx = selectedToppings.findIndex(t => t.name === topping.name);
  if (idx > -1) {
    selectedToppings.splice(idx, 1);
  } else {
    selectedToppings.push(topping);
  }
  updateModalTotal();
}

// Toggle global topping/sauce
function toggleGlobalTopping(id, name, price) {
  const idx = selectedToppings.findIndex(t => t.name === name);
  if (idx > -1) {
    selectedToppings.splice(idx, 1);
  } else {
    selectedToppings.push({ id, name, price: parseFloat(price) || 0 });
  }
  updateModalTotal();
}

// Toggle global topping/sauce
function toggleGlobalTopping(id, name, price) {
  const idx = selectedToppings.findIndex(t => t.name === name);
  if (idx > -1) {
    selectedToppings.splice(idx, 1);
  } else {
    selectedToppings.push({ id, name, price: parseFloat(price) || 0 });
  }
  updateModalTotal();
}

// Change quantity
function changeQty(delta) {
  currentQty = Math.max(1, currentQty + delta);
  document.getElementById('modal-qty').textContent = currentQty;
  updateModalTotal();
}

// Update total in modal
function updateModalTotal() {
  let base = parseFloat(currentItem.price);
  let extrasTotal = selectedExtras.reduce((sum, e) => sum + parseFloat(e.price), 0);
  let toppingsTotal = selectedToppings.reduce((sum, t) => sum + parseFloat(t.price || 0), 0);
  let total = (base + extrasTotal + toppingsTotal) * currentQty;
  document.getElementById('modal-total').textContent = total.toFixed(2);
}

// Add to cart
function addToCart() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  
  const cartItem = {
    id: currentItem.id,
    name: currentItem.name,
    price: parseFloat(currentItem.price),
    image: currentItem.image || 'assets/placeholder.jpg',
    qty: currentQty,
    extras: selectedExtras,
    toppings: selectedToppings,
    request: document.getElementById('modal-request').value,
    itemTotal: parseFloat(document.getElementById('modal-total').textContent)
  };

  cart.push(cartItem);
  localStorage.setItem('cart', JSON.stringify(cart));
  
  updateCartCount();
  closeModal();
  showAddedToCart(currentItem.name);
}

// Update cart count in navbar
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartCountEl = document.querySelector('.cart-count');
  if (cartCountEl) cartCountEl.textContent = count;
}

// Show added to cart notification
function showAddedToCart(name) {
  const notif = document.createElement('div');
  notif.className = 'cart-notification';
  notif.innerHTML = `<i class="fas fa-check"></i> ${name} added to cart!`;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}

// Close modal when clicking outside
document.getElementById('item-modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// Init
document.addEventListener('DOMContentLoaded', () => {
  if (window.db) {
    loadMenu();
    updateCartCount();
  } else {
    document.addEventListener('firebaseReady', () => {
      loadMenu();
      updateCartCount();
    });
  }
});