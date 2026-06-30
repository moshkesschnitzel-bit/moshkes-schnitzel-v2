// Cloudinary config
const CLOUDINARY_CLOUD = 'dpylqw980';
const CLOUDINARY_PRESET = 'moshkes-upload';

let currentAdminUser = null;
let editingItemId = null;
let allOrders = [];
let allCustomers = [];

// ===== AUTH =====
function adminLogin() {
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;

  auth.signInWithEmailAndPassword(email, password)
    .then(async result => {
      const userDoc = await db.collection('adminUsers').doc(result.user.email).get();
      if (userDoc.exists && userDoc.data().active) {
        currentAdminUser = result.user;
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
        initAdmin();
      } else {
        showAdminError('You do not have admin access.');
        auth.signOut();
      }
    })
    .catch(() => showAdminError('Invalid email or password.'));
}

function adminSignOut() {
  auth.signOut().then(() => {
    document.getElementById('admin-login').style.display = 'flex';
    document.getElementById('admin-panel').style.display = 'none';
  });
}

function showAdminError(msg) {
  const el = document.getElementById('admin-error');
  el.textContent = msg;
  el.style.display = 'block';
}

// ===== INIT =====
async function initAdmin() {
  loadStoreStatus();
  loadDashboard();
  loadOrders();
  loadMenuItems();
  loadCategories();
  loadCustomers();
  loadMessages();
  loadStoreSettings();
  loadFooterSettings();
  loadSpecials();
  loadAdminUsers();
  loadGlobalToppings();
  loadHeroImage();
}

// ===== NAVIGATION =====
function showSection(name) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`section-${name}`).classList.add('active');
  event.target.closest('.nav-item').classList.add('active');
  document.getElementById('section-title').textContent = 
    name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' ');
}

// ===== STORE STATUS =====
async function loadStoreStatus() {
  const doc = await db.collection('settings').doc('store').get();
  const isOpen = doc.exists ? doc.data().isOpen !== false : true;
  document.getElementById('store-toggle').checked = isOpen;
  document.getElementById('store-status-label').textContent = 
    isOpen ? '🟢 Store: Open' : '🔴 Store: Closed';
}

async function toggleStore() {
  const isOpen = document.getElementById('store-toggle').checked;
  await db.collection('settings').doc('store').set({ isOpen }, { merge: true });
  document.getElementById('store-status-label').textContent = 
    isOpen ? '🟢 Store: Open' : '🔴 Store: Closed';
}

// ===== DASHBOARD =====
async function loadDashboard() {
  const ordersSnap = await db.collection('orders').get();
  const customersSnap = await db.collection('users').get();
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let totalOrders = 0, todayRev = 0, weekRev = 0, monthRev = 0, deliveryRev = 0;
  let recentOrders = [];

  ordersSnap.forEach(doc => {
    const o = doc.data();
    if (o.status === 'cancelled') return;
    totalOrders++;
    const orderDate = o.createdAt?.toDate() || new Date();
    const total = o.total || 0;
    const dFee = o.deliveryFee || 0;

    if (orderDate >= todayStart) todayRev += total;
    if (orderDate >= weekStart) weekRev += total;
    if (orderDate >= monthStart) monthRev += total;
    deliveryRev += dFee;
    recentOrders.push({ id: doc.id, ...o, orderDate });
  });

  recentOrders.sort((a, b) => b.orderDate - a.orderDate);
  recentOrders = recentOrders.slice(0, 5);

  document.getElementById('stat-total-orders').textContent = totalOrders;
  document.getElementById('stat-today-revenue').textContent = `₪${todayRev.toFixed(2)}`;
  document.getElementById('stat-week-revenue').textContent = `₪${weekRev.toFixed(2)}`;
  document.getElementById('stat-month-revenue').textContent = `₪${monthRev.toFixed(2)}`;
  document.getElementById('stat-customers').textContent = customersSnap.size;
  document.getElementById('stat-delivery-revenue').textContent = `₪${deliveryRev.toFixed(2)}`;

  const recentList = document.getElementById('recent-orders-list');
  recentList.innerHTML = recentOrders.map(o => `
    <div class="order-card ${o.status}">
      <div class="order-header">
        <span class="order-number">${o.orderNumber}</span>
        <span class="order-status status-${o.status}">${o.status}</span>
      </div>
      <div class="order-details">
        <strong>${o.customerName}</strong> — ${o.customerPhone}<br/>
        ₪${o.total?.toFixed(2)} — ${o.paymentMethod}
      </div>
    </div>
  `).join('');
}

