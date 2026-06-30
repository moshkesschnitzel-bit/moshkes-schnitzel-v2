// Load hero image from Firebase
async function loadHeroImage() {
  try {
    const doc = await db.collection('settings').doc('hero').get();
    if (doc.exists && doc.data().image) {
      const heroSection = document.getElementById('hero-section');
      heroSection.style.backgroundImage = `url('${doc.data().image}')`;
      heroSection.style.backgroundSize = 'cover';
      heroSection.style.backgroundPosition = 'center';
    }
  } catch (error) {
    console.log('Hero image loading error:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadHeroImage);