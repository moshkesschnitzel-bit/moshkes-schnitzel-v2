// Load footer content from Firebase
async function loadFooter() {
  try {
    const doc = await db.collection('settings').doc('footer').get();
    
    if (doc.exists) {
      const data = doc.data();
      
      if (data.phone) document.getElementById('footer-phone').innerHTML = 
        `<a href="tel:${data.phone}" style="color:inherit;text-decoration:none;"><i class="fas fa-phone"></i> ${data.phone}</a>`;
      
      if (data.email) document.getElementById('footer-email').innerHTML = 
        `<a href="mailto:${data.email}" style="color:inherit;text-decoration:none;"><i class="fas fa-envelope"></i> ${data.email}</a>`;
      
      if (data.whatsapp) document.getElementById('footer-whatsapp').innerHTML = 
        `<a href="https://wa.me/${data.whatsapp.replace(/[^0-9]/g,'')}" target="_blank" style="color:inherit;text-decoration:none;"><i class="fab fa-whatsapp"></i> ${data.whatsapp}</a>`;
      
      if (data.address) document.getElementById('footer-address').innerHTML = 
        `<a href="https://maps.google.com/?q=${encodeURIComponent(data.address)}" target="_blank" style="color:inherit;text-decoration:none;"><i class="fas fa-map-marker-alt"></i> ${data.address}</a>`;
      
      if (data.about) document.getElementById('footer-about').textContent = data.about;
      
      if (data.copyright) document.getElementById('footer-copyright').textContent = data.copyright;
      
      if (data.instagram) document.getElementById('footer-instagram').href = data.instagram;
      
      if (data.facebook) document.getElementById('footer-facebook').href = data.facebook;
    }
  } catch (error) {
    console.log('Footer loading error:', error);
  }
}

// Run when page loads
document.addEventListener('DOMContentLoaded', () => {
  if (window.db) {
    loadFooter();
  } else {
    document.addEventListener('firebaseReady', loadFooter);
  }
});