// ===== ORDERS =====
async function loadOrders() {
  const snap = await db.collection('orders').orderBy('createdAt', 'desc').get();
  allOrders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderOrders(allOrders);

  const pending = allOrders.filter(o => o.status === 'pending').length;
  document.getElementById('new-orders-badge').textContent = pending;
}

function renderOrders(orders) {
  const list = document.getElementById('orders-list');
  if (orders.length === 0) {
    list.innerHTML = '<p style="color:#888;padding:20px;">No orders found.</p>';
    return;
  }
  list.innerHTML = orders.map(o => `
    <div class="order-card ${o.status}">
      <div class="order-header">
        <span class="order-number">${o.orderNumber}</span>
        <span class="order-status status-${o.status}">${o.status}</span>
        <span style="font-size:13px;color:#888;">${o.createdAt?.toDate().toLocaleDateString() || ''}</span>
      </div>
      <div class="order-details">
        <strong>Customer:</strong> ${o.customerName} | 
        <strong>Phone:</strong> ${o.customerPhone}<br/>
        <strong>Email:</strong> ${o.customerEmail}<br/>
        ${o.orderType === 'delivery' ? 
          `<strong>Address:</strong> ${o.deliveryAddress} 
           <a href="${o.mapsLink}" target="_blank">📍 Maps</a><br/>` : 
          '<strong>Type:</strong> Pickup<br/>'}
        <strong>Payment:</strong> ${o.paymentMethod} | 
        <strong>Total:</strong> ₪${o.total?.toFixed(2)}
        ${o.usdTotal ? ` ($${o.usdTotal})` : ''}
        ${o.isSplit ? ' | <strong>Split Payment</strong>' : ''}
        <br/>
        <strong>Items:</strong> ${o.items?.map(i => `${i.qty}x ${i.name}`).join(', ')}
      </div>
      <div class="order-actions">
        <button class="btn-status btn-preparing" 
          onclick="updateOrderStatus('${o.id}', 'preparing')">Preparing</button>
        <button class="btn-status btn-ready" 
          onclick="updateOrderStatus('${o.id}', 'ready')">Ready</button>
        <button class="btn-status btn-delivered" 
          onclick="updateOrderStatus('${o.id}', 'delivered')">Delivered</button>
        <button class="btn-status btn-cancelled" 
          onclick="updateOrderStatus('${o.id}', 'cancelled')">Cancel</button>
      </div>
    </div>
  `).join('');
}

async function updateOrderStatus(orderId, status) {
  await db.collection('orders').doc(orderId).update({ status });
  loadOrders();
}

function filterOrders() {
  const filter = document.getElementById('order-filter').value;
  if (filter === 'all') renderOrders(allOrders);
  else renderOrders(allOrders.filter(o => o.status === filter));
}

// ===== MENU ITEMS =====
async function loadMenuItems() {
  const snap = await db.collection('menuItems').get();
  const list = document.getElementById('menu-items-list');
  
  if (snap.empty) {
    list.innerHTML = '<p style="color:#888;padding:20px;">No menu items yet. Add your first item!</p>';
    return;
  }

  list.innerHTML = snap.docs.map(doc => {
    const item = doc.data();
    return `
      <div class="menu-item-row">
        <img src="${item.image || 'assets/placeholder.jpg'}" alt="${item.name}" />
        <div class="menu-item-info">
          <h4>${item.name} ${item.outOfStock ? '<span style="color:#e74c3c;font-size:12px;">(Out of Stock)</span>' : ''}</h4>
          <p>${item.description || ''}</p>
        </div>
        <span class="menu-item-price">₪${item.price}</span>
        <div class="menu-item-actions">
          <button class="btn-edit" onclick="editMenuItem('${doc.id}')">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn-toggle-stock" onclick="toggleStock('${doc.id}', ${item.outOfStock})">
            ${item.outOfStock ? '✅ In Stock' : '❌ Out of Stock'}
          </button>
          <button class="btn-delete" onclick="deleteMenuItem('${doc.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function toggleStock(itemId, currentStatus) {
  await db.collection('menuItems').doc(itemId).update({ outOfStock: !currentStatus });
  loadMenuItems();
}

async function deleteMenuItem(itemId) {
  if (confirm('Are you sure you want to delete this item?')) {
    await db.collection('menuItems').doc(itemId).delete();
    loadMenuItems();
  }
}

// ===== ADD/EDIT ITEM MODAL =====
async function showAddItemModal() {
  editingItemId = null;
  document.getElementById('item-modal-title').textContent = 'Add Menu Item';
  document.getElementById('item-name').value = '';
  document.getElementById('item-price').value = '';
  document.getElementById('item-desc').value = '';
  document.getElementById('item-image').value = '';
  document.getElementById('item-available').checked = true;
  document.getElementById('item-outofstock').checked = false;
  document.getElementById('extras-list').innerHTML = '';
  document.getElementById('toppings-list').innerHTML = '';
  await loadCategoriesForSelect();
  createImageUploader('item-image-uploader', (url) => {
    document.getElementById('item-image').value = url;
  });
  document.getElementById('item-modal').style.display = 'flex';
}

async function editMenuItem(itemId) {
  editingItemId = itemId;
  const doc = await db.collection('menuItems').doc(itemId).get();
  const item = doc.data();
  
  document.getElementById('item-modal-title').textContent = 'Edit Menu Item';
  document.getElementById('item-name').value = item.name;
  document.getElementById('item-price').value = item.price;
  document.getElementById('item-desc').value = item.description || '';
  document.getElementById('item-image').value = item.image || '';
  document.getElementById('item-available').checked = item.available !== false;
  document.getElementById('item-outofstock').checked = item.outOfStock || false;

  document.getElementById('extras-list').innerHTML = '';
  document.getElementById('toppings-list').innerHTML = '';

  if (item.extras) item.extras.forEach(e => addExtraField(e.name, e.price));
  if (item.toppings) item.toppings.forEach(t => addToppingField(t.name, t.price));

  await loadCategoriesForSelect(item.categoryId);
  createImageUploader('item-image-uploader', (url) => {
    document.getElementById('item-image').value = url;
  });
  // Show existing image preview
  if (item.image) {
    document.getElementById('item-image').value = item.image;
    const preview = document.getElementById('upload-preview-item-image-uploader');
    const dropzone = document.getElementById('dropzone-item-image-uploader');
    if (preview && dropzone) {
      document.getElementById('preview-img-item-image-uploader').src = item.image;
      preview.style.display = 'block';
      dropzone.style.display = 'none';
    }
  }
  document.getElementById('item-modal').style.display = 'flex';
}

async function loadCategoriesForSelect(selectedId = '') {
  const snap = await db.collection('categories').get();
  const select = document.getElementById('item-category');
  select.innerHTML = '<option value="">Select category...</option>';
  snap.forEach(doc => {
    const opt = document.createElement('option');
    opt.value = doc.id;
    opt.textContent = doc.data().name;
    if (doc.id === selectedId) opt.selected = true;
    select.appendChild(opt);
  });
}

function addExtraField(name = '', price = '') {
  const div = document.createElement('div');
  div.className = 'extra-field';
  div.innerHTML = `
    <input type="text" placeholder="Extra name (e.g. Extra sauce)" value="${name}" />
    <input type="number" placeholder="Price (₪)" value="${price}" style="width:100px;" />
    <button class="btn-remove-extra" onclick="this.parentElement.remove()">×</button>
  `;
  document.getElementById('extras-list').appendChild(div);
}

function addToppingField(name = '', price = '') {
  const div = document.createElement('div');
  div.className = 'extra-field';
  div.innerHTML = `
    <input type="text" placeholder="Topping name (e.g. Pickles)" value="${name}" />
    <input type="number" placeholder="Price (₪) or 0 for free" value="${price}" style="width:130px;" />
    <button class="btn-remove-extra" onclick="this.parentElement.remove()">×</button>
  `;
  document.getElementById('toppings-list').appendChild(div);
}

async function saveMenuItem() {
  const name = document.getElementById('item-name').value.trim();
  const price = parseFloat(document.getElementById('item-price').value);
  const desc = document.getElementById('item-desc').value.trim();
  const image = document.getElementById('item-image').value.trim();
  const categoryId = document.getElementById('item-category').value;
  const available = document.getElementById('item-available').checked;
  const outOfStock = document.getElementById('item-outofstock').checked;

  if (!name || !price) {
    alert('Please enter item name and price.');
    return;
  }

  const extras = [];
  document.querySelectorAll('#extras-list .extra-field').forEach(row => {
    const inputs = row.querySelectorAll('input');
    if (inputs[0].value.trim()) {
      extras.push({ name: inputs[0].value.trim(), price: parseFloat(inputs[1].value) || 0 });
    }
  });

  const toppings = [];
  document.querySelectorAll('#toppings-list .extra-field').forEach(row => {
    const inputs = row.querySelectorAll('input');
    if (inputs[0].value.trim()) {
      toppings.push({ name: inputs[0].value.trim(), price: parseFloat(inputs[1].value) || 0 });
    }
  });

  const itemData = { name, price, description: desc, image, categoryId, available, outOfStock, extras, toppings };

  if (editingItemId) {
    await db.collection('menuItems').doc(editingItemId).update(itemData);
  } else {
    await db.collection('menuItems').add(itemData);
  }

  closeItemModal();
  loadMenuItems();
}

function closeItemModal() {
  document.getElementById('item-modal').style.display = 'none';
}

// ===== CATEGORIES =====
async function loadCategories() {
  const snap = await db.collection('categories').orderBy('order').get();
  const list = document.getElementById('categories-list');
  
  if (snap.empty) {
    list.innerHTML = '<p style="color:#888;padding:20px;">No categories yet.</p>';
    return;
  }

  list.innerHTML = snap.docs.map(doc => `
    <div class="category-row">
      <h4>${doc.data().name}</h4>
      <div style="display:flex;gap:8px;">
        <button class="btn-delete" onclick="deleteCategory('${doc.id}')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    </div>
  `).join('');
}

function showAddCategoryModal() {
  const name = prompt('Category name (e.g. Schnitzels, Sides, Drinks):');
  if (name && name.trim()) {
    const snap = db.collection('categories').get().then(s => {
      db.collection('categories').add({ name: name.trim(), order: s.size + 1 })
        .then(() => loadCategories());
    });
  }
}

async function deleteCategory(catId) {
  if (confirm('Delete this category?')) {
    await db.collection('categories').doc(catId).delete();
    loadCategories();
  }
}

// ===== SPECIALS =====
async function loadSpecials() {
  const settingsDoc = await db.collection('settings').doc('specials').get();
  if (settingsDoc.exists) {
    document.getElementById('specials-toggle').checked = settingsDoc.data().enabled !== false;
  }

  const snap = await db.collection('specials').get();
  const list = document.getElementById('specials-list');

  if (snap.empty) {
    list.innerHTML = '<p style="color:#888;padding:20px;">No specials yet.</p>';
    return;
  }

  list.innerHTML = snap.docs.map(doc => {
    const s = doc.data();
    return `
      <div class="menu-item-row">
        <img src="${s.image || 'assets/placeholder.jpg'}" alt="${s.name}" />
        <div class="menu-item-info">
          <h4>${s.name}</h4>
          <p>${s.description || ''}</p>
        </div>
        <span class="menu-item-price">₪${s.price}</span>
        <div class="menu-item-actions">
          <button class="btn-delete" onclick="deleteSpecial('${doc.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function toggleSpecials() {
  const enabled = document.getElementById('specials-toggle').checked;
  await db.collection('settings').doc('specials').set({ enabled }, { merge: true });
}

function showAddSpecialModal() {
  const name = prompt('Special item name:');
  if (!name) return;
  const price = prompt('Price (₪):');
  if (!price) return;
  const description = prompt('Description:');
  const image = prompt('Image URL (leave blank to skip):');

  db.collection('specials').add({
    name: name.trim(),
    price: parseFloat(price),
    description: description || '',
    image: image || '',
    active: true
  }).then(() => loadSpecials());
}

async function deleteSpecial(id) {
  if (confirm('Delete this special?')) {
    await db.collection('specials').doc(id).delete();
    loadSpecials();
  }
}

// ===== CUSTOMERS =====
async function loadCustomers() {
  const snap = await db.collection('users').get();
  allCustomers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderCustomers(allCustomers);
}

function renderCustomers(customers) {
  const list = document.getElementById('customers-list');
  if (customers.length === 0) {
    list.innerHTML = '<p style="color:#888;padding:20px;">No customers yet.</p>';
    return;
  }
  list.innerHTML = customers.map(c => `
    <div class="customer-row">
      <div class="customer-avatar">${(c.name || c.email || '?')[0].toUpperCase()}</div>
      <div class="customer-info">
        <h4>${c.name || 'No name'}</h4>
        <p>${c.email} ${c.phone ? '| ' + c.phone : ''}</p>
        ${c.address ? `<p>📍 ${c.address}</p>` : ''}
      </div>
    </div>
  `).join('');
}

function searchCustomers() {
  const query = document.getElementById('customer-search').value.toLowerCase();
  const filtered = allCustomers.filter(c => 
    (c.name || '').toLowerCase().includes(query) ||
    (c.email || '').toLowerCase().includes(query) ||
    (c.phone || '').includes(query)
  );
  renderCustomers(filtered);
}

// ===== MESSAGES =====
async function loadMessages() {
  const snap = await db.collection('messages').orderBy('createdAt', 'desc').get();
  const list = document.getElementById('messages-list');
  
  const unread = snap.docs.filter(d => !d.data().read).length;
  document.getElementById('new-messages-badge').textContent = unread;

  if (snap.empty) {
    list.innerHTML = '<p style="color:#888;padding:20px;">No messages yet.</p>';
    return;
  }

  list.innerHTML = snap.docs.map(doc => {
    const m = doc.data();
    return `
      <div class="message-card ${!m.read ? 'unread' : ''}">
        <div class="message-header">
          <h4>${m.name} — ${m.email} ${m.phone ? '| ' + m.phone : ''}</h4>
          <span>${m.createdAt?.toDate().toLocaleDateString() || ''}</span>
        </div>
        <p>${m.message}</p>
        ${!m.read ? `<button class="btn-edit" style="margin-top:10px;" 
          onclick="markMessageRead('${doc.id}')">Mark as Read</button>` : ''}
      </div>
    `;
  }).join('');
}

async function markMessageRead(msgId) {
  await db.collection('messages').doc(msgId).update({ read: true });
  loadMessages();
}

// ===== STORE SETTINGS =====
async function loadStoreSettings() {
  const doc = await db.collection('settings').doc('store').get();
  if (doc.exists) {
    const data = doc.data();
    if (data.deliveryFee) document.getElementById('delivery-fee-input').value = data.deliveryFee;
    if (data.exchangeRate) document.getElementById('exchange-rate-input').value = data.exchangeRate;
    loadHoursEditor(data.hours || {});
  } else {
    loadHoursEditor({});
  }
}

function loadHoursEditor(hours) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const editor = document.getElementById('hours-editor');
  editor.innerHTML = days.map(day => `
    <div class="hours-row-editor">
      <span>${day}</span>
      <input type="time" id="hours-${day}-open" value="${hours[day]?.open || '09:00'}" />
      <span>to</span>
      <input type="time" id="hours-${day}-close" value="${hours[day]?.close || '22:00'}" />
    </div>
  `).join('');
}

async function saveDeliveryFee() {
  const fee = parseFloat(document.getElementById('delivery-fee-input').value);
  if (isNaN(fee)) { alert('Please enter a valid number.'); return; }
  await db.collection('settings').doc('store').set({ deliveryFee: fee }, { merge: true });
  alert('Delivery fee saved!');
}

async function saveExchangeRate() {
  const rate = parseFloat(document.getElementById('exchange-rate-input').value);
  if (isNaN(rate)) { alert('Please enter a valid rate.'); return; }
  await db.collection('settings').doc('store').set({ exchangeRate: rate }, { merge: true });
  alert('Exchange rate saved!');
}

async function saveHours() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hours = {};
  days.forEach(day => {
    hours[day] = {
      open: document.getElementById(`hours-${day}-open`).value,
      close: document.getElementById(`hours-${day}-close`).value
    };
  });
  await db.collection('settings').doc('store').set({ hours }, { merge: true });
  alert('Hours saved!');
}

// ===== FOOTER SETTINGS =====
async function loadFooterSettings() {
  const doc = await db.collection('settings').doc('footer').get();
  if (doc.exists) {
    const d = doc.data();
    document.getElementById('footer-about-input').value = d.about || '';
    document.getElementById('footer-phone-input').value = d.phone || '';
    document.getElementById('footer-email-input').value = d.email || '';
    document.getElementById('footer-whatsapp-input').value = d.whatsapp || '';
    document.getElementById('footer-address-input').value = d.address || '';
    document.getElementById('footer-instagram-input').value = d.instagram || '';
    document.getElementById('footer-facebook-input').value = d.facebook || '';
    document.getElementById('footer-copyright-input').value = d.copyright || '';
  }
}

async function saveFooterSettings() {
  const data = {
    about: document.getElementById('footer-about-input').value,
    phone: document.getElementById('footer-phone-input').value,
    email: document.getElementById('footer-email-input').value,
    whatsapp: document.getElementById('footer-whatsapp-input').value,
    address: document.getElementById('footer-address-input').value,
    instagram: document.getElementById('footer-instagram-input').value,
    facebook: document.getElementById('footer-facebook-input').value,
    copyright: document.getElementById('footer-copyright-input').value,
  };
  await db.collection('settings').doc('footer').set(data);
  alert('Footer settings saved!');
}

// ===== ADMIN MANAGEMENT =====
async function loadAdminUsers() {
  const snap = await db.collection('adminUsers').get();
  const list = document.getElementById('admin-users-list');
  
  if (snap.empty) {
    list.innerHTML = '<p style="color:#888;">No admin users found.</p>';
    return;
  }

  list.innerHTML = snap.docs.map(doc => `
    <div class="customer-row">
      <div class="customer-avatar">
        <i class="fas fa-shield-alt" style="font-size:16px;"></i>
      </div>
      <div class="customer-info">
        <h4>${doc.id}</h4>
        <p>${doc.data().active ? '✅ Active' : '❌ Disabled'}</p>
      </div>
      <div style="display:flex;gap:8px;">
        ${doc.id !== currentAdminUser.email ? `
          <button class="btn-delete" onclick="removeAdminUser('${doc.id}')">
            <i class="fas fa-trash"></i> Remove
          </button>
        ` : '<span style="font-size:13px;color:#888;">(You)</span>'}
      </div>
    </div>
  `).join('');
}

async function addAdminUser() {
  const email = document.getElementById('new-admin-email').value.trim();
  if (!email) {
    alert('Please enter an email address.');
    return;
  }

  await db.collection('adminUsers').doc(email).set({
    active: true,
    addedAt: firebase.firestore.FieldValue.serverTimestamp(),
    addedBy: currentAdminUser.email
  });

  document.getElementById('new-admin-email').value = '';
  alert(`✅ ${email} has been added as admin!`);
  loadAdminUsers();
}

async function removeAdminUser(email) {
  if (confirm(`Remove admin access for ${email}?`)) {
    await db.collection('adminUsers').doc(email).delete();
    loadAdminUsers();
  }
}

async function changeAdminPassword() {
  const pass1 = document.getElementById('new-password-1').value;
  const pass2 = document.getElementById('new-password-2').value;
  const msgDiv = document.getElementById('password-msg');

  if (!pass1 || !pass2) {
    showPasswordMsg('Please enter both fields.', 'error');
    return;
  }

  if (pass1 !== pass2) {
    showPasswordMsg('Passwords do not match.', 'error');
    return;
  }

  if (pass1.length < 6) {
    showPasswordMsg('Password must be at least 6 characters.', 'error');
    return;
  }

  try {
    await currentAdminUser.updatePassword(pass1);
    showPasswordMsg('✅ Password changed successfully!', 'success');
    document.getElementById('new-password-1').value = '';
    document.getElementById('new-password-2').value = '';
  } catch (error) {
    if (error.code === 'auth/requires-recent-login') {
      showPasswordMsg('Please sign out and sign back in before changing your password.', 'error');
    } else {
      showPasswordMsg(error.message, 'error');
    }
  }
}

function showPasswordMsg(msg, type) {
  const div = document.getElementById('password-msg');
  div.textContent = msg;
  div.style.display = 'block';
  div.style.color = type === 'success' ? '#27ae60' : '#e74c3c';
  div.style.fontWeight = '600';
  div.style.fontSize = '14px';
}

// ===== LIVE EXCHANGE RATE =====
async function fetchLiveExchangeRate() {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/ILS');
    const data = await response.json();
    const usdRate = 1 / data.rates.USD;
    document.getElementById('exchange-rate-input').value = usdRate.toFixed(4);
    await db.collection('settings').doc('store').set(
      { exchangeRate: parseFloat(usdRate.toFixed(4)) }, 
      { merge: true }
    );
    alert(`✅ Live rate updated! 1 USD = ₪${usdRate.toFixed(4)}`);
  } catch (error) {
    alert('Could not fetch live rate. Please enter manually.');
  }
}

// ===== CLOUDINARY IMAGE UPLOAD =====
function createImageUploader(containerId, onUpload) {
  const container = document.getElementById(containerId);
  container.innerHTML = `
    <div class="image-uploader" id="uploader-${containerId}">
      <div class="upload-drop-zone" id="dropzone-${containerId}">
        <i class="fas fa-cloud-upload-alt"></i>
        <p>Drag & drop image here or click to browse</p>
        <input type="file" accept="image/*" style="display:none;" 
               id="file-input-${containerId}" />
      </div>
      <div id="upload-preview-${containerId}" style="display:none;">
        <img id="preview-img-${containerId}" src="" style="max-height:150px;border-radius:10px;" />
        <button onclick="clearImage('${containerId}')" class="btn-delete" 
                style="margin-top:8px;padding:6px 12px;">
          <i class="fas fa-times"></i> Remove
        </button>
      </div>
      <div id="upload-progress-${containerId}" style="display:none;" class="upload-progress">
        <i class="fas fa-spinner fa-spin"></i> Uploading...
      </div>
    </div>
  `;

  const dropzone = document.getElementById(`dropzone-${containerId}`);
  const fileInput = document.getElementById(`file-input-${containerId}`);

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) uploadToCloudinary(file, containerId, onUpload);
  });
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) uploadToCloudinary(file, containerId, onUpload);
  });
}

async function uploadToCloudinary(file, containerId, onUpload) {
  const progress = document.getElementById(`upload-progress-${containerId}`);
  const dropzone = document.getElementById(`dropzone-${containerId}`);
  const preview = document.getElementById(`upload-preview-${containerId}`);

  progress.style.display = 'block';
  dropzone.style.display = 'none';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_PRESET);
  formData.append('cloud_name', CLOUDINARY_CLOUD);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
      { method: 'POST', body: formData }
    );
    const data = await response.json();
    
    progress.style.display = 'none';
    preview.style.display = 'block';
    document.getElementById(`preview-img-${containerId}`).src = data.secure_url;
    onUpload(data.secure_url);
  } catch (error) {
    progress.style.display = 'none';
    dropzone.style.display = 'block';
    alert('Upload failed. Please try again.');
  }
}

function clearImage(containerId) {
  document.getElementById(`upload-preview-${containerId}`).style.display = 'none';
  document.getElementById(`dropzone-${containerId}`).style.display = 'block';
}

// ===== GLOBAL TOPPINGS/EXTRAS/SAUCES MANAGER =====
async function loadGlobalToppings() {
  const snap = await db.collection('globalToppings').get();
  const list = document.getElementById('global-toppings-list');
  
  if (snap.empty) {
    list.innerHTML = '<p style="color:#888;">No toppings yet.</p>';
    return;
  }

  list.innerHTML = snap.docs.map(doc => {
    const t = doc.data();
    return `
      <div class="menu-item-row" style="padding:12px 15px;">
        <div class="menu-item-info">
          <h4>${t.name} <span style="color:#888;font-size:13px;">(${t.type})</span></h4>
          ${t.price > 0 ? `<p>+₪${t.price}</p>` : '<p>Free</p>'}
        </div>
        <button class="btn-delete" onclick="deleteGlobalTopping('${doc.id}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
  }).join('');
}

async function addGlobalTopping() {
  const name = document.getElementById('new-topping-name').value.trim();
  const price = parseFloat(document.getElementById('new-topping-price').value) || 0;
  const type = document.getElementById('new-topping-type').value;

  if (!name) { alert('Please enter a name.'); return; }

  await db.collection('globalToppings').add({ name, price, type });
  document.getElementById('new-topping-name').value = '';
  document.getElementById('new-topping-price').value = '';
  loadGlobalToppings();
}

async function deleteGlobalTopping(id) {
  if (confirm('Delete this topping/extra/sauce?')) {
    await db.collection('globalToppings').doc(id).delete();
    loadGlobalToppings();
  }
}

// ===== HERO IMAGE =====
async function loadHeroImage() {
  const doc = await db.collection('settings').doc('hero').get();
  createImageUploader('hero-image-uploader', (url) => {
    document.getElementById('hero-image-url').value = url;
  });
  if (doc.exists && doc.data().image) {
    document.getElementById('hero-image-url').value = doc.data().image;
    const preview = document.getElementById('upload-preview-hero-image-uploader');
    const dropzone = document.getElementById('dropzone-hero-image-uploader');
    if (preview && dropzone) {
      document.getElementById('preview-img-hero-image-uploader').src = doc.data().image;
      preview.style.display = 'block';
      dropzone.style.display = 'none';
    }
  }
}

async function saveHeroImage() {
  const url = document.getElementById('hero-image-url').value;
  if (!url) {
    alert('Please upload an image first.');
    return;
  }
  await db.collection('settings').doc('hero').set({ image: url }, { merge: true });
  alert('✅ Hero image saved!');
}